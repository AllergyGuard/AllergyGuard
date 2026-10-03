import { ImageResponse } from "next/og";

/**
 * The app icon, drawn at build time (no image files in the repo). Full-bleed
 * background with the mark inside the central 60%, so it also works as a
 * maskable icon that Android crops to a circle or squircle.
 */
export function appIconResponse(size: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#047857",
          color: "#ffffff",
          fontSize: size * 0.36,
          fontWeight: 700,
          letterSpacing: -size * 0.01,
        }}
      >
        AG
      </div>
    ),
    { width: size, height: size },
  );
}
