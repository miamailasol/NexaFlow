export default async function sitemap() {
  const baseUrl = 'https://nexaflow.surf';

  // Core static marketing and developer pages
  const routes = [
    '',
    '/about',
    '/contact',
    '/docs',
    '/faq',
    '/legal/compliance',
    '/legal/privacy',
    '/legal/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/docs') ? 0.9 : 0.7,
  }));

  return routes;
}
