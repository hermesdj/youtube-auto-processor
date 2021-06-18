<template>
  <q-form ref="form" @submit.stop="onSubmit">
    <q-card-section class="q-gutter-md">
      <q-input
        v-model="$v.localEpisode.video_name.$model"
        :error="$v.localEpisode.video_name.$error"
        :label="$t('episodes.fields.video_name')"
        counter
        filled
        maxlength="100"
        square
      >

      </q-input>
      <q-input
        v-if="namedEpisode"
        v-model="$v.localEpisode.episode_name.$model"
        :error="$v.localEpisode.episode_name.$error"
        :label="$t('episodes.fields.episode_name')"
        counter
        filled
        square
      >

      </q-input>
      <q-input
        v-model="$v.localEpisode.description.$model"
        :error="$v.localEpisode.description.$error"
        :error-message="$t('validations.required')"
        :label="$t('episodes.fields.description')"
        counter
        filled
        maxlength="5000"
        square
        type="textarea"
      >

      </q-input>
      <q-select
        v-model="$v.localEpisode.keywords.$model"
        :error="$v.localEpisode.keywords.$error"
        :label="$t('episodes.fields.keywords')"
        counter
        filled
        hide-dropdown-icon
        input-debounce="0"
        maxlength="500"
        multiple
        new-value-mode="add-unique"
        square
        use-chips
        use-input
        @new-value="createTags"
      >
        <template v-slot:counter>
          {{ localEpisode.keywords.join(',').length }} / 500
        </template>
        <template v-if="localEpisode.keywords && localEpisode.keywords.length > 0" v-slot:append>
          <q-icon
            class="cursor-pointer"
            name="cancel"
            @click.stop="localEpisode.keywords.splice(0, localEpisode.keywords.length)"
          />
        </template>
      </q-select>
    </q-card-section>
    <q-card-actions>
      <q-space></q-space>
      <q-btn :label="$t('forms.reset')" class="q-ml-sm" color="primary" flat type="reset"/>
      <q-btn :label="$t('episodes.edit.btn')" :loading="loading" color="primary" icon-right="save"
             type="submit"/>
    </q-card-actions>
  </q-form>
</template>

<script>
import {Episode} from "src/models/Episode";
import {integer, maxLength, minLength, required, requiredIf} from "vuelidate/lib/validators";
import {pick, uniq} from "lodash";

export default {
  name: "EditEpisodeForm",
  props: {
    episode: {
      type: Episode,
      required: true
    }
  },
  data: () => ({
    loading: false,
    localEpisode: {
      path: null,
      episode_number: 0,
      video_name: null,
      description: null,
      keywords: [],
      episode_name: null,
      publishAt: null
    }
  }),
  watch: {
    episode: {
      immediate: true,
      deep: true,
      handler(val) {
        if (val) {
          console.log('episode is', val);
          this.localEpisode = Object.assign({}, val);
        }
      }
    },
    'localEpisode.episode_name'(val) {
      if (val && this.namedEpisode) {
        this.localEpisode.video_name = this.localEpisode.video_name.replace('${episode_name}', val);
      }
    }
  },
  validations() {
    return {
      localEpisode: {
        path: {
          required
        },
        video_name: {
          required,
          maxLength: maxLength(100)
        },
        description: {
          required: true,
          maxLength: maxLength(5000)
        },
        episode_number: {
          required,
          integer
        },
        episode_name: {
          required: requiredIf(() => this.namedEpisode)
        },
        keywords: {
          minLength: minLength(0),
          maxLength: value => value.join(',').length <= 500
        }
      }
    }
  },
  computed: {
    namedEpisode() {
      return this.episode && this.episode.serie && this.episode.serie.named_episode;
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

        let updatedEpisode = await Episode.api().callStatic('updateEpisodeData', [
          this.episode.id,
          pick(this.localEpisode, ['video_name', 'episode_name', 'description', 'keywords'])
        ]);


        if (updatedEpisode) {
          this.$emit('update:episode', new Episode(updatedEpisode));
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
      this.localEpisode.keywords = uniq(this.localEpisode.keywords.concat(val.split(',').map(v => v.trim())));
      done();
    }
  }
}
</script>

<style scoped>

</style>
