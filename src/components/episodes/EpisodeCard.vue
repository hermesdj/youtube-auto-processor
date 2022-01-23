<template>
  <q-card v-if="localEpisode" square>
    <div class="row">
      <div class="col-4">
        <q-img
          v-if="localEpisode && localEpisode.thumbnail"
          :src="`thumbnail://${encodeURIComponent(localEpisode.thumbnail)}`"
          style="max-width: 100%;"
        >
          <q-btn
            v-if="localEpisode.youtube_id"
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
        <q-card-section>
          <div class="text-subtitle1">
            {{ localEpisode.video_name }}
          </div>
          <div class="text-caption text-grey">
            {{ localEpisode.date_created | moment('DD/MM/YYYY HH:mm:ss') }}
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
      </div>
      <q-separator vertical/>
      <div class="col">
        <q-toolbar>
          <q-toolbar-title>{{ $t('episodes.edit.title') }}</q-toolbar-title>
        </q-toolbar>
        <q-separator/>
        <EditEpisodeForm
          v-if="episode"
          :episode.sync="localEpisode"
        >

        </EditEpisodeForm>
      </div>
    </div>
  </q-card>
</template>

<script>
import {Episode} from "src/models/Episode";
import {dbEvents} from "src/models/common/ipc";
import {filter} from "rxjs/operators";
import EditEpisodeForm from "components/episodes/EditEpisodeForm";
import {shell} from "electron";

export default {
  name: "EpisodeCard",
  components: {EditEpisodeForm},
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
  },
  methods: {
    openInBrowser() {
      if (this.localEpisode && this.localEpisode.youtube_id) {
        shell.openExternal(`https://studio.youtube.com/video/${this.localEpisode.youtube_id}/edit`)
      }
    }
  }
}
</script>

<style scoped>

</style>
