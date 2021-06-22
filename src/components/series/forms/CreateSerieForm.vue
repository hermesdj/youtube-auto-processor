<template>
  <q-form ref="form" @submit.stop="onSubmit">
    <q-card bordered flat square>
      <q-card-section class="q-gutter-md">
        <q-input
          v-model="$v.serie.playlist_title.$model"
          :error="$v.serie.playlist_title.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.title')"
          filled
          square
        >

        </q-input>
        <q-input
          v-model="$v.serie.planning_name.$model"
          :error="$v.serie.planning_name.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.planningName')"
          filled
          square
        >

        </q-input>
        <q-input
          v-model="$v.serie.video_title_template.$model"
          :error="$v.serie.video_title_template.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.videoTitleTemplate')"
          filled
          square
        >

        </q-input>
        <q-select
          v-model="$v.serie.default_language.$model"
          :error="$v.serie.default_language.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.language')"
          :options="availableLanguages"
          filled
          square
        >

        </q-select>
        <q-select
          v-model="$v.serie.video_keywords.$model"
          :error="$v.serie.video_keywords.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.tags')"
          filled
          hide-dropdown-icon
          input-debounce="0"
          multiple
          new-value-mode="add-unique"
          square
          use-chips
          use-input
          @new-value="createTags"
        >
          <template v-if="serie.video_keywords.length > 0" v-slot:append>
            <q-icon
              class="cursor-pointer"
              name="cancel"
              @click.stop="serie.video_keywords.splice(0, serie.video_keywords.length)"
            />
          </template>
        </q-select>
        <q-input
          v-model="$v.serie.game_title.$model"
          :label="$t('series.fields.gameTitle')"
          filled
          square
        />
        <q-input
          v-model="$v.serie.store_url.$model"
          :error="$v.serie.store_url.$error"
          :error-message="$t('validations.url')"
          :label="$t('series.fields.storeUrl')"
          filled
          square
        >

        </q-input>
        <q-input
          v-model="$v.serie.description.$model"
          :error="$v.serie.description.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.description')"
          filled
          square
          type="textarea"
        >

        </q-input>
      </q-card-section>
      <q-card-section class="q-gutter-md">
        <q-toggle
          v-model="serie.named_episode"
          :label="$t('series.fields.namedEpisode')"
          color="primary"
        >

        </q-toggle>
      </q-card-section>
      <q-card-section class="q-gutter-md">
        <q-toggle
          v-model="isNew"
          :label="$t('series.create.isNew')"
          color="primary"
        >

        </q-toggle>
        <q-input
          v-if="!isNew"
          v-model.number="$v.serie.last_episode.$model"
          :error="$v.serie.playlist_title.$error"
          :error-message="$t('validations.required')"
          :hint="$t('series.hints.lastEpisodeNumber')"
          :label="$t('series.fields.lastEpisodeNumber')"
          filled
          min="0"
          square
          step="1"
          type="number"
        />
      </q-card-section>
      <q-card-section class="q-gutter-md">
        <q-toggle
          v-model="createPlaylistOnYoutube"
          :label="$t('series.create.createOnYoutube')"
          color="primary"
        >

        </q-toggle>
        <q-input
          v-if="!createPlaylistOnYoutube"
          v-model="$v.serie.playlist_id.$model"
          :error="$v.serie.playlist_title.$error"
          :error-message="$t('validations.required')"
          :label="$t('series.fields.playlistId')"
          filled
          square
        >

        </q-input>
      </q-card-section>
      <q-card-actions>
        <q-space></q-space>
        <q-btn :label="$t('forms.reset')" class="q-ml-sm" color="primary" flat type="reset"/>
        <q-btn :label="$t('series.create.btn')" :loading="loading" color="primary" icon-right="add_circle_outline"
               type="submit"/>
      </q-card-actions>
    </q-card>
  </q-form>
</template>

<script>
import {uniq} from 'lodash';
import {minLength, numeric, required, requiredIf, url} from 'vuelidate/lib/validators';
import {Serie} from "src/models/Serie";

export default {
  name: "CreateSerieForm",
  data: () => ({
    loading: false,
    serie: {
      planning_name: 'AO Tennis 2 WTL ${episode_number}',
      playlist_id: null,
      video_title_template: '[FR] AO Tennis 2 - Mode Carrière WTL - Kyra - Rediff Épisode ${episode_number}',
      video_keywords: [
        'ao tennis 2',
        'ao tennis 2 carriere',
        'ao tennis 2 gameplay',
        'ao tennis carriere fr',
        'ao tennis career mode',
        'ao tennis career',
        'ao tennis 2 ep 1',
        'ao tennis 2 fr',
        'ao tennis gameplay fr'
      ],
      description: 'Tmp',
      last_episode: 0,
      game_title: 'AO Tennis 2',
      playlist_title: 'AO Tennis 2 : Mode carrière WTL - Kyra Fendragon',
      default_language: 'fr',
      named_episode: false,
      store_url: 'https://store.steampowered.com/app/1072500/AO_Tennis_2/'
    },
    createPlaylistOnYoutube: true,
    isNew: true
  }),
  validations() {
    return {
      serie: {
        playlist_id: {
          required: requiredIf(() => !this.createPlaylistOnYoutube)
        },
        playlist_title: {
          required: requiredIf(() => this.createPlaylistOnYoutube)
        },
        last_episode: {
          required,
          numeric
        },
        store_url: {url},
        default_language: {required},
        description: {required},
        video_keywords: {minLength: minLength(1)},
        video_title_template: {required},
        planning_name: {required},
        game_title: {required}
      }
    }
  },
  computed: {
    availableLanguages() {
      return [
        {
          value: 'fr',
          label: this.$t('series.languages.fr')
        }
      ]
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

        let serie = await Serie.api().callStatic('createSerie', [
          this.serie,
          this.isNew,
          this.createPlaylistOnYoutube
        ]);

        if (serie) {
          this.$emit('created', serie);
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
    },
    createTags(val, done) {
      this.serie.video_keywords = uniq(this.serie.video_keywords.concat(val.split(',').map(v => v.trim())));
      done();
    }
  }
}
</script>

<style scoped>

</style>
