/** @type {import('next').NextConfig} */

const withLess = require("next-with-less")

const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    OWN_URL: process.env.OWN_URL,
    CORE_SERVICE: process.env.CORE_SERVICE,
  },
}

module.exports = withLess(nextConfig)
