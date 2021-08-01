<template>
  <q-page>
    <q-toolbar>
      <q-btn flat icon="arrow_back" round @click="$router.back()"/>
    </q-toolbar>
    <div v-if="serie" class="row full-height no-wrap q-gutter-md">
      <div class="col col-shrink full-height">
        <div class="q-pa-md q-gutter-md">
          <q-img
            :src="`http://localhost:8889/file/${encodeURIComponent(serie.thumbnail)}`"
            style="max-width: 312px;"
          >

          </q-img>
          <div class="text-h5">{{ serie.name }}</div>
          <div class="text-caption">
            {{ $t('series.labels.countEpisodes', {count: serie.episodes.length}) }} -
            {{ $t('series.privacy.' + serie.privacy_status) }} - {{ $t('series.status.' + serie.status) }}
          </div>
          <div>
            <EditSerieBtn :serie="serie" />
            <DeleteSerieBtn :serie="serie" @deleted="$router.replace({name: 'series'})"/>
            <SyncFromYoutubeBtn :serie.sync="serie"/>
            <SyncWithYoutubeBtn :serie.sync="serie"/>
            <SerieActionsMenu :serie.sync="serie"/>
            <PickEpisodeFileBtn :serie="serie"/>
          </div>
          <div class="text-caption" style="white-space: normal; max-width: 312px;">
            {{ serie.description }}
          </div>
        </div>
      </div>
      <div class="col col-grow bg-grey-2">
        <div class="q-pa-md full-height">
          <SerieEpisodeList :serie="serie"/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import {Serie} from "src/models/Serie";
import DeleteSerieBtn from "components/series/actions/DeleteSerieBtn";
import SyncFromYoutubeBtn from "components/series/actions/SyncFromYoutubeBtn";
import SyncWithYoutubeBtn from "components/series/actions/SyncWithYoutubeBtn";
import SerieActionsMenu from "components/series/actions/SerieActionsMenu";
import PickEpisodeFileBtn from "components/series/actions/PickEpisodeFileBtn";
import {dbEvents} from "src/models/common/ipc";
import {filter} from "rxjs/operators";
import SerieEpisodeList from "components/episodes/SerieEpisodeList";
import EditSerieBtn from "components/series/actions/EditSerieBtn";

export default {
  name: "SeriePage",
  components: {
    EditSerieBtn,
    SerieEpisodeList,
    PickEpisodeFileBtn,
    SerieActionsMenu,
    SyncWithYoutubeBtn,
    SyncFromYoutubeBtn,
    DeleteSerieBtn
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data: () => ({
    serie: null,
    subscription: null
  }),
  created() {
    this.subscription = dbEvents.asObservable()
      .pipe(filter(event => event.collection === 'series' && event.data.id === this.id))
      .subscribe(event => {
        let serie = new Serie(event.data);

        if (!serie.episodes && this.serie && this.serie.episodes) {
          serie.episodes = this.serie.episodes;
        }

        this.serie = serie;
      });
  },
  beforeDestroy() {
    if (this.subscription && this.subscription.unsubscribe) this.subscription.unsubscribe();
  },
  mounted() {
    this.loadSerie();
  },
  methods: {
    async loadSerie() {
      this.loading = true;
      try{
        this.serie = await Serie
          .api()
          .findById(this.id, {}, {populate: {path: 'episodes', populate: 'job'}});
      }finally{
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>

</style>
