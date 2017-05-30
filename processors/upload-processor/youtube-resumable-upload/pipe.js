var fs = require('fs');
var request = require('request');
var PassThrough = require('stream').PassThrough;
var util = require('util');

var up = fs.createReadStream('index.js');

var pass = function() {

}

util.inherits(pass, PassThrough);

pass.prototype.on('pipe', function(source) {
	source.unpipe(this);
	source.pipe(process.stdout);
	setTimeout(function(){
		console.log('got here');
		source.pipe(process.stdout);
	}, 1000);
});

var p = new pass();

up.pipe(new pass());
