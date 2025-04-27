import { Command } from '@/constants/commands';
import { PackageJson } from 'type-fest';
import { ProtocolWithReturn } from 'webext-bridge';

declare module 'webext-bridge' {
    export interface RelatedWebsite {
        name: string;
        title: string;
        description: string;
        icon?: string;
        url: string;
        openInNewTab: boolean;
    }

    export interface RuleItem {
        name: string;
        description: string;
        isBuiltin: boolean;
        language: 'json' | 'javascript';
        details: string;
    }

    export interface ProtocolMap {
        triggerCommand: ProtocolWithReturn<{ command: Command }, void>;

        getRelatedWebsites: ProtocolWithReturn<{ context: PageContext }, RelatedWebsite[]>;
        asyncUpdateRelatedWebsites: ProtocolWithReturn<
            { moreRelatedWebsites: RelatedWebsite[] },
            void
        >;

        getRules: ProtocolWithReturn<{}, RuleItem[]>;
    }
}
