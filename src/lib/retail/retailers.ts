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
    slug: "soilboy",
    name: "Soilboy",
    url: "https://soilboy.co.uk",
    method: "shopify_json",
  },
  {
    slug: "ginger-greenhouse",
    name: "Ginger Greenhouse",
    url: "https://gingergreenhouse.co.uk",
    method: "woocommerce",
  },
  {
    slug: "root-houseplants",
    name: "Root Houseplants",
    url: "https://www.root-houseplants.co.uk",
    method: "shopify_json",
  },
];
