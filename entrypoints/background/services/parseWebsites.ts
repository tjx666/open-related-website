import { onMessage } from 'webext-bridge/background';

export function parseWebsites() {
    onMessage('parseWebsites', async ({ data }) => {
        const { url } = data;

        try {
            // Use fetch to get webpage content
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'text/html',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch website data: ${response.status}`);
            }

            const html = await response.text();

            // Extract title - use simple string operations
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

            // Extract description
            let description = '';
            const metaStart = html.indexOf('name="description"');
            if (metaStart !== -1) {
                const contentStart = html.indexOf('content="', metaStart);
                if (contentStart !== -1) {
                    const contentValueStart = contentStart + 9; // length of 'content="'
                    const contentEnd = html.indexOf('"', contentValueStart);
                    if (contentEnd !== -1) {
                        description = html.slice(contentValueStart, contentEnd).trim();
                    }
                }
            }

            // Extract icon
            let iconUrl = '';
            const faviconStart = html.indexOf('rel="icon"') || html.indexOf('rel="shortcut icon"');
            if (faviconStart !== -1) {
                const hrefStart = html.indexOf('href="', faviconStart);
                if (hrefStart !== -1) {
                    const hrefValueStart = hrefStart + 6; // length of 'href="'
                    const hrefEnd = html.indexOf('"', hrefValueStart);
                    if (hrefEnd !== -1) {
                        const iconPath = html.slice(hrefValueStart, hrefEnd).trim();
                        // Handle relative path
                        iconUrl = new URL(iconPath, url).href;
                    }
                }
            }

            // If no icon found, use default favicon.ico
            if (!iconUrl) {
                iconUrl = new URL('/favicon.ico', url).href;
            }

            return {
                title,
                description,
                iconUrl,
            };
        } catch (error) {
            console.error('Failed to parse website:', error);
            // Return default values
            return {
                title: new URL(url).hostname,
                description: '',
                iconUrl: '',
            };
        }
    });
}
