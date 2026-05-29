import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import App from './App.vue';
import { router } from './router';
import './styles.css';

createApp(App)
  .use(createPinia())
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
    },
  })
  .component('Badge', Badge)
  .component('Button', Button)
  .component('Card', Card)
  .component('Column', Column)
  .component('DataTable', DataTable)
  .component('InputText', InputText)
  .component('Message', Message)
  .component('RadioButton', RadioButton)
  .component('Select', Select)
  .component('SelectButton', SelectButton)
  .mount('#app');
