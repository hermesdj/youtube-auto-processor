/**
 * Created by Jérémy on 08/05/2017.
 */
var fs = require('fs');
var cliAuth = require('google-cli-auth');
var path = require('path');
var SCOPES = ['https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/spreadsheets'];
var config = path.join(__dirname, './client_secret_v1.json');
var {google} = require('googleapis');
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
    let self = this;
    fs.readFile(config, function (err, content) {
        if (err) {
            console.error('Error loading client secret file:', err);
            return;
        }

        let credentials = JSON.parse(content);
        let clientSecret = credentials.installed.client_secret;
        let clientId = credentials.installed.client_id;
        let redirectUrl = credentials.installed.redirect_uris[0];

        self.oauth2client = new OAuth2Client(clientId, clientSecret, redirectUrl);

        authorize(credentials, function (err, token) {
            if (err) {
                console.error('youtube auth error', err);
                return;
            }
            console.log('token is', token);
            self.oauth2client.setCredentials(token);
            self.token = token;
            done(self);
        });
    });
}

module.exports = Client;
