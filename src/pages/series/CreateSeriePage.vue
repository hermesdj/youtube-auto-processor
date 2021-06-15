<template>
  <q-page>
    <q-toolbar>
      <q-btn flat icon="arrow_back" round @click="$router.back()"/>
      <q-toolbar-title>{{ $t('series.create.title') }}</q-toolbar-title>
    </q-toolbar>
    <div class="row q-mb-lg">
      <div class="col-8 q-mx-auto">
        <CreateSerieForm
          @cancel="$router.back()"
          @created="serie => $router.replace({name: 'seriePage', params: {id: serie.id}})"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import CreateSerieForm from "components/series/forms/CreateSerieForm";

export default {
  name: "CreateSeriePage.vue",
  components: {CreateSerieForm}
}
</script>

<style scoped>

</style>
