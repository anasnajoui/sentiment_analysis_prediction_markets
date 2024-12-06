/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'polymarket-upload.s3.us-east-2.amazonaws.com',
          port: '',
          pathname: '/**',
        },
      ],
    },
    experimental: {
      appDir: true
    },
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
  }
  
  module.exports = nextConfig