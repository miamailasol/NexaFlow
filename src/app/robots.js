export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/',       // Disallow private dashboard workspace
          '/api/',       // Disallow API route handlers
          '/_next/',     // Disallow Next.js build assets
          '/static/',    // Disallow raw static files
        ],
      },
    ],
    sitemap: 'https://nexaflow.surf/sitemap.xml',
  };
}
