/**
 * Created by Jérémy on 08/05/2017.
 */
var fs = require('fs');
var cliAuth = require('google-cli-auth');
var path = require('path');
var SCOPES = ['https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/spreadsheets'];
var config = path.join(__dirname, './client_secret.json');
var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;

function authorize(credentials, done) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;

    cliAuth({
        name: 'youtube-auto-processor',
        client_id: clientId,
        client_secret: clientSecret,
        scope: SCOPES
    }, function (err, token) {
        if (err) {
            console.error(err);
        }
        console.log('authorized with token', token);
        done(err, token);
    });
}

function Client(done) {
    var self = this;
    self.oauth2client = new OAuth2Client();
    fs.readFile(config, function (err, content) {
        if (err) {
            console.error('Error loading client secret file:', err);
            return;
        }

        authorize(JSON.parse(content), function (err, token) {
            if (err) {
                console.error('youtube auth error', err);
                return;
            }
            self.oauth2client.setCredentials(token);
            self.token = token;
            done(self);
        });
    });
}

module.exports = Client;