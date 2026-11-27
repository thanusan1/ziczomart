export function slugifyCategoryName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMainCategoryHref(cat: {
  name: string;
  slug: string;
}): string {
  const lowerName = cat.name.trim().toLowerCase();
  const lowerSlug = cat.slug.trim().toLowerCase();

  if (lowerName === "electronics" || lowerSlug.startsWith("electronics")) {
    return "/categories/electronics";
  }
  if (
    lowerName === "home & kitchen" ||
    lowerName === "home and kitchen" ||
    lowerSlug.startsWith("home-kitchen") ||
    lowerSlug.startsWith("home-and-kitchen")
  ) {
    return "/categories/home-kitchen";
  }
  return `/categories/${cat.slug}`;
}

export function getSubcategoryHref(
  mainCat: { name: string; slug: string },
  subSlug: string,
): string {
  const base = getMainCategoryHref(mainCat);
  return `${base}/${subSlug}`;
}
