<template>
  <q-card
    class="bg-grey-2 overflow-auto"
    flat
    square
    style="max-height: calc(100vh - 64px);"
  >
    <q-linear-progress v-if="loading" color="primary" indeterminate/>
    <q-card-section>
      <div class="text-subtitle2">{{ $t('configs.videoProcessing.config.title') }}</div>
      <div class="text-caption text-grey">{{ $t('configs.videoProcessing.config.description') }}</div>
    </q-card-section>
    <q-card-section v-if="!loading && config">
      <div class="row">
        <div class="col-shrink q-mx-auto q-gutter-md" style="min-width: 750px;">
          <q-card bordered square>
            <q-card-section class="q-gutter-md">
              <div class="row items-start q-gutter-sm">
                <q-input
                  v-model="config.ffmpegPath"
                  :hint="$t('configs.videoProcessing.config.hints.ffmpegPath')"
                  :label="$t('configs.videoProcessing.config.fields.ffmpegPath')"
                  class="col-grow"
                  standout="bg-primary text-white"
                >
                </q-input>
                <FilePickerBtn
                  class="q-mt-md"
                  color="primary"
                  icon="attach_file"
                  round
                  @onFilePath="path => $set(config, 'ffmpegPath', path)"

                >
                </FilePickerBtn>
              </div>
              <div class="row items-start q-gutter-sm">
                <q-input
                  v-model="config.ffprobePath"
                  :hint="$t('configs.videoProcessing.config.hints.ffprobePath')"
                  :label="$t('configs.videoProcessing.config.fields.ffprobePath')"
                  class="col-grow"
                  standout="bg-primary text-white"
                >
                </q-input>
                <FilePickerBtn
                  class="q-mt-md"
                  color="primary"
                  icon="attach_file"
                  round
                  @onFilePath="path => $set(config, 'ffprobePath', path)"

                >
                </FilePickerBtn>
              </div>
              <div class="row items-start q-gutter-sm">
                <q-toggle v-model="config.prependIntro"
                          :label="$t('configs.videoProcessing.config.fields.prependIntro')"/>
                <template v-if="config.prependIntro">
                  <q-input
                    v-model="config.defaultIntro"
                    :hint="$t('configs.videoProcessing.config.hints.defaultIntro')"
                    :label="$t('configs.videoProcessing.config.fields.defaultIntro')"
                    class="col-grow"
                    standout="bg-primary text-white"
                  >
                  </q-input>
                  <FilePickerBtn
                    class="q-mt-md"
                    color="primary"
                    icon="attach_file"
                    round
                    @onFilePath="path => $set(config, 'defaultIntro', path)"

                  >
                  </FilePickerBtn>
                </template>
              </div>
              <div class="row items-start q-gutter-sm">
                <q-toggle v-model="config.appendOutro"
                          :label="$t('configs.videoProcessing.config.fields.appendOutro')"/>
                <template v-if="config.appendOutro">
                  <q-input
                    v-model="config.defaultOutro"
                    :hint="$t('configs.videoProcessing.config.hints.defaultOutro')"
                    :label="$t('configs.videoProcessing.config.fields.defaultOutro')"
                    class="col-grow"
                    standout="bg-primary text-white"
                  >
                  </q-input>
                  <FilePickerBtn
                    class="q-mt-md"
                    color="primary"
                    icon="attach_file"
                    round
                    @onFilePath="path => $set(config, 'defaultOutro', path)"

                  >
                  </FilePickerBtn>
                </template>
              </div>
            </q-card-section>
            <q-card-section class="q-gutter-md">
              <div>
                <q-toggle v-model="config.pauseBeforeProcessing" :label="$t('configs.videoProcessing.config.fields.pauseBeforeProcessing')" />
              </div>
              <div>
                <q-toggle v-model="config.pauseAfterProcessing" :label="$t('configs.videoProcessing.config.fields.pauseAfterProcessing')" />
              </div>
              <div>
                <q-toggle v-model="config.chainVideoProcessing" :label="$t('configs.videoProcessing.config.fields.chainVideoProcessing')" />
              </div>
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
import FilePickerBtn from "components/common/FilePickerBtn";

export default {
  name: "ConfigVideoProcessor",
  components: {FilePickerBtn},
  data: () => ({
    loading: false,
    config: null,
    saving: false
  }),
  mounted() {
    this.loadConfig();
  },
  methods: {
    async loadConfig() {
      try {
        this.loading = true;

        this.config = await Config.api().callStatic('loadAsObject', []);
        console.log(this.config);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.videoProcessing.config.error', {message: err.message})
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
          message: this.$t('configs.videoProcessing.config.saveError', {message: err.message})
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
