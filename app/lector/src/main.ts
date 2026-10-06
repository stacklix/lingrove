import { initializeAppLanguage } from '@lingrove/host-sdk';
import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import '@lingrove/host-sdk/ui.css';
void initializeAppLanguage().then(
  () => createApp(App).mount('#app'),
  () => createApp(App).mount('#app'),
);
