/**
 * Created by Jérémy on 06/05/2017.
 * Index file used to boot up system
 */
let Services = require('./services');

let services = new Services();
services.install();