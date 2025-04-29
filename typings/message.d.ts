import { Command } from '@/constants/commands';
import { PackageJson } from 'type-fest';
import { ProtocolWithReturn } from 'webext-bridge';
import { RuleItem, RelatedWebsite } from '@/entrypoints/background/rules/BaseRule';

declare module 'webext-bridge' {
    export interface ProtocolMap {
        triggerCommand: ProtocolWithReturn<{ command: Command }, void>;

        getRelatedWebsites: ProtocolWithReturn<{ context: PageContext }, RelatedWebsite[]>;
        asyncUpdateRelatedWebsites: ProtocolWithReturn<
            { moreRelatedWebsites: RelatedWebsite[] },
            void
        >;

        getRules: ProtocolWithReturn<{}, RuleItem[]>;
        addRule: ProtocolWithReturn<JsonRule, void>;
        deleteRule: ProtocolWithReturn<{ name: string }, void>;
        updateRule: ProtocolWithReturn<JsonRule, void>;
        saveRules: ProtocolWithReturn<{ rules: JsonRule[] }, void>;
    }
}
