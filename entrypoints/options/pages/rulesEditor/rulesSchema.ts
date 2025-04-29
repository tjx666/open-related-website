export const rulesSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            language: {
                type: 'string',
                description: '规则语言类型，目前仅支持 json',
                default: 'json',
                enum: ['json'],
            },
            name: {
                type: 'string',
                description: '规则名称，必须唯一，例如: search-engine-redirect',
            },
            description: {
                type: 'string',
                description:
                    '规则简要描述，介绍此规则的用途，例如: Redirect searches from Baidu to other engines',
            },
            isEnabled: {
                type: 'boolean',
                description: '规则是否启用，默认为启用状态',
                default: true,
            },
            matchPageRegexpPatterns: {
                type: 'array',
                description:
                    'URL 匹配正则表达式数组，使用正则表达式匹配页面URL，匹配成功就会推荐下面配置的相关网站',
                items: {
                    type: 'string',
                    description: String.raw`正则表达式，例如: https://www\.baidu\.com/s\?.*wd=([^&]+).*`,
                },
                minItems: 1,
            },
            relatedWebsites: {
                type: 'array',
                description: '相关网站列表，当页面URL匹配到正则表达式时要显示的推荐网站',
                items: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description:
                                '网站标题，在推荐列表中显示的网站标题，例如: Google Search (Same Query)',
                        },
                        description: {
                            type: 'string',
                            description:
                                '网站描述，对网站功能的简短描述，例如: View the same search query on Google',
                        },
                        urlPattern: {
                            type: 'string',
                            description:
                                '带占位符的 URL 模板，例如: https://www.google.com/search?q={urlParam:q}。支持的占位符包括：\n- {urlParam:参数名} - 获取URL中的查询参数\n- {urlPathSegment:索引} - 获取URL path中的片段（按/分割，0为第一个；不带索引则返回完整path）\n- {dom:选择器} - 获取页面DOM元素的内容\n- {repoPath} - 获取当前页面的仓库路径（仅在GitHub/GitLab等平台上可用）',
                        },
                        url: {
                            type: 'string',
                            description:
                                '不带占位符的直接 URL，例如: https://www.google.com/。与 urlPattern 二选一，必须至少填写其中一个',
                        },
                        icon: {
                            type: 'string',
                            description:
                                '网站图标的URL地址，建议使用 16x16 或 32x32 的图标，例如: https://www.google.com/favicon.ico',
                        },
                        openInNewTab: {
                            type: 'boolean',
                            description: '是否在新标签页中打开链接',
                            default: true,
                        },
                        level: {
                            type: 'number',
                            description:
                                '推荐级别，级别越高在推荐列表中排序越靠前（当相似度相同时）',
                            default: 0,
                            minimum: 0,
                        },
                    },
                    required: ['title', 'description'],
                    // 注意：由于 JSON Schema 无法表达 url 或 urlPattern 至少提供一个的逻辑
                    // 我们在保存时添加额外的代码验证，而不是在 schema 中定义
                },
                minItems: 1,
            },
        },
        required: ['language', 'name', 'description', 'matchPageRegexpPatterns', 'relatedWebsites'],
    },
};
