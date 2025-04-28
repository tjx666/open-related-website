import type { Ref } from 'vue';
import { computed, shallowRef } from 'vue';

import Fuse from 'fuse.js';
import { onMessage, sendMessage } from 'webext-bridge/content-script';

import type { RelatedWebsite } from '@/background/rules/BaseRule';

import { createPageContext } from '../createPageContext';

export function useRelatedWebsites(searchStr: Ref<string>) {
    const relatedWebsites = shallowRef<RelatedWebsite[]>([]);

    onMessage('asyncUpdateRelatedWebsites', ({ data }) => {
        relatedWebsites.value = [...relatedWebsites.value, ...data.moreRelatedWebsites];
    });

    (async function () {
        const syncResult = await sendMessage('getRelatedWebsites', {
            context: await createPageContext(),
        });
        relatedWebsites.value = [...relatedWebsites.value, ...syncResult];
    })();

    const filteredWebsites = computed(() => {
        if (searchStr.value.trim() === '') {
            // 当没有搜索条件时，按 level 降序排列
            return [...relatedWebsites.value].sort((a, b) => (b.level || 0) - (a.level || 0));
        }

        // 执行模糊搜索
        const fuseResults = new Fuse(relatedWebsites.value, {
            keys: ['title', 'description'],
        }).search(searchStr.value);

        // 对搜索结果先按相似度排序，相似度相同时按 level 降序排序
        return fuseResults
            .sort((a, b) => {
                // 首先按相似度排序（score 越小表示相似度越高）
                const scoreDiff = (a.score || 0) - (b.score || 0);
                if (scoreDiff !== 0) return scoreDiff;

                // 相似度相同时按 level 降序排序
                return (b.item.level || 0) - (a.item.level || 0);
            })
            .map((item) => item.item);
    });

    return filteredWebsites;
}
