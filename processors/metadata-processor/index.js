/**
 * Created by Jérémy on 09/05/2017.
 */
var path = require('path');
var https = require('https');
var client = require('../../config/google-client');
var fs = require('fs');
var cookie = require('cookie');
var setCookie = require('set-cookie-parser');

function MetadataProcessor() {

}

function getVideo(auth, next) {
    var headers = {
        'Authorization': auth.oauth2client.credentials.access_token,
        'User-Agent': 'Youtube Channel Processor v1.0.0'
    };

    console.log('request headers', headers);

    var request = https.request({
        host: 'www.googleapis.com',
        method: 'GET',
        path: '/youtube/v3/search?part=id&forMine=true&maxResults=1&type=video',
        headers: headers
    }, function (res) {
        console.log('fetch video : statusCode:', res.statusCode);

        if (res.statusCode >= 400) {
            console.error('Could not fetch Video', res.statusCode);
        }

        res.setEncoding('utf8');
        var rawData = '';

        res.on('data', function (chunk) {
            rawData += chunk;
        });

        res.on('end', function () {
            try {
                fs.writeFile("./.tmp/test.html", rawData, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!");
                });
            } catch (e) {
                console.error(e);
            }

            console.log(res.headers['set-cookie']);
            next(null, res, rawData);
        });
    });

    request.on('error', function (res) {
        console.log(res.statusCode);
    });

    request.end();
}

function loadCookie(auth, videoId, next) {
    var headers = {
        'Authorization': auth.oauth2client.credentials.access_token,
        'User-Agent': 'Youtube Channel Processor v1.0.0'
    };

    console.log('request headers', headers);

    var request = https.request({
        host: 'www.youtube.com',
        method: 'GET',
        path: '/edit?o=U&ns=1&video_id=' + videoId,
        headers: headers
    }, function (res) {
        console.log('fetch cookie : statusCode:', res.statusCode);

        if (res.statusCode >= 400) {
            console.error('Could not fetch Cookie', res.statusCode);
        }

        res.setEncoding('utf8');
        var rawData = '';

        res.on('data', function (chunk) {
            rawData += chunk;
        });

        res.on('end', function () {
            try {
                fs.writeFile("./.tmp/test.html", rawData, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!");
                });
            } catch (e) {
                console.error(e);
            }
            var session = rawData.match(/var session_token = \"(.*?)\";/);
            console.log('session_token found', session[1]);
            console.log(res.headers['set-cookie']);
            next(null, session[1], setCookie.parse(res));
        });
    });

    request.on('error', function (res) {
        console.log(res.statusCode);
    });

    request.end();
}

function updateAsBrowser(episode, auth, session_token, cookies, next) {
    var metadata = {
        creator_share_feed: 'yes',
        video_monetization_style: 'ads',
        ad_breaks: {has_preroll: true, has_midroll: false, has_postroll: true, midrolls_are_manual: true},
        syndication: 'everywhere',
        creator_share_gplus: 'yes',
        creator_share_custom_message: '',
        allow_comments: 'yes',
        allow_comments_detail: 'all',
        self_racy: 'no',
        game_title: 'Mass Effect Andromeda',
        modified_fields: 'creator_share_feed, video_monetization_style, ad_breaks, syndication, creator_share_gplus, creator_share_custom_message, allow_comments, allow_comments_detail, self_racy, game_title',
        video_id: episode.youtube_id,
        session_token: session_token
    };

    var cookieString = cookies.reduce(function (acc, val) {
        return acc += cookie.serialize(val.name, val.value, {
                path: val.path,
                domain: val.domain,
                expires: val.expires,
                httpOnly: val.httpOnly
            }) + ';';
    }, '');

    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Youtube Processor Application 1.0',
        'Cookie': cookieString
        // 'Authorization': auth.oauth2client.credentials.access_token
    };

    console.log('request headers:', headers);

    var request = https.request({
        host: 'www.youtube.com',
        method: 'POST',
        path: '/metadata_ajax?action_edit_video=1',
        headers: headers
    }, function (res) {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${headersJSON.stringify(res)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
            next();
        });
    });

    request.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    request.write(JSON.stringify(metadata));
    request.end();
}

MetadataProcessor.prototype.update = function (job, next) {
    client(function (auth) {
        if (job.episode.youtube_id) {
            getVideo(auth, function (err, res, data) {
                console.log(data);
            });
        }
    });
};

module.exports = MetadataProcessor;