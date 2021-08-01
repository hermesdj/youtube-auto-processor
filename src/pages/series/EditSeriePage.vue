<template>
  <q-page v-if="serie">
    <q-toolbar>
      <q-btn flat icon="arrow_back" round @click="$router.back()"/>
      <q-toolbar-title>{{ $t('series.edit.title', serie) }}</q-toolbar-title>
    </q-toolbar>
    <div class="row q-mb-lg">
      <div class="col-8 q-mx-auto">
        <EditSerieForm
          @cancel="$router.back()"
          @saved="() => $router.replace({name: 'seriePage', params: {id}})"
          :serie.sync="serie"
        />
      </div>
    </div>
  </q-page>
</template>

<script>

import EditSerieForm from "components/series/forms/EditSerieForm";
import {Serie} from "src/models/Serie";

export default {
  name: "EditSeriePage.vue",
  components: {EditSerieForm},
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data: () => ({
    serie: {
      name: null
    }
  }),
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
