<template>
  <q-btn v-if="serie" :loading="syncing" color="grey" flat icon="cloud_download" round @click="sync">
    <q-tooltip>
      {{ $t('series.dialogs.syncFromYoutube.tooltip') }}
    </q-tooltip>
  </q-btn>
</template>

<script>
import {Serie} from "src/models/Serie";

export default {
  name: "SyncFromYoutubeBtn",
  props: {
    serie: {
      type: Object,
      default: null
    }
  },
  data: () => ({
    syncing: false
  }),
  methods: {
    async sync() {
      this.syncing = true;
      try {
        let data = await Serie.api().callMethod(this.serie.id, 'syncPlaylistWithSerie');
        console.log(data);
        if (data) {
          this.$emit('update:serie', Object.assign(this.serie, data));
        }
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('series.dialogs.syncFromYoutube.error', {error: err.message})
        })
      } finally {
        this.syncing = false;
      }
    }
  }
}
</script>

<style scoped>

</style>
