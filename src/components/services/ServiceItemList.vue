<template>
  <q-list bordered separator>
    <ServiceList>
      <template v-slot:service="{service}">
        <q-item>
          <q-item-section side top>
            <q-badge :color="service.started ? 'green' : 'red'" :label="$t('services.started')"></q-badge>
          </q-item-section>

          <q-item-section top>
            <q-item-label>{{ service.service_name }}</q-item-label>
            <q-item-label caption>{{ service.service_description }}</q-item-label>
          </q-item-section>

          <q-space></q-space>

          <q-item-section side top>
            <div class="text-grey-8 q-gutter-xs">
              <q-btn v-if="!service.started" class="gt-xs" dense flat icon="play_circle_filled" round size="12px"
                     @click="service.start()"/>
              <q-btn v-if="service.started" class="gt-xs" dense flat icon="stop" round size="12px"
                     @click="service.stop()"/>
            </div>
          </q-item-section>
        </q-item>
      </template>
    </ServiceList>
  </q-list>
</template>

<script>
import ServiceList from "components/services/ServiceList";

export default {
  name: "ServiceItemList",
  components: {ServiceList}
}
</script>

<style scoped>

</style>
