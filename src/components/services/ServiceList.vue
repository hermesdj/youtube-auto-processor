<template>
  <component :is="rootTag">
    <component :is="tag" v-for="service in services" :key="service.id" :class="itemClass">
      <slot :service="service" name="service"></slot>
    </component>
  </component>
</template>

<script>
import {Service} from "src/models/Service";
import {dbEvents} from "src/models/common/ipc";
import {filter} from 'rxjs/operators';

export default {
  name: "ServiceList",
  props: {
    tag: {
      type: String,
      default: () => 'div'
    },
    rootTag: {
      type: String,
      default: () => 'div'
    },
    itemClass: String
  },
  data: () => ({
    services: [],
    subscription: null
  }),
  mounted() {
    this.loadData();
    this.subscription = dbEvents.asObservable()
      .pipe(filter(event => event.collection === 'services'))
      .subscribe(event => {
        console.log('service list got event', event);
        let index = this.services.findIndex(s => s.id === event.data.id);
        if (index > -1) {
          if (event.eventType === 'CREATE' || event.eventType === 'UPDATE') {
            this.services.splice(index, 1, new Service(event.data));
          } else {
            this.services.splice(index, 1);
          }
        } else {
          if (event.eventType === 'CREATE' || event.eventType === 'UPDATE') {
            this.services.push(new Service(event.data));
          }
        }
      });
  },
  beforeDestroy() {
    if(this.subscription && this.subscription.unsubscribe) this.subscription.unsubscribe();
  },
  methods: {
    async loadData() {
      this.services = await Service.api().find({});
      console.log(this.services);
    }
  }
}
</script>

<style scoped>

</style>
