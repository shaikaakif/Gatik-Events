import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: getAppUrl(), lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${getAppUrl()}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${getAppUrl()}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];
}
