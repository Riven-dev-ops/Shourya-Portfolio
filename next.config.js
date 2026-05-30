/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/portfolio',
        destination: '/#portfolio-section',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
      {
        source: '/index.html',
        destination: '/index.html',
      },
      {
        source: '/portfolio-details',
        destination: '/portfolio-details.html',
      },
      {
        source: '/login',
        destination: '/login.html',
      },
      {
        source: '/admin',
        destination: '/admin.html',
      },
    ];
  },
};

export default nextConfig;
