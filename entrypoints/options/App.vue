<script setup lang="ts">
import { useRouter } from 'vue-router';

import { SettingOutlined } from '@ant-design/icons-vue';

import AntdConfigProvider from '@/components/AntdConfigProvider.vue';
import { RULES_PAGE_PATH } from '@/constants/path';

const router = useRouter();

function navigateToRules() {
    router.push(RULES_PAGE_PATH);
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
                        规则管理
                    </a-menu-item>
                </a-menu>
            </a-layout-sider>
            <a-layout-content><router-view /> </a-layout-content>
        </a-layout>
    </AntdConfigProvider>
</template>
