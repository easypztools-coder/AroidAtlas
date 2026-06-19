import { ExtractedProduct, RetailerConfig } from "./adapters/types";
import { shopifyJsonAdapter } from "./adapters/shopifyJsonAdapter";
import { shopifyStorefrontAdapter } from "./adapters/shopifyStorefrontAdapter";
import { woocommerceAdapter } from "./adapters/woocommerceAdapter";
import { jsonLdAdapter } from "./adapters/jsonLdAdapter";
import { htmlAdapter } from "./adapters/htmlAdapter";

export async function runRetailerAdapter(
  retailer: RetailerConfig
): Promise<ExtractedProduct[]> {
  const { method } = retailer;
  switch (method) {
    case "shopify_json":
      return shopifyJsonAdapter(retailer);
    case "shopify_storefront":
      return shopifyStorefrontAdapter(retailer);
    case "woocommerce":
      return woocommerceAdapter(retailer);
    case "jsonld":
      return jsonLdAdapter(retailer);
    case "html_selectors":
      return htmlAdapter(retailer);
    case "manual":
      // Manual updates do not run automatically via cron
      return [];
    default:
      throw new Error(`Unsupported extraction method: ${method}`);
  }
}
