const {google} = require('googleapis');
const YT_STUDIO_URL = 'https://studio.youtube.com/';
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const {createLogger} = require("../../logger");
const logger = createLogger({label: "puppeteer-youtube-uploader"});
const fs = require('fs');
const os = require('os');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');

const pupeteerDataDir = path.join(os.tmpdir(), 'youtube-auto-processor', 'puppeteer_tmp');
if (!fs.existsSync(pupeteerDataDir)) {
  mkdirp(pupeteerDataDir);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleFileUploadAndWaitForUploadToEnd(
  browser,
  page,
  {
    filePath,
    stream,
    channelId
  },
  auth,
  onProgress
) {
  const youtube = google.youtube({
    version: 'v3',
    auth
  });

  let videoId = null;
  let processingWatcherInterval = null;
  let progressWatcherInterval = null;

  return await new Promise(async (resolve, reject) => {
    try {
      page.on('response', async (interceptedResponse) => {
        if (interceptedResponse.url().startsWith(`${YT_STUDIO_URL}youtubei/v1/upload/createvideo`)) {
          let data = await interceptedResponse.json();
          if (!data.videoId) {
            reject(new Error('No VideoId found'));
          } else {
            logger.info('intercepted youtube video id : %s', data.videoId);
            videoId = data.videoId;
          }
        }
      });

      page.once('domcontentloaded', async () => {
        try {
          logger.info('page opened, process file upload for %s', filePath);
          await page.waitForSelector('#create-icon', {timeout: 60000});
          await page.click("#create-icon");

          let pageCookies = await page.cookies();
          logger.debug('page cookies are %j', pageCookies);

          await page.waitForSelector('#text-item-0 > ytcp-ve', {timeout: 60000});
          await page.click('#text-item-0 > ytcp-ve');

          await page.waitForSelector('#select-files-button > div', {timeout: 60000});
          const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('#select-files-button > div')
          ]);

          await fileChooser.accept([filePath]);
          logger.info('file %s is uploading, waiting for processing selector...', filePath);

          let progress = 0;
          let uploadDone = false;
          let videoProcessingDetails = null;
          let videoContentDetails = null;
          let uploadStatus = null;

          processingWatcherInterval = setInterval(async () => {
            if (videoId) {
              logger.info('Check youtube processing for video id %s', videoId);

              if (!uploadDone) {
                let {data} = await youtube.videos.list({
                  id: videoId,
                  part: 'processingDetails, contentDetails, status'
                });

                if (data && data.items) {
                  let {items} = data;

                  for (let {id, processingDetails, contentDetails, status} of items) {
                    if (id === videoId) {
                      videoProcessingDetails = processingDetails;
                      videoContentDetails = contentDetails;
                      uploadStatus = status;

                      if (processingDetails) {
                        logger.info('video %s processing status is %s', id, processingDetails.processingStatus);
                      }
                      if (status) {
                        logger.info('video %s upload status is %s', id, status.uploadStatus);
                        uploadDone = status.uploadStatus === "processed";
                      }
                      if (contentDetails) {
                        logger.info('video %s content definition is %s', id, contentDetails.definition);
                        uploadDone = contentDetails.definition === "hd";
                      }
                    }

                    await onProgress({
                      percent: progress,
                      videoId: id,
                      processingDetails: videoProcessingDetails,
                      contentDetails: videoContentDetails,
                      uploadStatus,
                      pageCookies
                    });
                  }
                }
              }

              if (uploadDone) {
                clearInterval(processingWatcherInterval);
                processingWatcherInterval = null;
                await sleep(5000);

                resolve({
                  videoId,
                  percent: 100,
                  processingDetails: videoProcessingDetails,
                  contentDetails: videoContentDetails,
                  uploadStatus,
                  pageCookies
                });
              }
            }
          }, 30000);

          progressWatcherInterval = setInterval(async () => {
            let progressBarValues = await page.$$eval('tp-yt-paper-progress', el => el.map(x => x.getAttribute("value")));

            if (progressBarValues && Array.isArray(progressBarValues) && progressBarValues.length > 0) {
              progressBarValues = progressBarValues.map(p => parseInt(p));
              logger.info('progressBarValues is %j', progressBarValues);
              let value = progressBarValues.pop();

              if (value !== undefined && !isNaN(value)) {
                progress = value;
              }
            }

            let spanProgress = await page.$$('span.ytcp-video-upload-progress');

            if (spanProgress) {
              let spanProgressElem = spanProgress.pop();
              let progressInnerText = await spanProgressElem.getProperty('innerText');
              let progressValue = await progressInnerText.jsonValue();
              uploadDone = progressValue.startsWith('Mise en ligne terminée');
              logger.info('progress is done ? %j', uploadDone);
              if (uploadDone) {
                progress = 100;
              }
            }

            await onProgress({
              percent: progress,
              videoId,
              processingDetails: videoProcessingDetails,
              contentDetails: videoContentDetails,
              uploadStatus,
              pageCookies
            });

            if (progress === 100 || uploadDone) {
              logger.info('clearing progress watcher interval');
              clearInterval(progressWatcherInterval);
              progressWatcherInterval = null;
              if (!videoId) {
                clearInterval(processingWatcherInterval);
                processingWatcherInterval = null;
                reject(new Error('No video id found after 100 percent upload reached !'));
              }
            }
          }, 2000);
        } catch (err) {
          reject(err);
        }
      });

      const url = `${YT_STUDIO_URL}channel/${channelId}`;
      logger.info('opening page %s', url);

      await page.goto(url);
    } catch (err) {
      logger.error('YT Upload error %s', err.message);
      reject(err);
    }
  })
    .finally(() => {
      if (processingWatcherInterval) {
        clearInterval(processingWatcherInterval);
        processingWatcherInterval = null;
      }
      if (progressWatcherInterval) {
        clearInterval(progressWatcherInterval);
        progressWatcherInterval = null;
      }
    });
}

async function initBrowserAndPage(browserOptions, cookies) {
  const browser = await puppeteer.launch({
    userDataDir: pupeteerDataDir,
    executablePath: puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked'),
    ...browserOptions
  });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36');

  logger.info('cookie passed as parameters are %j', cookies);
  await page.setCookie(...cookies);

  return {browser, page}
}

async function endSession(browser, page) {
  logger.info('closing page and browser');
  await page.close();

  await browser.close();

  if (browser && browser.process() !== null) {
    logger.info('Cleaning tmp dir %s', pupeteerDataDir);
    await new Promise((resolve) => rimraf(pupeteerDataDir + '/*', err => {
      if (err) {
        logger.warn('Error cleaning puppeteer data directory: %s', err.message);
      }
      resolve();
    }));
    browser.process().kill('SIGINT');
  }
}

async function uploadHeadless(
  options,
  auth,
  cookies,
  onProgress
) {
  const {browser, page} = await initBrowserAndPage({headless: true}, cookies);
  try {
    return await handleFileUploadAndWaitForUploadToEnd(browser, page, options, auth, onProgress);
  } finally {
    await endSession(browser, page);
  }
}

async function uploadFullscreen(
  options,
  auth,
  cookies,
  onProgress
) {
  const {browser, page} = await initBrowserAndPage({headless: false}, cookies);

  try {
    return await handleFileUploadAndWaitForUploadToEnd(browser, page, options, auth, onProgress);
  } finally {
    await endSession(browser, page);
  }
}

async function uploadWithPuppeteer(
  options,
  auth,
  cookies,
  onProgress
) {
  try {
    return await uploadHeadless(options, auth, cookies, onProgress);
  } catch (err) {
    return await uploadFullscreen(options, auth, cookies, onProgress);
  }
}

module.exports = {
  uploadWithPuppeteer
}
