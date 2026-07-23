import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portail TAD Groupe",
    short_name: "Portail TAD",
    description: "Portail des applications métiers TAD Groupe",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#0b316e",
    lang: "fr",
    icons: [],
  };
}
