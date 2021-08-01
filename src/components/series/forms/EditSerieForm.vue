<template>
  <q-form ref="form" @submit.stop="onSubmit">
    <q-card bordered flat square>
      <q-card-section class="q-gutter-md">
        <q-input
          v-model="$v.localSerie.description.$model"
          :error="$v.localSerie.description.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.description')"
          filled
          square
          type="textarea"
        >

        </q-input>
      </q-card-section>
      <q-card-actions>
        <q-space></q-space>
        <q-btn :label="$t('forms.reset')" class="q-ml-sm" color="primary" flat type="reset"/>
        <q-btn :label="$t('series.edit.btn')" :loading="loading" color="primary" icon-right="save"
               type="submit"/>
      </q-card-actions>
    </q-card>
  </q-form>
</template>

<script>
import {required} from "vuelidate/lib/validators";
import {Serie} from "src/models/Serie";
import {pick} from 'lodash';

export default {
  name: "EditSerieForm",
  props: {
    serie: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    loading: false,
    localSerie: {
      description: null
    }
  }),
  validations() {
    return {
      localSerie: {
        description: {required}
      }
    }
  },
  watch: {
    serie: {
      immediate: true,
      handler(val){
        this.localSerie = pick(val, ['description']);
      }
    }
  },
  methods: {
    async onSubmit() {
      this.$v.$touch();

      if (this.$v.$anyError) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('forms.invalidForm')
        })
        return;
      }

      try {
        this.loading = true;

        let serie = await Serie.api().callStatic('updateSerieData', [
          this.serie.id,
          {description: this.localSerie.description}
        ]);

        if (serie) {
          this.$emit('update:serie', serie);
          this.$emit('saved', serie);
          this.$refs.form.reset();
          this.$v.$reset();
        }

      } catch (err) {
        this.$q.notify({
          color: 'red-4',
          textColor: 'white',
          icon: 'warning',
          message: this.$t('forms.formError', {message: err.message})
        })
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>

</style>
