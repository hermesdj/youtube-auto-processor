<template>
  <q-page class="bg-grey-2">
    <q-toolbar>
      <q-tabs>
        <q-route-tab
          v-for="(tab, index) in tabs" :key="index"
          :label="tab.label"
          :to="tab.path"
        />
      </q-tabs>
    </q-toolbar>
    <q-separator/>
    <div class="row">
      <div class="col q-mx-auto">
        <router-view></router-view>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: "ConfigLayout.vue",
  computed: {
    tabs() {
      return [
        {
          name: 'app',
          path: '/configurations/app',
          label: this.$t('configs.tabs.app')
        },
        {
          name: 'googleAuth',
          path: '/configurations/auth',
          label: this.$t('configs.tabs.googleAuth')
        },
        {
          name: 'videoProcessing',
          path: '/configurations/processing',
          label: this.$t('configs.tabs.videoProcessing')
        }
      ]
    }
  }
}
</script>

<style scoped>

</style>
