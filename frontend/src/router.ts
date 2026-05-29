import { createRouter, createWebHashHistory } from 'vue-router';
import AuthView from './views/AuthView.vue';
import CatalogView from './views/CatalogView.vue';
import HistoryView from './views/HistoryView.vue';
import PlayView from './views/PlayView.vue';
import SetupView from './views/SetupView.vue';

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'catalog',
      component: CatalogView,
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/register',
      name: 'register',
      component: AuthView,
    },
    {
      path: '/login',
      name: 'login',
      component: AuthView,
    },
    {
      path: '/games/:gameId/setup',
      name: 'game-setup',
      component: SetupView,
    },
    {
      path: '/games/:gameId/play',
      name: 'game-play',
      component: PlayView,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});
