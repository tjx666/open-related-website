import { onMessage } from 'webext-bridge/background';

import { rulesManager } from '../RulesManager';

export async function registerRulesServices() {
    onMessage('getRules', async () => {
        return rulesManager.getAllRules();
    });

    onMessage('addRule', async (e) => {
        const newRule = e.data;
        return rulesManager.addRule(newRule);
    });

    onMessage('deleteRule', async (e) => {
        const name = e.data.name;
        return rulesManager.deleteRule(name);
    });

    onMessage('updateRule', async (e) => {
        const rule = e.data;
        return rulesManager.updateRule(rule);
    });

    onMessage('saveRules', async (e) => {
        const newRules = e.data.rules;
        return rulesManager.saveRules(newRules);
    });
}
