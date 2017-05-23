/**
 * Created by Jérémy on 08/05/2017.
 */
module.exports = function () {
    var states = {
        READY: {
            id: 1,
            label: 'READY',
            next: function () {
                return states.INITIALIZED;
            }
        },
        INITIALIZED: {
            id: 2,
            label: 'INITIALIZED',
            next: function () {
                return states.VIDEO_READY;
            }
        },
        VIDEO_READY: {
            id: 3,
            label: 'VIDEO_READY',
            next: function () {
                return null;
            }
        },
        VIDEO_DONE: {
            id: 4,
            label: 'VIDEO_DONE',
            next: function () {
                return states.SCHEDULE;
            }
        },
        SCHEDULE: {
            id: 5,
            label: 'SCHEDULE',
            next: function () {
                return states.UPLOAD_READY;
            }
        },
        UPLOAD_READY: {
            id: 6,
            label: 'UPLOAD_READY',
            next: function () {
                return null;
            }
        },
        UPLOAD_DONE: {
            id: 7,
            label: 'UPLOAD_DONE',
            next: function () {
                return states.THUMBNAIL;
            }
        },
        THUMBNAIL: {
            id: 8,
            label: 'THUMBNAIL',
            next: function () {
                return states.PLAYLIST;
            }
        },
        PLAYLIST: {
            id: 9,
            label: 'PLAYLIST',
            next: function () {
                return states.WAIT_YOUTUBE_PROCESSING;
            }
        },
        WAIT_YOUTUBE_PROCESSING: {
            id: 10,
            label: 'WAIT_YOUTUBE_PROCESSING',
            next: function () {
                return states.MONETIZE;
            }
        },
        MONETIZE: {
            id: 11,
            label: 'MONETIZE',
            next: function () {
                return states.MONETIZING;
            }
        },
        MONETIZING: {
            id: 11,
            label: 'MONETIZING',
            next: function () {
                return states.ENDSCREEN;
            }
        },
        ENDSCREEN: {
            id: 12,
            label: 'ENDSCREEN',
            next: function () {
                return states.ALL_DONE
            }
        },
        ALL_DONE: {
            id: 11,
            label: 'ALL_DONE',
            next: function () {
                return states.PUBLIC;
            }
        },
        PUBLIC: {
            id: 12,
            label: 'PUBLIC',
            next: function () {
                return states.SHARE;
            }
        },
        SHARE: {
            id: 13,
            label: 'SHARE',
            next: function () {
                return null;
            }
        },
        ERROR: {
            id: -1,
            label: 'ERROR',
            next: function () {
                return null;
            }
        }
    };

    return states;
}();