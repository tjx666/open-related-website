<script lang="ts" setup>
import { ref } from 'vue';

import { onClickOutside } from '@vueuse/core';
import type { RelatedWebsite } from 'webext-bridge';

import { useEscListener } from '@/hooks/useEscListener';

import { useRelatedWebsites } from './composables/useRelatedWebsites';
import { exit } from './toggleExtension';

// fuzzy search
const searchStr = ref('');
const filteredWebsites = useRelatedWebsites(searchStr);

function openWebsite(site: RelatedWebsite) {
    window.open(site.url, site.openInNewTab ? '_blank' : '_self');
}

function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        const firstItem = filteredWebsites.value.at(0);
        if (firstItem) {
            openWebsite(firstItem);
        }
    }
}

function parseIcon(icon: string) {
    // inline svg
    if (icon.startsWith('<svg')) {
        const svg = new Blob([icon], { type: 'image/svg+xml' });
        return URL.createObjectURL(svg);
    }
    // http link
    return icon;
}

// exit
const root = ref<HTMLDivElement>();
useEscListener(exit, root);
const main = ref<HTMLDivElement>();
onClickOutside(main, exit);
</script>

<template>
    <div ref="root" class="bg-opacity-10 h-screen bg-black px-20 pt-32">
        <main ref="main" class="mx-auto max-w-2xl min-w-96 bg-white shadow">
            <input
                v-model="searchStr"
                class="h-10 w-full border border-solid border-black pl-2"
                placeholder="press enter to open the first item"
                autofocus
                @keydown="handleKeydown"
            />
            <ul class="max-h-96 overflow-y-scroll overscroll-contain">
                <li
                    v-for="site of filteredWebsites"
                    :key="site.name"
                    class="flex h-10 cursor-pointer items-center border-b p-2 hover:bg-gray-300"
                    @click="openWebsite(site)"
                >
                    <img v-if="site.icon" class="mr-2 h-4 w-4" :src="parseIcon(site.icon)" />
                    <p class="overflow-hidden text-ellipsis whitespace-nowrap">
                        <span class="mr-2 font-bold">{{ site.title }}</span>
                        <span class="text-gray-600">{{ site.description }}</span>
                    </p>
                </li>
            </ul>
        </main>
    </div>
</template>
