const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/Index.vue')
      },
      {
        path: 'jobs',
        name: 'jobs',
        component: () => import('pages/jobs/JobListPage.vue')
      },
      {
        path: 'series',
        name: 'series',
        component: () => import('pages/series/SerieListPage.vue')
      },
      {
        path: 'serie',
        component: () => import('pages/Router.vue'),
        children: [
          {
            path: ':id',
            name: 'seriePage',
            component: () => import('pages/series/SeriePage.vue'),
            props: true
          }
        ]
      },
      {
        path: 'episodes',
        component: () => import('pages/Router.vue'),
        children: [
          {
            path: ':id',
            name: 'episodePage',
            component: () => import('pages/episodes/EpisodePage.vue'),
            props: true
          }
        ]
      },
      {
        path: 'forms',
        component: () => import('pages/Router.vue'),
        children: [
          {
            path: 'series',
            component: () => import('pages/Router.vue'),
            children: [
              {
                path: 'create',
                name: 'createSerie',
                component: () => import('pages/series/CreateSeriePage.vue')
              }
            ]
          }
        ]
      },
      {
        path: 'logs',
        name: 'logs',
        component: () => import('pages/appLogs/LogListPage.vue')
      },
      {
        path: 'configurations',
        name: 'configHome',
        redirect: '/configurations/app',
        component: () => import('pages/configurations/ConfigLayout.vue'),
        children: [
          {
            path: 'app',
            name: 'appConfig',
            component: () => import('components/configurations/app/AppConfigHome.vue')
          },
          {
            path: 'auth',
            name: 'configGoogleAuth',
            component: () => import('components/configurations/google/ConfigGoogleAuth.vue')
          },
          {
            path: 'processing',
            name: 'videoProcessing',
            redirect: '/configurations/processing/config',
            component: () => import('components/configurations/video/ConfigVideoProcessing.vue'),
            children: [
              {
                path: 'config',
                name: 'configVideoProcessing',
                component: () => import('components/configurations/video/ConfigVideoProcessor.vue')
              },
              {
                path: 'encoding',
                name: 'configVideoEncoding',
                component: () => import('components/configurations/video/ConfigVideoEncoding.vue')
              },
              {
                path: 'encoders',
                name: 'configEncoders',
                component: () => import('components/configurations/video/ConfigEncoders.vue')
              },
              {
                path: 'filters',
                name: 'configFilters',
                component: () => import('components/configurations/video/ConfigFilters.vue')
              },
              {
                path: 'codecs',
                name: 'configCodecs',
                component: () => import('components/configurations/video/ConfigCodecs.vue')
              },
              {
                path: 'formats',
                name: 'configFormats',
                component: () => import('components/configurations/video/ConfigFormats.vue')
              },
            ]
          }
        ]
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
