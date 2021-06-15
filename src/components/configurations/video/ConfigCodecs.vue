<template>
  <q-table
    :columns="columns"
    :data="filteredCodecs"
    :filter="searchInput"
    :loading="loading"
    :pagination.sync="pagination"
    class="sticky-header-table-codecs"
    dense
    flat
    row-key="key"
    square
  >
    <template v-slot:top>
      <q-toolbar class="q-gutter-md" style="height: 84px">
        <q-toolbar-title shrink>
          {{ $t('configs.videoProcessing.codecs.title') }}
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
  name: "ConfigCodecs",
  data: () => ({
    searchInput: null,
    pagination: {
      sortBy: 'key',
      descending: false,
      page: 1,
      rowsPerPage: 50
    },
    codecs: [],
    loading: false,
    filter: {
      types: []
    }
  }),
  mounted() {
    this.loadCodecs();
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
        {
          name: 'canEncode',
          required: true,
          align: 'left',
          field: row => row.canEncode,
          format: val => val ? this.$t('configs.videoProcessing.values.yes') : this.$t('configs.videoProcessing.values.no'),
          label: this.$t('configs.videoProcessing.fields.canEncode'),
          sortable: true
        },
        {
          name: 'canDecode',
          required: true,
          align: 'left',
          field: row => row.canDecode,
          format: val => val ? this.$t('configs.videoProcessing.values.yes') : this.$t('configs.videoProcessing.values.no'),
          label: this.$t('configs.videoProcessing.fields.canDecode'),
          sortable: true
        }
      ]
    },
    filteredCodecs() {
      let filter = {};

      if (this.filter.types && this.filter.types.length > 0) {
        filter.type = {$in: this.filter.types};
      }

      return this.codecs.filter(encoder => sift(filter)(encoder));
    },
    typeList() {
      return uniqBy(this.codecs, 'type').map(v => v.type);
    }
  },
  methods: {
    async loadCodecs() {
      try {
        this.codecs = await ipcRenderer.invoke('processing.availableCodecs', {});
        console.log('codecs are', this.codecs);
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
.sticky-header-table-codecs
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
