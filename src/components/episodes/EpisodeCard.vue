<template>
  <q-card v-if="localEpisode" square>
    <img
      v-if="localEpisode && localEpisode.thumbnail"
      :src="`http://localhost:8889/file/${encodeURIComponent(localEpisode.thumbnail)}`"
      style="max-width: 100%;"
    />
    <q-card-section>
      <div class="text-subtitle1">
        {{ localEpisode.video_name }}
      </div>
    </q-card-section>
    <q-card-section v-if="episode.description">
      <q-scroll-area style="height: 200px">
        <div class="text-caption text-grey" style="white-space: pre-line;">{{
            episode.description
          }}
        </div>
      </q-scroll-area>
    </q-card-section>
  </q-card>
</template>

<script>
import {Episode} from "src/models/Episode";
import {dbEvents} from "src/models/common/ipc";
import {filter} from "rxjs/operators";

export default {
  name: "EpisodeCard",
  props: {
    episode: {
      type: Episode,
      required: true
    }
  },
  data: () => ({
    localEpisode: null,
    subscription: null
  }),
  created() {
    this.subscription = dbEvents.asObservable()
      .pipe(filter(event => event.collection === 'episodes' && event.data.id === this.episode.id))
      .subscribe(event => {
        this.localEpisode = Object.assign({}, this.localEpisode, new Episode(event.data));
        this.$emit('update:episode', this.localEpisode);
      });
  },
  beforeDestroy() {
    if (this.subscription && this.subscription.unsubscribe) this.subscription.unsubscribe();
  },
  watch: {
    episode: {
      deep: true,
      immediate: true,
      handler(val) {
        this.localEpisode = val;
      }
    }
  }
}
</script>

<style scoped>

</style>
