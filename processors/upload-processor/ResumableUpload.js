const {EventEmitter} = require("events");
const mime = require('mime');
const axios = require('axios');
const fs = require('fs');

class ResumableUploadError extends Error {
    constructor(message, data) {
        super(message);
        this.data = data;
    }
}

class ResumableUpload extends EventEmitter {
    constructor({accessToken, retry = -1, monitor}) {
        super();

        this.byteCount = 0; //init variables
        this.accessToken = accessToken;
        this.filePath = null;
        this.metadata = {};
        this.monitor = monitor;
        this.retry = retry;
        this.host = 'www.googleapis.com';
        this.api = '/upload/youtube/v3/videos';
        this.parts = ['snippet', 'status', 'contentDetails'];
        this.location = null;
    }

    async upload(filePath, metadata) {
        if (!this.accessToken) {
            throw new ResumableUploadError('No Access Token provided');
        }

        this.filePath = filePath;
        this.metadata = metadata;

        try {
            let {data, headers} = await axios.post(
                `https://${this.host}${this.api}?uploadType=resumable&part=${this.parts.join(',')}`,
                metadata,
                {
                    headers: {
                        'Host': this.host,
                        'Authorization': 'Bearer ' + this.accessToken,
                        'Content-Length': Buffer.from(JSON.stringify(metadata)).length,
                        'Content-Type': 'application/json',
                        'X-Upload-Content-Length': fs.statSync(filePath).size,
                        'X-Upload-Content-Type': mime.lookup(filePath)
                    }
                }
            );

            if (!headers.location) {
                throw new ResumableUploadError("No location in response headers", headers);
            }

            if (data && data.error) {
                throw new ResumableUploadError("Error data response", data);
            }

            this.location = headers.location;

            return this.send(this.location, filePath);
        } catch (err) {
            if (err.isAxiosError) {
                err = new ResumableUploadError("Axios Error", {json: err.toJSON(), data: err.response.data});
            }

            if (err.response && err.response.status === 403) {
                throw err;
            } else if (this.retry > 0 || this.retry <= -1) {
                this.retry--;
                return this.upload(filePath, metadata);
            } else {
                throw err;
            }
        }
    }

    async send(location, filePath) {
        try {
            let fileStream = fs.createReadStream(filePath, {
                start: this.byteCount,
                end: fs.statSync(filePath).size
            });

            let health = setInterval(async () => {
                let progress = await this.getProgress();
                this.emit('progress', progress.bytes);
            }, 5000);

            let {data} = await axios.put(location, fileStream, {
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                    'Content-Length': fs.statSync(filePath).size - this.byteCount,
                    'Content-Type': mime.lookup(filePath)
                }
            });

            clearInterval(health);

            return data;
        } catch (err) {
            if (err.isAxiosError) {
                err = new ResumableUploadError("Axios Error", err.toJSON());
            }

            if (this.retry > 0 || this.retry <= -1) {
                this.retry--;

                let progress = await this.getProgress();

                this.byteCount = progress.bytes;

                return this.send(location, filePath);
            } else {
                throw err;
            }
        }
    }

    async getProgress() {
        let {headers} = await axios.put(
            this.location,
            {},
            {
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                    'Content-Length': 0,
                    'Content-Range': 'bytes */' + fs.statSync(this.filePath).size
                }
            }
        );

        return {bytes: headers.range ? headers.range.substring(8) : 0};
    }
}

module.exports = {
    ResumableUpload
}
