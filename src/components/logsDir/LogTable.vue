<template>
  <q-table
    :columns="columns"
    :data="logs"
    :pagination.sync="pagination"
    :title="$t('logs.table.title')"
    class="sticky-header-table-logs"
    dense
    flat
    row-key="id"
    square
    @request="loadData"
  >
    <template v-slot:top-right>
      <div class="q-gutter-md inline row justify-center">
        <q-select
          v-model="filter.levels"
          :disable="levelList.length === 0"
          :options="levelList"
          class="float-left"
          dense
          hide-bottom-space
          multiple
          square
          standout="bg-primary text-white"
        >

        </q-select>
        <q-select
          v-model="filter.labels"
          :disable="labelList.length === 0"
          :options="labelList"
          class="float-left"
          dense
          hide-bottom-space
          multiple
          square
          standout="bg-primary text-white"
        >

        </q-select>
        <q-toggle v-model="autoLoad" :label="$t('logs.autoLoad')" :loading="loading" class="float-left"
                  icon="autorenew"/>
        <q-btn color="red" flat icon="cleaning_services" :label="$t('logs.clear')" @click="clearLogs"/>
      </div>
    </template>
    <template v-slot:body-cell-message="props">
      <q-td :props="props">
        <div
          style="white-space: normal;"
        >
          {{ props.row.message }}
        </div>
      </q-td>
    </template>
  </q-table>
</template>

<script>
import moment from 'moment';
import {Log} from "src/models/Log";

export default {
  name: "LogList",
  data: () => ({
    logs: [],
    autoLoad: true,
    loading: false,
    pagination: {
      sortBy: 'timestamp',
      descending: true,
      page: 1,
      rowsPerPage: 50,
      rowsNumber: -1
    },
    interval: null,
    labelList: [],
    levelList: ['trace', 'debug', 'info', 'warn', 'error'],
    filter: {
      labels: [],
      levels: ['info', 'warn', 'error']
    }
  }),
  watch: {
    autoLoad: {
      immediate: true,
      handler(val) {
        if (val) {
          this.interval = setInterval(() => {
            this.loadData({pagination: this.pagination});
          }, 1000);
        } else {
          clearInterval(this.interval);
        }
      }
    }
  },
  beforeDestroy() {
    clearInterval(this.interval);
  },
  computed: {
    columns() {
      return [
        {
          name: 'timestamp',
          format: val => moment(val).format('DD/MM/YYYY HH:mm:ss SSS'),
          required: true,
          align: 'left',
          field: row => row.timestamp,
          label: this.$t('logs.table.cols.date'),
          sortable: true,
          headerStyle: 'width: 200px;'
        },
        {
          name: 'level',
          required: true,
          align: 'left',
          field: row => row.level,
          label: this.$t('logs.table.cols.level'),
          sortable: true,
          headerStyle: 'width: 50px;'
        },
        {
          name: 'hostname',
          required: true,
          align: 'left',
          field: row => row.hostname,
          label: this.$t('logs.table.cols.hostname'),
          sortable: true,
          headerStyle: 'width: 100px;'
        },
        {
          name: 'pid',
          required: true,
          align: 'left',
          field: row => row.meta.pid,
          label: this.$t('logs.table.cols.pid'),
          sortable: true,
          headerStyle: 'width: 50px;'
        },
        {
          name: 'label',
          required: true,
          align: 'left',
          field: row => row.label,
          label: this.$t('logs.table.cols.label'),
          sortable: true,
          headerStyle: 'width: 150px;'
        },
        {
          name: 'message',
          required: true,
          align: 'left',
          field: row => row.message,
          label: this.$t('logs.table.cols.message')
        }
      ];
    }
  },
  methods: {
    async loadData({pagination: {page, rowsPerPage, sortBy, descending}}) {
      this.loading = true;

      try {
        let filter = {};
        if (this.filter && this.filter.labels && Array.isArray(this.filter.labels) && this.filter.labels.length > 0) {
          filter.label = {$in: this.filter.labels};
        }
        if (this.filter && this.filter.levels && Array.isArray(this.filter.levels) && this.filter.levels.length > 0) {
          filter.level = {$in: this.filter.levels};
        }

        let {total, rows} = await Log.api().paginate({
          filter,
          offset: (page - 1) * rowsPerPage,
          limit: rowsPerPage,
          sort: {[sortBy]: descending ? -1 : 1}
        });

        this.logs = rows;
        this.pagination.rowsNumber = total;
        this.pagination.page = page;
        this.pagination.rowsPerPage = rowsPerPage;
        this.pagination.sortBy = sortBy;
        this.pagination.descending = descending;

        if (this.labelList.length === 0) {
          this.labelList = await Log.api().callStatic("listLabels", []);
        }
      } finally {
        this.loading = false;
      }
    },
    async clearLogs() {
      await Log.api().callStatic('deleteMany', [{}]);
    }
  }
}
</script>

<style lang="sass">
.sticky-header-table-logs
  /* height or max-height is important */
  height: calc(100vh - 48px)

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: #ffffff

  thead tr th
    position: sticky
    z-index: 1

  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */









  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
</style>
