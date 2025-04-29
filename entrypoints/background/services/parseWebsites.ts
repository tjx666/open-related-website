import { onMessage } from 'webext-bridge/background';

export function parseWebsites() {
    onMessage('parseWebsites', async ({ data }) => {
        const { url } = data;

        try {
            // 使用 fetch 获取网页内容
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'text/html',
                },
            });

            if (!response.ok) {
                throw new Error(`获取网站数据失败: ${response.status}`);
            }

            const html = await response.text();

            // 提取标题 - 使用简单的字符串操作
            let title = new URL(url).hostname;
            const titleStart = html.indexOf('<title');
            if (titleStart !== -1) {
                const titleTagEnd = html.indexOf('>', titleStart);
                if (titleTagEnd !== -1) {
                    const titleEnd = html.indexOf('</title>', titleTagEnd);
                    if (titleEnd !== -1) {
                        title = html.slice(titleTagEnd + 1, titleEnd).trim();
                    }
                }
            }

            // 提取描述
            let description = '';
            const metaStart = html.indexOf('name="description"');
            if (metaStart !== -1) {
                const contentStart = html.indexOf('content="', metaStart);
                if (contentStart !== -1) {
                    const contentValueStart = contentStart + 9; // 'content="' 的长度
                    const contentEnd = html.indexOf('"', contentValueStart);
                    if (contentEnd !== -1) {
                        description = html.slice(contentValueStart, contentEnd).trim();
                    }
                }
            }

            // 提取图标
            let iconUrl = '';
            const faviconStart = html.indexOf('rel="icon"') || html.indexOf('rel="shortcut icon"');
            if (faviconStart !== -1) {
                const hrefStart = html.indexOf('href="', faviconStart);
                if (hrefStart !== -1) {
                    const hrefValueStart = hrefStart + 6; // 'href="' 的长度
                    const hrefEnd = html.indexOf('"', hrefValueStart);
                    if (hrefEnd !== -1) {
                        const iconPath = html.slice(hrefValueStart, hrefEnd).trim();
                        // 处理相对路径
                        iconUrl = new URL(iconPath, url).href;
                    }
                }
            }

            // 如果没有找到图标，使用默认的 favicon.ico
            if (!iconUrl) {
                iconUrl = new URL('/favicon.ico', url).href;
            }

            return {
                title,
                description,
                iconUrl,
            };
        } catch (error) {
            console.error('解析网站失败:', error);
            // 返回默认值
            return {
                title: new URL(url).hostname,
                description: '',
                iconUrl: '',
            };
        }
    });
}
