import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/legal/privacidad", "/legal/terminos", "/legal/cookies"],
      disallow: ["/dashboard/", "/api/", "/login", "/registro"],
    },
    sitemap: "https://nervehealthsystems.com/sitemap.xml",
  };
}
