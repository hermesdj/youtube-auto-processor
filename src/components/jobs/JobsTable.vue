<template>
  <q-table
      :columns="columns"
      :data="filteredJobs"
      :filter="searchInput"
      :loading="loading"
      :pagination.sync="pagination"
      :selected.sync="selected"
      class="sticky-header-table-jobs"
      dense
      flat
      row-key="id"
      selection="single"
      square
  >
    <template v-slot:top>
      <q-toolbar class="q-gutter-md" style="height: 84px">
        <q-toolbar-title shrink>
          {{ $t('jobs.table.title') }}
        </q-toolbar-title>
        <q-space></q-space>
        <q-select
            v-model="filter.state"
            :options="jobStatuses"
            dense
            emit-value
            hide-bottom-space
            multiple
            square
            standout="bg-primary text-white"
        >
          <template v-slot:selected>
            {{ $t('jobs.table.selectedStates', {count: filter.state.length}) }}
          </template>
        </q-select>
        <q-input v-model.lazy="searchInput" :placeholder="$t('jobs.table.search')" dense
                 standout="bg-primary text-white">
          <template v-slot:append>
            <q-icon v-if="searchInput === ''" name="search"/>
            <q-icon v-else class="cursor-pointer" name="clear" @click="searchInput = ''"/>
          </template>
        </q-input>
        <q-dialog
            v-model="dialog"
            position="right"
            seamless
        >
          <JobCard
              v-if="selectedJob"
              :job="selectedJob"
          />
        </q-dialog>
      </q-toolbar>
    </template>
    <template v-slot:body-cell-date_created="props">
      <q-td :props="props">
        {{ formatDate(props.row.date_created, 'from') }}
      </q-td>
    </template>
    <template v-slot:body-cell-publishAt="props">
      <q-td :props="props">
        <span v-if="props.row.episode && props.row.episode.publishAt">
          {{ formatDate(props.row.episode.publishAt, 'from') }}
        </span>
      </q-td>
    </template>
    <template v-slot:body-cell-title="props">
      <q-td :props="props" style="max-width: 350px">
        <q-item>
          <q-item-section
              v-if="props.row.episode && props.row.episode.thumbnail"
              thumbnail
          >
            <img
                :src="`http://localhost:8889/file/${encodeURIComponent(props.row.episode.thumbnail)}`"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <router-link
                  v-if="props.row.episode"
                  :to="{name: 'episodePage', params: {id: props.row.episode.id}}"
              >
                {{ props.row.title }}
              </router-link>
              <span v-else>{{ props.row.title }}</span>
            </q-item-label>
            <q-item-label caption style="white-space: normal;">
              <span v-if="props.row.episode">{{ props.row.episode.description | truncate(256) }}</span>
              <span v-else>-</span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-td>
    </template>
  </q-table>
</template>

<script>
import moment from "moment";
import {Job} from "src/models/Job";
import states from "../../../config/states";
import sift from "sift";
import {isObject, truncate} from "lodash";
import JobCard from "components/jobs/JobCard";
import {dbEvents} from "src/models/common/ipc";
import {filter} from "rxjs/operators";
import {Episode} from "src/models/Episode";

export default {
  name: "JobTable",
  components: {JobCard},
  data: () => ({
    selected: [],
    jobs: [],
    dialog: false,
    pagination: {
      sortBy: 'date_created',
      descending: true,
      page: 1,
      rowsPerPage: 50
    },
    searchInput: '',
    loading: false,
    filter: {
      state: Object.keys(states).filter(state => !['ALL_DONE', 'PUBLIC'].includes(state))
    },
    subscription: null,
    selectedJob: null
  }),
  filters: {
    truncate(value, length) {
      return truncate(value, {length, omission: '...'});
    }
  },
  beforeDestroy() {
    if (this.subscription && this.subscription.unsubscribe) this.subscription.unsubscribe();
  },
  watch: {
    selected: {
      deep: true,
      immediate: true,
      handler(val) {
        if (val && val.length === 1) {
          this.selectedJob = val[0];
          this.dialog = true;
        } else {
          this.selectedJob = null;
          this.dialog = false;
        }
      }
    },
    dialog(val) {
      if (!val) this.selected.splice(0, this.selected.length);
    },
    filter: {
      deep: true,
      immediate: true,
      handler() {
        this.loadData({pagination: this.pagination});
      }
    }
  },
  created() {
    this.subscription = dbEvents.asObservable()
        .pipe(filter(event => event.collection === 'jobs' || event.collection === 'episodes'))
        .subscribe(event => {
          if (event.collection === 'jobs') {
            let index = this.jobs.findIndex(s => s.id === event.data.id);
            let job = new Job(event.data);

            if (index > -1) {
              if (event.eventType === 'CREATE' || event.eventType === 'UPDATE') {
                let existingJob = this.jobs[index];

                if (!job.episode) {
                  job.episode = existingJob.episode;
                }

                this.jobs.splice(index, 1, job);
              } else {
                this.jobs.splice(index, 1);
              }
            } else {
              if (event.eventType === 'CREATE' || event.eventType === 'UPDATE') {
                this.jobs.push(new Job(event.data));
              }
            }

            if (this.selectedJob && event.data.id === this.selectedJob.id) {
              if (event.eventType === 'CREATE' || event.eventType === 'UPDATE') {
                this.selectedJob = job;
                this.selected.splice(0, 1, this.selectedJob);
              } else {
                this.selectedJob = null;
                this.selected.splice(0, this.selected.length);
              }
            }
          } else if (event.collection === 'episodes') {
            let episode = new Episode(event.data);
            let jobId;
            let jobIndex = -1;

            if (isObject(episode.job)) {
              jobId = episode.job.id;
            } else {
              jobId = episode.job;
            }

            if (!jobId) {
              jobIndex = this.jobs.findIndex(job => job.episode && job.episode.id === episode.id);
              if (jobIndex > -1) {
                jobId = this.jobs[jobIndex].id;
              }
            }

            if (jobId) {
              if (jobIndex === -1) {
                jobIndex = this.jobs.findIndex(job => job.id === jobId);
              }

              if (jobIndex > -1) {
                let job = this.jobs[jobIndex];
                job.episode = episode;
                this.jobs.splice(jobIndex, 1, job);
              }
            }
          }
        });
  },
  computed: {
    jobStatuses() {
      return Object.keys(states);
    },
    filteredJobs() {
      return this.jobs.filter(job => sift({
        ...this.computedFilter,
        title: {$regex: this.searchInput, $options: 'i'}
      })(job));
    },
    computedFilter() {
      let filter = {};

      if (this.filter.state.length > 0) {
        filter.state = {$in: this.filter.state};
      }

      return filter;
    },
    columns() {
      return [
        {
          name: 'title',
          required: true,
          align: 'left',
          field: row => row.title,
          label: this.$t('jobs.table.cols.title')
        },
        {
          name: 'date_created',
          required: true,
          align: 'left',
          field: row => row.date_created,
          label: this.$t('jobs.table.cols.date_created'),
          sortable: true
        },
        {
          name: 'state',
          required: true,
          align: 'left',
          field: row => row.state,
          label: this.$t('jobs.table.cols.state'),
          sortable: true
        },
        {
          name: 'publishAt',
          required: true,
          align: 'left',
          field: row => row.episode && row.episode.publishAt ? row.episode.publishAt : null,
          label: this.$t('jobs.table.cols.publishAt'),
          sortable: true
        }
      ];
    }
  },
  methods: {
    async loadData({pagination: {page, rowsPerPage, sortBy, descending}}) {
      this.loading = true;

      try {
        this.jobs = await Job.api().find({
          filter: this.computedFilter,
          offset: (page - 1) * rowsPerPage,
          limit: rowsPerPage,
          sort: {[sortBy]: descending ? -1 : 1},
          projection: {},
          options: {
            populate: [{path: 'episode', populate: 'serie'}]
          }
        });

        this.pagination.page = page;
        this.pagination.rowsPerPage = rowsPerPage;
        this.pagination.sortBy = sortBy;
        this.pagination.descending = descending;
      } finally {
        this.loading = false;
      }
    },
    formatDate(date, format) {
      if (format === 'from') return moment(date).fromNow();
      return moment(date).format(format);
    },
  },
}
</script>

<style lang="sass">
.sticky-header-table-jobs
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
