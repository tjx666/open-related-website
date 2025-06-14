<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { browser } from 'wxt/browser';

import AntdConfigProvider from '@/components/AntdConfigProvider.vue';
import SettingsIcon from '@/components/icons/SettingsIcon.vue';
import { Command } from '@/constants/commands';
import { SHORTCUT_PAGE_PATH } from '@/constants/path';

import { i18n } from '#i18n';

const runtimeId = ref(browser.runtime.id);
const shortcut = ref('');
const formattedKeys = ref<string[]>([]);

/**
 * Get the current shortcut key in real time
 */
const getShortcut = async () => {
    try {
        const commands = await browser.commands.getAll();
        const toggleCommand = commands.find((cmd) => cmd.name === Command.ToggleExtension);
        shortcut.value = toggleCommand?.shortcut || 'Alt+O';

        // Format shortcut to uppercase and split into keys
        if (shortcut.value) {
            formattedKeys.value = shortcut.value.toUpperCase().split('');
        }
    } catch (error) {
        console.error('getShortcut error:', error);
        shortcut.value = 'Alt+O';
        formattedKeys.value = ['alt', 'o'];
    }
};

/**
 * Open the Chrome shortcut settings page
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
                    <span>{{ i18n.t('popup.shortcut') }}</span>
                    <div class="flex items-center">
                        <div class="flex items-center">
                            <template v-for="(key, index) in formattedKeys" :key="index">
                                <kbd class="keycap">{{ key }}</kbd>
                                <span v-if="index < formattedKeys.length - 1" class="mx-1">+</span>
                            </template>
                        </div>
                        <button
                            class="ml-2 cursor-pointer text-blue-500 hover:text-blue-700"
                            :title="i18n.t('popup.setShortcut')"
                            @click="openShortcutSettings"
                        >
                            <SettingsIcon />
                        </button>
                    </div>
                </li>

                <li class="mt-4">
                    {{ i18n.t('popup.customRules')
                    }}<a
                        class="text-blue-500 underline"
                        :href="`chrome-extension://${runtimeId}/options.html`"
                        target="_blank"
                        >{{ i18n.t('popup.clickHere') }}</a
                    >
                </li>

                <li class="mt-4 flex items-center">
                    ❤️
                    <a
                        class="ml-2 text-blue-500 underline"
                        href="https://github.com/tjx666/open-related-website"
                        target="_blank"
                        >{{ i18n.t('popup.giveStar') }}</a
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
