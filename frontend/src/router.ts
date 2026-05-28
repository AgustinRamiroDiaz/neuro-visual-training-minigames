import { createRouter, createWebHashHistory } from 'vue-router';
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
