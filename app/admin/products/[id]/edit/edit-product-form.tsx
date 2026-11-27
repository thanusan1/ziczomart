"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import ProductCategorySelector, {
  type SelectableCategory,
} from "@/components/admin/product-category-selector";
import { validateProductCategorySelection } from "../../actions";

type Product = {
  id: string;
  name: string;
  category_id: string | null;
  sku: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_best_deal?: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
};

type ProductImage = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  url: string;
};

type Props = {
  product: Product;
  initialImages: ProductImage[];
};

export default function EditProductForm({ product, initialImages }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(product.name);
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [sku, setSku] = useState(product.sku ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product.compare_at_price == null ? "" : String(product.compare_at_price),
  );
  const [stock, setStock] = useState(String(product.stock_quantity));

  const [isActive, setIsActive] = useState(product.is_active);
  const [isFeatured, setIsFeatured] = useState(product.is_featured);
  const [isBestDeal, setIsBestDeal] = useState(Boolean(product.is_best_deal));
  const [isBestSeller, setIsBestSeller] = useState(
    Boolean(product.is_best_seller),
  );
  const [isNewArrival, setIsNewArrival] = useState(
    Boolean(product.is_new_arrival),
  );

  const [categories, setCategories] = useState<SelectableCategory[]>([]);
  const [existingImages, setExistingImages] =
    useState<ProductImage[]>(initialImages);

  const [newImages, setNewImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        setError("Unable to load product categories.");
      } else {
        const list = (data ?? []) as SelectableCategory[];
        setCategories(list);

        if (product.category_id) {
          const assigned = list.find((c) => c.id === product.category_id);
          if (assigned) {
            if (assigned.parent_id) {
              setMainCategoryId(assigned.parent_id);
              setSubcategoryId(assigned.id);
            } else {
              setMainCategoryId(assigned.id);
              setSubcategoryId("");
            }
          }
        }
      }

      setLoadingCategories(false);
    }

    loadCategories();
  }, [supabase, product.category_id]);

  useEffect(() => {
    const urls = newImages.map((file) => URL.createObjectURL(file));

    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImages]);

  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);

    if (existingImages.length + newImages.length + selected.length > 5) {
      setError("You can have a maximum of 5 product images.");
      event.target.value = "";
      return;
    }

    const validFiles = selected.filter((file) => {
      const validType = ["image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      );

      if (!validType) {
        setError("Only JPG, PNG and WebP images are allowed.");
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("Each image must be smaller than 10 MB.");
        return false;
      }

      return true;
    });

    setError("");
    setNewImages((current) => [...current, ...validFiles]);

    event.target.value = "";
  }

  function removeNewImage(index: number) {
    setNewImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );
  }

  function removeExistingImage(id: string) {
    setExistingImages((current) => current.filter((image) => image.id !== id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!mainCategoryId) {
      setError("Please select a Main Category.");
      return;
    }

    const parsedPrice = Number(price);
    const parsedCompareAtPrice =
      compareAtPrice.trim() === "" ? null : Number(compareAtPrice);

    const parsedStock = Number(stock);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Enter a valid selling price.");
      return;
    }

    if (
      parsedCompareAtPrice !== null &&
      (!Number.isFinite(parsedCompareAtPrice) || parsedCompareAtPrice < 0)
    ) {
      setError("Enter a valid compare-at price.");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setError("Stock must be a whole number of 0 or more.");
      return;
    }

    setSaving(true);

    const catValidation = await validateProductCategorySelection({
      mainCategoryId,
      subcategoryId,
      allowInactiveId: product.category_id,
    });

    if (!catValidation.ok) {
      setError(catValidation.error);
      setSaving(false);
      return;
    }

    const resolvedCategoryId = catValidation.resolvedCategoryId;

    const uploadedPaths: string[] = [];

    try {
      // Update product information.
      let { error: updateError } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          category_id: resolvedCategoryId,
          sku: sku.trim() || null,
          description: description.trim() || null,
          price: parsedPrice,
          compare_at_price: parsedCompareAtPrice,
          stock_quantity: parsedStock,
          is_active: isActive,
          is_featured: isFeatured,
          is_best_deal: isBestDeal,
          is_best_seller: isBestSeller,
          is_new_arrival: isNewArrival,
        })
        .eq("id", product.id);

      if (
        updateError &&
        (updateError.message.includes("is_best_deal") ||
          updateError.message.includes("is_best_seller") ||
          updateError.message.includes("is_new_arrival"))
      ) {
        const fallback = await supabase
          .from("products")
          .update({
            name: name.trim(),
            category_id: resolvedCategoryId,
            sku: sku.trim() || null,
            description: description.trim() || null,
            price: parsedPrice,
            compare_at_price: parsedCompareAtPrice,
            stock_quantity: parsedStock,
            is_active: isActive,
            is_featured: isFeatured,
          })
          .eq("id", product.id);
        updateError = fallback.error;
      }

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Delete removed image records.
      const removedImages = initialImages.filter(
        (image) => !existingImages.some((current) => current.id === image.id),
      );

      if (removedImages.length > 0) {
        const { error: deleteImagesError } = await supabase
          .from("product_images")
          .delete()
          .in(
            "id",
            removedImages.map((image) => image.id),
          );

        if (deleteImagesError) {
          throw new Error(deleteImagesError.message);
        }

        const paths = removedImages.map((image) => image.storage_path);

        const { error: storageDeleteError } = await supabase.storage
          .from("product-images")
          .remove(paths);

        if (storageDeleteError) {
          console.error("Image cleanup failed:", storageDeleteError.message);
        }
      }

      // Upload additional images.
      const imageRecords = [];

      for (const file of newImages) {
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension)) {
          throw new Error("Invalid image file extension.");
        }

        const path = `${product.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        uploadedPaths.push(path);

        imageRecords.push({
          product_id: product.id,
          storage_path: path,
          alt_text: name.trim(),
          sort_order: existingImages.length + imageRecords.length,
        });
      }

      if (imageRecords.length > 0) {
        const { error: insertImagesError } = await supabase
          .from("product_images")
          .insert(imageRecords);

        if (insertImagesError) {
          throw new Error(insertImagesError.message);
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      // Clean up newly uploaded files if saving fails.
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("product-images").remove(uploadedPaths);
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the product.",
      );

      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <section>
        <h2 className="text-lg font-bold text-gray-900">Product Information</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Product Name *
            </label>

            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div className="md:col-span-2">
            <ProductCategorySelector
              categories={categories}
              loading={loadingCategories}
              mainCategoryId={mainCategoryId}
              subcategoryId={subcategoryId}
              onMainCategoryChange={setMainCategoryId}
              onSubcategoryChange={setSubcategoryId}
              allowInactiveCurrent
              currentCategoryId={product.category_id}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              SKU
            </label>

            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. ZM-ELE-001"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Stock Quantity *
            </label>

            <input
              required
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Description
            </label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* Pricing */}
      <section>
        <h2 className="text-lg font-bold text-gray-900">Pricing</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Selling Price (Rs.) *
            </label>

            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Compare-at Price (Rs.)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* Images */}
      <section>
        <h2 className="text-lg font-bold text-gray-900">Product Images</h2>

        <p className="mt-1 text-sm text-gray-500">
          You can keep existing images, remove them or add new ones. Maximum 5
          images, 10 MB each.
        </p>

        {existingImages.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {existingImages.map((image) => (
              <div
                key={image.id}
                className="relative overflow-hidden rounded-xl border border-gray-200"
              >
                <img
                  src={image.url}
                  alt={image.alt_text || name}
                  className="h-32 w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeExistingImage(image.id)}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X size={15} />
                </button>

                <p className="truncate px-2 py-2 text-xs text-gray-500">
                  Existing image
                </p>
              </div>
            ))}
          </div>
        )}

        {previews.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {previews.map((preview, index) => (
              <div
                key={preview}
                className="relative overflow-hidden rounded-xl border border-orange-200"
              >
                <img
                  src={preview}
                  alt={`New product image ${index + 1}`}
                  className="h-32 w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white hover:bg-red-600"
                  aria-label="Remove new image"
                >
                  <X size={15} />
                </button>

                <p className="truncate px-2 py-2 text-xs text-orange-600">
                  New image
                </p>
              </div>
            ))}
          </div>
        )}

        {existingImages.length + newImages.length < 5 && (
          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-orange-400 hover:bg-orange-50">
            <ImagePlus size={30} className="text-orange-500" />

            <span className="mt-3 font-semibold text-gray-800">
              Add Product Images
            </span>

            <span className="mt-1 text-sm text-gray-500">
              JPG, PNG or WebP — maximum 10 MB each
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageSelection}
              className="hidden"
            />
          </label>
        )}
      </section>

      <div className="border-t border-gray-100" />

      {/* Display Settings */}
      <section>
        <h2 className="text-lg font-bold text-gray-900">Display Settings</h2>

        <div className="mt-5 space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />

            <span className="text-sm font-medium text-gray-700">
              Active — show this product in the store
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />

            <span className="text-sm font-medium text-gray-700">
              Featured — highlight this product in Featured Products
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isBestDeal}
              onChange={(e) => setIsBestDeal(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />

            <span className="text-sm font-medium text-gray-700">
              Best Deal — show this product in Today&apos;s Best Deals
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isNewArrival}
              onChange={(e) => setIsNewArrival(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />

            <span className="text-sm font-medium text-gray-700">
              New Arrival — show this product in New Arrivals
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />

            <span className="text-sm font-medium text-gray-700">
              Best Seller — show this product in Best Sellers
            </span>
          </label>
        </div>
      </section>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving || loadingCategories}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
