import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tiwizi",
    short_name: "Tiwizi",
    description: "Apprends le kabyle pour de vrai.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a09",
    theme_color: "#0a0a09",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
