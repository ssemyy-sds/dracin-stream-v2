export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { path, provider } = req.query;

    // Reconstruct path from array if needed
    const apiPath = Array.isArray(path) ? path.join('/') : path;

    // Build query string, excluding path and provider
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
        if (key !== 'path' && key !== 'provider') {
            queryParams.set(key, value);
        }
    });

    let targetUrl;

    if (provider === 'secondary') {
        const secondaryBase = 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api';
        // Allow path to be passed directly for the new API
        // apiPath comes from req.query.path
        targetUrl = `${secondaryBase}/${apiPath}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    } else {
        // Primary API uses path-based routing
        // Example: https://api.sansekai.my.id/api/dramabox/trending
        const queryString = queryParams.toString();
        targetUrl = `https://api.sansekai.my.id/api/dramabox/${apiPath}${queryString ? '?' + queryString : ''}`;
    }

    console.log('[API Proxy] provider:', provider, '| path:', apiPath, '| targetUrl:', targetUrl);

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Dracin-Stream/2.0'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}

