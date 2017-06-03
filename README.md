# youtube-auto-processor

## Description

## Installation & Configuration
Download ffmpeg : http://ffmpeg.zeranoe.com/builds/
To be completed

## State machine
job move from state : (not accurate)
- READY : le service watch-folder a détecté une vidéo et initialisé un nouveau job, la vidéo est passée en orange sur l'agenda
- INITIALIZED : le job-runner a initialisé l'épisode et la série si elle n'existait pas
- VIDEO_READY : la vidéo est prête à être traitée par ffmpeg
- VIDEO_PROCESS : la vidéo est en cours de traitement par ffmpeg
- VIDEO_DONE : la vidéo a été traitée par ffmpeg
- SCHEDULE : le job-runner va récupérer la date de publication de la vidéo sur l'agenda
- UPLOAD_READY : la vidéo est prête à être uploadée
- UPLOAD_PROCESS : la vidéo est en cours d'upload
- UPLOAD_DONE : la vidéo a finie d'être uploadée sur Youtube
- THUMBNAIL : le job-runner va upload la miniature de la vidéo
- PLAYLIST : le job-runner va insérer la vidéo dans la playlist, après l'avoir créée si elle n'existe pas
- ALL_DONE : la vidéo est prête à être diffusée, elle est passée en vert sur l'agenda
- PUBLIC : la vidéo est publique (la date du jour est > à la date de publication) et elle est marquée comme public sur l'agenda
- ERROR : Le job runner a rencontré une erreur et a passé le job en arrêt

## Configuration


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