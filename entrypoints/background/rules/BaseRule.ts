import type { ResolveContext } from '../createResolveContext';

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

    /**
     * The level of the recommended item
     */
    level?: number;
}

export interface BaseRule {
    language: string;
    name: string;
    description: string;
    isBuiltin: boolean;
    isEnabled: boolean;
    lastModifiedTimestamp: number;
}

export abstract class JsRule implements BaseRule {
    public language = 'javascript';
    abstract name: string;
    abstract description: string;
    abstract matchPageRegexes: RegExp[];
    isBuiltin = true;
    isEnabled = true;
    lastModifiedTimestamp = 1745756185909;
    abstract resolve(context: ResolveContext): Promise<RelatedWebsite[]> | RelatedWebsite[];
}

export interface JsonRule extends BaseRule {
    language: 'json';
    name: string;
    description: string;
    matchPageRegexpPatterns: string[];
    relatedWebsites: RelatedWebsite[];
}

export type RuleItem = JsRule | JsonRule;
