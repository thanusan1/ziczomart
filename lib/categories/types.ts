export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MainCategorySummary = CategoryRecord & {
  subcategory_count: number;
  active_subcategory_count: number;
  product_count: number;
};

export type SubcategoryWithParent = CategoryRecord & {
  parent_name: string | null;
  parent_slug: string | null;
  parent_is_active: boolean | null;
  product_count: number;
};
