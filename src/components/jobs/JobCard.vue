<template>
  <q-card v-if="localJob" square>
    <q-img
      v-if="localJob.episode && localJob.episode.thumbnail"
      :src="`http://localhost:8889/file/${encodeURIComponent(localJob.episode.thumbnail)}`"
    >
      <q-btn
        v-if="localJob.episode.youtube_id"
        class="absolute-top-right text-white"
        icon="open_in_new"
        round
        size="sm"
        style="top: 8px; right: 8px"
        @click="openInBrowser"
      >
        <q-tooltip>{{ $t('episodes.messages.openOnYoutube') }}</q-tooltip>
      </q-btn>
    </q-img>
    <q-linear-progress
      v-if="localJob.state === 'VIDEO_PROCESSING'"
      color="purple"
      indeterminate

    />
    <q-linear-progress
      v-if="localJob.state === 'UPLOAD_PROCESSING'"
      :indeterminate="!localJob.upload_data || localJob.upload_data.progress === 0"
      :value="localJob.upload_data.progress / localJob.upload_data.total"
      color="purple"
    />
    <q-linear-progress
      v-if="localJob.state === 'WAIT_YOUTUBE_PROCESSING'"
      color="purple"
      indeterminate
    />
    <q-card-section>
      <div class="text-subtitle1">
        {{ localJob.title }}
      </div>
      <div class="text-caption text-grey">
        {{ localJob.state }} -
        {{ $t('jobs.messages.publishAt', {publishAt: formatDate(localJob.episode.publishAt, 'from')}) }}
        <span
          v-if="localJob.process_data && localJob.process_data.progress"
        >
        - {{ $t('jobs.messages.process.percent', {percent: formatPercent(videoProcessingProgress)}) }}
        </span>
        <span
          v-if="localJob.upload_data"
        >
        - {{
            $t('jobs.messages.upload.progress', {percent: formatPercent(videoUploadProgress)})
          }}
        </span>
        <span v-if="localJob && localJob.details && localJob.details.definition" class="q-mx-2">
           <q-icon
             v-if="localJob.details && localJob.details.definition === 'sd' || localJob.details.definition === 'hd'"
             :color="localJob.details.definition === 'sd' || localJob.details.definition === 'hd' ? 'green' : 'orange'"
             name="sd"
             size="sm"
           />
          <q-icon
            v-if="localJob.details && localJob.details.definition === 'hd'"
            :color="localJob.details.definition === 'hd' ? 'green' : 'orange'"
            name="hd"
            size="sm"
          />
        </span>
      </div>
    </q-card-section>
    <q-banner v-if="localJob.state === 'ERROR' && localJob.err && localJob.err.message" class="text-white bg-red">
      <template v-slot:avatar>
        <q-icon name="error"></q-icon>
      </template>
      <div class="text-subtitle2">{{ localJob.err.message }}</div>
      <div class="text-caption">{{ $t('jobs.messages.previousState', {lastState: localJob.last_state}) }}</div>
    </q-banner>
    <q-card-section v-if="localJob.episode && localJob.episode.description">
      <q-scroll-area style="height: 200px">
        <div class="text-caption text-grey" style="white-space: pre-line;">{{
            localJob.episode.description
          }}
        </div>
      </q-scroll-area>
    </q-card-section>
    <q-card-actions>
      <q-space></q-space>
      <q-btn v-if="localJob.state === 'ERROR'" :label="$t('jobs.messages.retry')" flat icon="replay"
             @click="localJob.retry()"></q-btn>
      <q-btn :label="$t('jobs.messages.changeState.btn')" flat icon="edit" @click="openGotoDialog"></q-btn>
      <q-btn v-if="localJob.state !== 'PAUSED'" flat icon="pause" round @click="localJob.pause()"/>
      <q-btn v-if="localJob.state === 'PAUSED'" flat icon="play_circle" round @click="localJob.resume()"/>
      <q-btn v-close-popup flat icon="close" round/>
    </q-card-actions>
  </q-card>
</template>

<script>
import {Job} from "src/models/Job";
import moment from "moment";
import {isObject} from "lodash";
import JobSelectStateDialog from "components/jobs/JobSelectStateDialog";
import {dbEvents} from "src/models/common/ipc";
import {filter} from "rxjs/operators";
import {shell} from 'electron';

export default {
  name: "JobCard",
  props: {
    job: {
      type: Job,
      required: true
    }
  },
  data: () => ({
    localJob: null,
    subscription: null
  }),
  created() {
    this.subscription = dbEvents.asObservable()
      .pipe(filter(event => event.collection === 'jobs' && event.data.id === this.job.id))
      .subscribe(event => {
        this.localJob = Object.assign({}, this.localJob, new Job(event.data));
        this.$emit('update:job', this.localJob);
      });
  },
  beforeDestroy() {
    if (this.subscription && this.subscription.unsubscribe) this.subscription.unsubscribe();
  },
  watch: {
    job: {
      deep: true,
      immediate: true,
      handler(val) {
        if (val) {
          if (!isObject(val.episode)) {
            val.episode = this.localJob.episode;
          }
        }
        this.localJob = val;
      }
    }
  },
  computed: {
    videoProcessingProgress() {
      let result = 0;

      if (this.localJob && this.localJob.process_data) {
        let {duration = 0, progress} = this.localJob.process_data;

        if (progress && duration > 0) {
          let parsedTime = moment.duration(progress.timemark);
          result = parsedTime.asMilliseconds() / (duration * 1000);
        } else if (this.localJob.state !== 'VIDEO_PROCESSING') {
          result = 1;
        }
      }

      return result;
    },
    videoUploadProgress() {
      let result = 0;

      if (this.localJob && this.localJob.upload_data) {
        result = this.localJob.upload_data.progress / this.localJob.upload_data.total;
      }

      return result;
    }
  },
  methods: {
    formatDate(date, format) {
      if (format === 'from') return moment(date).fromNow();
      return moment(date).format(format);
    },
    formatPercent(value) {
      return Intl.NumberFormat("en-US", {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    },
    async openGotoDialog() {
      await this.$q.dialog({
        component: JobSelectStateDialog,
        parent: this,
        job: this.localJob
      })
    },
    openInBrowser() {
      if (this.localJob && this.localJob.episode && this.localJob.episode.youtube_id) {
        shell.openExternal(`https://studio.youtube.com/video/${this.localJob.episode.youtube_id}/edit`)
      }
    }
  }
}
</script>

<style scoped>

</style>
