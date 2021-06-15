<template>
  <q-list separator>
    <q-item
      v-for="episode in episodes" :key="episode.id"
      :to="{name: 'episodePage', params: {id: episode.id}}"
    >
      <q-item-section side thumbnail top>
        <img
          :src="`http://localhost:8889/file/${encodeURIComponent(serie.path + '/thumbnails/' + episode.episode_number + '.png')}`"/>
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
    <q-item v-if="!episodes || episodes.length === 0">
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
    }
  },
  data: () => ({
    episodes: [],
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
        if (val && val.episodes) {
          this.episodes = val.episodes;
        } else {
          this.episodes = [];
        }
      }
    }
  },
  methods: {
    formatDate(date, format) {
      return moment(date).format(format);
    }
  }
}
</script>

<style scoped>

</style>
