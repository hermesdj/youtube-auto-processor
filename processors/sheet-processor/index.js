/**
 * Created by Jérémy on 08/05/2017.
 */
const {Google} = require('../../model');
const {GoogleToken} = Google;
const {google} = require('googleapis');
const moment = require('moment');
const COLORS = require('../../config/colors');
const {createLogger} = require('../../logger');
const logger = createLogger({label: 'sheet-processor'});

async function process(auth, job, appConfig) {
  if (!appConfig) {
    throw new Error('No app config provided to process function !');
  }

  let spreadsheetId = appConfig.spreadsheetId;

  if (!spreadsheetId) {
    throw new Error('no spreadsheet id defined in config, cannot retrieve scheduled date');
  }

  logger.debug('processing on agenda for current month with id %s', spreadsheetId);

  moment.locale('fr');

  let month = moment().format('MMMM');
  month = month.charAt(0).toUpperCase() + month.slice(1);
  month = month.replace('û', 'u');
  month = month.replace('é', 'e');

  let year = moment().format('YYYY');
  let start = 'A1';
  let end = 'H40';
  let sheetName = month.concat(' ').concat(year);

  let range = sheetName.concat('!').concat(start).concat(':').concat(end);

  try {
    let {haystack, i, j} = await processRange(auth, job, range, spreadsheetId);

    if (i !== null && j !== null) {
      return {haystack, i, j, sheetName};
    } else {
      throw new Error('Cell not found');
    }
  } catch (err) {
    logger.warn('Not found on current month %s, trying next month', sheetName);
    month = moment().add(1, 'M').format('MMMM');
    month = month.charAt(0).toUpperCase() + month.slice(1);
    month = month.replace('û', 'u');
    month = month.replace('é', 'e');
    year = moment().add(1, 'M').format('YYYY');
    sheetName = month.concat(' ').concat(year);

    range = sheetName.concat('!').concat(start).concat(':').concat(end);

    let {haystack, i, j} = await processRange(auth, job, range, spreadsheetId);

    if (i !== null && j !== null) {
      return {haystack, i, j, sheetName};
    } else {
      throw new Error('Cell not found');
    }
  }
}

async function processRange(auth, job, range, spreadsheetId) {
  let planningValue = job.episode.serie.planning_name.replace('${episode_number}', job.episode.episode_number).replace('${episode_name}', job.episode.episode_name)
  logger.info('searching %s with range %j', planningValue, range);

  let sheets = google.sheets({
    version: 'v4',
    auth: auth
  });

  let res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: range
  });

  let {data: {values}} = res;
  return find(values, planningValue);
}

function find(haystack, needle) {
  logger.debug('search needle ' + needle);

  let result = null;

  for (let i = 0; i < haystack.length; i++) {
    for (let j = 0; j < haystack[i].length; j++) {
      if (haystack[i][j] === needle) {
        result = {haystack, i, j};
        break;
      }
    }

    if (result) {
      break;
    }
  }

  if (!result) {
    throw new Error('Episode ' + needle + ' cannot be found on the agenda');
  }

  return result;
}

async function parseDate(haystack, i, j) {
  logger.debug('parsing value at %d, %d', i, j);

  let result = null;
  let hour = haystack[i][0];
  let day = null;

  for (let k = i - 1; k >= 0; k--) {
    if (haystack[k][j]) {
      let m = haystack[k][j].match(/(\d+)(-|\/)(\d+)(?:-|\/)(?:(\d+)\s+(\d+):(\d+)(?::(\d+))?(?:\.(\d+))?)?/);
      if (m !== null) {
        day = haystack[k][j];
        break;
      }
    }
  }

  if (day && hour) {
    logger.debug('day=%s, hour=%s', day, hour);
    result = moment(day + hour, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sZ');
  }

  if (moment(result).isValid()) {
    return result;
  } else {
    throw new Error('invalid date parsed: ' + day + ':' + hour);
  }
}

async function getSheetId(auth, sheetName, spreadsheetId) {
  let sheets = google.sheets({
    version: 'v4',
    auth: auth
  });

  let res = await sheets.spreadsheets.get({
    spreadsheetId
  });

  let {data} = res;
  let result = null;

  for (let i = 0; i < data.sheets.length; i++) {
    let sheet = data.sheets[i];
    if (sheet.properties.title === sheetName) {
      result = sheet.properties.sheetId;
      break;
    }
  }

  if (!result) {
    throw new Error('cannot find sheetId for name ' + sheetName)
  }

  return result;
}

async function mark(job, colorConfigName, appConfig) {
  if (job.currentPlanningState === colorConfigName) {
    return Promise.resolve(job);
  }

  if (!job.episode) {
    throw new Error('no episode for this job, cannot mark as processing');
  }

  if (!job.episode.serie) {
    throw new Error('no serie for this job, cannot mark as processing');
  }

  if (!appConfig.spreadsheetId) {
    throw new Error('no spreadsheet id defined in config, cannot retrieve scheduled date');
  }

  if (!appConfig) {
    throw new Error('No app config provided !');
  }

  let colorConfig = COLORS[colorConfigName];

  if (!colorConfig) {
    throw new Error('Color configuration does not exists for ' + colorConfigName);
  }

  let oauth2client = await GoogleToken.resolveOAuth2Client();

  let {i, j, sheetName} = await process(oauth2client, job, appConfig);

  let sheetId = await getSheetId(oauth2client, sheetName, appConfig.spreadsheetId);

  let requests = [];
  requests.push({
    updateCells: {
      start: {sheetId: sheetId, rowIndex: i, columnIndex: j},
      rows: [{
        values: [{
          userEnteredFormat: colorConfig
        }]
      }],
      fields: 'userEnteredFormat(backgroundColor, textFormat)'
    }
  });

  return await updateCells(oauth2client, requests, appConfig.spreadsheetId)
    .then(async () => {
      job.currentPlanningState = colorConfigName;
      await job.save();
      return job;
    });
}

async function updateCells(auth, requests, spreadsheetId) {
  let sheets = google.sheets({
    version: 'v4',
    auth: auth
  });

  let {data} = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {requests: requests}
  });

  return data;
}

const getScheduledDate = async function (job, appConfig) {
  if (!job.episode) {
    throw new Error('no episode for this job, cannot retrieve scheduled date');
  }

  if (!job.episode.serie) {
    throw new Error('no serie for this job, cannot retrieve scheduled date')
  }

  let oauth2client = await GoogleToken.resolveOAuth2Client();

  let {haystack, i, j} = await process(oauth2client, job, appConfig);
  return await parseDate(haystack, i, j);
};

const markAsProcessing = async function (job, appConfig) {
  logger.info('mark as processing on agenda');
  return mark(job, 'processing', appConfig);
};

const markAsReady = function (job, appConfig) {
  logger.info('marking as ready on agenda');
  return mark(job, 'done', appConfig);
};

const markAsPublic = function (job, appConfig) {
  logger.info('marking as public on agenda');
  return mark(job, 'public', appConfig);
};

const markAsError = function (job, appConfig) {
  logger.info('marking as error on agenda');
  return mark(job, 'error', appConfig);
};

module.exports = {
  markAsError,
  markAsPublic,
  markAsReady,
  markAsProcessing,
  getScheduledDate
};
