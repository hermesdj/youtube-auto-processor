<template>
  <q-card
    class="bg-grey-2 overflow-auto"
    flat
    square
    style="max-height: calc(100vh - 64px);"
  >
    <q-linear-progress v-if="loading" color="primary" indeterminate/>
    <q-card-section>
      <div class="text-subtitle2">{{ $t('configs.app.title') }}</div>
      <div class="text-caption text-grey">{{ $t('configs.app.description') }}</div>
    </q-card-section>
    <q-card-section v-if="!loading && config">
      <div class="row">
        <div class="col-shrink q-mx-auto q-gutter-md" style="min-width: 750px;">
          <ConfigureChannelCard/>
          <q-card bordered square>
            <q-card-section class="q-gutter-md">
              <q-input
                v-model="config.spreadsheetId"
                :hint="$t('configs.app.hints.spreadsheetId')"
                :label="$t('configs.app.fields.spreadsheetId')"
                standout="bg-primary text-white"
              />
              <q-input
                v-model="config.defaultDescriptionTemplate"
                :hint="$t('configs.app.hints.defaultDescriptionTemplate')"
                :label="$t('configs.app.fields.defaultDescriptionTemplate')"
                standout="bg-primary text-white"
                type="textarea"
              />
              <q-input
                v-model="config.defaultDescription"
                :hint="$t('configs.app.hints.defaultDescription')"
                :label="$t('configs.app.fields.defaultDescription')"
                standout="bg-primary text-white"
                type="textarea"
              />
              <q-item>
                <q-item-section>
                  <q-item-label>{{ $t('configs.app.fields.mainAppDirectory') }}</q-item-label>
                  <q-item-label caption>{{ config.mainAppDirectory }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn :label="$t('configs.app.changeAppDirectory.btn')" disable color="primary"/>
                </q-item-section>
              </q-item>
            </q-card-section>
            <q-card-actions>
              <q-space/>
              <q-btn
                :label="$t('configs.app.saveBtn')"
                :loading="saving"
                color="primary"
                icon="save"
                @click="saveConfig"
              >

              </q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import {Config} from "src/models/Config";
import ConfigureChannelCard from "components/configurations/app/ConfigureChannelCard";

export default {
  name: "AppConfigHome",
  components: {ConfigureChannelCard},
  data: () => ({
    loading: false,
    config: null,
    saving: false,
    channel: null
  }),
  mounted() {
    this.loadConfig();
  },
  methods: {
    async loadConfig() {
      this.loading = true;

      try {
        this.config = await Config.api().callStatic('loadAsObject');
        console.log('config is', this.config);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.app.config.error', {message: err.message})
        })
      } finally {
        this.loading = false;
      }
    },
    async saveConfig() {
      let configs = Object.keys(this.config).map(key => ({key, value: this.config[key]}));

      console.log('saving configs', configs);

      this.saving = true;

      try {
        await Config.api().callStatic('saveConfig', [configs]);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.app.config.saveError', {message: err.message})
        })
      } finally {
        this.saving = false;
      }
    }
  }
}
</script>

<style scoped>

</style>
