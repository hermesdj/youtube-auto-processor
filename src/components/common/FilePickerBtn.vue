<template>
  <div>
    <q-input
      ref="fileInput"
      v-model="file"
      label="Standard"
      style="display:none"
      type="file"
      accept="*"
    />
    <q-btn
      v-bind="$attrs"
      @click="getFile"
    >
    </q-btn>
  </div>
</template>

<script>
export default {
  name: "FilePickerBtn",
  data: () => ({
    file: null
  }),
  watch: {
    file(val) {
      if (val && val.length > 0) {
        let file = val[0];
        this.$emit('onFile', file);
        this.$emit('onFilePath', file.path);
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
