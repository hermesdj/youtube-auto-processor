/**
 * Created by Jérémy on 08/05/2017.
 */
var path = require('path');
var SCOPES = ['https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/spreadsheets'];
var config = path.join(__dirname, 'client_secret.json');
var {google} = require('googleapis');

function Client(done) {
    const auth = new google.auth.GoogleAuth({
        keyFile: config,
        scopes: SCOPES
    });

    done(auth);
}

module.exports = Client;
