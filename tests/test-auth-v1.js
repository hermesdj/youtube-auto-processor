/**
 * Created by Jérémy on 08/05/2017.
 */
var client = require('../config/google-client-v1');

client(function (auth) {
    console.log('token is', auth.token);
});
