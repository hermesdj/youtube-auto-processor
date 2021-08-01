// This is just an example,
// so you can safely delete all default props below

export default {
  app: {
    title: 'Youtube Channel Manager',
    description: "Welcome to the Youtube Channel Manager by Jay's Gaming",
    menu: {
      series: 'Séries',
      jobs: 'Jobs',
      services: 'Services',
      logs: 'Logs',
      config: 'Settings'
    },
    btn: {
      save: 'Save'
    }
  },
  logs: {
    autoLoad: 'Auto Reload',
    clear: 'Clear Logs',
    table: {
      title: 'Logs',
      cols: {
        date: 'Date',
        time: 'Time',
        hostname: 'Hostname',
        pid: 'PID',
        message: 'Message',
        label: 'Label',
        level: 'Level'
      }
    }
  },
  dialogs: {
    confirm: {
      title: 'Confirm'
    }
  },
  services: {
    title: 'Windows Services',
    installed: 'Installed',
    started: 'Started'
  },
  series: {
    labels: {
      countEpisodes: "{count} Episodes"
    },
    table: {
      title: '{status} Series',
      search: 'Search series...',
      cols: {
        name: 'Title',
        game: 'Game Title',
        createdAt: 'Date Created',
        updatedAt: 'Date Updated',
        countEpisodes: 'Number of Episodes',
        status: 'Status'
      }
    },
    status: {
      active: 'Active',
      paused: 'Paused',
      cancelled: 'Cancelled',
      finished: 'Finished'
    },
    actions: {
      categories: {
        privacy: 'Privacy',
        status: 'Status'
      }
    },
    create: {
      btn: 'New Serie',
      title: 'Create a new serie',
      createOnYoutube: 'Create Playlist on Youtube',
      isNew: 'New Serie'
    },
    edit: {
      btn: 'Save',
      title: 'Edit Serie {name}',
      tooltip: 'Edit Serie {name}'
    },
    privacy: {
      public: 'Public',
      private: 'Private',
      unlisted: 'Unlisted'
    },
    fields: {
      title: 'Title',
      planningName: 'Planning Name Template',
      videoTitleTemplate: 'Video Title Template',
      language: 'Language',
      tags: 'Tags',
      description: 'Description',
      playlistId: 'Youtube Playlist ID',
      gameTitle: 'Game Title',
      lastEpisodeNumber: 'Last Episode Number',
      namedEpisode: 'Named Episode',
      storeUrl: 'Game Store URL'
    },
    hints: {
      lastEpisodeNumber: 'Provide the last episode number for this serie if it already exists. 0 for a new serie.'
    },
    languages: {
      fr: 'French'
    },
    dialogs: {
      delete: {
        description: 'You are about to delete this serie, are you sure ?',
        error: 'An error occurred when deleting the serie : {error}',
        tooltip: 'Delete Serie'
      },
      syncFromYoutube: {
        error: 'An error occurred while syncing data from Youtube : {error}',
        tooltip: 'Retrieve data from Youtube Playlist'
      },
      syncWithYoutube: {
        error: 'An error occurred while syncing data to Youtube: {error}',
        tooltip: 'Send data to Youtube Playlist'
      },
      pickFile: {
        tooltip: 'Select a new file to add to this serie'
      }
    },
    episodes: {
      title: 'Episodes',
      empty: 'This serie does not contain any episodes for the moment'
    }
  },
  episodes: {
    messages: {
      publishAt: 'Episode publication: {publishAt}',
      openOnYoutube: 'Open Video Edit Page on Youtube'
    },
    fields: {
      path: 'Path',
      video_name: 'Video Title',
      youtube_id: 'ID Youtube',
      playlist_item_id: 'ID Playlist Item',
      status: 'Status',
      episode_number: 'Episode Number',
      description: 'Description',
      keywords: 'Keywords',
      episode_name: 'Episode Name'
    },
    edit: {
      title: 'Modifier Episode',
      btn: 'Save'
    }
  },
  jobs: {
    table: {
      title: 'Processing Job List',
      search: 'Search Jobs',
      selectedStates: '{count} Selected',
      cols: {
        date_created: "Created On",
        state: "Processing State",
        title: "Title",
        data: "State Data",
        actions: "Actions",
        publishAt: "Published"
      }
    },
    messages: {
      publishAt: 'Published {publishAt}',
      retry: 'Retry',
      previousState: 'Error occurred during state {lastState}',
      process: {
        timemark: 'Processed timemark: {timemark}',
        percent: 'Processed: {percent}'
      },
      upload: {
        progress: 'Upload progress: {percent}'
      },
      changeState: {
        btn: 'Goto State',
        title: 'Select new Job state',
        changeStateError: 'An error occurred while changing job state: {message}'
      }
    }
  },
  validations: {
    required: 'The field is required',
    url: 'The value must be a correctly formatted url'
  },
  forms: {
    reset: 'Reset',
    invalidForm: 'The form is invalid, please correct the issues before submitting again.',
    formError: 'The form submission has encountered the error {message}'
  },
  configs: {
    tabs: {
      app: 'App Settings',
      googleAuth: 'Google Auth',
      videoProcessing: 'Video Processing'
    },
    app: {
      title: 'Main App Configuration',
      description: 'Configure different components of the App',
      saveBtn: 'Save Config',
      channel: {
        title: 'Managed Youtube Channel',
        noChannel: 'No Channel configured. Please select a channel to manage.',
        pickLabel: 'Select Channel',
        pickTooltip: 'Select a youtube channel from my channel list',
        pickTitle: 'Pick a Youtube Channel',
        saveChannelError: 'Error on saving selected channel: {message}',
        paginateChannelsError: 'Error on retrieving channel list: {message}',
        loadError: 'Error loading channel configured: {message}'
      },
      config: {
        error: 'Error loading app config: {message}',
        saveError: 'Error saving app config: {message}'
      },
      fields: {
        spreadsheetId: 'Google Spreadsheet ID',
        defaultDescriptionTemplate: 'Default Description Template',
        defaultDescription: 'Default Description',
        mainAppDirectory: 'Main App Directory'
      },
      hints: {
        spreadsheetId: 'Provide the Google Spreadsheet ID where the app can retrieve an episode scheduled date',
        defaultDescriptionTemplate: 'Main template used to build the description of an episode.',
        defaultDescription: 'Provide a default description to be inserted in the description template'
      },
      changeAppDirectory: {
        btn: 'Change'
      }
    },
    googleAuth: {
      title: 'Configure Google Authentication',
      description: 'Google Authentication is required to connect to the Youtube and Sheet API in order to manage videos, resolve scheduling, etc.',
      config: {
        title: 'Google Client Config',
        fields: {
          project_id: 'Project ID',
          client_id: 'Client ID',
          client_secret: 'Client Secret'
        },
        error: 'Error retrieving google client config: {message}',
        loading: 'Loading google auth configuration',
        noConfig: 'No google client configuration found, please provide google client configuration json',
        pickTooltip: 'Pick the JSON file provided on the google developper console',
        pickLabel: 'Pick JSON file',
        createFromPathError: 'Impossible to create config from file. Returned error is : {message}'
      },
      token: {
        title: 'Google Auth Token',
        noToken: 'No Google Auth Token stored, please auth on google using the connect button',
        authLabel: 'Connect',
        authTooltip: 'Start the authentication process on Google',
        fields: {
          expiry_date: 'Expiry Date'
        }
      },
      cookie: {
        title: 'Google Auth Cookies',
        noCookies: 'No Google Cookies stored, please auth on youtube studio using the connect button',
        authLabel: 'Connect',
        authTooltip: 'Start the authentication process on Youtube',
        configOk: 'Google Cookie Config is OK',
        noChannel: 'No Channel managed configured. Cannot configure cookie config. Please configure a channel first'
      }
    },
    videoProcessing: {
      loadError: 'Error during configuration loading: {message}',
      tabs: {
        config: 'Processing Config',
        encoders: 'Encoders',
        filters: 'Filters',
        codecs: 'Codecs',
        formats: 'Formats',
        configEncoding: 'Encoding Config'
      },
      fields: {
        key: 'Key',
        type: 'Type',
        description: 'Description',
        input: 'Input',
        output: 'Output',
        canDecode: 'Can Decode ?',
        canEncode: 'Can Encode ?',
        canDemux: 'Can Demux ?',
        canMux: 'Can Mux ?'
      },
      values: {
        yes: 'Yes',
        no: 'No'
      },
      datafilters: {
        type: 'Filter By Type',
        input: 'Filter By Input',
        output: 'Filter By Output'
      },
      encoders: {
        title: 'Available Encoders'
      },
      codecs: {
        title: 'Available Codecs'
      },
      formats: {
        title: 'Available Formats'
      },
      filters: {
        title: 'Available Filters'
      },
      config: {
        title: 'Video processing configuration',
        description: 'Configure the params used by the video processor to transform your videos from a raw file to an uploadable file',
        error: 'Error loading video processor config: {message}',
        saveError: 'An error occurred while saving the video processing configuration: {message}',
        fields: {
          defaultIntro: 'Default Intro Video',
          defaultOutro: 'Default Outro Video',
          prependIntro: 'Prepend Intro',
          appendOutro: 'Append Outro',
          ffmpegPath: 'FFMPEG Path',
          ffprobePath: 'FFPROBE Path',
          pauseBeforeProcessing: 'Pause Job before processing',
          pauseAfterProcessing: 'Pause Job after processing',
          chainVideoProcessing: 'Resume next Paused Job after Video Processing'
        },
        hints: {
          defaultIntro: 'The Video to prepend when processing',
          defaultOutro: 'The Video to append when processing',
          ffmpegPath: 'The path to the FFMPEG exe file',
          ffprobePath: 'The path to the FFPROBE exe file',
        }
      },
      configEncoding: {
        title: 'Video Encoding configuration',
        description: 'Configure the params used by FFMPEG while processing a video.',
        invalidConfig: 'The FFMPEG configuration is invalid. Please configure first the FFMPEG path and FFPROBE path.',
        error: 'Error loading video encoding config: {message}',
        saveError: 'An error occured while saving the video encoding configuration: {message}',
        fields: {
          videoCodec: 'Video Codec',
          inputOptions: 'Input Options',
          videoFilter: 'Video Filter',
          videoBitrate: 'Video Bitrate'
        }
      }
    }
  }
}
