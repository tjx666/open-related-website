import type { Ref } from 'vue';
import { computed, shallowRef } from 'vue';

import Fuse from 'fuse.js';
import type { RelatedWebsite } from 'webext-bridge';
import { onMessage, sendMessage } from 'webext-bridge/content-script';

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
        if (searchStr.value.trim() === '') return relatedWebsites.value;

        return new Fuse(relatedWebsites.value, {
            keys: ['name', 'title', 'description'],
        })
            .search(searchStr.value)
            .map((item) => {
                return item.item;
            });
    });
    return filteredWebsites;
}
