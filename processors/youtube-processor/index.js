/**
 * Created by Jérémy on 08/05/2017.
 */
const {google} = require('googleapis');
const client = require('../../config/google-client-v1');

function process(auth, job, done) {
    let youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });

    console.log(job.episode.youtube_id);

    youtube.videos.list({
        id: job.episode.youtube_id,
        part: 'processingDetails, contentDetails'
    }, function (err, {data}) {
        console.log(data);
        if (err) {
            job.error('error retrieving processing details: ' + err);
            return done(err, null);
        }
        if (data) {
            job.processing = data.items[0].processingDetails;
            job.details = data.items[0].contentDetails;
            job.markModified('processing');
            job.markModified('details');
            job.save(done);
        }
    });
}

module.exports = {
    getVideoProcessorStats: function (job, done) {
        if (!job) {
            return done('no job to retrieve the video status from !');
        }

        if (!job.episode) {
            job.error('no episode in this job');
            return;
        }

        if (!job.episode.youtube_id) {
            job.error('no youtube id for episode ' + job.episode._id);
            return;
        }

        client(function (auth) {
            process(auth, job, done);
        });
    },
    getVideoProcessorStatsMultiple: function (jobs, done) {
        if (!jobs || jobs.length === 0) {
            return done('no jobs provided');
        }

        let videoIds = jobs.filter(job => job.episode && job.episode.youtube_id).map(job => job.episode.youtube_id);

        if (videoIds.length === 0) {
            return done('no video ids found');
        }

        client(async function (auth) {
            let youtube = google.youtube({
                version: 'v3',
                auth: auth.oauth2client
            });

            try {
                let {data} = await youtube.video.list({
                    id: videoIds.join(','),
                    part: 'processingDetails, contentDetails, id'
                });

                if (data && data.items && Array.isArray(data.items)) {
                    for (let {id, processingDetails, contentDetails} of data.items) {
                        let job = jobs.find(job => job.episode.youtube_id === id);

                        if (job) {
                            job.processing = processingDetails;
                            job.details = contentDetails;
                            job.lastProcessFetchDate = new Date();
                            job.markModified('processing');
                            job.markModified('details');
                            job.markModified('lastProcessFetchDate');
                            await job.save();
                        } else {
                            console.warn('job not found for video id', id);
                        }
                    }

                    done(null, {items: data.items, jobs});

                } else {
                    return done('no data found in response');
                }
            } catch (err) {
                job.error('error retrieving processing details: ' + err);
                return done(err, null);
            }
        });
    }
};
