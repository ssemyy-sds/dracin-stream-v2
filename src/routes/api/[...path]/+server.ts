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
        // Secondary API uses ?action= query parameter format
        // Example: https://api.gimita.id/api/search/dramabox?action=home&page=1&size=10
        queryParams.set('action', path || '');
        targetUrl = `${API_URLS.secondary}?${queryParams.toString()}`;
    } else {
        // Primary API uses path-based routing
        // Example: https://api.sansekai.my.id/api/dramabox/trending
        const queryString = queryParams.toString();
        targetUrl = `${API_URLS.primary}/${path}${queryString ? '?' + queryString : ''}`;
    }

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
