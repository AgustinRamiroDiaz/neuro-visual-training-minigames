import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import ButtonGroup from 'primevue/buttongroup';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Fieldset from 'primevue/fieldset';
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import Tooltip from 'primevue/tooltip';
import App from './App.vue';
import { router } from './router';
import './styles.css';

createApp(App)
  .use(createPinia())
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: false,
        cssLayer: {
          name: 'primevue',
          order: 'primevue',
        },
      },
    },
  })
  .component('Badge', Badge)
  .component('Button', Button)
  .component('ButtonGroup', ButtonGroup)
  .component('Card', Card)
  .component('Column', Column)
  .component('DataTable', DataTable)
  .component('Fieldset', Fieldset)
  .component('InputGroup', InputGroup)
  .component('InputText', InputText)
  .component('Message', Message)
  .component('RadioButton', RadioButton)
  .component('Select', Select)
  .component('SelectButton', SelectButton)
  .component('Tag', Tag)
  .directive('tooltip', Tooltip)
  .mount('#app');
