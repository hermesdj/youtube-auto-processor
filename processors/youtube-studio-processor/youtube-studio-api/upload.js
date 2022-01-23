const YT_STUDIO_URL = 'https://studio.youtube.com/';
const puppeteer = require("puppeteer");
const {createLogger} = require('../../../logger');
const logger = createLogger({label: 'youtube-studio-upload'});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function upload(
  {
    fileName = "file-" + Date.now(),
    filePath = null,
    channelId = '',
    newTitle = `unnamed-${Date.now()}`,
    newDescription = '',
    newPrivacy = 'PRIVATE',
    stream,
    isDraft = false,
    tags = []
  },
  headers,
  onProgress
) {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch({
        executablePath: puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked')
      });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

      let videoId = null;

      const cookie = headers.cookie;
      const cookies = cookie.split('; ').map(c => ({
        name: c.split('=')[0].trim(),
        value: c.split('=')[1].trim(),
        domain: '.youtube.com'
      }));

      await page.setCookie(...cookies);

      async function watchResponse(interceptedResponse) {
        //logger.debug('A response was received:', interceptedResponse.url());
        if (interceptedResponse.url().startsWith('https://studio.youtube.com/youtubei/v1/upload/createvideo')) {
          let data = await interceptedResponse.json();
          if (!data.videoId) {
            reject(new Error('No VideoId found'));
          } else {
            logger.debug('intercepted video id', data.videoId);
            videoId = data.videoId;
          }
        }
      }

      page.on('response', watchResponse);

      page.once('domcontentloaded', async () => {
        logger.debug('page opened, process file upload for', newTitle);
        await sleep(5000);

        await page.click("#create-icon");
        await sleep(500);
        await page.click('#text-item-0 > ytcp-ve');
        await sleep(500);

        const [fileChooser] = await Promise.all([
          page.waitForFileChooser(),
          page.click('#select-files-button > div')
        ]);

        await fileChooser.accept([filePath]);
        logger.debug('file is uploading, waiting for processing selector...');

        let progressWatcher = setInterval(async () => {
          let progressBarValues = await page.$$eval('tp-yt-paper-progress', el => el.map(x => x.getAttribute("value")));

          if (progressBarValues.length > 0) {
            progressBarValues = progressBarValues.map(p => parseInt(p));

            let value = progressBarValues.find(p => p > 0);

            if (value) {
              let percent = parseInt(value);
              logger.debug('upload progress is', value, '%');
              onProgress({percent});

              if (percent === 100 && videoId) {
                logger.debug('uploaded video id is', videoId);
                clearInterval(progressWatcher);

                await sleep(5000);
                logger.debug('wait for processing selector');
                await page.waitForSelector("ytcp-video-upload-progress[processing]", {timeout: 120000});

                logger.debug('closing upload dialog and puppeteer browser');
                await page.close();
                await browser.close();

                resolve({videoId});
              }
            }
          } else {
            logger.debug('no element tp-yt-paper-progress found')
          }
        }, 5000);

        if (!videoId) {
          let httpResponse = await page.waitForResponse((response) => response.url().startsWith('https://studio.youtube.com/youtubei/v1/upload/createvideo'), {timeout: 120000});
          let data = await httpResponse.json();
          videoId = data.videoId;
        }
      })

      await page.goto(YT_STUDIO_URL);
    } catch (err) {
      console.error('puppeteer error:', err);
      reject(err);
    }
  })
}

module.exports = upload
