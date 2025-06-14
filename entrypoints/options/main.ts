import '~/assets/tailwind.css';

import { createApp } from 'vue';

import { autoAnimatePlugin } from '@formkit/auto-animate/vue';
import Antd from 'ant-design-vue';

import App from './App.vue';
import { router } from './router';

createApp(App).use(router).use(Antd).use(autoAnimatePlugin).mount('#app');
