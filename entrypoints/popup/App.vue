<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { browser } from 'wxt/browser';

import AntdConfigProvider from '@/components/AntdConfigProvider.vue';
import { Command } from '@/constants/commands';
import { SHORTCUT_PAGE_PATH } from '@/constants/path';

const runtimeId = ref(browser.runtime.id);
const shortcut = ref('');
const formattedKeys = ref<string[]>([]);

/**
 * 获取实时快捷键
 */
const getShortcut = async () => {
    try {
        const commands = await browser.commands.getAll();
        const toggleCommand = commands.find((cmd) => cmd.name === Command.ToggleExtension);
        shortcut.value = toggleCommand?.shortcut || 'Alt+O';

        // 格式化快捷键为小写且分离键位
        if (shortcut.value) {
            formattedKeys.value = shortcut.value.toUpperCase().split('');
        }
    } catch (error) {
        console.error('获取快捷键失败:', error);
        shortcut.value = 'Alt+O';
        formattedKeys.value = ['alt', 'o'];
    }
};

/**
 * 打开 Chrome 快捷键设置页面
 */
const openShortcutSettings = () => {
    browser.tabs.create({ url: SHORTCUT_PAGE_PATH });
};

onMounted(() => {
    getShortcut();
});
</script>

<template>
    <AntdConfigProvider>
        <div class="flex h-40 w-80 items-center justify-center">
            <ul class="w-full px-4">
                <li class="mb-2 flex items-center justify-between">
                    <span>快捷键：</span>
                    <div class="flex items-center">
                        <div class="flex items-center">
                            <template v-for="(key, index) in formattedKeys" :key="index">
                                <kbd class="keycap">{{ key }}</kbd>
                                <span v-if="index < formattedKeys.length - 1" class="mx-1">+</span>
                            </template>
                        </div>
                        <button
                            class="ml-2 cursor-pointer text-blue-500 hover:text-blue-700"
                            title="设置快捷键"
                            @click="openShortcutSettings"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="3"></circle>
                                <path
                                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </li>

                <li class="mt-4">
                    自定义规则：<a
                        class="text-blue-500 underline"
                        :href="`chrome-extension://${runtimeId}/options.html`"
                        target="_blank"
                        >点击这里</a
                    >
                </li>

                <li class="mt-4 flex items-center">
                    ❤️
                    <a
                        class="ml-2 text-blue-500 underline"
                        href="https://github.com/tjx666/open-related-website"
                        target="_blank"
                        >点个 star 支持一下吧</a
                    >
                </li>
            </ul>
        </div>
    </AntdConfigProvider>
</template>

<style scoped>
.keycap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 5px;
    margin: 0 2px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0;
    text-align: center;
    color: #444;
    background-color: #f7f7f7;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow:
        0 2px 0 rgba(0, 0, 0, 0.1),
        inset 0 1px 0 white;
    transition: all 0.1s ease;
}

.keycap:active {
    transform: translateY(1px);
    box-shadow:
        0 1px 0 rgba(0, 0, 0, 0.1),
        inset 0 1px 0 white;
}
</style>
