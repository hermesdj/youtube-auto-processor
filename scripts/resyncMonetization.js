const {connect} = require('./db');
const {google} = require('googleapis');
const {init, setMonetisation} = require('./processors/youtube-studio-processor/youtube-studio-api');
const {parse, toSeconds} = require('iso8601-duration');

async function setEpisodeMonetisation(youtubeId, duration) {
  let midVideoMilliseconds = 1200000;

  if (duration) {
    let parsedDuration = parse(duration);
    let seconds = toSeconds(parsedDuration);
    midVideoMilliseconds = (seconds / 2) * 1000;
  }

  try {
    console.log('setting monetisation on video', youtubeId, 'at minute', Math.round((midVideoMilliseconds / 1000) / 60), 'for duration', duration);
    const result = await setMonetisation(youtubeId, {
      encryptedVideoId: youtubeId,
      monetizationSettings: {
        newMonetizeWithAds: true
      },
      "adSettings": {
        "adFormats": {
          "newHasOverlayAds": "ENABLED",
          "newHasSkippableVideoAds": "ENABLED",
          "newHasNonSkippableVideoAds": "ENABLED",
          "newHasProductListingAds": "ENABLED"
        },
        "adBreaks": {
          "newHasPrerolls": "ENABLED",
          "newHasMidrollAds": "ENABLED",
          "newHasPostrolls": "ENABLED",
          "newHasManualMidrolls": "ENABLED",
          "newManualMidrollTimesMillis": [midVideoMilliseconds]
        },
        "autoAdSettings": "AUTO_AD_SETTINGS_TYPE_OFF"
      },
    })

    if (result && result.error) {
      console.error("Error setting monetisation", result.error);
    }
  } catch (err) {
    console.error("Exception setting monetisation", err);
  }
}

(async function () {
  await connect();

  const {Google: {GoogleToken, GoogleCookieConfig}, Serie} = require('./model');
  const cookieInfo = await GoogleCookieConfig.resolveConfig({});
  const oauth2client = await GoogleToken.resolveOAuth2Client();

  await init(cookieInfo);

  let youtube = google.youtube({
    version: 'v3',
    auth: oauth2client
  });

  const series = await Serie.find(
    {playlist_id: {$ne: null}, createdAt: {$gt: new Date('2021-04-01')}},
    {_id: 1, playlist_id: 1, playlist_title: 1}
  ).populate('countEpisodes');

  for (let serie of series.filter(s => s.countEpisodes > 0)) {
    console.log('processing serie ' + serie.playlist_title);
    let pageToken = null;
    let playlistItems = [];

    do {
      let {data} = await youtube.playlistItems.list({
        part: 'snippet',
        playlistId: serie.playlist_id,
        maxResults: 50,
        pageToken
      });

      let {items, nextPageToken} = data;

      pageToken = nextPageToken;

      if(items && items.length > 0){
        playlistItems = playlistItems.concat(items);
      }

    } while (pageToken != null);

    if(playlistItems.length > 0){
      let videoIds = playlistItems.map(pi => pi.snippet.resourceId.videoId);

      let {data} = await youtube.videos.list({
        part: 'contentDetails, id',
        id: videoIds.join(',')
      });

      let {items} = data;

      for(let {id, contentDetails} of items){
        await setEpisodeMonetisation(id, contentDetails.duration);
      }
    }
  }

})();
