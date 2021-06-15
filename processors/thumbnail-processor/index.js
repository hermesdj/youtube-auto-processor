/**
 * Created by Jérémy on 08/05/2017.
 */
const {google} = require('googleapis');
const {GoogleToken} = require('../../model/google.model');
const fs = require('fs');
const path = require('path');

exports.setThumbnail = async function (job) {
  if (!job.episode) {
    throw new Error('no episode in this job');
  }

  if (!job.episode.youtube_id) {
    throw new Error('no youtube id for episode ' + job.episode._id);
  }

  let oauth2client = await GoogleToken.resolveOAuth2Client();

  let thumbnail_path = path.join(path.dirname(job.path), 'thumbnails', job.episode.episode_number + '.png');

  if (!fs.existsSync(thumbnail_path)) {
    throw new Error('Thumbnail file is missing at path ' + thumbnail_path);
  }

  let stream = fs.createReadStream(thumbnail_path);

  if (!stream) {
    throw new Error('Cannot create a file read stream on path ' + thumbnail_path);
  }

  let youtube = google.youtube({
    version: 'v3',
    auth: oauth2client
  });

  let res = await youtube.thumbnails.set({
    videoId: job.episode.youtube_id,
    media: {
      body: stream
    }
  });

  let {data} = res;

  if (!data.items) {
    throw new Error('No items found in set thumbnail response');
  }

  job.episode.thumbnails = data.items;

  await job.episode.save();

  return job;
};
