<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';

import { onClickOutside } from '@vueuse/core';
import type { RelatedWebsite } from 'webext-bridge';

import { useEscListener } from '@/hooks/useEscListener';

import { useRelatedWebsites } from './composables/useRelatedWebsites';
import { exit } from './toggleExtension';

// fuzzy search
const searchStr = ref('');
const filteredWebsites = useRelatedWebsites(searchStr);
const searchInputRef = ref<HTMLInputElement | null>(null);
const showEmptyState = computed(
    () => filteredWebsites.value.length === 0 && searchStr.value.length > 0,
);

/**
 * 确保搜索框聚焦
 */
const focusSearchInput = async () => {
    await nextTick();
    if (searchInputRef.value) {
        // 使用 setTimeout 确保在 DOM 完全渲染后聚焦
        setTimeout(() => {
            searchInputRef.value?.focus();
        }, 50);
    }
};

onMounted(focusSearchInput);

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
 * - {urlPathSegment:索引} - 获取 URL path 中的片段（按 / 分割，0 为第一个；不带索引则返回完整 path）
 * - {dom:选择器} - 获取页面 DOM 元素的内容
 * - {repoPath} - 获取当前页面的仓库路径（仅在 GitHub/GitLab 等平台上可用）
 */
function processUrlPattern(urlPattern: string): string {
    return urlPattern.replaceAll(/\{([^}]+)\}/g, (match, content) => {
        const [type, param] = content.split(':');

        if (type === 'urlParam') {
            // 从当前 URL 中提取查询参数
            const url = new URL(globalThis.location.href);
            return url.searchParams.get(param) || '';
        }

        if (type === 'urlPathSegment') {
            // 从 URL path 中提取参数
            const url = new URL(globalThis.location.href);
            const pathParts = url.pathname.split('/').filter(Boolean);
            // 如果没有提供索引，返回完整路径
            if (!param) {
                return url.pathname;
            }
            const index = Number.parseInt(param, 10);
            return index < pathParts.length ? pathParts[index] : '';
        }

        if (type === 'dom') {
            // 从 DOM 中提取内容
            const element = document.querySelector(param);
            return element ? element.textContent || '' : '';
        }

        if (type === 'repoPath') {
            // Get repository path (only supported on GitHub/GitLab)
            const host = globalThis.location.hostname;
            if (host === 'github.com' || host === 'gitlab.com') {
                const pathParts = location.pathname.split('/').filter(Boolean);
                if (pathParts.length >= 2) {
                    return `${pathParts[0]}/${pathParts[1]}`;
                }
            }
            return '';
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
    } else if (e.key === 'Escape') {
        exit();
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

function clearSearch() {
    searchStr.value = '';
    if (searchInputRef.value) {
        searchInputRef.value.focus();
    }
}

// exit
const root = ref<HTMLDivElement>();
useEscListener(exit, root);
const main = ref<HTMLDivElement>();
onClickOutside(main, exit);
</script>

<template>
    <div
        ref="root"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-32 backdrop-blur-sm transition-all duration-200 sm:px-6"
    >
        <main
            ref="main"
            class="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-2 pb-0 shadow-2xl transition-all duration-300 ease-in-out dark:bg-gray-800"
        >
            <div class="relative mb-2">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg
                        class="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
                <input
                    ref="searchInputRef"
                    v-model="searchStr"
                    class="block w-full border-0 border-b border-gray-200 bg-white py-3 pr-10 pl-10 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-gray-400 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-gray-600"
                    placeholder="搜索相关网站... (按 Enter 打开第一个结果)"
                    @keydown="handleKeydown"
                />
                <button
                    v-if="searchStr"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors duration-150 hover:text-gray-600 dark:hover:text-gray-300"
                    @click="clearSearch"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            <div class="overflow-hidden">
                <!-- 空结果状态 -->
                <div
                    v-if="showEmptyState"
                    class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                    <svg
                        class="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p class="mt-4 text-lg">没有找到匹配的结果</p>
                    <p class="mt-2">请尝试其他搜索关键词</p>
                </div>

                <!-- 结果列表 -->
                <ul
                    v-else
                    v-auto-animate
                    class="max-h-96 divide-y divide-gray-200 overflow-y-auto overscroll-contain dark:divide-gray-700"
                >
                    <li
                        v-for="site of filteredWebsites"
                        :key="site.title"
                        class="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        @click="openWebsite(site)"
                    >
                        <div
                            class="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
                        >
                            <img
                                v-if="site.icon"
                                class="h-5 w-5 object-contain"
                                :src="parseIcon(site.icon)"
                                :alt="site.title"
                            />
                            <span
                                v-else
                                class="text-sm font-medium text-gray-500 dark:text-gray-400"
                            >
                                {{ site.title.charAt(0).toUpperCase() }}
                            </span>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center justify-between">
                                <h3
                                    class="truncate text-sm font-medium text-gray-900 transition-colors duration-150 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400"
                                >
                                    {{ site.title }}
                                </h3>
                                <div
                                    class="arrow-icon opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 text-gray-400 group-hover:text-blue-500"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <p
                                v-if="site.description"
                                class="truncate text-sm text-gray-500 dark:text-gray-400"
                            >
                                {{ site.description }}
                            </p>
                        </div>
                    </li>
                </ul>

                <!-- 键盘操作提示 -->
                <div
                    v-if="filteredWebsites.length > 0"
                    class="flex justify-between border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                    <span
                        >按
                        <kbd class="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">Enter</kbd>
                        快速打开</span
                    >
                    <span
                        >按
                        <kbd class="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">Esc</kbd>
                        关闭</span
                    >
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
ul::-webkit-scrollbar {
    width: 8px;
}

ul::-webkit-scrollbar-track {
    background-color: transparent;
}

ul::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 4px;
}

ul::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.8);
}

/* 渐入动画 */
.fixed {
    animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>
