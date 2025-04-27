import type { RelatedWebsite } from 'webext-bridge';

import type { ResolveContext } from '../createResolveContext';

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
