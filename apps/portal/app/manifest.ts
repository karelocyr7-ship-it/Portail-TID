import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portail TID",
    short_name: "Portail TID",
    description: "Portail des applications métiers de TID / TAD Groupe",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8fc",
    theme_color: "#062f70",
    lang: "fr",
    icons: [
      {
        src: "/branding/tid-logo.png",
        sizes: "216x87",
        type: "image/png",
      },
    ],
  };
}
