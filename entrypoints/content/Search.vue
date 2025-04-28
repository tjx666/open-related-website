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
    const target = site.openInNewTab ? '_blank' : '_self';
    // 优先使用 urlPattern 如果存在
    if (site.urlPattern) {
        try {
            // 处理 urlPattern 中的占位符
            const processedUrl = processUrlPattern(site.urlPattern);
            window.open(processedUrl, target);
            return;
        } catch (error) {
            console.error('处理 URL 模板失败:', error);
            // 如果处理失败，回退到固定 URL
        }
    }

    // 使用固定 URL
    window.open(site.url, target);
}

/**
 * 处理 URL 模板中的占位符 支持的占位符：
 *
 * - {urlParam:参数名} - 获取当前 URL 中的查询参数
 * - {dom:选择器} - 获取页面 DOM 元素的内容
 */
function processUrlPattern(urlPattern: string): string {
    return urlPattern.replaceAll(/\{([^}]+)\}/g, (match, content) => {
        const [type, param] = content.split(':');

        if (type === 'urlParam') {
            // 从当前 URL 中提取查询参数
            const url = new URL(globalThis.location.href);
            return url.searchParams.get(param) || '';
        }

        if (type === 'dom') {
            // 从 DOM 中提取内容
            const element = document.querySelector(param);
            return element ? element.textContent || '' : '';
        }

        // 未识别的占位符类型，保持原样
        return match;
    });
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
    <div ref="root" class="h-screen bg-black/10 px-20 pt-32">
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
                    :key="site.title"
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
