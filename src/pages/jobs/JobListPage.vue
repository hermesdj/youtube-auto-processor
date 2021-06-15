<template>
  <q-page>
    <JobTable />
  </q-page>
</template>

<script>
import JobTable from "components/jobs/JobsTable";
export default {
  name: "JobListPage",
  components: {JobTable}
}
</script>

<style scoped>

</style>
