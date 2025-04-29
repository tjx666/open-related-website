<script setup lang="ts">
import { useRouter } from 'vue-router';

import { CodeOutlined, SettingOutlined } from '@ant-design/icons-vue';

import AntdConfigProvider from '@/components/AntdConfigProvider.vue';
import { RULES_EDITOR_PAGE_PATH, RULES_PAGE_PATH } from '@/constants/path';

import { i18n } from '#i18n';

const router = useRouter();

function navigateToRules() {
    router.push(RULES_PAGE_PATH);
}

function navigateToRulesEditor() {
    router.push(RULES_EDITOR_PAGE_PATH);
}
</script>

<template>
    <AntdConfigProvider>
        <a-layout class="h-screen overflow-y-scroll bg-white">
            <a-layout-sider class="bg-white!">
                <a-menu>
                    <a-menu-item key="rules" @click="navigateToRules">
                        <template #icon>
                            <SettingOutlined />
                        </template>
                        {{ i18n.t('options.rulesManagement') }}
                    </a-menu-item>
                    <a-menu-item key="rules-editor" @click="navigateToRulesEditor">
                        <template #icon>
                            <CodeOutlined />
                        </template>
                        {{ i18n.t('options.rulesEditor.title') }}
                    </a-menu-item>
                </a-menu>
            </a-layout-sider>
            <a-layout-content><router-view /> </a-layout-content>
        </a-layout>
    </AntdConfigProvider>
</template>
