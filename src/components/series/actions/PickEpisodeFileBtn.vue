<template>
  <span>
    <q-input ref="fileInput" v-model="file" label="Standard" accept=".mp4" style="display:none" type="file"></q-input>
    <q-btn color="grey" flat icon="file_upload" round @click="getFile">
      <q-tooltip>{{ $t('series.dialogs.pickFile.tooltip') }}</q-tooltip>
    </q-btn>
  </span>
</template>

<script>
import {Serie} from "src/models/Serie";

export default {
  name: "PickEpisodeFileBtn",
  props: {
    serie: {
      type: Serie,
      default: null
    }
  },
  data: () => ({
    file: null
  }),
  watch: {
    async file(val) {
      if (val && val.length > 0) {
        let file = val[0];
        await this.serie.addFile(file.path);
      }
    }
  },
  methods: {
    getFile() {
      this.file = null;
      this.$refs.fileInput.$el.click();
    }
  }
}
</script>

<style scoped>

</style>
