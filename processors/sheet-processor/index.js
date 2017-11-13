/**
 * Created by Jérémy on 08/05/2017.
 */
const client = require('../../config/google-client');
const google = require('googleapis');
const config = require('../../config/youtube.json');
const moment = require('moment');
const COLORS = require('../../config/colors');
const winston = require('winston');

function process(auth, job, done) {
    if (!config.agenda_spreadsheet_id) {
        job.error('no spreadsheet id defined in config/youtube.json, cannot retrieve scheduled date');
        return done(job.err, null);
    }

    winston.debug('processing on agenda for current month');

    moment.locale('fr');
    let month = moment().format('MMMM');
    month = month.charAt(0).toUpperCase() + month.slice(1);
    month = month.replace('û', 'u');
    let year = moment().format('YYYY');
    let start = 'A1';
    let end = 'H40';
    let range = month.concat(' ').concat(year).concat('!').concat(start).concat(':').concat(end);


    processRange(auth, job, range, function (err, haystack, i, j) {
        if (err) {
            winston.error(err);
            month = moment().add(1, 'M').format('MMMM');
            month = month.charAt(0).toUpperCase() + month.slice(1);
            month = month.replace('û', 'u');
            let range = month.concat(' ').concat(year).concat('!').concat(start).concat(':').concat(end);
            processRange(auth, job, range, function (err, haystack, i, j) {
                if (err) {
                    winston.error('cannot find episode on the agenda');
                    return done(err);
                }
                return done(err, haystack, i, j, month.concat(' ').concat(year));
            });
        }

        if (i && j) {
            return done(null, haystack, i, j, month.concat(' ').concat(year));
        }
    });
}

function processRange(auth, job, range, done) {
    winston.info('processing with range', range);
    let sheets = google.sheets({
        version: 'v4',
        auth: auth.oauth2client
    });

    sheets.spreadsheets.values.get({
        spreadsheetId: config.agenda_spreadsheet_id,
        range: range
    }, function (err, res) {
        if (err) {
            winston.error('error on retrieving google agenda info : ' + err);
            done(err, job);
        }
        find(res.values, job.episode.serie.planning_name.replace('${episode_number}', job.episode.episode_number).replace('${episode_name}', job.episode.episode_name), done);
    });
}

function find(haystack, needle, done) {
    for (let i = 0; i < haystack.length; i++) {
        for (let j = 0; j < haystack[i].length; j++) {
            if (haystack[i][j] === needle) {
                return done(null, haystack, i, j);
            }
        }
    }
    done('Episde ' + needle + ' cannot be found on the agenda', null, null, null);
}

function parseDate(haystack, i, j, done) {
    winston.info('parsing value at', i, j);
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
        winston.info('day && hour found', day, hour);
        result = moment(day + hour, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sZ');
    }

    if (moment(result).isValid()) {
        done(null, result);
    } else {
        done('invalid date parsed: ' + day + ':' + hour, null);
    }
}

exports.getScheduledDate = function (job, done) {
    if (!job.episode) {
        job.error('no episode for this job, cannot retrieve scheduled date');
        return done(job.err, null);
    }

    if (!job.episode.serie) {
        job.error('no serie for this job, cannot retrieve scheduled date');
        return done(job.err, null);
    }

    client(function (auth) {
        process(auth, job, function (err, haystack, i, j) {
            if (err) {
                return done(err, job);
            }
            parseDate(haystack, i, j, done);
        });
    });
};

function getSpreadsheetId(auth, sheetName, done) {
    let sheets = google.sheets({
        version: 'v4',
        auth: auth.oauth2client
    });

    sheets.spreadsheets.get({
        spreadsheetId: config.agenda_spreadsheet_id
    }, function (err, res) {
        if (err) {
            done(err, job);
        }
        let result = null;
        for (let i = 0; i < res.sheets.length; i++) {
            let sheet = res.sheets[i];
            if (sheet.properties.title === sheetName) {
                result = sheet.properties.sheetId;
                break;
            }
        }
        if (result) {
            done(null, result);
        } else {
            done('cannot find sheetId for name ' + sheetName, null);
        }
    });
}

function mark(job, format, done) {
    if (!job.episode) {
        winston.error('no episode for this job, cannot mark as processing');
        job.error('no episode for this job, cannot mark as processing');
        return done(job.err, null);
    }

    if (!job.episode.serie) {
        winston.error('no serie for this job, cannot mark as processing');
        job.error('no serie for this job, cannot mark as processing');
        return done(job.err, null);
    }

    winston.debug('authenticating on google agenda');
    client(function (auth) {
        winston.debug('done authenticating on google agenda, processing mark on planning');
        process(auth, job, function (err, haystack, i, j, sheetName) {
            if (err) {
                winston.error('error marking on planning !');
                return done(err, job);
            }
            getSpreadsheetId(auth, sheetName, function (err, sheetId) {
                if (err) {
                    done(err, job);
                    return;
                }
                let requests = [];
                requests.push({
                    updateCells: {
                        start: {sheetId: sheetId, rowIndex: i, columnIndex: j},
                        rows: [{
                            values: [{
                                userEnteredFormat: format
                            }]
                        }],
                        fields: 'userEnteredFormat(backgroundColor, textFormat)'
                    }
                });

                updateCells(auth, requests, done);
            });
        });
    });
}

function updateCells(auth, requests, done) {
    let sheets = google.sheets({
        version: 'v4',
        auth: auth.oauth2client
    });

    sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.agenda_spreadsheet_id,
        resource: {requests: requests}
    }, function (err, res) {
        winston.debug('spreadsheet batch update response' + JSON.stringify(res));
        if (err) {
            winston.error('error updating cells');
            winston.error(err);
            return done(err, job);
        }
        done(null, res);
    });
}

exports.markAsProcessing = function (job, done) {
    winston.info('mark as processing on agenda');
    mark(job, COLORS.processing, done);
};

exports.markAsReady = function (job, done) {
    winston.info('marking as ready on agenda');
    mark(job, COLORS.done, done);
};

exports.markAsPublic = function (job, done) {
    winston.info('marking as public on agenda');
    mark(job, COLORS.public, done);
};

exports.markAsError = function (job, done) {
    winston.info('marking as error on agenda');
    mark(job, COLORS.error, function (err, res) {
        winston.error(err);
        done(err, res);
    });
};