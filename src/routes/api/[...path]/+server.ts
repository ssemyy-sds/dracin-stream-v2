import type { RequestHandler } from '@sveltejs/kit';

const API_URLS = {
    primary: 'https://api.sansekai.my.id/api/dramabox',
    secondary: 'https://api.gimita.id/api/search/dramabox'
};

export const GET: RequestHandler = async ({ url, params }) => {
    const path = params.path;
    const provider = url.searchParams.get('provider') || 'primary';

    // Build query string, excluding provider
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
        if (key !== 'provider') {
            queryParams.set(key, value);
        }
    });

    let targetUrl: string;

    if (provider === 'secondary') {
        const secondaryBase = 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api';
        // Handle specific route mappings if necessary or pass through
        // api-call.md: Home -> /api/home, Search -> /api/search, etc.
        // The internal path comes in as 'home', 'search', etc.

        // Special case handling based on api-call.md instructions
        if (path === 'chapters' || path === 'detail' || path === 'stream') {
            // For these, we expect a bookId. 
            // api-secondary.ts needs to be updated to pass the ID in the path or query 
            // But valid REST design would be /api/chapters/{bookId}
            // For now, let's assume api-secondary.ts will call /api/chapters/123?provider=secondary
            // So if path contains slashes, we just append it.
            targetUrl = `${secondaryBase}/${path}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        } else {
            targetUrl = `${secondaryBase}/${path}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        }
    } else {
        // Primary API uses path-based routing
        // Example: https://api.sansekai.my.id/api/dramabox/trending
        const queryString = queryParams.toString();
        targetUrl = `${API_URLS.primary}/${path}${queryString ? '?' + queryString : ''}`;
    }

    console.log('[API Proxy] provider:', provider, '| path:', path, '| targetUrl:', targetUrl);

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Dracin-Stream/2.0'
            }
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new Response(JSON.stringify({ error: 'Proxy error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
