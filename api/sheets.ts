export default async function handler(req: any, res: any) {
  const { gid } = req.query;
  const targetGid = gid || '879729485';
  const timestamp = Date.now();
  const googleUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTKiwxfLGGgfjaveTtW0ES34dlbYXUIq7MQSJhzBZ1kJWk9KCiwSvqkwW-riUHCjKFW17Ac3iv2ag8l/pub?gid=${targetGid}&single=true&output=csv&_t=${timestamp}`;

  try {
    const response = await fetch(googleUrl, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from Google' });
    }

    const csvText = await response.text();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(csvText);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
