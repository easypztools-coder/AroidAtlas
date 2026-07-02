import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const genus = searchParams.get("genus");
  const slug = searchParams.get("slug");

  if (!genus || !slug) {
    return NextResponse.json({ error: "Missing 'genus' or 'slug' parameter" }, { status: 400 });
  }

  const filePath = path.join(
    process.cwd(),
    "content",
    "plants",
    genus.toLowerCase(),
    `${slug.toLowerCase()}.json`
  );

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Plant profile not found" }, { status: 404 });
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ ...data, genusSlug: genus.toLowerCase() });
  } catch (err) {
    console.error("Failed to read plant details API:", err);
    return NextResponse.json({ error: "Failed to read plant profile" }, { status: 500 });
  }
}
