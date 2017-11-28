const Discord = require('discord.js');
const config = require('../../config/discord.json');
const hook = new Discord.WebhookClient(discord.webhook_id, discord.webhook_token);

exports.share = function (job, next) {
    let content = config.publication_message
      .replace('${video_name}', job.episode.video_name)
      .replace('${youtube_id}', job.episode.youtube_id)
      .replace('${playlist_id}', job.episode.serie.playlist_id);

    hook.send(content)
        .then(message => next(null, `Sent message: ${message.content}`))
        .catch(error => next(error, null));
};
