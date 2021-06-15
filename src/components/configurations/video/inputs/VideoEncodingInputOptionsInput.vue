<template>
  <q-input
    v-model="options"
    :label="$t('configs.videoProcessing.configEncoding.fields.inputOptions')"
    standout="bg-primary text-white"
  >

  </q-input>
</template>

<script>
export default {
  name: "VideoEncodingInputOptionsInput",
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    options: {
      get() {
        return this.value.join(' ');
      },
      set(val) {
        this.$emit('input', val.split('-').filter(v => !!v).map(v => `-${v.trim()}`));
      }
    }
  }
}
</script>

<style scoped>

</style>
