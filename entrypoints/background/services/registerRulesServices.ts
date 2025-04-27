import type { RuleItem } from 'webext-bridge';
import { onMessage } from 'webext-bridge/background';

import type { BaseRule } from '../rules/BaseRule';
import { rulesManager } from '../RulesManager';

function mapRuleToRuleItem(rule: BaseRule): RuleItem {
    return {
        name: rule.name,
        description: rule.description,
        isBuiltin: true,
        language: rule.language,
    };
}

export async function registerRulesServices() {
    onMessage('getRules', async () => {
        const rules = await rulesManager.getAllRules();
        return rules.map(mapRuleToRuleItem);
    });

    onMessage('addRule', async (e) => {
        const newRule = e.data;
        const rules = await rulesManager.addRule(newRule);
        return rules.map(mapRuleToRuleItem);
    });
}
