import { json } from "@remix-run/node";
import { findBestProductMatches } from "../utils/productMatcher";
import { getShopifyProducts } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shade = url.searchParams.get("shade");
  if (!shade) return json({ error: "No shade provided" }, { status: 400 });

  // Fetch products from Shopify
  const products = await getShopifyProducts();
  // Find best matches
  const matches = findBestProductMatches(products, shade).slice(0, 5);
  // Add checkoutUrl to each product (Shopify Storefront checkout link)
  matches.forEach(match => {
    match.product.checkoutUrl = `/cart/${match.product.id}:1`;
  });
  return json({ matches });
};
