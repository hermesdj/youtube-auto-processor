const Serie = require('../../model/serie.model');
const Episode = require('../../model/episode.model');
const ytConfig = require('../../config/youtube.json');
const {parse, toSeconds} = require('iso8601-duration');
const {init, setMonetisation, setEndScreen, endScreen, getEndScreen} = require('./youtube-studio-api');

const SID = '-AcofBMe2HIV3gv2t5kGxu69sCLGOt6z3T35ghypt3jECPE5l2h-b-ZBEhLwYiqE2i6mUw.';
const HSID = 'A2p1gOQpijhVfqLzA';
const SSID = 'ASPv5VzQUh4od1xKr';
const APISID = '1jUe7UOI8epmsJgq/ApfvJm9tr6PM9HIcQ';
const SAPISID = 'NUauvEH2cF0MyKuB/AwwK7pkOcITKkHBXa';
const LOGIN_INFO = 'AFmmF2swRgIhAJ6Mh1Sq_nUPH_YwE4H6clzS_ROPlDJmriwUW4CZh83UAiEAyZxVoTVWxir-g2-z9cObGJ-cEhU2vEjhEmuz_ve1ZhI:QUQ3MjNmeWRhV2ZZWEpYNk5kMFJoS2pGUXFWaXNMUTkwYVhpb0VqVEc1TUMwRVB5Y2FRVEMtaWFvcW5iUWNGYVhqbUIzTGk1cnRUblZGbThHNEZCWW43dFhTV192alAtVTgybWptc2JYZV9KRWNMZEtJTDFUTXRxeFNsM2o5NUFKSHc0NmQ3eWdja1RjTUdsdjBmcGprWkRac0JDcDE4N2Rn';

module.exports = {
    setMonetization: async function (job, done) {
        try {
            await init({
                SID,
                HSID,
                SSID,
                APISID,
                SAPISID,
                LOGIN_INFO
            })

            const result = await setMonetisation(job.episode.youtube_id, {
                encryptedVideoId: job.episode.youtube_id, // your video ID
                monetizationSettings: {
                    newMonetizeWithAds: true // Monetisation: On
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
                        "newHasManualMidrolls": "DISABLED"
                    },
                    "autoAdSettings": "AUTO_AD_SETTINGS_TYPE_OFF"
                },
            })

            if (result) {
                if (result.error) {
                    done(result.error);
                } else {
                    console.log('monetize result is', result);
                    done(null, result);
                }
            }
        } catch (err) {
            done(err);
        }
    },
    setEndScreen: async function (job, done) {
        try {
            if (!job.details || !job.details.duration) {
                throw new Error('details duration missing');
            }

            console.log('duration is', job.details.duration);
            let parsedDuration = parse(job.details.duration);
            console.log('parsed duration is', parsedDuration);
            let seconds = toSeconds(parsedDuration);
            console.log('video seconds is', seconds);

            let episode = await Episode.findById(job.episode._id);

            if (!episode) {
                throw new Error('Episode not found');
            }

            if (!episode.serie) {
                throw new Error('No serie in episode');
            }

            let serie = await Serie.findById(episode.serie);

            if (!serie || !serie.playlist_id) {
                throw new Error('no playlist id found in serie');
            }

            await init({
                SID,
                HSID,
                SSID,
                APISID,
                SAPISID,
                LOGIN_INFO
            });

            const result = await setEndScreen(episode.youtube_id, (seconds * 1000) - 20000, [
                {...endScreen.POSITION_CENTER, ...endScreen.TYPE_SUBSCRIBE(ytConfig.channelId)},
                {...endScreen.POSITION_CENTER_LEFT, ...endScreen.TYPE_BEST_FOR_VIEWERS},
                {...endScreen.POSITION_CENTER_RIGHT, ...endScreen.TYPE_PLAYLIST(serie.playlist_id)}
            ])

            if (result) {
                if (result.error) {
                    done(result.error);
                } else {
                    console.log('endscreen result is', result);
                    done(null, result);
                }
            }
        } catch (err) {
            console.error(err);
            done(err);
        }
    },
    getEndScreen: async function (job, done) {
        try {
            const VIDEO_ID = job.episode.youtube_id;
            await init({
                SID,
                HSID,
                SSID,
                APISID,
                SAPISID,
                LOGIN_INFO
            });

            const result = await getEndScreen(VIDEO_ID);
            if (result) {
                console.log(result.endscreens[0]);
            }
            done(null, result);
        } catch (err) {
            console.error(err);
            done(err);
        }
    }
}
