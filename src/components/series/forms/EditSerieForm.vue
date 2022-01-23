<template>
  <q-form ref="form" @submit.stop="onSubmit">
    <q-card bordered flat square>
      <q-card-section class="q-gutter-md">
        <q-input
          v-model="$v.localSerie.video_title_template.$model"
          :error="$v.localSerie.video_title_template.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.videoTitleTemplate')"
          filled
          square
        >

        </q-input>
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
        <q-input
          v-model.number="$v.localSerie.last_episode.$model"
          :error="$v.localSerie.last_episode.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.lastEpisodeNumber')"
          filled
          square
          type="number"
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
import {required, minValue, integer} from "vuelidate/lib/validators";
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
      description: null,
      video_title_template: null,
      last_episode: 0
    }
  }),
  validations() {
    return {
      localSerie: {
        description: {required},
        video_title_template: {required},
        last_episode: {integer, minValue: minValue(0)}
      }
    }
  },
  watch: {
    serie: {
      immediate: true,
      handler(val){
        this.localSerie = pick(val, ['description', 'video_title_template', 'last_episode']);
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
          {
            description: this.localSerie.description,
            video_title_template: this.localSerie.video_title_template,
            last_episode: this.localSerie.last_episode
          }
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
