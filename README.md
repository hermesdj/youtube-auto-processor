# youtube-auto-processor

## Description
Youtube auto processor is a windows application I have written to manage my Youtube channel. Its job is to
automatically detect new videos in the file system and start a "job" to process it. It will process the video
using FFMPEG and add an intro and an outro to it, then it will read the publish date on a google spreadsheet,
then it will upload and schedule the video on youtube and then it will configure the video uploaded by setting its
thumbnail, playlist, monetization policy and endscreen.

## June 2021 Update :

I have rewritten huge parts of the code to update it using async/await. Since the end of 2019, the processor was no longer working
due to youtube changing some policies on their API. In order to have the monetisation, endscreen and upload working again, I had to
rework the code to use a headless browser with puppeteer.

I have completly rewritten the Desktop GUI project, removed the nw.js dependency and now it is done in VueJS with the Quasar Framework and Electron.


You can contribute to the project. It is written in nodejs, it uses mongodb to store data, and it uses electron for the desktop
client used to display job status.

## Video Presentation (deprecated)
You can watch my presentation videos (in french) here: https://www.youtube.com/playlist?list=PLqYokZhSL5_7fgXVuog30xWtHsAdYseca

The video are no longer up to date and are focused on version 1.0.0 of the app. I might do a video on the 1.5.0 in the future.

## Installation and Configuration
In order to install the application, a few dependencies must be installed:
1) Install nodejs LTS or Current: https://nodejs.org/en/
2) Install Mongodb: https://www.mongodb.com/fr
3) Download ffmpeg: http://ffmpeg.zeranoe.com/builds/
4) Clone the project on your computer. You can use Github Desktop for example: https://desktop.github.com/
5) Open a CMD prompt and navigate to the root folder of the project
6) install the dependencies by running `npm install`
7) Start a mongodb instance (you can configure mongodb to run as a windows service: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)

After these 7 steps are done, you can launch the electron client in dev mode by running the script :

`quasar dev -m electron`

### What's changed in 1.5.0 ?

The 1.5.0 has a lot of different things from the old 1.0.0 :
1) It uses async/await in the code, making it clearer to read
2) It no longer depends on configuration files stored in the project folder and can be configured directly in the Desktop GUI
3) It no longer depends on windows services. The job runner, video processor, upload processor and file watcher are all parts of the main electron thread now.
4) the upload processor and the video processor launch a child process when they execute
5) The video processor can be configured to run the nvenc codec to use your NVIDIA graphics card encoding capablitiies
6) The serie page on the desktop GUI allows you to create a new serie with a form instead of filling a json file on the file system

### Configuring the app for the first time

Once the desktop client is running, go to Settings > Google Auth to configure :
- Google Client Config : this needs the json file for your Google API Authentication. See below for more information.
- Google Auth Token : Once you have imported the google client config, you have to authenticate on google using this button.
- Google Auth Cookies : the upload processor, monetization and endscreen processor needs to retrieve cookies information from your youtube studio session. It opens a browser to youtube studio and
close when it has found the cookies it needs.

Once the Google Auth is configured, go to Settings > App Settings to configure :
- Managed youtube channel : will let you select a youtube channel from your google account. You have to have completed the previous steps for this.
- Google spreadsheet ID : id of the google spreadsheet where the publish date of your videos can be found
- Default description template : the template used to generate descriptions (see below)
- Default Description : the content of the ${default_description} used in the main template
- Main App Directory : the directory where the processor will watch/store processed videos.

#### Google API Authentication
You will need a Google API credential files in order to connect to the Google API using your own google Account. Navigate to:

https://console.developers.google.com

Navigate to API and services and activate:
- Youtube Data API
- Google Sheets API

Then you need to create an OAuth2.0 client ID and download the json file. Use it on the Settings > Google Auth page of the desktop GUI.

#### Description templates

For the description_templates, the following values are for now available:
- `${game_title}`: The game title as defined in the serie
- `${description}`: The description of the video
- `${store_url}`: The Steam url (or any other store url)
- `${playlist_url}`: the URL of the playlist
- `${default_description}`: The default description defined in Settings > App Settings

#### Managing thumbnails
When you create a new Serie using the desktop GUI, it will create a new folder on your file system located in:

`${project_root_directory/Watch/${game_title}/${serie_title}`

In this folder, you will have a serie.json file describing the serie.

In this folder, you will need to create a `thumbnails` folder containing all the episodes thumbnails named by the episode number and in png format 1280x720p.
The desktop GUI will display for the serie the thumbnail 1.png. If it does not find it, you will have an empty unloaded image displayed instead.

An example of file structure would be:

```
--Watch/
  |--Stellaris/
    |-- My Awesome Serie/
      |--serie.json
      |--<drop your videos here>
      |--thumbnails/
        |--1.png
        |--2.png
```

### Adding new episodes to a serie
You have two ways to add episodes to a serie once it has been created using the GUI :

1) You can open the page of the serie and you have a "pick episode" button. It opens a file selector, you select the .mp4 file and it will create a job for it. One by One, not multiple files.
2) You can drop the .mp4 file directly in the serie folder next to the serie.json file.

The first case will move your video to the serie folder like the second step. Once the video has been added to the Watch folder of the serie, a new job is created and the episode is automatically generated.

### Configuring NVENC
In the Desktop GUI, in Settings > Video Processing > Encoding Config, input the followind options :
- Video Codec : `h264_nvenc`
- Input Options : `-hwaccel cuvid -hwaccel_device 0 -c:v h264_nvenc`
- Video Bitrate : input an integer number. I use 5000.

### Configuring the video processor
You can configure the video processor options in Settings > Video Processing > Processing Config.
The fields are self explanatory.

### The upload processor
Youtube has added a Quota usage for youtube upload to 1600 points out of 10 000 by default. It means you can only reasonably upload 5 videos a day using the Youtube Data API.
This was too limiting for me as I process more like 15 videos one day and none the next days. I implemented a puppeteer headless browser to open the youtube studio page and simulate
the upload like I was doing it manually.

The upload processor will first try to do it headless, in the background. If it fails, it will retry but opening the browser. So when the UPLOAD_PROCESSING step is reached
and a browser appears, you have to open youtube studio page and authenticate on it if needed. Once the upload processor manages to upload a video, it will store the last cookies that worked
in order to be able to do it headless next time.

## State machine
Job states can be modified in the config/states.js file
job move from state :
- READY : File watcher triggered on a new file, job is created and ready to be processed.
- INITIALIZED : The job runner will initialize the episode with its video name, description, etc.
- SCHEDULE : Retrieve the publish at date on the Google Spreadsheet
- VIDEO_READY : Video is ready to be processed by the Video Processor.
- VIDEO_PROCESSING : FFMPEG is encoding the video
- VIDEO_DONE : FFMPEG has finished processing the video. It will be put in ``${project_root_directory/Output/${job_id}``
- UPLOAD_READY : Video is ready to be uploaded
- UPLOAD_PROCESSING : Video is being uploaded (one at a time)
- UPLOAD_DONE : Video has been uploaded
- SET_VIDEO_DATA : Set on the youtube video the title, description, keywords, privacy and publish date
- THUMBNAIL : Set thumbnail on the youtube video
- PLAYLIST : Add the youtube video to the youtube playlist
- WAIT_YOUTUBE_PROCESSING : wait for youtube to have finished processing the video
- MONETIZE : Monetize the video
- MONETIZING : Video is being monetized
- ENDSCREEN : Set the endscreen on the video
- SETTING_ENDSCREEN : the endscreen is being configured
- ALL_DONE : Video is ready to be published, waiting for publication date to be reached
- PUBLIC : Video is public on youtube. Will be marked as "finished" in one day in case there is a problem
- FINISHED : The JOB is finished ! The local video is deleted and the job is deleted

- ERROR : The job encountered an error
- PAUSED : The job has been, paused

## Troubleshooting
If you encounter an issue, please use the Issue tracker of this repository: https://github.com/hermesdj/youtube-auto-processor/issues
