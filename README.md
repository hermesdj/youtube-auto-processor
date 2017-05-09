# youtube-auto-processor

## State machine
job move from state :
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
- ERROR : la vidéo est publique (la date du jour est > à la date de publication) et elle est marquée comme public sur l'agenda

## Configuration
