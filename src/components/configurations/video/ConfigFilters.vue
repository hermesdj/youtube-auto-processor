<template>
  <q-table
    :columns="columns"
    :data="filteredFilters"
    :filter="searchInput"
    :loading="loading"
    :pagination.sync="pagination"
    class="sticky-header-table-filters"
    dense
    flat
    row-key="key"
    square
  >
    <template v-slot:top>
      <q-toolbar class="q-gutter-md" style="height: 84px">
        <q-toolbar-title shrink>
          {{ $t('configs.videoProcessing.filters.title') }}
        </q-toolbar-title>
        <q-space></q-space>
        <q-select
          v-model="filter.inputs"
          :options="inputList"
          dense
          hide-bottom-space
          multiple
          square
          style="min-width: 150px;"
          standout="bg-primary text-white"
          :label="$t('configs.videoProcessing.datafilters.input')"
        >

        </q-select>
        <q-select
          v-model="filter.outputs"
          :options="outputList"
          dense
          hide-bottom-space
          multiple
          square
          style="min-width: 150px;"
          standout="bg-primary text-white"
          :label="$t('configs.videoProcessing.datafilters.output')"
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
  name: "ConfigFilters",
  data: () => ({
    searchInput: null,
    pagination: {
      sortBy: 'key',
      descending: false,
      page: 1,
      rowsPerPage: 50
    },
    filters: [],
    loading: false,
    filter: {
      inputs: [],
      outputs: []
    }
  }),
  mounted() {
    this.loadFilters();
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
          name: 'input',
          required: true,
          align: 'left',
          field: row => row.input,
          label: this.$t('configs.videoProcessing.fields.input'),
          sortable: true
        },
        {
          name: 'output',
          required: true,
          align: 'left',
          field: row => row.output,
          label: this.$t('configs.videoProcessing.fields.output'),
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
    filteredFilters() {
      let filter = {};

      if (this.filter.inputs && this.filter.inputs.length > 0) {
        filter.input = {$in: this.filter.inputs};
      }

      if (this.filter.outputs && this.filter.outputs.length > 0) {
        filter.output = {$in: this.filter.outputs};
      }

      return this.filters.filter(f => sift(filter)(f));
    },
    inputList() {
      return uniqBy(this.filters, 'input').map(v => v.input);
    },
    outputList() {
      return uniqBy(this.filters, 'output').map(v => v.output);
    }
  },
  methods: {
    async loadFilters() {
      try {
        this.filters = await ipcRenderer.invoke('processing.availableFilters', {});
        console.log('filters are', this.filters);
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
.sticky-header-table-filters
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
