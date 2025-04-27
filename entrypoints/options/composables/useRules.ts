import type { Ref } from 'vue';
import { onMounted, shallowRef, watch } from 'vue';

import type { RuleItem } from 'webext-bridge';
import { sendMessage } from 'webext-bridge/options';

export function useRules(showBuiltin: Ref<boolean>) {
    const rules = shallowRef<RuleItem[]>([]);

    async function updateRules() {
        let allRules = await sendMessage('getRules', {});
        console.log({
            allRules,
            showBuiltin: showBuiltin.value,
        });
        if (showBuiltin.value === false) {
            allRules = allRules.filter((rule) => !rule.isBuiltin);
        }
        rules.value = allRules;
    }

    watch(showBuiltin, () => {
        updateRules();
    });

    // 初始化时加载规则
    onMounted(() => {
        updateRules();
    });

    return rules;
}
