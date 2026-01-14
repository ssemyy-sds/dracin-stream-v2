export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { path } = req.query;

    // Reconstruct path from array if needed
    const apiPath = Array.isArray(path) ? path.join('/') : path;

    // Build query string, excluding path
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
        if (key !== 'path' && key !== 'provider') {
            queryParams.set(key, value);
        }
    });

    const secondaryBase = 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api';
    const targetUrl = `${secondaryBase}/${apiPath}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    console.log('[API Proxy] path:', apiPath, '| targetUrl:', targetUrl);

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

