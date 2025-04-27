import type { Ref } from 'vue';
import { ref, watch } from 'vue';

import type { JsonValue } from 'type-fest';

import { storage } from '#imports';

export function useStorage<V extends JsonValue>(key: string): Ref<V | null>;
export function useStorage<V extends JsonValue>(key: string, defaultValue: V): Ref<V>;
export function useStorage<V extends JsonValue>(key: string, defaultValue?: V) {
    const value = ref(defaultValue === undefined ? null : defaultValue) as Ref<V | null>;

    const syncKey = `local:${key}` as const;
    async function syncStorage() {
        const storageValue = await storage.getItem<V>(syncKey);
        if (storageValue !== null) {
            value.value = storageValue;
        }
    }
    syncStorage();

    watch(value, async () => {
        await storage.setItem(syncKey, value.value);
    });

    return value;
}
