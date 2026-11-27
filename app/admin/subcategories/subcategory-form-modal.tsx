"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { slugifyCategoryName } from "@/lib/categories/slug";
import type {
  CategoryRecord,
  SubcategoryWithParent,
} from "@/lib/categories/types";
import {
  createSubcategoryAction,
  updateSubcategoryAction,
} from "../categories/actions";
import { ImagePlus, Loader2, X } from "lucide-react";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  mainCategories: CategoryRecord[];
  editingSubcategory: SubcategoryWithParent | null;
  defaultParentId?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export default function SubcategoryFormModal({
  open,
  mode,
  mainCategories,
  editingSubcategory,
  defaultParentId = "",
  onClose,
  onSuccess,
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parentId, setParentId] = useState(
    mode === "edit" && editingSubcategory
      ? (editingSubcategory.parent_id ?? "")
      : defaultParentId || "",
  );
  const [name, setName] = useState(
    mode === "edit" && editingSubcategory ? editingSubcategory.name : "",
  );
  const [slug, setSlug] = useState(
    mode === "edit" && editingSubcategory ? editingSubcategory.slug : "",
  );
  const [slugTouched, setSlugTouched] = useState(
    mode === "edit" && Boolean(editingSubcategory),
  );
  const [description, setDescription] = useState(
    mode === "edit" && editingSubcategory
      ? (editingSubcategory.description ?? "")
      : "",
  );
  const [sortOrder, setSortOrder] = useState(
    mode === "edit" && editingSubcategory
      ? String(editingSubcategory.sort_order ?? 0)
      : "0",
  );
  const [isActive, setIsActive] = useState(
    mode === "edit" && editingSubcategory
      ? Boolean(editingSubcategory.is_active)
      : true,
  );

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    mode === "edit" && editingSubcategory
      ? (editingSubcategory.image_url ?? null)
      : null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState("");
  const previewUrl = objectUrl || existingImageUrl || "";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  if (!open) return null;

  const selectableMainCategories = mainCategories.filter(
    (c) => c.is_active || c.id === parentId,
  );

  function handleNameChange(val: string) {
    setName(val);
    if (!slugTouched) {
      setSlug(slugifyCategoryName(val));
    }
  }

  function handleSlugChange(val: string) {
    setSlugTouched(true);
    setSlug(slugifyCategoryName(val));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10 MB.");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setObjectUrl(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    setExistingImageUrl(null);
    setObjectUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setError("");

    if (!parentId) {
      setError("Please select a Main Category.");
      return;
    }
    if (!name.trim()) {
      setError("Subcategory name is required.");
      return;
    }
    const finalSlug = slugifyCategoryName(slug || name);
    if (!finalSlug) {
      setError("Please enter a valid URL slug.");
      return;
    }
    const parsedOrder = Number(sortOrder);
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      setError("Display order must be a non-negative whole number.");
      return;
    }

    setSaving(true);
    let uploadedPath: string | null = null;

    try {
      let imageUrl = existingImageUrl;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase();
        if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
          throw new Error("Invalid image file extension.");
        }

        uploadedPath = `categories/subcategories/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(uploadedPath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) throw new Error(uploadError.message);

        imageUrl = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadedPath).data.publicUrl;
      }

      const result =
        mode === "create"
          ? await createSubcategoryAction({
              parentId,
              name: name.trim(),
              slug: finalSlug,
              description: description.trim() || null,
              imageUrl,
              sortOrder: parsedOrder,
              isActive,
            })
          : await updateSubcategoryAction({
              id: editingSubcategory!.id,
              parentId,
              name: name.trim(),
              slug: finalSlug,
              description: description.trim() || null,
              imageUrl,
              sortOrder: parsedOrder,
              isActive,
            });

      if (!result.ok) {
        if (uploadedPath) {
          await supabase.storage.from("product-images").remove([uploadedPath]);
        }
        setError(result.error);
        setSaving(false);
        return;
      }

      onSuccess(
        result.message ||
          (mode === "create"
            ? "Subcategory created successfully."
            : "Subcategory updated successfully."),
      );
      onClose();
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage.from("product-images").remove([uploadedPath]);
      }
      setError(
        err instanceof Error ? err.message : "Failed to save subcategory.",
      );
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Add Subcategory" : "Edit Subcategory"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === "create" ? "Add Subcategory" : "Edit Subcategory"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "create"
                ? "Create a new subcategory under any main category."
                : "Update subcategory details and parent assignment."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Main Category */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Main Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1049C6] focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select a Main Category...</option>
              {selectableMainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                  {!cat.is_active ? " (Inactive)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Name & Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Subcategory Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Smartphones"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1049C6] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="smartphones"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm text-slate-800 outline-none focus:border-[#1049C6] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Subcategory Image{" "}
              <span className="text-xs font-normal text-slate-400">
                (Optional · JPG, PNG, WebP · Max 10 MB)
              </span>
            </label>

            {previewUrl ? (
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <Image
                    src={previewUrl}
                    alt="Subcategory preview"
                    fill
                    unoptimized
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">
                    {imageFile ? imageFile.name : "Current image"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm font-medium text-slate-600 transition hover:border-[#1049C6] hover:bg-blue-50/40 hover:text-[#1049C6]"
              >
                <ImagePlus size={20} />
                Click to upload subcategory image
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description{" "}
              <span className="text-xs font-normal text-slate-400">
                (Optional)
              </span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for this subcategory..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1049C6] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Display Order & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1049C6]"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 w-full">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-[#1049C6]"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Active Subcategory
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1049C6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3BA8] disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving
                ? "Saving..."
                : mode === "create"
                  ? "Create Subcategory"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
