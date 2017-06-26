# youtube-auto-processor

## Description
Youtube auto processor is a windows application I have wroten to manage my Youtube channel. It's job is to
automatically detect new videos in the file system and start a "job" to process it. It will process the video
using FFMPEG and add an intro and an outro to it, then it will read the publish date on a google spreadsheet, 
then it will upload and schedule the video on youtube and then it will configure the video uploaded by setting its
thumbnail, playlist, monetization policy and endscreen

The project is in an early state : it works for my channel, and it works with configuration files. It is not yet suited
to work for another channel without a few modifications. I am working on improving this.

You can contribute to the project. It is written in nodejs, it uses mongodb to store data, and it uses nw.js for the web
client used to display job status.

## Video Presentation
You can watch my presentation videos (in french) here : https://www.youtube.com/playlist?list=PLqYokZhSL5_7fgXVuog30xWtHsAdYseca

## Installation and Configuration
In order to install the application, a few dependencies must be installed :
1) Install nodejs LTS or Current : https://nodejs.org/en/
2) Install Mongodb : https://www.mongodb.com/fr
3) Download ffmpeg : http://ffmpeg.zeranoe.com/builds/
4) Clone the project on your computer. You can use Github Desktop for example : https://desktop.github.com/
5) Open a CMD prompt and navigate to the root folder of the project
6) install the dependencies by running `npm install`
7) install the nw.js client dependencies by running `npm install -g jspm` and `jspm install`
8) Start a mongodb instance (you can configure mongodb to run as a windows service : https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)

After these 8 steps are done, you are ready to configure the project. The configuration files are located in the config folder.

You will need a Google API credential files in order to connect to the Google API using your own google Account. Navigate to :

https://console.developers.google.com

You will need to activate :
- Youtube Data API
- Google Sheets API

You will then need to generate a ID clients OAuth 2.0, download the JSON file, rename it to `client_secret.json` and move it to the config folder.

`config/app.json` :

```json
{
  "watch_directory": "Z:/Content Creation/Processor/Watch",
  "working_directory": "Z:/Content Creation/Processor/Work",
  "output_directory": "Z:/Content Creation/Processor/Output",
  "ffmpeg_path": "Z:/Dev/workspace/youtube-auto-processor/lib/ffmpeg-3.3.1-win64-static/bin/ffmpeg.exe", 
  "ffprobe_path": "Z:/Dev/workspace/youtube-auto-processor/lib/ffmpeg-3.3.1-win64-static/bin/ffprobe.exe",
  "pause_before_processing": true
}
```

- `watch_directory`: Folder where the app will look for new .mp4 videos
- `working_directory` :  Folder where FFMPEG will store the data during processing
- `output_directory`: Folder where FFMPEG will output the videos
- `ffmpeg_path`: Path to ffmpeg.exe
- `ffprobe_path`: Path to ffprobe.exe (usually in the same folder as ffmpeg.exe)
- `pause_before_processing`: If the application should pause a job before starting the video processing. Useful if you want to keep recording videos and process them later

`config/youtube.json`
```json
{
  "agenda_spreadsheet_id": "SPREADSHEET_ID",
  "default_description_template": "${game_title} Gameplay FR 1080p HD\r\n\r\n${description}\r\n\r\nVous pouvez retrouver le jeu en suivant le lien suivant : \r\n${store_url}\r\n\r\nVous pouvez suivre la série grâce à la playlist suivante :\r\n${playlist_url}\r\n\r\n${default_description}", // default video description template
  "default_description_template_localized": {
    "en": "${game_title} Gameplay FR 1080p HD\r\n\r\n${description}\r\n\r\nYou can buy the game here : \r\n${store_url}\r\n\r\nYou can follow the whole serie thanks to the following playlist :\r\n${playlist_url}\r\n\r\n${default_description}" // Not working yet
  },
  "default_intro": "Z:/Content Creation/Processor/Assets/Intro/Intro.mp4",
  "default_outro": "Z:/Content Creation/Processor/Assets/Outro/Outro.mp4",
  "prepend_intro": true,
  "append_outro": true,
  "intro_outro_air_date": "2017/06/01 00:00:00"
}
```
- `agenda_spreadsheet_id`: Spreadsheet where the videos are scheduled. You can find mine at http://agenda.jaysgaming.fr
- `default_description_template`:
- `default_description_template_localized`:
- `default_intro`:
- `default_outro`:
- `prepend_intro`:
- `append_outro`:
- `intro_outro_air_date`:

For the description_templates, the following values are for now available :
- `${game_title}` : The game title as defined in the `serie.json` descriptor (see below)
- `${description}` : The description of the video
- `${store_url}` : The Steam url (or any other store url)
- `${playlist_url}` : the URL of the playlist
- `${default_description}` : The default description defined in `config/default_description.txt`

When the File Watcher service starts, it will look into the folder configured as `watch_directory` for .mp4 files. In the folder, a serie.json file must be present in order to define what serie the folder is linked to

`examples/serie.json`
```json
{
  "planning_name": "Test ${episode_number}", 
  "playlist_id": "YOUTUBE_PLAYLIST_ID", 
  "video_keywords": "Test, Programming, API, Processor", 
  "last_episode": 0, 
  "video_title_template": "Test Processing - Episode ${episode_number}",
  "description": "Ceci est une vidéo de test pour le processeur Youtube !", 
  "description_template": null, 
  "named_episode": false, 
  "game_title": "Test",
  "localizations": [ 
    {
      "key": "en",
      "title": "Test Processing - Episode ${episode_number}",
      "description": "This is a test video for Youtube auto processor",
      "description_template": null
    }
  ]
}
```

- `planning_name`: Name to look in the google spreadsheet for scheduling the video date
- `playlist_id`: Playlist ID. If not provided, add a playlist_title key in this file and the program will create it
- `video_keywords`: The keywords of each videos
- `last_episode`: The last episode uploaded but not managed by the program. This is useful to start the program on an existing serie
- `video_title_template`: The video title template
- `description`: The video description that will be included in the default_description_template
- `description_template`: A description template specific for this serie
- `named_episode`: If the video title will need a custom name. If set to true, the process will stop in INITIALIZED state until an episode_name is provided
- `game_title`: The name of the game
- `localizations`: Localization management for title and description. Not working for now

In the Watch folder, you will need to create a `thumbnails` folder containing all the episodes thumbnails named by the episode number and in png format 1280x720p

Once everything is configured, run the application `npm start`

If you want to have debug available in the NW.js client, run `npm install nw --nwjs_build_type=sdk` before launching the app

## State machine
job move from state : 
- READY : le service watch-folder a détecté une vidéo et initialisé un nouveau job, la vidéo est passée en orange sur l'agenda
- INITIALIZED : le job-runner a initialisé l'épisode et la série si elle n'existait pas
- SCHEDULE : le job-runner va récupérer la date de publication de la vidéo sur l'agenda
- VIDEO_READY : la vidéo est prête à être traitée par ffmpeg
- VIDEO_PROCESS : la vidéo est en cours de traitement par ffmpeg
- VIDEO_DONE : la vidéo a été traitée par ffmpeg
- UPLOAD_READY : la vidéo est prête à être uploadée
- UPLOAD_PROCESS : la vidéo est en cours d'upload
- UPLOAD_DONE : la vidéo a finie d'être uploadée sur Youtube
- THUMBNAIL : le job-runner va upload la miniature de la vidéo
- PLAYLIST : le job-runner va insérer la vidéo dans la playlist, après l'avoir créée si elle n'existe pas
- WAIT_YOUTUBE_PROCESSING
- MONETIZE
- MONETIZING
- ENDSCREEN
- SETTING_ENDSCREEN
- ALL_DONE : la vidéo est prête à être diffusée, elle est passée en vert sur l'agenda
- PUBLIC : la vidéo est publique (la date du jour est > à la date de publication) et elle est marquée comme public sur l'agenda
- FINISHED

- ERROR : Le job runner a rencontré une erreur et a passé le job en arrêt
- PAUSED

## TODO
- [x] Suppression de la vidéo locale une fois que tout le traitement a été terminé et la vidéo publique. Idem pour le thumbnail
- [x] Ajout d'un state MONETIZE pour gérer la monétisation automatique de la vidéo
- [x] En state INITIALIZED, si la vidéo a besoin d'un titre custom, il faut mettre le traitement en pause et ne pas passer à l'étape suivante
- [x] Ajout d'un state PAUSE pour mettre en pause le traitement en cours si possible
- [ ] Associer une icône à chaque state
- [x] Traitement de la vidéo avec intro et outro
- [x] Ajout d'un écran de fin automatique
- [ ] Terminer le client nw.js pour consulter le status des jobs et manager le système
- [ ] Setter le nom du jeu sur la vidéo automatiquement
- [ ] Charger automatiquement la base de données au lancement de l'application si mongo n'est pas lancé (service windows)
- [ ] Compilation de l'application avec nw-builder
- [ ] Gérer le cas où on a une ou des cases vides dans l'agenda
- [x] vérifier que cela check bien dans le mois suivant
- [ ] Gérer la localization des vidéos (ça ne fonctionne pas actuellement et bug sur le serieProcessor à l'initialization)
- [ ] Cleanup des vidéos uploadées + configuration
- [ ] Compléter le readme avec des screenshots par exemple...
- [ ] changer la gestion des URL de store pour supporter les nouveaux partenariats

## Troubleshooting
If you encounter an issue, please use the Issue tracker of this repository : https://github.com/hermesdj/youtube-auto-processor/issues

