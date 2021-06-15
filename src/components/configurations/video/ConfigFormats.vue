<template>
  <q-table
    :columns="columns"
    :data="filteredFormats"
    :filter="searchInput"
    :loading="loading"
    :pagination.sync="pagination"
    class="sticky-header-table-formats"
    dense
    flat
    row-key="key"
    square
  >
    <template v-slot:top>
      <q-toolbar class="q-gutter-md" style="height: 84px">
        <q-toolbar-title shrink>
          {{ $t('configs.videoProcessing.formats.title') }}
        </q-toolbar-title>
        <q-space></q-space>
      </q-toolbar>
    </template>
  </q-table>
</template>

<script>
import {ipcRenderer} from 'electron';
import {uniqBy} from 'lodash';
import sift from 'sift';

export default {
  name: "ConfigFormats",
  data: () => ({
    searchInput: null,
    pagination: {
      sortBy: 'key',
      descending: false,
      page: 1,
      rowsPerPage: 50
    },
    formats: [],
    loading: false,
    filter: {
      types: []
    }
  }),
  mounted() {
    this.loadFormats();
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
          name: 'description',
          required: true,
          align: 'left',
          field: row => row.description,
          label: this.$t('configs.videoProcessing.fields.description'),
          sortable: true
        },
        {
          name: 'canMux',
          required: true,
          align: 'left',
          field: row => row.canMux,
          format: val => val ? this.$t('configs.videoProcessing.values.yes') : this.$t('configs.videoProcessing.values.no'),
          label: this.$t('configs.videoProcessing.fields.canMux'),
          sortable: true
        },
        {
          name: 'canDemux',
          required: true,
          align: 'left',
          field: row => row.canDemux,
          format: val => val ? this.$t('configs.videoProcessing.values.yes') : this.$t('configs.videoProcessing.values.no'),
          label: this.$t('configs.videoProcessing.fields.canDemux'),
          sortable: true
        }
      ]
    },
    filteredFormats() {
      let filter = {};

      if (this.filter.types && this.filter.types.length > 0) {
        filter.type = {$in: this.filter.types};
      }

      return this.formats.filter(encoder => sift(filter)(encoder));
    },
    typeList() {
      return uniqBy(this.formats, 'type').map(v => v.type);
    }
  },
  methods: {
    async loadFormats() {
      try {
        this.formats = await ipcRenderer.invoke('processing.availableFormats', {});
        console.log('formats are', this.formats);
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
.sticky-header-table-formats
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
