<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';

import { onClickOutside } from '@vueuse/core';

import type { RelatedWebsite } from '@/background/rules/BaseRule';
import ClearSearchIcon from '@/components/icons/ClearSearchIcon.vue';
import EmptySearchIcon from '@/components/icons/EmptySearchIcon.vue';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import { useEscListener } from '@/hooks/useEscListener';

import { i18n } from '#i18n';

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
 * Ensure the search input is focused
 */
const focusSearchInput = async () => {
    await nextTick();
    if (searchInputRef.value) {
        // Use setTimeout to ensure DOM is fully rendered before focusing
        setTimeout(() => {
            searchInputRef.value?.focus();
        }, 50);
    }
};

onMounted(focusSearchInput);

function openWebsite(site: RelatedWebsite) {
    const target = site.openInNewTab ? '_blank' : '_self';
    // Prefer urlPattern if exists
    if (site.urlPattern) {
        try {
            // Process placeholders in urlPattern
            const processedUrl = processUrlPattern(site.urlPattern);
            window.open(processedUrl, target);
            return;
        } catch (error) {
            console.error('Failed to process URL template:', error);
            // Fallback to static URL if processing fails
        }
    }

    // Use static URL
    window.open(site.url, target);
}

/**
 * Process placeholders in URL template. Supported placeholders:
 *
 * - {urlParam:parameterName} - Get query parameter from current URL
 * - {urlPathSegment:index} - Get segment from URL path (split by /, 0 is first; if index omitted returns full path)
 * - {dom:selector} - Get content from page DOM element
 * - {repoPath} - Get repository path of current page (only available on GitHub/GitLab, etc.)
 */
function processUrlPattern(urlPattern: string): string {
    return urlPattern.replaceAll(/\{([^}]+)\}/g, (match, content) => {
        const [type, param] = content.split(':');

        if (type === 'urlParam') {
            // Extract query parameter from current URL
            const url = new URL(globalThis.location.href);
            return url.searchParams.get(param) || '';
        }

        if (type === 'urlPathSegment') {
            // Extract parameter from URL path
            const url = new URL(globalThis.location.href);
            const pathParts = url.pathname.split('/').filter(Boolean);
            // If index is not provided, return full path
            if (!param) {
                return url.pathname;
            }
            const index = Number.parseInt(param, 10);
            return index < pathParts.length ? pathParts[index] : '';
        }

        if (type === 'dom') {
            // Extract content from DOM
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

        // Unrecognized placeholder type, keep original
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
                    <SearchIcon />
                </div>
                <input
                    ref="searchInputRef"
                    v-model="searchStr"
                    class="block w-full border-0 border-b border-gray-200 bg-white py-3 pr-10 pl-10 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-gray-400 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-gray-600"
                    :placeholder="i18n.t('content.search.placeholder')"
                    @keydown="handleKeydown"
                />
                <button
                    v-if="searchStr"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors duration-150 hover:text-gray-600 dark:hover:text-gray-300"
                    @click="clearSearch"
                >
                    <ClearSearchIcon class="h-5 w-5" />
                </button>
            </div>

            <div class="overflow-hidden">
                <!-- Empty result state -->
                <div
                    v-if="showEmptyState"
                    class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                    <EmptySearchIcon class="mx-auto h-12 w-12 text-gray-400" />
                    <p class="mt-4 text-lg">{{ i18n.t('content.search.emptyResult') }}</p>
                    <p class="mt-2">{{ i18n.t('content.search.tryOtherKeywords') }}</p>
                </div>

                <!-- Result list -->
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

                <!-- Keyboard operation hint -->
                <div
                    v-if="filteredWebsites.length > 0"
                    class="flex justify-between border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                    <span
                        >{{ i18n.t('content.search.enterKeyHint') }}
                        <kbd class="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">Enter</kbd>
                        {{ i18n.t('content.search.quickOpen') }}</span
                    >
                    <span
                        >{{ i18n.t('content.search.escKeyHint') }}
                        <kbd class="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">Esc</kbd>
                        {{ i18n.t('content.search.close') }}</span
                    >
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
/* Custom scrollbar styles */
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

/* Fade-in animation */
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
