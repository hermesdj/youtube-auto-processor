<template>
  <ServiceList class="row q-gutter-md" item-class="col grow" root-tag="div" tag="div">
    <template v-slot:service="{service}">
      <q-card square bordered>
        <q-card-section>
          <div class="text-h6">{{ service.service_name }}</div>
        </q-card-section>
        <q-card-section>
          {{service.service_description}}
        </q-card-section>
      </q-card>
    </template>
  </ServiceList>
</template>

<script>
import ServiceList from "components/services/ServiceList";

export default {
  name: "ServiceCardList",
  components: {ServiceList}
}
</script>

<style scoped>

</style>
