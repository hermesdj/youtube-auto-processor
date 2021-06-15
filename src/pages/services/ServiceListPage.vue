<template>
  <q-page>
    <q-toolbar>
      <q-toolbar-title>{{$t('services.title')}}</q-toolbar-title>
    </q-toolbar>
    <div class="q-pa-md">
      <ServiceItemList></ServiceItemList>
    </div>
  </q-page>
</template>

<script>
import ServiceItemList from "components/services/ServiceItemList";

export default {
  name: "ServiceListPage",
  components: {ServiceItemList}
}
</script>

<style scoped>

</style>
