/**
 * Created by Jérémy on 08/05/2017.
 */
var client = require('../../config/google-client');
var google = require('googleapis');
var config = require('../../config/youtube.json');
var moment = require('moment');
var COLORS = require('../../config/colors');

function process(auth, job, done) {
    if (!config.agenda_spreadsheet_id) {
        job.error('no spreadsheet id defined in config/youtube.json, cannot retrieve scheduled date');
        return done(job.err, null);
    }

    moment.locale('fr');
    var month = moment().format('MMMM');
    month = month.charAt(0).toUpperCase() + month.slice(1);
    var year = moment().format('YYYY');
    var start = 'A1';
    var end = 'H28';
    var range = month.concat(' ').concat(year).concat('!').concat(start).concat(':').concat(end);

    processRange(auth, job, range, function (err, haystack, i, j) {
        if (err) {
            return done(err, null);
        }

        if (i && j) {
            return done(null, haystack, i, j, month.concat(' ').concat(year));
        }

        month = moment().add(1, 'M').format('MMMM');
        month = month.charAt(0).toUpperCase() + month.slice(1);
        var range = month.concat(' ').concat(year).concat('!').concat(start).concat(':').concat(end);
        processRange(auth, job, range, function (err, haystack, i, j) {
            done(err, haystack, i, j, month.concat(' ').concat(year));
        });
    });
}

function processRange(auth, job, range, done) {
    console.log('processing with range', range);
    var sheets = google.sheets({
        version: 'v4',
        auth: auth.oauth2client
    });

    sheets.spreadsheets.values.get({
        spreadsheetId: config.agenda_spreadsheet_id,
        range: range
    }, function (err, res) {
        if (err) {
            done(err, null);
        }
        find(res.values, job.episode.serie.planning_name.replace('${episode_number}', job.episode.episode_number), done);
    });
}

function find(haystack, needle, done) {
    for (var i = 0; i < haystack.length; i++) {
        for (var j = 0; j < haystack[i].length; j++) {
            if (haystack[i][j] === needle) {
                return done(null, haystack, i, j);
            }
        }
    }
    done('Episde ' + needle + ' cannot be found on the agenda', null, null, null);
}

function parseDate(haystack, i, j, done) {
    var result = null;
    var hour = haystack[i][0];
    var day = null;

    for (var k = i - 1; k >= 0; k--) {
        var test_date = moment(haystack[k][j], 'DD/MM/YYYY');
        if (test_date !== null && test_date.isValid()) {
            day = haystack[k][j];
            break;
        }
    }

    if (day && hour) {
        result = moment(day + hour, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sZ');
    }

    done(null, result);
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
                return done(err, null);
            }
            parseDate(haystack, i, j, done);
        });
    });
};

function getSpreadsheetId(auth, sheetName, done) {
    var sheets = google.sheets({
        version: 'v4',
        auth: auth.oauth2client
    });

    sheets.spreadsheets.get({
        spreadsheetId: config.agenda_spreadsheet_id
    }, function (err, res) {
        if (err) {
            done(err, null);
        }
        var result = null;
        for (var i = 0; i < res.sheets.length; i++) {
            var sheet = res.sheets[i];
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
        job.error('no episode for this job, cannot mark as processing');
        return done(job.err, null);
    }

    if (!job.episode.serie) {
        job.error('no serie for this job, cannot mark as processing');
        return done(job.err, null);
    }

    client(function (auth) {
        process(auth, job, function (err, haystack, i, j, sheetName) {
            if (err) {
                return done(err, null);
            }
            getSpreadsheetId(auth, sheetName, function (err, sheetId) {
                if (err) {
                    done(err, null);
                    return;
                }
                var requests = [];
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
    var sheets = google.sheets({
        version: 'v4',
        auth: auth.oauth2client
    });

    sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.agenda_spreadsheet_id,
        resource: {requests: requests}
    }, function (err, res) {
        if (err) {
            done(err, null);
            return;
        }
        done(null, res);
    });
}

exports.markAsProcessing = function (job, done) {
    console.log('mark as processing on agenda');
    mark(job, COLORS.processing, done);
};

exports.markAsReady = function (job, done) {
    console.log('marking as ready on agenda');
    mark(job, COLORS.done, done);
};

exports.markAsPublic = function (job, done) {
    console.log('marking as public on agenda');
    mark(job, COLORS.public, done);
};

exports.markAsError = function (job, done) {
    console.log('marking as error on agenda');
    mark(job, COLORS.error, done);
};