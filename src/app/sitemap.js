export default async function sitemap() {
  const baseUrl = 'https://nexaflow.surf';

  // Core static marketing and developer pages
  const routes = [
    '',
    '/about',
    '/contact',
    '/docs',
    '/faq',
    '/blog/web3-payroll-streaming-micro-benefits',
    '/legal/compliance',
    '/legal/privacy',
    '/legal/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/docs') || route.startsWith('/blog') ? 0.9 : 0.7,
  }));

  return routes;
}
