import { storage } from '#imports';

import { rules as builtinRules } from './rules';
import type { BaseRule, JsonRule } from './rules/BaseRule';

class RulesManager {
    getBuiltinRules() {
        return builtinRules;
    }

    async getUserRules() {
        const rules = await storage.getItem<JsonRule[]>('local:rules', {
            fallback: [],
        });
        return rules;
    }

    async getAllRules(): Promise<BaseRule[]> {
        const builtinRules = this.getBuiltinRules();
        const userRules = await this.getUserRules();
        return [...builtinRules, ...userRules];
    }

    async addRule(rule: JsonRule) {
        const userRules = await this.getUserRules();
        userRules.push(rule);
        await storage.setItem('local:rules', userRules);
        return this.getAllRules();
    }
}

const rulesManager = new RulesManager();

export { rulesManager };
