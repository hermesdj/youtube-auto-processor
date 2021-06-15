<template>
  <q-btn v-if="serie" :loading="deleting" color="grey" flat icon="delete" round @click="deleteSerie">
    <q-tooltip>{{ $t('series.dialogs.delete.tooltip') }}</q-tooltip>
  </q-btn>
</template>

<script>
import {Serie} from "src/models/Serie";

export default {
  name: "DeleteSerieBtn",
  props: {
    serie: {
      type: Object,
      default: null
    }
  },
  data: () => ({
    deleting: false
  }),
  methods: {
    deleteSerie() {
      this.$q.dialog({
        title: this.$t('dialogs.confirm.title'),
        message: this.$t('series.dialogs.delete.description'),
        cancel: true,
        persistent: true
      }).onOk(async () => {
        this.deleting = true;

        try {
          await Serie.api().callMethod(this.serie.id, 'deleteSerie', []);
          this.$emit('deleted', this.serie);
        } catch (err) {
          this.$q.notify({
            color: 'red-4',
            textColor: 'white',
            icon: 'warning',
            message: this.$t('series.dialogs.delete.error', {error: err.message})
          })
        } finally {
          this.deleting = false;
        }
      })
    }
  }
}
</script>

<style scoped>

</style>
