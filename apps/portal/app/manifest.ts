import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portail TAD Groupe",
    short_name: "Portail TAD",
    description: "Portail des applications métiers TAD Groupe",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8fc",
    theme_color: "#062f70",
    lang: "fr",
    icons: [
      {
        src: "/branding/tad-logo.png",
        sizes: "1080x545",
        type: "image/png",
      },
    ],
  };
}
