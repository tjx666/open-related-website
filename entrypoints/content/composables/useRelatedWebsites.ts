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
            // When there is no search term, sort by level in descending order
            return [...relatedWebsites.value].sort((a, b) => (b.level || 0) - (a.level || 0));
        }

        // Perform fuzzy search
        const fuseResults = new Fuse(relatedWebsites.value, {
            keys: ['title', 'description'],
        }).search(searchStr.value);

        // Sort search results by similarity first, if similarity is the same then by level descending
        return fuseResults
            .sort((a, b) => {
                // First sort by similarity (smaller score means higher similarity)
                const scoreDiff = (a.score || 0) - (b.score || 0);
                if (scoreDiff !== 0) return scoreDiff;

                // If similarity is the same, sort by level descending
                return (b.item.level || 0) - (a.item.level || 0);
            })
            .map((item) => item.item);
    });

    return filteredWebsites;
}
