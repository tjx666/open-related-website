export const rulesSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            language: {
                type: 'string',
                description: 'Rule language type, currently only supports json',
                default: 'json',
                enum: ['json'],
            },
            name: {
                type: 'string',
                description: 'Rule name, must be unique, e.g.: search-engine-redirect',
            },
            description: {
                type: 'string',
                description:
                    'Brief description of the rule, explaining its purpose, e.g.: Redirect searches from Baidu to other engines',
            },
            isEnabled: {
                type: 'boolean',
                description: 'Whether the rule is enabled, default is enabled',
                default: true,
            },
            matchPageRegexpPatterns: {
                type: 'array',
                description:
                    'URL matching regexp patterns array, using regular expressions to match page URLs, when matched successfully it will recommend the related websites configured below',
                items: {
                    type: 'string',
                    description: String.raw`Regular expression, e.g.: https://www\.baidu\.com/s\?.*wd=([^&]+).*`,
                },
                minItems: 1,
            },
            relatedWebsites: {
                type: 'array',
                description: 'List of related websites to display when the page URL matches the regular expression',
                items: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description:
                                'Website title displayed in the recommendation list, e.g.: Google Search (Same Query)',
                        },
                        description: {
                            type: 'string',
                            description:
                                'Website description, a brief description of website functionality, e.g.: View the same search query on Google',
                        },
                        urlPattern: {
                            type: 'string',
                            description:
                                'URL template with placeholders, e.g.: https://www.google.com/search?q={urlParam:q}. Supported placeholders include:\n- {urlParam:paramName} - Get query parameter from URL\n- {urlPathSegment:index} - Get segment from URL path (split by /, 0 is the first; without index returns the full path)\n- {dom:selector} - Get content from page DOM element\n- {repoPath} - Get repository path of current page (only available on GitHub/GitLab, etc.)',
                        },
                        url: {
                            type: 'string',
                            description:
                                'Direct URL without placeholders, e.g.: https://www.google.com/. Choose either this or urlPattern, at least one must be provided',
                        },
                        icon: {
                            type: 'string',
                            description:
                                'URL address of the website icon, recommended to use 16x16 or 32x32 icons, e.g.: https://www.google.com/favicon.ico',
                        },
                        openInNewTab: {
                            type: 'boolean',
                            description: 'Whether to open the link in a new tab',
                            default: true,
                        },
                        level: {
                            type: 'number',
                            description:
                                'Recommendation level, higher level means higher ranking in the recommendation list (when similarity is the same)',
                            default: 0,
                            minimum: 0,
                        },
                    },
                    required: ['title', 'description'],
                    // Note: Since JSON Schema cannot express the logic that at least one of url or urlPattern must be provided
                    // We add additional code validation when saving, rather than defining it in the schema
                },
                minItems: 1,
            },
        },
        required: ['language', 'name', 'description', 'matchPageRegexpPatterns', 'relatedWebsites'],
    },
};
