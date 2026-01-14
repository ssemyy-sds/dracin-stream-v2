import type { RequestHandler } from '@sveltejs/kit';


const SECONDARY_BASE = 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api';

export const GET: RequestHandler = async ({ url, params }) => {
    const path = params.path;

    // Build query string, excluding provider
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
        if (key !== 'provider') {
            queryParams.set(key, value);
        }
    });

    // Directly use the secondary base URL
    const targetUrl = `${SECONDARY_BASE}/${path}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    console.log('[API Proxy] path:', path, '| targetUrl:', targetUrl);

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
