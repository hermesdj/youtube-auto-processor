<template>
  <q-select
    v-model="encoding"
    :label="$t('configs.videoProcessing.configEncoding.fields.videoCodec')"
    :loading="loading"
    :options="options"
    emit-value
    fill-input
    hide-selected
    input-debounce="0"
    standout="bg-primary text-white"
    use-input
    @filter="filterFn"
  >

  </q-select>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
  name: "VideoEncondigCodecInput",
  props: {
    value: {
      type: String,
      default: null
    }
  },
  data: () => ({
    loading: false,
    codecs: [],
    options: []
  }),
  mounted() {
    this.loadCodecs();
  },
  computed: {
    encoding: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      }
    }
  },
  methods: {
    filterFn(val, update, abort) {
      update(() => {
        const needle = val.toLocaleLowerCase()
        this.options = this.codecs.filter(v => v.toLocaleLowerCase().indexOf(needle) > -1)
      })
    },
    async loadCodecs() {
      try {
        let codecs = await ipcRenderer.invoke('processing.availableCodecs', {});
        this.codecs = codecs.map(c => c.key);
        this.options = this.codecs;
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.videoProcessing.loadError', {message: err.message})
        })
      }
    }
  }
}
</script>

<style scoped>

</style>
