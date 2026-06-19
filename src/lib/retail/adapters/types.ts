export interface ExtractedProduct {
  retailerSlug: string;
  retailerName: string;
  title: string;
  productUrl: string;
  priceGbp: number;
  originalPriceGbp?: number;
  inStock: boolean;
  variantTitle?: string;
  potSizeCm?: number;
  plantSizeLabel?: string;
  sourceMethod:
    | "jsonld"
    | "shopify_json"
    | "shopify_storefront"
    | "woocommerce"
    | "html_selectors"
    | "manual";
  checkedAt: string;
}

export interface RetailerConfig {
  slug: string;
  name: string;
  url: string;
  method: ExtractedProduct["sourceMethod"];
  config?: {
    // Custom endpoint suffix, e.g. "/collections/all/products.json"
    customPath?: string;
    // For WooCommerce or Shopify public search
    searchPath?: string;
    // HTML scraping CSS selectors
    selectors?: {
      container?: string;
      title?: string;
      price?: string;
      originalPrice?: string;
      link?: string;
      inStock?: string;
    };
  };
}
