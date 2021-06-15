<template>
  <q-page>
    <q-toolbar>
      <q-btn flat icon="arrow_back" round @click="$router.back()"/>
    </q-toolbar>
    <div class="row q-my-lg">
      <div class="col-8 q-mx-auto">
        <EpisodeCard
          v-if="localEpisode"
          :episode="localEpisode"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import {Episode} from "src/models/Episode";
import EpisodeCard from "components/episodes/EpisodeCard";

export default {
  name: "EpisodePage",
  components: {EpisodeCard},
  props: {
    id: {
      type: String,
      required: true
    }
  },
  async onRouteUpdate(to, from, next) {
    if (to.params.id !== from.params.id) {
      await this.loadEpisode(to.params.id);
    }
    next();
  },
  data: () => ({
    localEpisode: null,
    loading: false
  }),
  mounted() {
    this.loadEpisode(this.id);
  },
  methods: {
    async loadEpisode(id) {
      this.loading = true;

      try {
        this.localEpisode = await Episode
          .api()
          .findById(this.id, {}, {populate: [{path: 'serie'}, {path: 'job'}]});
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>

</style>
