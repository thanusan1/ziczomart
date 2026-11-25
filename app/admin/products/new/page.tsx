"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Create and clean up image preview URLs.
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));

    setImagePreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  // Load active categories from Supabase.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadingCategories(true);
      setCategoryError("");

      const { data, error } = await supabase
        .from("categories")
        .select("id, name, is_active, sort_order")
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Category loading error:", error);

        setCategoryError(`Unable to load categories: ${error.message}`);
        setCategories([]);
      } else {
        const activeCategories = (data ?? []).filter(
          (category) => category.is_active === true,
        );

        setCategories(activeCategories);

        if (activeCategories.length === 0) {
          setCategoryError(
            "No active categories were returned. Check that Electronics is active in Supabase.",
          );
        }
      }

      setLoadingCategories(false);
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle product image selection.
  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length + images.length > 5) {
      setError("You can upload a maximum of 5 images.");
      event.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, PNG and WebP images are allowed.");
        event.target.value = "";
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} exceeds the 10 MB file limit.`);
        event.target.value = "";
        return;
      }
    }

    setError("");
    setImages((previous) => [...previous, ...selectedFiles]);

    event.target.value = "";
  }

  // Remove selected product image.
  function removeImage(index: number) {
    setImages((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  // Create product.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericPrice = Number(price);
    const numericComparePrice = compareAtPrice ? Number(compareAtPrice) : null;
    const numericStock = Number(stock);

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Enter a valid product price.");
      return;
    }

    if (
      numericComparePrice !== null &&
      (!Number.isFinite(numericComparePrice) ||
        numericComparePrice <= numericPrice)
    ) {
      setError("Compare-at price must be greater than the selling price.");
      return;
    }

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      setError("Stock must be a whole number of zero or more.");
      return;
    }

    if (
      categoryId &&
      !categories.some((category) => category.id === categoryId)
    ) {
      setError("Please select a valid active category.");
      return;
    }

    setSaving(true);

    let productId: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      const slugBase = name
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const slug = `${slugBase || "product"}-${crypto
        .randomUUID()
        .slice(0, 8)}`;

      // Create product record.
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          slug,
          category_id: categoryId || null,
          sku: sku.trim() || null,
          description: description.trim() || null,
          price: numericPrice,
          compare_at_price: numericComparePrice,
          stock_quantity: numericStock,
          is_active: isActive,
          is_featured: isFeatured,
        })
        .select("id")
        .single();

      if (productError || !product) {
        throw new Error(productError?.message || "Unable to create product.");
      }

      productId = product.id;

      // Upload product images.
      const imageRecords: {
        product_id: string;
        storage_path: string;
        alt_text: string;
        sort_order: number;
      }[] = [];

      for (let index = 0; index < images.length; index++) {
        const file = images[index];
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension)) {
          throw new Error(`Invalid image extension: ${file.name}`);
        }

        const storagePath = `${product.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        uploadedPaths.push(storagePath);

        imageRecords.push({
          product_id: product.id,
          storage_path: storagePath,
          alt_text: name.trim(),
          sort_order: index,
        });
      }

      // Save image records.
      if (imageRecords.length > 0) {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert(imageRecords);

        if (imageError) {
          throw new Error(
            `Product images could not be saved: ${imageError.message}`,
          );
        }
      }

      setSuccess("Product created successfully!");

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      // Clean up uploaded files if creation fails.
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from("product-images")
          .remove(uploadedPaths);

        if (cleanupError) {
          console.error("Image cleanup failed:", cleanupError);
        }
      }

      // Clean up product record.
      if (productId) {
        const { error: deleteError } = await supabase
          .from("products")
          .delete()
          .eq("id", productId);

        if (deleteError) {
          console.error("Product cleanup failed:", deleteError);
        }
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500"
      >
        <ArrowLeft size={17} />
        Back to Products
      </Link>

      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
          Store Management
        </p>

        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
          Add New Product
        </h1>

        <p className="mt-2 text-gray-500">
          Add a product to your ZicZo Mart store.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {/* Basic Information */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>

          <div className="mt-5 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Product Name *
              </label>

              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Category
              </label>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-orange-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "Select a category"}
                </option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {categoryError && (
                <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                  {categoryError}
                </div>
              )}

              {!loadingCategories && categories.length > 0 && (
                <p className="mt-2 text-xs text-green-600">
                  {categories.length} active categor
                  {categories.length === 1 ? "y" : "ies"} loaded.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                SKU
              </label>

              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Example: ZM-001"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description
              </label>

              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product..."
                className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Pricing and Inventory */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">
            Pricing & Inventory
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Selling Price (LKR) *
              </label>

              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500.00"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Compare-at Price (LKR)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="3000.00"
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
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Product Images */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">Product Images</h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload up to 5 JPG, PNG or WebP images. Maximum 10 MB per image.
          </p>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 transition hover:border-orange-400 hover:bg-orange-50">
            <ImagePlus size={35} className="text-orange-500" />

            <span className="mt-3 font-semibold text-gray-700">
              Choose product images
            </span>

            <span className="mt-1 text-xs text-gray-400">JPG, PNG or WebP</span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              disabled={images.length >= 5}
              className="hidden"
            />
          </label>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <div className="flex h-40 items-center justify-center bg-gray-50">
                    {imagePreviews[index] && (
                      <img
                        src={imagePreviews[index]}
                        alt={file.name}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-700">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-gray-100" />

        {/* Product Settings */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">Product Settings</h2>

          <div className="mt-5 space-y-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />

              <span className="text-sm font-medium text-gray-700">
                Active — make this product available in the store
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
                Featured — mark this product as featured
              </span>
            </label>
          </div>
        </section>

        {/* Error and Success Messages */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-6">
          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || loadingCategories}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 size={17} className="animate-spin" />}

            {saving ? "Saving Product..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
