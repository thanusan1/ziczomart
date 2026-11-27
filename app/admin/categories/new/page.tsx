"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, X, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCategoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setImage(file);
  }

  function removeImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    const order = Number(sortOrder);

    if (!Number.isInteger(order) || order < 0) {
      setError("Sort order must be a non-negative whole number.");
      return;
    }

    setSaving(true);

    let uploadedPath: string | null = null;

    try {
      let imageUrl: string | null = null;

      const slug =
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        crypto.randomUUID().slice(0, 8);

      if (image) {
        const extension = image.name.split(".").pop()?.toLowerCase();

        if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension)) {
          throw new Error("Invalid image extension.");
        }

        uploadedPath = `categories/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(uploadedPath, image, {
            cacheControl: "3600",
            upsert: false,
            contentType: image.type,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadedPath);

        imageUrl = publicData.publicUrl;
      }

      const { error: insertError } = await supabase.from("categories").insert({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        image_url: imageUrl,
        is_active: isActive,
        sort_order: order,
      });

      if (insertError) throw insertError;

      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage.from("product-images").remove([uploadedPath]);
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the category.",
      );

      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/categories"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-500"
      >
        <ArrowLeft size={16} />
        Back to Categories
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Category</h1>
        <p className="mt-2 text-gray-500">
          Create a category for your ZicZo Mart store.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Category Information
          </h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Category Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this category..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">
            Category Image
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            Optional. JPG, PNG or WebP, maximum 10 MB.
          </p>

          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <Image
                  src={previewUrl}
                  alt="Category image preview"
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-full truncate text-sm font-medium text-gray-700">
                  {image?.name}
                </p>

                <button
                  type="button"
                  onClick={removeImage}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <X size={16} />
                  Remove image
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center transition hover:border-orange-400 hover:bg-orange-50"
            >
              <ImagePlus size={38} className="mb-3 text-gray-400" />

              <span className="font-semibold text-gray-800">
                Choose category image
              </span>

              <span className="mt-2 text-sm text-gray-500">
                Click to browse files
              </span>

              <span className="mt-1 text-xs text-gray-400">
                JPG, PNG or WebP · Maximum 10 MB
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
        </section>

        <div className="border-t border-gray-100" />

        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Display Settings
          </h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Sort Order
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Lower numbers appear first.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 accent-orange-500"
              />

              <span className="text-sm font-semibold text-gray-700">
                Active category
              </span>
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/admin/categories"
            className="rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={17} />
            {saving ? "Saving..." : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
