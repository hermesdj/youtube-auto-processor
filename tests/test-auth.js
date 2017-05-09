/**
 * Created by Jérémy on 08/05/2017.
 */
var client = require('./config/google-client');

client(function (auth) {
    console.log(auth.token);
});