import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const genus = searchParams.get("genus");
  const slug = searchParams.get("slug");

  if (!genus || !slug) {
    return new NextResponse("Missing genus or slug parameter", { status: 400 });
  }

  const validGenera = ["monstera", "philodendron", "anthurium", "alocasia", "rhaphidophora", "scindapsus"];
  if (!validGenera.includes(genus)) {
    return new NextResponse("Invalid genus", { status: 400 });
  }

  // Try .png first, then .jpg
  const extensions = [".png", ".jpg", ".jpeg"];
  for (const ext of extensions) {
    const imagePath = path.join(
      process.cwd(),
      "content",
      "plants",
      genus,
      `${slug}${ext}`
    );
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const contentType =
        ext === ".png" ? "image/png" : "image/jpeg";
      return new NextResponse(imageBuffer, {
        headers: { "Content-Type": contentType },
      });
    }
  }

  // No image found — return a placeholder SVG
  return new NextResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <rect fill="#1A1F1D" width="400" height="500"/>
      <text fill="#8B9A92" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="250">No image available</text>
    </svg>`,
    {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    }
  );
}