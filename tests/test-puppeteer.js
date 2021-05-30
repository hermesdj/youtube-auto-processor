const puppeteer = require("puppeteer");

const SID = '-AcofBMe2HIV3gv2t5kGxu69sCLGOt6z3T35ghypt3jECPE5l2h-b-ZBEhLwYiqE2i6mUw.';
const HSID = 'A2p1gOQpijhVfqLzA';
const SSID = 'ASPv5VzQUh4od1xKr';
const APISID = '1jUe7UOI8epmsJgq/ApfvJm9tr6PM9HIcQ';
const SAPISID = 'NUauvEH2cF0MyKuB/AwwK7pkOcITKkHBXa';
const LOGIN_INFO = 'AFmmF2swRgIhAJ6Mh1Sq_nUPH_YwE4H6clzS_ROPlDJmriwUW4CZh83UAiEAyZxVoTVWxir-g2-z9cObGJ-cEhU2vEjhEmuz_ve1ZhI:QUQ3MjNmeWRhV2ZZWEpYNk5kMFJoS2pGUXFWaXNMUTkwYVhpb0VqVEc1TUMwRVB5Y2FRVEMtaWFvcW5iUWNGYVhqbUIzTGk1cnRUblZGbThHNEZCWW43dFhTV192alAtVTgybWptc2JYZV9KRWNMZEtJTDFUTXRxeFNsM2o5NUFKSHc0NmQ3eWdja1RjTUdsdjBmcGprWkRac0JDcDE4N2Rn';


(async () => {
    try {
        const result = {
            CHANNEL_ID: null,
            DELEGATION_CONTEXT: null,
            INNERTUBE_CONTEXT_SERIALIZED_DELEGATION_CONTEXT: null,
            INNERTUBE_API_KEY: null,
            DELEGATED_SESSION_ID: null,
            clientScreenNonce: null,
            sessionToken: null
        };

        const browser = await puppeteer.launch();
        const url = `https://studio.youtube.com/video/swyGScamm9A/monetization/ads`;
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

        const cookie = `SID=${SID};HSID=${HSID};SSID=${SSID};APISID=${APISID};SAPISID=${SAPISID};${LOGIN_INFO ? `LOGIN_INFO=${LOGIN_INFO}` : ''}`
        const cookies = cookie.split(';').map(c => ({
            name: c.split('=')[0],
            value: c.split('=')[1],
            domain: '.youtube.com'
        }));

        await page.setCookie(...cookies);

        function logResponse(interceptedResponse) {
            //console.log('A response was received:', interceptedResponse.url());
        }

        page.on('response', logResponse);

        page.once('domcontentloaded', async () => {

            let ytConfig = await page.evaluate(() => window.yt.config_);

            result.CHANNEL_ID = ytConfig.CHANNEL_ID;
            result.clientScreenNonce = ytConfig['client-screen-nonce'];
            result.DELEGATED_SESSION_ID = ytConfig.DELEGATED_SESSION_ID;
            result.DELEGATION_CONTEXT = ytConfig.DELEGATION_CONTEXT;
            result.INNERTUBE_API_KEY = ytConfig.INNERTUBE_API_KEY;
            result.INNERTUBE_CONTEXT_SERIALIZED_DELEGATION_CONTEXT = ytConfig.INNERTUBE_CONTEXT_SERIALIZED_DELEGATION_CONTEXT;

            let httpResponse = await page.waitForResponse((response) => response.url().startsWith('https://studio.youtube.com/youtubei/v1/att/esr'), {timeout: 60000});
            let data = await httpResponse.json();
            result.sessionToken = data.sessionToken;
        })

        await page.goto(url);
    } catch (err) {
        console.error(err);
    }
})();
