import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

import { RULES_PAGE_PATH } from '@/constants/path';

import AddRule from './pages/rules/Add.vue';
import EditRule from './pages/rules/Edit.vue';
import RuleList from './pages/rules/List.vue';
import Rules from './pages/rules/RulesPage.vue';

const routes: RouteRecordRaw[] = [
    { path: '/', redirect: RULES_PAGE_PATH },
    {
        path: RULES_PAGE_PATH,
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
            {
                path: 'edit/:name',
                component: EditRule,
            },
        ],
    },
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});
