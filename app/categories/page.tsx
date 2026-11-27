import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getMainCategoryHref, getSubcategoryHref } from "@/lib/categories/slug";
import type { CategoryRecord } from "@/lib/categories/types";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import TrustStrip from "@/components/ui/trust-strip";
import { ArrowRight, Tag, FolderTree } from "lucide-react";

export const metadata: Metadata = {
  title: "All Categories",
  description:
    "Browse all main product categories and subcategories at ZicZo Mart.",
};

export const instant = false;

export default async function AllCategoriesPage() {
  const supabase = await createClient();

  const [{ data: categoriesRaw, error }, { data: productsRaw }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase.from("products").select("id, category_id").eq("is_active", true),
    ]);

  const allCategories = (categoriesRaw ?? []) as CategoryRecord[];
  const mainCategories = allCategories.filter((c) => !c.parent_id);
  const subcategories = allCategories.filter((c) => Boolean(c.parent_id));

  const productCountByCat = new Map<string, number>();
  for (const p of productsRaw ?? []) {
    if (p.category_id) {
      productCountByCat.set(
        p.category_id,
        (productCountByCat.get(p.category_id) ?? 0) + 1,
      );
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <Breadcrumb items={[{ label: "Categories" }]} />

          <section className="mt-3 rounded-[20px] border border-[#E2E8F0] bg-gradient-to-r from-[#EFF6FF] via-[#E5F0FF] to-[#DBEAFE] px-6 py-8 shadow-sm sm:px-10">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563EB]">
              ZICZO MART DIRECTORY
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl lg:text-4xl">
              Shop by Category
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Explore all {mainCategories.length} main categories and their
              subcategories across ZicZo Mart.
            </p>
          </section>
        </div>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Unable to load categories: {error.message}
            </div>
          ) : mainCategories.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mainCategories.map((main) => {
                const subs = subcategories.filter(
                  (s) => s.parent_id === main.id,
                );
                const mainHref = getMainCategoryHref(main);
                const totalProducts =
                  (productCountByCat.get(main.id) ?? 0) +
                  subs.reduce(
                    (sum, s) => sum + (productCountByCat.get(s.id) ?? 0),
                    0,
                  );

                return (
                  <div
                    key={main.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div>
                      <Link
                        href={mainHref}
                        className="group flex items-center gap-4"
                      >
                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                          {main.image_url ? (
                            <Image
                              src={main.image_url}
                              alt={main.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <Tag size={24} className="text-[#1049C6]/50" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-base font-bold text-[#0F172A] transition group-hover:text-[#1049C6]">
                            {main.name}
                          </h2>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {subs.length} subcategor
                            {subs.length === 1 ? "y" : "ies"} · {totalProducts}{" "}
                            product{totalProducts === 1 ? "" : "s"}
                          </p>
                        </div>
                        <ArrowRight
                          size={16}
                          className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#1049C6]"
                        />
                      </Link>

                      {subs.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3.5">
                          {subs.slice(0, 6).map((sub) => (
                            <Link
                              key={sub.id}
                              href={getSubcategoryHref(main, sub.slug)}
                              className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6]"
                            >
                              {sub.name}
                            </Link>
                          ))}
                          {subs.length > 6 && (
                            <Link
                              href={mainHref}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-[#1049C6] hover:underline"
                            >
                              +{subs.length - 6} more
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <FolderTree className="mx-auto text-slate-300" size={40} />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No categories available
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Categories added in the admin dashboard will appear here.
              </p>
            </div>
          )}
        </section>

        <TrustStrip />
      </main>

      <Footer />
    </>
  );
}
