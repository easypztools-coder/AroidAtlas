This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Botanical Plate Import Pipeline

To add new botanical plates to the site:
1. Place raw image files in the `Finished Plates/` folder (typically named `ChatGPT Image ...`).
2. Run the renaming CLI tool:
   ```bash
   npx tsx scripts/rename-plates.ts
   ```
   This will identify (using Gemini Vision or the hardcoded mappings) and rename the files **in place** within `Finished Plates/` to their correct botanical names (e.g. `Philodendron melanochrysum 'Variegata'.png`).
3. Run the plant page generator:
   ```bash
   npx tsx scripts/generate-plant-pages.ts
   ```
   This will analyze the renamed plates, generate their structured JSON profiles under `content/plants/<genus>/`, and **copy** (not move or delete) the images over.

> [!IMPORTANT]
> **Do NOT delete** the images from the `Finished Plates/` directory during or after importing. This folder serves as a permanent repository to keep track of all botanical plates.

