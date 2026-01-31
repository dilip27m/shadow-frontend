/** @type {import('next').NextConfig} */
const nextConfig = {
    // Production optimizations
    reactStrictMode: true,

    // Compress images
    images: {
        formats: ['image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Disable x-powered-by header
    poweredByHeader: false,
};

export default nextConfig;
