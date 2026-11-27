"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function EditCategoryForm({ category }: { category: Category }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [sortOrder, setSortOrder] = useState(String(category.sort_order));
  const [isActive, setIsActive] = useState(category.is_active);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(category.image_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select JPG, PNG or WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setImage(file);
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
      let imageUrl = category.image_url;

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

        imageUrl = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadedPath).data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("categories")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          is_active: isActive,
          sort_order: order,
        })
        .eq("id", category.id);

      if (updateError) throw updateError;

      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage.from("product-images").remove([uploadedPath]);
      }

      setError(
        err instanceof Error ? err.message : "Unable to update category.",
      );

      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Category Name *
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-gray-700">
          Category Image
        </label>

        {previewUrl && (
          <div className="relative mb-4 aspect-video max-w-xl overflow-hidden rounded-xl border bg-gray-50">
            <Image
              src={previewUrl}
              alt="Category preview"
              fill
              unoptimized
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 576px"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Choose New Image
          </button>

          {image && (
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setPreviewUrl(category.image_url || "");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600"
            >
              <X size={16} />
              Cancel New Image
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

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
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
        />
      </div>

      <label className="flex items-center gap-3">
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

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
        <button
          type="button"
          onClick={() => router.push("/admin/categories")}
          className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          <Upload size={17} />
          {saving ? "Updating..." : "Update Category"}
        </button>
      </div>
    </form>
  );
}
