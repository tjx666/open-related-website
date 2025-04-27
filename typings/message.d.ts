import { Command } from '@/constants/commands';
import { PackageJson } from 'type-fest';
import { ProtocolWithReturn } from 'webext-bridge';
import { RuleItem } from '@/entrypoints/background/rules/BaseRule';

declare module 'webext-bridge' {
    export interface RelatedWebsite {
        /**
         * Will be displayed as the title of the recommended item
         */
        title: string;
        /**
         * Will be displayed as the description of the recommended item
         */
        description: string;
        /**
         * Will be displayed as the icon of the recommended item
         */
        icon?: string;
        /**
         * The URL to navigate to (placeholders are not supported)
         */
        url?: string;
        /**
         * The URL pattern to navigate to (placeholders are supported)
         */
        urlPattern?: string;
        /**
         * Whether to open in a new tab
         */
        openInNewTab?: boolean;
    }

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
    }
}
