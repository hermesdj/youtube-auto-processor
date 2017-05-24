const Discord = require('discord.js');
const hook = new Discord.WebhookClient('316937764463706123', 'eRVqdCiOijQYC4RDJ0vsi00lASFtlNdeKbpTKHUe1iEBYhgKb-BRUb2n3eQWK729u1KI');

exports.share = function (job, next) {
    let content = 'Jay a mis en ligne l\'épisode suivant : ' + job.episode.video_name
            + ' '
        + ' https://www.youtube.com/watch?v=' + job.episode.youtube_id + '&list=' + job.episode.serie.playlist_id;
    hook.send(content)
        .then(message => next(null, `Sent message: ${message.content}`))
        .catch(error => next(error, null));
};
