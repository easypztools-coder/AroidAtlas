import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Aroid Atlas — Rare Tropical Plant Encyclopedia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0F0C",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            lineHeight: 1.05,
            marginBottom: 20,
          }}
        >
          Aroid Atlas
        </div>
        <div
          style={{
            width: 64,
            height: 2,
            background: "rgba(195,217,161,0.3)",
            marginBottom: 20,
          }}
        />
        <div
          style={{
            fontSize: 26,
            color: "#C3D9A1",
            textAlign: "center",
            fontWeight: 400,
            maxWidth: 680,
            lineHeight: 1.4,
          }}
        >
          The Visual Encyclopedia of Rare Tropical Plants
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
