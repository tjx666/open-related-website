import type { RuleItem } from 'webext-bridge';
import { onMessage } from 'webext-bridge/background';

import type { BaseRule } from '../rules/BaseRule';
import { rulesManager } from '../RulesManager';

function mapRuleToRuleItem(rule: BaseRule): RuleItem {
    return {
        name: rule.name,
        description: rule.description,
        isBuiltin: rule.isBuiltin,
        language: rule.language,
        isEnabled: rule.isEnabled,
        lastModifiedTimestamp: rule.lastModifiedTimestamp,
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

    onMessage('deleteRule', async (e) => {
        const name = e.data.name;
        const rules = await rulesManager.deleteRule(name);
        return rules.map(mapRuleToRuleItem);
    });

    onMessage('updateRule', async (e) => {
        const rule = e.data;
        const rules = await rulesManager.updateRule(rule);
        return rules.map(mapRuleToRuleItem);
    });
}
