import { onMessage, sendMessage } from 'webext-bridge/background';

import type { RelatedWebsite } from '@/background/rules/BaseRule';

import { createResolveContext } from '../createResolveContext';
import { JsRule } from '../rules/BaseRule';
import { rulesManager } from '../RulesManager';

export async function getRelatedWebsites() {
    onMessage('getRelatedWebsites', async ({ data, sender }) => {
        const context = await createResolveContext(data.context);
        const rules = await rulesManager.getAllRules();
        const matchedRules = rules.filter((rule) => {
            if (rule instanceof JsRule) {
                return rule.matchPageRegexes.some((regexp) => regexp.test(context.url));
            } else {
                return rule.matchPageRegexpPatterns.some((pattern) =>
                    new RegExp(pattern).test(context.url),
                );
            }
        });
        const relatedWebsites: RelatedWebsite[] = [];
        const activeTabId = sender.tabId;
        for (const rule of matchedRules) {
            if (rule instanceof JsRule) {
                const promiseOrSites = rule.resolve(context);
                if ('then' in promiseOrSites) {
                    promiseOrSites.then((sites) => {
                        sendMessage(
                            'asyncUpdateRelatedWebsites',
                            {
                                moreRelatedWebsites: sites,
                            },
                            `content-script@${activeTabId}`,
                        );
                    });
                } else {
                    relatedWebsites.push(...promiseOrSites);
                }
            } else {
                relatedWebsites.push(...rule.relatedWebsites);
            }
        }
        return relatedWebsites;
    });
}
