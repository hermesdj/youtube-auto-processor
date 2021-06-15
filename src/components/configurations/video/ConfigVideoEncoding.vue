<template>
  <q-card
    class="bg-grey-2 overflow-auto"
    flat
    square
    style="max-height: calc(100vh - 64px);"
  >
    <q-linear-progress v-if="loading" color="primary" indeterminate/>
    <q-card-section>
      <div class="text-subtitle2">{{ $t('configs.videoProcessing.configEncoding.title') }}</div>
      <div class="text-caption text-grey">{{ $t('configs.videoProcessing.configEncoding.description') }}</div>
    </q-card-section>
    <q-card-section v-if="!loading && config">
      <div class="row">
        <div class="col-shrink q-mx-auto q-gutter-md" style="min-width: 750px;">
          <q-card bordered square>
            <q-card-section class="q-gutter-md">
              <q-banner v-if="!config.ffmpegPath || !config.ffprobePath" class="text-white bg-red" inline-actions>
                <template v-slot:avatar>
                  <q-icon name="error"></q-icon>
                </template>
                <div class="text-subtitle2">{{ $t('configs.videoProcessing.configEncoding.invalidConfig') }}</div>
                <template v-slot:action>
                  <q-btn
                    :to="{name: 'configVideoProcessing'}"
                    flat
                    icon="settings"
                    round
                    text-color="white"
                  >
                  </q-btn>
                </template>
              </q-banner>
              <template v-else>
                <VideoEncondigCodecInput v-model="config.videoCodec"/>
                <VideoEncodingInputOptionsInput v-model="config.inputOptions"/>
                <q-input
                  v-model.number="config.videoBitrate"
                  :label="$t('configs.videoProcessing.configEncoding.fields.videoBitrate')"
                  :min="1000"
                  standout="bg-primary text-white"
                  type="number"
                />
              </template>
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
import VideoEncondigCodecInput from "components/configurations/video/inputs/VideoEncondigCodecInput";
import VideoEncodingInputOptionsInput from "components/configurations/video/inputs/VideoEncodingInputOptionsInput";

export default {
  name: "ConfigVideoEncoding",
  components: {VideoEncodingInputOptionsInput, VideoEncondigCodecInput},
  data: () => ({
    loading: false,
    config: null,
    saving: false
  }),
  mounted() {
    this.loadConfig();
  },
  watch: {
    config: {
      deep: true,
      handler(val) {
        console.log('config is', val);
      }
    }
  },
  methods: {
    async loadConfig() {
      try {
        this.loading = true;

        this.config = await Config.api().callStatic('loadAsObject', []);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.videoProcessing.configEncoding.error', {message: err.message})
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
          message: this.$t('configs.videoProcessing.configEncoding.saveError', {message: err.message})
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
