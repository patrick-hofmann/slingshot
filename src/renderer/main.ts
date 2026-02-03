import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import ProjectsPage from './pages/projects/index.vue'
import ProjectDetailPage from './pages/projects/[projectId].vue'
import ThreadDetailPage from './pages/threads/[threadId].vue'

import './assets/main.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/projects'
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsPage
    },
    {
      path: '/projects/:projectId',
      name: 'project',
      component: ProjectDetailPage
    },
    {
      path: '/projects/:projectId/threads/:threadId',
      name: 'thread',
      component: ThreadDetailPage
    }
  ]
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
