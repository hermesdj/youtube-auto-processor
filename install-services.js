/**
 * Created by Jérémy on 06/05/2017.
 * Index file used to boot up system
 */
var Services = require('./services');

var services = new Services();
services.install();