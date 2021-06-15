<template>
  <q-card
    class="bg-grey-2"
    flat
    square
  >
    <q-linear-progress v-if="loading" color="primary" indeterminate/>
    <q-card-section>
      <div class="text-subtitle2">{{ $t('configs.googleAuth.title') }}</div>
      <div class="text-caption text-grey">{{ $t('configs.googleAuth.description') }}</div>
    </q-card-section>

    <q-card-section v-if="!config && !loading">
      <q-banner class="text-white bg-red" inline-actions>
        <template v-slot:avatar>
          <q-icon name="error"></q-icon>
        </template>
        <div class="text-subtitle2">{{ $t('configs.googleAuth.config.noConfig') }}</div>
        <template v-slot:action>
          <q-input ref="fileInput" v-model="file" accept=".json" label="Standard" style="display:none"
                   type="file"></q-input>
          <q-btn :label="$t('configs.googleAuth.config.pickLabel')" color="white" flat icon="file_upload"
                 @click="getFile">
            <q-tooltip>{{ $t('configs.googleAuth.config.pickTooltip') }}</q-tooltip>
          </q-btn>
        </template>
      </q-banner>
    </q-card-section>
    <q-card-section v-if="!loading && config">
      <div class="row">
        <div class="col-shrink q-mx-auto" style="min-width: 750px;">
          <q-card square>
            <q-list bordered>
              <q-item-label header>{{ $t('configs.googleAuth.config.title') }}</q-item-label>
              <q-item>
                <q-item-section>
                  <q-item-label>{{ $t('configs.googleAuth.config.fields.project_id') }}</q-item-label>
                  <q-item-label caption>{{ config.project_id }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>{{ $t('configs.googleAuth.config.fields.client_id') }}</q-item-label>
                  <q-item-label caption>{{ config.client_id }}</q-item-label>
                </q-item-section>
              </q-item>
              <template v-if="config">
                <q-separator/>
                <q-item-label header>{{ $t('configs.googleAuth.token.title') }}</q-item-label>
                <q-banner v-if="!loading && !token" class="text-white bg-red" inline-actions>
                  <template v-slot:avatar>
                    <q-icon name="error"></q-icon>
                  </template>
                  <div class="text-subtitle2">{{ $t('configs.googleAuth.token.noToken') }}</div>
                  <template v-slot:action>
                    <q-btn
                      :label="$t('configs.googleAuth.token.authLabel')"
                      color="white"
                      flat
                      icon="login"
                      @click="startAuthProcess"
                    >
                      <q-tooltip>{{ $t('configs.googleAuth.token.authTooltip') }}</q-tooltip>
                    </q-btn>
                  </template>
                </q-banner>
                <template v-else>
                  <q-item>
                    <q-item-section>
                      <q-item-label>{{ $t('configs.googleAuth.token.fields.expiry_date') }}</q-item-label>
                      <q-item-label caption>{{ formatDate(token.tokens.expiry_date) }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <q-separator/>
                <q-item-label header>{{ $t('configs.googleAuth.cookie.title') }}</q-item-label>
                <q-banner v-if="!loading && !channel" class="text-white bg-red">
                  <div class="text-subtitle2">{{ $t('configs.googleAuth.cookie.noChannel') }}</div>
                </q-banner>
                <q-banner v-if="!loading && !cookieConfig && channel" class="text-white bg-red" inline-actions>
                  <template v-slot:avatar>
                    <q-icon name="error"></q-icon>
                  </template>
                  <div class="text-subtitle2">{{ $t('configs.googleAuth.cookie.noCookies') }}</div>
                  <template v-slot:action>
                    <q-btn
                      :label="$t('configs.googleAuth.cookie.authLabel')"
                      color="white"
                      flat
                      icon="login"
                      @click="startCookieRetrieveProcess"
                    >
                      <q-tooltip>{{ $t('configs.googleAuth.cookie.authTooltip') }}</q-tooltip>
                    </q-btn>
                  </template>
                </q-banner>
                <template v-else-if="!loading && cookieConfig">
                  <q-item>
                    <q-item-section>
                      <q-item-label>{{ $t('configs.googleAuth.cookie.configOk') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        :label="$t('configs.googleAuth.cookie.authLabel')"
                        flat
                        icon="login"
                        @click="startCookieRetrieveProcess"
                      >
                        <q-tooltip>{{ $t('configs.googleAuth.cookie.authTooltip') }}</q-tooltip>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </template>
              </template>
            </q-list>
          </q-card>
        </div>
      </div>
    </q-card-section>

    <q-inner-loading
      v-if="loading"
    >
      <q-spinner-gears color="primary" size="50px"/>
      {{ $t('configs.googleAuth.config.loading') }}
    </q-inner-loading>
  </q-card>
</template>

<script>
import {GoogleClientConfig, GoogleCookieConfig, GoogleToken, YoutubeChannel} from "src/models/Google";
import moment from "moment";
import {truncate} from "lodash";

export default {
  name: "ConfigGoogleAuth.vue",
  data: () => ({
    config: null,
    loading: false,
    file: null,
    token: null,
    channel: null,
    cookieConfig: null
  }),
  mounted() {
    this.loadAuth();
  },
  filters: {
    truncate(value, length) {
      return truncate(value, {length, omission: '...'});
    }
  },
  watch: {
    file(val) {
      console.log('file', val);
      if (val && val.length > 0) {
        this.createFromPath(val[0].path);
      }
    },
    config: {
      deep: true,
      handler(val) {
        if (val && !this.token) {
          this.loadToken();
        }
      }
    }
  },
  methods: {
    async loadAuth() {
      this.loading = true;
      try {
        this.config = await GoogleClientConfig.api().findOne({}, {}, {populate: 'token'});
        if (this.config.token) {
          this.token = this.config.token;
        }
        this.channel = await YoutubeChannel.api().findOne({});
        await this.loadCookieConfig();
        console.log('config is', this.config);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.googleAuth.config.error', {message: err.message})
        })
      } finally {
        this.loading = false;
      }
    },
    async loadToken() {
      this.loading = true;
      try {
        this.token = await GoogleClientConfig.api().findOne({config: this.config.id});
        console.log('token is', this.token);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.googleAuth.token.loadError', {message: err.message})
        })
      } finally {
        this.loading = false;
      }
    },
    async loadCookieConfig() {
      this.cookieConfig = await GoogleCookieConfig.api().findOne({});
    },
    getFile() {
      this.file = null;
      this.$refs.fileInput.$el.click();
    },
    async createFromPath(p) {
      try {
        this.config = await GoogleClientConfig.api().callStatic('createFromFilePath', [p]);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.googleAuth.config.createFromPathError', {message: err.message})
        })
      }
    },
    async startAuthProcess() {
      this.token = await GoogleToken.requestToken(this.config);
    },
    formatDate(val) {
      return moment(val).fromNow();
    },
    async startCookieRetrieveProcess() {
      this.cookieConfig = await GoogleCookieConfig.authOnStudio(this.channel);
      console.log('cookie config is', this.cookieConfig);
    }
  }
}
</script>

<style scoped>

</style>
