/**
 * Created by Jérémy on 08/05/2017.
 */
module.exports = function () {
    var states = {
        READY: {
            label: 'READY',
            next: function () {
                return states.INITIALIZED;
            }
        },
        INITIALIZED: {
            label: 'INITIALIZED',
            next: function () {
                return states.VIDEO_READY;
            }
        },
        VIDEO_READY: {
            label: 'VIDEO_READY',
            next: function () {
                return null;
            }
        },
        VIDEO_DONE: {
            label: 'VIDEO_DONE',
            next: function () {
                return states.SCHEDULE;
            }
        },
        SCHEDULE: {
            label: 'SCHEDULE',
            next: function () {
                return states.UPLOAD_READY;
            }
        },
        UPLOAD_READY: {
            label: 'UPLOAD_READY',
            next: function () {
                return null;
            }
        },
        UPLOAD_DONE: {
            label: 'UPLOAD_DONE',
            next: function () {
                return states.THUMBNAIL;
            }
        },
        THUMBNAIL: {
            label: 'THUMBNAIL',
            next: function () {
                return states.PLAYLIST;
            }
        },
        PLAYLIST: {
            label: 'PLAYLIST',
            next: function () {
                return states.ALL_DONE;
            }
        },
        ALL_DONE: {
            label: 'ALL_DONE',
            next: function () {
                return states.PUBLIC;
            }
        },
        PUBLIC: {
            label: 'PUBLIC',
            next: function () {
                return null;
            }
        },
        ERROR: {
            label: 'ERROR',
            next: function () {
                return null;
            }
        }
    };

    return states;
}();