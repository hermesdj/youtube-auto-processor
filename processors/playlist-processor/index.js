/**
 * Created by Jérémy on 09/05/2017.
 */
const {google} = require('googleapis');
const {GoogleToken} = require('../../model/google.model');
const {createLogger} = require('../../logger');
const logger = createLogger({label: 'playlist-processor'});

module.exports = {
  addEpisodeToPlaylist: async function (videoId, playlistId) {
    if (!playlistId) {
      throw new Error('no playlist id provided');
    }

    if (!videoId) {
      throw new Error('no video id provided');
    }

    let oauth2client = await GoogleToken.resolveOAuth2Client();
    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    logger.info('adding video %s to playlist %s', videoId, playlistId);

    let {data} = await youtube.playlistItems.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            videoId,
            kind: 'youtube#video'
          }
        }
      }
    });

    return data;
  },
  createPlaylist: async function (title, description, defaultLanguage, privacyStatus) {
    if (!title) {
      throw new Error('Playlist title is required');
    }

    if (!description) {
      throw new Error('Playlist description is required');
    }

    if (!defaultLanguage) {
      throw new Error('Playlist default language is required');
    }

    if (!privacyStatus || !['private', 'public', 'unlisted'].includes(privacyStatus)) {
      throw new Error('Playlist privacy must be either private, public or unlisted');
    }

    let oauth2client = await GoogleToken.resolveOAuth2Client();
    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    let res = await youtube.playlists.insert({
      part: 'snippet, status',
      requestBody: {
        snippet: {
          title,
          description,
          defaultLanguage
        },
        status: {
          privacyStatus
        }
      }
    });

    return res.data.id;
  },
  retrievePlaylistData: async function (playlistId) {
    let oauth2client = await GoogleToken.resolveOAuth2Client();
    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    let {data} = await youtube.playlists.list({
      id: playlistId,
      part: 'snippet,status'
    });

    return data && data.items ? data.items[0] : null;
  },
  updatePlaylist: async function (playlistId, title, description, privacyStatus, defaultLanguage) {
    if (!title) {
      throw new Error('Playlist title is required');
    }

    if (!description) {
      throw new Error('Playlist description is required');
    }

    if (!defaultLanguage) {
      throw new Error('Playlist default language is required');
    }

    if (!privacyStatus || !['private', 'public', 'unlisted'].includes(privacyStatus)) {
      throw new Error('Playlist privacy must be either private, public or unlisted');
    }

    let oauth2client = await GoogleToken.resolveOAuth2Client();
    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    let {data} = await youtube.playlists.update({
      part: 'snippet, status',
      requestBody: {
        id: playlistId,
        snippet: {
          title,
          description,
          defaultLanguage
        },
        status: {
          privacyStatus
        }
      }
    });

    return data;
  },
  deletePlaylist: async function (id) {
    let oauth2client = await GoogleToken.resolveOAuth2Client();
    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    await youtube.playlists.delete({id});
    return true;
  }
}
