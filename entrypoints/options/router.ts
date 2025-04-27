import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

import AddRule from './pages/rules/Add.vue';
import RuleList from './pages/rules/List.vue';
import Rules from './pages/rules/RulesPage.vue';

const routes: RouteRecordRaw[] = [
    { path: '/', redirect: '/rules' },
    {
        path: '/rules',
        component: Rules,
        redirect: '/rules/lists',
        children: [
            {
                path: 'lists',
                component: RuleList,
            },
            {
                path: 'add',
                component: AddRule,
            },
        ],
    },
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});
