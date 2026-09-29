export default async function handler(req: any, res: any) {
  const timestamp = Date.now();
  const googleUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTKiwxfLGGgfjaveTtW0ES34dlbYXUIq7MQSJhzBZ1kJWk9KCiwSvqkwW-riUHCjKFW17Ac3iv2ag8l/pubhtml?_t=${timestamp}`;

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

    const html = await response.text();
    
    // items.push({name: "Outubro", pageUrl: "...", gid: "879729485"...
    const regex = /items\.push\(\{name:\s*"([^"]+)",[^\}]*gid:\s*"([^"]+)"/g;
    const months = [];
    let match;
    const ignoreList = ["Comece aqui", "Categorias", "Metas Financeiras", "Panorama anual", "Investimento"];
    
    while ((match = regex.exec(html)) !== null) {
      const name = match[1];
      const gid = match[2];
      if (!ignoreList.includes(name)) {
        months.push({ name, gid });
      }
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json(months);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
