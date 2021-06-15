<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{$t('jobs.messages.changeState.title')}}</div>
      </q-card-section>
      <q-list class="overflow-auto" style="max-height: 450px">
        <q-item v-for="(state, index) in stateList"
                :key="index" :active="selectedState === state"
                clickable
                @click="selectedState = state"
        >
          {{ state }}
        </q-item>
      </q-list>
      <q-card-actions align="right">
        <q-btn color="primary" label="Cancel" @click="onCancelClick"/>
        <q-btn :loading="loading" color="primary" label="OK" @click="onOKClick"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {Job} from "src/models/Job";
import states from "app/config/states";

export default {
  name: "JobSelectStateDialog",
  props: {
    job: {
      type: Job,
      required: true
    }
  },
  data: () => ({
    selectedState: null,
    loading: false
  }),
  computed: {
    stateList() {
      return Object.keys(states);
    },
  },

  methods: {
    // following method is REQUIRED
    // (don't change its name --> "show")
    show() {
      this.$refs.dialog.show()
    },

    // following method is REQUIRED
    // (don't change its name --> "hide")
    hide() {
      this.$refs.dialog.hide()
    },

    onDialogHide() {
      // required to be emitted
      // when QDialog emits "hide" event
      this.$emit('hide')
    },

    async onOKClick() {
      this.loading = true;
      try {
        await this.job.changeState(this.selectedState);

        this.$emit('ok', this.selectedState)
        this.hide()
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('jobs.messages.changeState.changeStateError', {message: err.message})
        })
      } finally {
        this.loading = false;
      }
    },

    onCancelClick() {
      // we just need to hide dialog
      this.hide()
    }
  }
}
</script>

<style scoped>

</style>
