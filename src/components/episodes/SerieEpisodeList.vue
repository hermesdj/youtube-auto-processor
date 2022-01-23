<template>
    <q-list separator>
      <div class="q-px-lg q-py-md flex flex-center">
        <q-pagination color="primary" v-model="options.page" :max="Math.ceil(countEpisodes / options.limit)" boundary-links :max-pages="5" direction-links></q-pagination>
      </div>
      <q-separator />
      <q-item
        v-for="episode in episodes" :key="episode.id"
        :to="{name: 'episodePage', params: {id: episode.id}}"
        class="bg-grey-2"
      >
        <q-item-section side thumbnail top>
          <img
            :src="`thumbnail://${encodeURIComponent(serie.path + '/thumbnails/' + episode.episode_number + '.png')}`"/>
        </q-item-section>
        <q-item-section top>
          <q-item-label class="text-bold">{{ episode.video_name }}</q-item-label>
          <q-item-label class="text-grey text-caption">
            {{ $t('episodes.messages.publishAt', {publishAt: formatDate(episode.publishAt, 'DD/MM/YYYY HH:mm')}) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side top>
          <div v-if="episode.job">{{ episode.job.state }}</div>
        </q-item-section>
      </q-item>
      <q-item v-if="(!episodes || episodes.length === 0) && !loading">
        <q-item-label class="text-center full-width">{{ $t('series.episodes.empty') }}</q-item-label>
      </q-item>
    </q-list>
</template>

<script>
import {Serie} from "src/models/Serie";
import {dbEvents} from "src/models/common/ipc";
import {filter} from "rxjs/operators";
import {isObject} from "lodash";
import {Episode} from "src/models/Episode";
import {Job} from "src/models/Job";
import moment from 'moment';

export default {
  name: "SerieEpisodeList",
  props: {
    serie: {
      type: Serie,
      required: true
    },
    countEpisodes: {
      type: Number,
      default: 0
    }
  },
  data: () => ({
    episodes: [],
    options: {
      page: 1,
      limit: 10
    },
    loading: false
  }),
  created() {
    this.subscription = dbEvents.asObservable()
      .pipe(filter(event => event.collection === 'episodes' || event.collection === 'jobs'))
      .subscribe(event => {
        let episode;
        let episodeId;
        let episodeIndex = -1;

        if (event.collection === 'episodes') {
          episode = new Episode(event.data);
          episodeId = episode.id;
        }

        if (event.collection === 'jobs') {
          let job = new Job(event.data);

          if (isObject(job.episode)) {
            episodeId = job.episode.id;
            episode = new Episode(job.episode);
          } else {
            episodeId = job.episode;

            let index = this.episodes.findIndex(e => e.id === episodeId);
            if (index > -1) {
              episode = this.episodes.find(e => e.id === episodeId);
            }
          }

          if (episode) {
            episode.job = job;
          }
        }

        if (episodeIndex === -1 && episodeId) {
          episodeIndex = this.episodes.findIndex(e => e.id === episodeId);
        }

        if (episodeId && episode) {
          if (episodeIndex > -1) {
            // Already in local array
            if (event.eventType === 'REMOVE') {
              this.episodes.splice(episodeIndex, 1);
            } else {
              this.episodes.splice(episodeIndex, 1, episode);
            }
          } else {
            // Not in local array
            let serieId;

            if (isObject(episode.serie)) {
              serieId = episode.serie.id;
            } else {
              serieId = episode.serie;
            }

            if (serieId === this.serie.id) {
              if (this.eventType !== 'REMOVE') {
                this.episodes.push(episode);
              }
            }
          }
        }
      });
  },
  beforeDestroy() {
    if (this.subscription && this.subscription.unsubscribe) this.subscription.unsubscribe();
  },
  watch: {
    serie: {
      immediate: true,
      deep: true,
      handler(val) {
        this.loadEpisodes(val.id);
      }
    },
    options: {
      immediate: true,
      deep: true,
      handler(val){
        this.episodes.splice(0, this.episodes.length);
        this.loadEpisodes(this.serie.id);
      }
    }
  },
  methods: {
    formatDate(date, format) {
      return moment(date).format(format);
    },
    async loadEpisodes(serieId) {
      this.loading = true;
      return this.$nextTick(() => {
        return Episode.api().find({
          filter: {serie: serieId}, sort: '-episode_number', options: {
            populate: 'job',
            skip: (this.options.page - 1) * this.options.limit,
            limit: this.options.limit
          }
        }).then(res => this.episodes = res)
          .finally(() => this.loading = false);
      });
    }
  }
}
</script>

<style scoped>

</style>
