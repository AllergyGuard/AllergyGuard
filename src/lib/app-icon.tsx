import { ImageResponse } from "next/og";

/**
 * The app icon, drawn at build time (no image files in the repo): a white
 * shield with a tick on the brand purple. Full-bleed background with the mark
 * inside the central 60%, so it also works as a maskable icon that Android
 * crops to a circle or squircle.
 */
export function appIconResponse(size: number): ImageResponse {
  const mark = Math.round(size * 0.5);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6d3fe0",
        }}
      >
        <svg width={mark} height={mark} viewBox="0 0 24 24">
          <path d="M12 2.5 4.5 5.3v6.1c0 4.7 3.2 8.7 7.5 10.1 4.3-1.4 7.5-5.4 7.5-10.1V5.3L12 2.5Z" fill="#ffffff" />
          <path
            d="m8.6 12.2 2.4 2.4 4.6-4.8"
            fill="none"
            stroke="#6d3fe0"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
