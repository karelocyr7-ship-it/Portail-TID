import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TAD Groupe – Portail applicatif",
    short_name: "TAD Groupe",
    description: "Portail des applications métiers de TID / TAD Groupe",
    start_url: "/",
    display: "standalone",
    background_color: "#0A2A5C",
    theme_color: "#0A2A5C",
    lang: "fr",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
