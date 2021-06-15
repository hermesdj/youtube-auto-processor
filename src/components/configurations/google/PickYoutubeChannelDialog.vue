<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{ $t('configs.googleAuth.channel.pickTitle') }}</div>
      </q-card-section>
      <q-pagination v-if="totalResults > pagination.itemsPerPage" v-model="pagination.page" :max="10"/>
      <q-list bordered class="overflow-auto" separator style="max-height: 450px">
        <q-linear-progress v-if="loading" color="primary" indeterminate/>
        <q-item
          v-for="(channel, index) in channels"
          :key="index" :active="selectedChannel === channel"
          clickable
          @click="selectedChannel = channel"
        >
          <q-item-section avatar>
            <q-avatar>
              <q-img :src="channel.snippet.thumbnails.default.url"/>
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ channel.snippet.title }}</q-item-label>
            <q-item-label caption>{{ channel.snippet.description | truncate(64) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-actions align="right">
        <q-btn color="primary" flat label="Cancel" @click="onCancelClick"/>
        <q-btn :disable="!selectedChannel" :loading="saving" color="primary" label="OK" @click="onOKClick"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {YoutubeChannel} from "src/models/Google";
import {truncate} from "lodash";

export default {
  name: "PickYoutubeChannelDialog",
  data: () => ({
    selectedChannel: null,
    loading: false,
    saving: false,
    channels: [],
    nextPageToken: null,
    prevPageToken: null,
    totalResults: 0,
    pagination: {
      page: 1,
      itemsPerPage: 0
    }
  }),
  filters: {
    truncate(value, length) {
      return truncate(value, {length, omission: '...'});
    }
  },
  mounted() {
    this.loadChannels();
  },
  computed: {},

  methods: {
    show() {
      this.$refs.dialog.show()
    },

    hide() {
      this.$refs.dialog.hide()
    },

    onDialogHide() {
      this.$emit('hide')
    },

    async onOKClick() {
      this.saving = true;
      try {
        console.log(this.selectedChannel);
        let channel = await YoutubeChannel.api().callStatic('createFromYoutubeData', [this.selectedChannel]);
        this.$emit('ok', channel);
        this.hide();
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.googleAuth.channel.saveChannelError', {message: err.message})
        })
      } finally {
        this.saving = false;
      }
    },

    onCancelClick() {
      // we just need to hide dialog
      this.hide()
    },
    async loadChannels() {
      this.loading = true;
      try {
        let {items, pageInfo} = await YoutubeChannel.paginateChannels({});

        this.channels = items;
        this.pagination.itemsPerPage = pageInfo.resultsPerPage;
        this.totalResults = pageInfo.totalResults;
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.googleAuth.channel.paginateChannelsError', {message: err.message})
        })
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>

</style>
