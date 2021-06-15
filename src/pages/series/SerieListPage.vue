<template>
  <q-page>
    <SeriesTable>
      <template v-slot:name="{serie}">
        <router-link
          :to="{name: 'seriePage', params: {id: serie.id}}"
        >
          {{ serie.name }}
        </router-link>
      </template>
    </SeriesTable>
  </q-page>
</template>

<script>
import SeriesTable from "components/series/SeriesTable";

export default {
  name: "SerieListPage",
  components: {SeriesTable}
}
</script>

<style scoped>

</style>
