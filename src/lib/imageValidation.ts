/**
 * Validates that a product's image URLs contain the product's name slug.
 * Logs warnings in development for mismatched or missing images.
 */
export const validateProductImage = (
  productName: string,
  imageUrl: string
): boolean => {
  if (!imageUrl || imageUrl.trim() === "") {
    console.warn(`[Image Validation] Missing image URL for product: "${productName}"`);
    return false;
  }

  const nameSlug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const urlLower = imageUrl.toLowerCase();
  const matches = urlLower.includes(nameSlug);

  if (!matches) {
    console.warn(
      `[Image Validation] Mismatch for "${productName}": URL "${imageUrl}" does not contain expected slug "${nameSlug}"`
    );
  }

  return matches;
};

export const validateProductImages = (
  productName: string,
  images: string[]
): { valid: string[]; flagged: string[] } => {
  const valid: string[] = [];
  const flagged: string[] = [];

  if (!images || images.length === 0) {
    console.warn(`[Image Validation] No images array for product: "${productName}"`);
    return { valid, flagged };
  }

  images.forEach((url) => {
    if (validateProductImage(productName, url)) {
      valid.push(url);
    } else {
      flagged.push(url);
    }
  });

  return { valid, flagged };
};

/** Fallback placeholder when image is missing or fails to load */
export const PLACEHOLDER_IMAGE = "/placeholder.svg";
