<template>
  <q-card
    square
  >
    <q-list separator>
      <q-separator/>
      <q-item-label header>{{ $t('configs.app.channel.title') }}</q-item-label>
      <q-banner v-if="!loading && !channel" class="text-white bg-red" inline-actions>
        <template v-slot:avatar>
          <q-icon name="error"></q-icon>
        </template>
        <div class="text-subtitle2">{{ $t('configs.app.channel.noChannel') }}</div>
        <template v-slot:action>
          <q-btn
            :label="$t('configs.app.channel.pickLabel')"
            color="white"
            flat
            icon="youtube_searched_for"
            @click="pickYoutubeChannel"
          >
            <q-tooltip>{{ $t('configs.app.channel.pickTooltip') }}</q-tooltip>
          </q-btn>
        </template>
      </q-banner>
      <q-item v-if="!loading && channel">
        <q-item-section avatar>
          <q-avatar>
            <q-img :src="channel.thumbnails.default.url"/>
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ channel.title }}</q-item-label>
          <q-item-label caption>{{ channel.description | truncate(64) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn v-if="false" flat icon="edit" round @click="editYoutubeChannel"></q-btn>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script>
import {YoutubeChannel} from "src/models/Google";
import {truncate} from "lodash";
import PickYoutubeChannelDialog from "components/configurations/google/PickYoutubeChannelDialog";

export default {
  name: "ConfigureChannelCard",
  data: () => ({
    loading: false,
    channel: null
  }),
  mounted() {
    this.loadChannel();
  },
  filters: {
    truncate(value, length) {
      return truncate(value, {length, omission: '...'});
    }
  },
  methods: {
    async loadChannel() {
      this.loading = true;

      try {
        this.channel = await YoutubeChannel.api().findOne({});
        console.log(this.channel);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.app.channel.loadError', {message: err.message})
        })
      } finally {
        this.loading = false;
      }
    },
    async pickYoutubeChannel() {
      await this.$q.dialog({
        component: PickYoutubeChannelDialog,
        parent: this
      }).onOk(channel => {
        this.channel = channel;
      })
    },
    async editYoutubeChannel() {
      // TODO
    }
  }
}
</script>

<style scoped>

</style>
