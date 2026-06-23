import { RetailerConfig } from "./adapters/types";

export const approvedRetailers: RetailerConfig[] = [
  {
    slug: "grow-tropicals",
    name: "Grow Tropicals",
    url: "https://growtropicals.com",
    method: "shopify_json",
  },
  {
    slug: "house-of-kojo",
    name: "House of Kojo",
    url: "https://www.houseofkojo.com",
    method: "shopify_json",
  },
  {
    slug: "conservatory-archives",
    name: "Conservatory Archives",
    url: "https://conservatoryarchives.co.uk",
    method: "shopify_json",
  },
  {
    slug: "root-houseplants",
    name: "Root Houseplants",
    url: "https://root-houseplants.com/shop",
    method: "html_selectors",
    config: {
      selectors: {
        container: 'a[href^="/shop/"]',
        title: "h3",
        price: "span",
      },
    },
  },
];
