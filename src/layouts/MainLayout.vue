<template>
  <q-layout view="hHh Lpr lff">
    <q-header elevated>
      <q-bar class="q-electron-drag">
        <q-icon name="video_settings"></q-icon>
        <div class="text-weight-bold">
          {{ $t('app.title') }}
        </div>
        <q-space></q-space>
      </q-bar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      :breakpoint="500"
      :mini="miniState"
      :width="200"
      bordered
      content-class="bg-grey-3"
      show-if-above
      @mouseout="miniState = true"
      @mouseover="miniState = false"

    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item
            v-for="(item, index) in menu"
            :key="index"
            :to="item.to"
            clickable
          >
            <q-item-section avatar>
              <q-icon :name="item.icon"></q-icon>
            </q-item-section>
            <q-item-section>
              {{ item.label }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'MainLayout',
  data() {
    return {
      leftDrawerOpen: false,
      miniState: true,
      jobRunnerActive: true
    }
  },
  computed: {
    menu() {
      return [
        {
          to: {name: 'jobs'},
          label: this.$t('app.menu.jobs'),
          icon: 'task_alt'
        },
        {
          to: {name: 'series'},
          label: this.$t('app.menu.series'),
          icon: 'video_library'
        },
        {
          to: {name: 'configHome'},
          label: this.$t('app.menu.config'),
          icon: 'settings'
        },
        {
          to: {name: 'logs'},
          label: this.$t('app.menu.logs'),
          icon: 'event_note'
        },
      ]
    },
    isMaximized() {
      if (process.env.MODE === 'electron') {
        const win = this.$q.electron.remote.BrowserWindow.getFocusedWindow();

        if (win) return win.isMaximized();
      }
      return false;
    }
  },
  methods: {
    minimize() {
      if (process.env.MODE === 'electron') {
        this.$q.electron.remote.BrowserWindow.getFocusedWindow().minimize()
      }
    },

    maximize() {
      if (process.env.MODE === 'electron') {
        const win = this.$q.electron.remote.BrowserWindow.getFocusedWindow()

        if (win.isMaximized()) {
          win.unmaximize()
        } else {
          win.maximize()
        }
      }
    },

    close() {
      if (process.env.MODE === 'electron') {
        this.$q.electron.remote.BrowserWindow.getFocusedWindow().close()
      }
    }
  }
}
</script>
