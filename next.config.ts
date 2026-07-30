import type { NextConfig } from "next";

const adminAppUrl = (process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.ajoflow.com").replace(
  /\/$/,
  "",
);
const marketerAppUrl = (
  process.env.NEXT_PUBLIC_MARKETER_APP_URL || "https://marketer.ajoflow.com"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin-login",
        destination: `${adminAppUrl}/admin-login`,
        permanent: false,
      },
      {
        source: "/admin",
        destination: `${adminAppUrl}/admin`,
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: `${adminAppUrl}/admin/:path*`,
        permanent: false,
      },
      {
        source: "/marketer/apply",
        destination: `${marketerAppUrl}/apply`,
        permanent: false,
      },
      {
        source: "/marketer",
        destination: `${marketerAppUrl}/marketer`,
        permanent: false,
      },
      {
        source: "/marketer/:path*",
        destination: `${marketerAppUrl}/marketer/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
