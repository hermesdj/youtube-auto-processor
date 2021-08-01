<template>
  <q-btn icon="edit" flat round color="grey" :to="{name: 'editSerie', params: {id: serie.id}}">
    <q-tooltip>{{$t('series.edit.tooltip', serie)}}</q-tooltip>
  </q-btn>
</template>

<script>
export default {
  name: "EditSerieBtn",
  props: {
    serie: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>

</style>
