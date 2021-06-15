<template>
  <q-card
    flat
    square
    class="bg-grey-2"
  >
    <q-splitter
      v-model="splitterModel"
      style="height: calc(100vh - 84px)"
    >
      <template v-slot:before>
        <q-tabs
          color="text-primary"
          vertical
        >
          <q-route-tab v-for="(tab, index) in tabs" :key="index" :label="tab.label" :to="tab.to"></q-route-tab>
        </q-tabs>
      </template>
      <template v-slot:after>
        <router-view/>
      </template>
    </q-splitter>
  </q-card>
</template>

<script>
export default {
  name: "ConfigVideoProcessing.vue",
  data: () => ({
    splitterModel: 10
  }),
  computed: {
    tabs() {
      return [
        {
          label: this.$t('configs.videoProcessing.tabs.config'),
          to: {name: 'configVideoProcessing'}
        },
        {
          label: this.$t('configs.videoProcessing.tabs.configEncoding'),
          to: {name: 'configVideoEncoding'}
        },
        {
          label: this.$t('configs.videoProcessing.tabs.encoders'),
          to: {name: 'configEncoders'}
        },
        {
          label: this.$t('configs.videoProcessing.tabs.filters'),
          to: {name: 'configFilters'}
        },
        {
          label: this.$t('configs.videoProcessing.tabs.codecs'),
          to: {name: 'configCodecs'}
        },
        {
          label: this.$t('configs.videoProcessing.tabs.formats'),
          to: {name: 'configFormats'}
        }
      ]
    }
  }
}
</script>

<style scoped>

</style>
