import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anand Electricals",
    short_name: "Anand Electricals",
    start_url: "/dashboard",
    display: "standalone",
    theme_color: "#2140b8",
    background_color: "#f6f7fa",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
