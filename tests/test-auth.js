/**
 * Created by Jérémy on 08/05/2017.
 */
var client = require('../config/google-client');

client(async function (auth) {
    console.log('auth is', auth);
    console.log(await auth.getCredentials());
    console.log(await auth.getAccessToken());
});
