<template>
  <q-btn color="grey" flat icon="more_vert" round>
    <q-menu
      v-model="menu"
    >
      <q-card square>
        <q-list dense style="min-width: 250px">
          <q-item-label header>{{ $t('series.actions.categories.privacy') }}</q-item-label>

          <q-item v-ripple tag="label">
            <q-item-section avatar>
              <q-radio v-model="localSerie.privacy_status" val="private"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('series.privacy.private') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-ripple tag="label">
            <q-item-section avatar>
              <q-radio v-model="localSerie.privacy_status" val="public"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('series.privacy.public') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-ripple tag="label">
            <q-item-section avatar>
              <q-radio v-model="localSerie.privacy_status" val="unlisted"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('series.privacy.unlisted') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced/>

          <q-item-label header>{{ $t('series.actions.categories.status') }}</q-item-label>

          <q-item v-ripple tag="label">
            <q-item-section avatar>
              <q-radio v-model="localSerie.status" val="active"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('series.status.active') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-ripple tag="label">
            <q-item-section avatar>
              <q-radio v-model="localSerie.status" val="finished"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('series.status.finished') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-ripple tag="label">
            <q-item-section avatar>
              <q-radio v-model="localSerie.status" val="cancelled"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('series.status.cancelled') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-ripple tag="label">
            <q-item-section avatar>
              <q-radio v-model="localSerie.status" val="paused"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('series.status.paused') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-separator/>
        <q-card-actions>
          <q-space></q-space>
          <q-btn :label="$t('app.btn.save')" :loading="saving" flat icon="save" @click="save"/>
        </q-card-actions>
      </q-card>
    </q-menu>
  </q-btn>
</template>

<script>
import {Serie} from "src/models/Serie";

export default {
  name: "SerieActionsMenu",
  props: {
    serie: {
      type: Object,
      default: null
    }
  },
  data: () => ({
    localSerie: null,
    saving: false,
    menu: false
  }),
  watch: {
    serie: {
      immediate: true,
      handler(val) {
        this.localSerie = Object.assign({}, val);
      }
    }
  },
  methods: {
    async save() {
      this.saving = true;

      try {
        // TODO
        this.$emit('update:serie', new Serie(this.localSerie));
        this.menu = false;
      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('series.dialogs.save.error', {error: err.message})
        })
      } finally {
        this.saving = false;
      }
    }
  }
}
</script>

<style scoped>

</style>
