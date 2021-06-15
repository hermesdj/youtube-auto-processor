<template>
  <q-table
    :columns="columns"
    :data="filteredEncoders"
    :filter="searchInput"
    :loading="loading"
    :pagination.sync="pagination"
    class="sticky-header-table-encoders"
    dense
    flat
    row-key="key"
    square
  >
    <template v-slot:top>
      <q-toolbar class="q-gutter-md" style="height: 84px">
        <q-toolbar-title shrink>
          {{ $t('configs.videoProcessing.encoders.title') }}
        </q-toolbar-title>
        <q-space></q-space>
        <q-select
          v-model="filter.types"
          :label="$t('configs.videoProcessing.datafilters.type')"
          :options="typeList"
          dense
          hide-bottom-space
          multiple
          square
          standout="bg-primary text-white"
          style="min-width: 150px;"
        >

        </q-select>
      </q-toolbar>
    </template>
  </q-table>
</template>

<script>
import {ipcRenderer} from 'electron';
import {uniqBy} from 'lodash';
import sift from 'sift';

export default {
  name: "ConfigEncoders",
  data: () => ({
    searchInput: null,
    pagination: {
      sortBy: 'key',
      descending: false,
      page: 1,
      rowsPerPage: 50
    },
    encoders: [],
    loading: false,
    filter: {
      types: []
    }
  }),
  mounted() {
    this.loadEncoders();
  },
  computed: {
    columns() {
      return [
        {
          name: 'key',
          required: true,
          align: 'left',
          field: row => row.key,
          label: this.$t('configs.videoProcessing.fields.key'),
          sortable: true
        },
        {
          name: 'type',
          required: true,
          align: 'left',
          field: row => row.type,
          label: this.$t('configs.videoProcessing.fields.type'),
          sortable: true
        },
        {
          name: 'description',
          required: true,
          align: 'left',
          field: row => row.description,
          label: this.$t('configs.videoProcessing.fields.description'),
          sortable: true
        },
      ]
    },
    filteredEncoders() {
      let filter = {};

      if (this.filter.types && this.filter.types.length > 0) {
        filter.type = {$in: this.filter.types};
      }

      return this.encoders.filter(encoder => sift(filter)(encoder));
    },
    typeList() {
      return uniqBy(this.encoders, 'type').map(v => v.type);
    }
  },
  methods: {
    async loadEncoders() {
      try {
        this.encoders = await ipcRenderer.invoke('processing.availableEncoders', {});
        console.log('encoders are', this.encoders);
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('configs.videoProcessing.loadError', {message: err.message})
        })
      }
    }
  }
}
</script>

<style lang="sass">
.sticky-header-table-encoders
  height: calc(100vh - 84px)

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    background-color: #ffffff

  thead tr th
    position: sticky
    z-index: 1

  thead tr:first-child th
    top: 0

  &.q-table--loading thead tr:last-child th
    top: 48px
</style>
