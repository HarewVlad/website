/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  output: 'standalone',
  distDir: '.next',
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false
    }
    return config
  },
  images: {
    // Using remotePatterns for more flexible and secure domain configuration.
    // This allows specifying patterns for subdomains, paths, and protocols.
    // Always prefer to list specific hostnames or use limited wildcards where possible.
    remotePatterns: [
      // Common Placeholder Services
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '**',
      },
      // Popular Cloud Image / CDN Services
      {
        protocol: 'https',
        hostname: '*.cloudinary.com', // Catches subdomains like res.cloudinary.com, cdn.cloudinary.com
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.imgix.net', // Common for image optimization services
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net', // Amazon CloudFront (common for S3 buckets)
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com', // Direct S3 buckets (less common than CloudFront for public images)
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com', // Region-specific S3 buckets (e.g., s3.us-west-2.amazonaws.com)
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com', // Google Cloud Storage
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'assets.vercel.com', // Vercel's own asset host
        pathname: '**',
      },
      // Stock Photo and Content Platforms
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.ctfassets.net', // Contentful CMS assets
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.sanity.io', // Sanity.io CMS assets
        pathname: '**',
      },
      // Social Media & User Content (often used in examples)
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub user avatars
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com', // Raw images from GitHub repos
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com', // Gravatar avatars
        pathname: '**',
      },
      // E-commerce & Other Common CDNs
      {
        protocol: 'https',
        hostname: '*.shopify.com', // Shopify CDN
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com', // Instagram CDN for images
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.twimg.com', // Twitter (X) images
        pathname: '**',
      },
      // You can add more specific domains if you frequently encounter them
      // from your LLM generations or specific project needs.
    ],
    // The 'domains' array is generally used for simpler, direct hostname matching
    // when 'remotePatterns' is not needed for complex patterns.
    // If you use remotePatterns with '**' for pathname, 'domains' is less critical
    // but can still be used for clarity or specific overrides.
    // For this comprehensive list, 'remotePatterns' is sufficient.
    // domains: [], // Can be empty or removed if remotePatterns covers all needs.
  },
}

export default nextConfig