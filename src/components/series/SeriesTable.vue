<template>
  <q-table
    :columns="columns"
    :data="series"
    :filter="searchInput"
    :loading="loading"
    :pagination.sync="pagination"
    class="sticky-header-table-series"
    dense
    flat
    row-key="id"
    square
    @request="loadData"
  >
    <template v-slot:top>
      <q-toolbar class="q-gutter-md" style="height: 84px">
        <q-toolbar-title shrink>
          <q-select
            v-model="filter.status"
            :options="serieStatuses"
            borderless
            emit-value
            hide-bottom-space
            square
          >
            <template v-slot:selected>
              <q-toolbar-title shrink>{{
                  $t('series.table.title', {status: $t('series.status.' + filter.status)})
                }}
              </q-toolbar-title>
            </template>
          </q-select>
        </q-toolbar-title>
        <q-space></q-space>
        <q-input v-model.lazy="searchInput" :placeholder="$t('series.table.search')" dense
                 standout="bg-primary text-white">
          <template v-slot:append>
            <q-icon v-if="searchInput === ''" name="search"/>
            <q-icon v-else class="cursor-pointer" name="clear" @click="searchInput = ''"/>
          </template>
        </q-input>
        <q-btn
          :label="$t('series.create.btn')"
          :to="{name: 'createSerie'}"
          color="primary"
          flat
        />
      </q-toolbar>
    </template>
    <template v-slot:body-cell-planning_name="props">
      <q-td :props="props" style="max-width: 350px">
        <q-item>
          <q-item-section
            v-if="props.row.thumbnail"
            thumbnail
          >
            <img
              :src="`thumbnail://${encodeURIComponent(props.row.thumbnail)}`"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <slot :serie="props.row" name="name">{{ props.row.name }}</slot>
            </q-item-label>
            <q-item-label caption style="white-space: normal;">{{
                props.row.description | truncate(256)
              }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-td>
    </template>
  </q-table>
</template>

<script>
import moment from "moment";
import {Serie} from "src/models/Serie";
import {truncate} from 'lodash';

export default {
  name: "SeriesTable",
  data: () => ({
    series: [],
    pagination: {
      sortBy: 'createdAt',
      descending: true,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: -1
    },
    searchInput: '',
    loading: false,
    filter: {
      status: 'active'
    }
  }),
  watch: {
    filter: {
      deep: true,
      immediate: true,
      handler() {
        this.loadData({pagination: this.pagination});
      }
    }
  },
  filters: {
    truncate(value, length) {
      return truncate(value, {length, omission: '...'});
    }
  },
  computed: {
    serieStatuses() {
      return ['active', 'cancelled', 'finished', 'paused'].map(value => ({
        value,
        label: this.$t('series.table.title', {status: this.$t('series.status.' + value)})
      }))
    },
    columns() {
      return [
        {
          name: 'planning_name',
          required: true,
          align: 'left',
          field: row => row.name,
          label: this.$t('series.table.cols.name'),
          sortable: true
        },
        {
          name: 'game_title',
          required: true,
          align: 'left',
          field: row => row.game_title,
          label: this.$t('series.table.cols.game'),
          sortable: true
        },
        {
          name: 'status',
          required: true,
          align: 'left',
          format: val => this.$t('series.status.' + val),
          field: row => row.status,
          label: this.$t('series.table.cols.status'),
          sortable: true
        },
        {
          name: 'createdAt',
          required: true,
          align: 'left',
          format: val => moment(val).format('DD/MM/YYYY'),
          field: row => row.createdAt,
          label: this.$t('series.table.cols.createdAt'),
          sortable: true
        },
        {
          name: 'updatedAt',
          required: true,
          align: 'left',
          format: val => moment(val).format('DD/MM/YYYY'),
          field: row => row.createdAt,
          label: this.$t('series.table.cols.updatedAt'),
          sortable: true
        },
        {
          name: 'countEpisodes',
          required: true,
          sortable: false,
          align: 'left',
          field: row => row.countEpisodes,
          label: this.$t('series.table.cols.countEpisodes')
        }
      ];
    }
  },
  methods: {
    async loadData({pagination: {page, rowsPerPage, sortBy, descending}}) {
      this.loading = true;

      try {
        let filter = {
          status: this.filter.status
        };

        if (this.searchInput && this.searchInput.length > 3) {
          filter.$or = [{planning_name: {$regex: this.searchInput}}, {game_title: {$regex: this.searchInput}}];
        }

        let {total, rows} = await Serie.api().paginate({
          filter,
          offset: (page - 1) * rowsPerPage,
          limit: rowsPerPage,
          sort: {[sortBy]: descending ? -1 : 1},
          projection: {},
          options: {
            populate: ['countEpisodes', 'firstEpisode']
          }
        });

        this.series = rows;
        this.pagination.rowsNumber = total;
        this.pagination.page = page;
        this.pagination.rowsPerPage = rowsPerPage;
        this.pagination.sortBy = sortBy;
        this.pagination.descending = descending;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style lang="sass">
.sticky-header-table-series
  height: calc(100vh - 48px)

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
