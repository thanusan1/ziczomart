import Link from "next/link";
import AuthNav from "@/components/layout/auth-nav";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Announcement Bar */}
      <div className="bg-black px-4 py-2 text-center text-sm text-white">
        Welcome to ZicZo Mart | Shop smarter, live better.
      </div>

      {/* Navbar */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/" className="transition hover:text-orange-500">
              Home
            </Link>

            <Link href="/products" className="transition hover:text-orange-500">
              Products
            </Link>

            <Link
              href="/categories"
              className="transition hover:text-orange-500"
            >
              Categories
            </Link>

            <Link href="/about" className="transition hover:text-orange-500">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <AuthNav />

            <Link
              href="/cart"
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Cart
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-24 md:grid-cols-2">
          <div>
            <p className="mb-4 font-semibold uppercase tracking-widest text-orange-500">
              Welcome to ZicZo Mart
            </p>

            <h1 className="text-5xl font-extrabold leading-tight md:text-6xl">
              Everything You Need.
              <span className="text-orange-500"> All in One Place.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-gray-500">
              Discover amazing products, enjoy great prices and experience a
              better way to shop online.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-block rounded-lg bg-black px-8 py-4 font-semibold text-white transition hover:bg-orange-500"
            >
              Explore Products →
            </Link>
          </div>

          <div className="flex min-h-80 items-center justify-center rounded-3xl bg-orange-100 p-10">
            <div className="text-center">
              <div className="text-7xl font-black text-orange-500">ZM</div>

              <p className="mt-4 text-2xl font-bold">ZicZo Mart</p>

              <p className="mt-2 text-gray-600">Shop smarter. Live better.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
        {[
          {
            title: "Quality Products",
            description: "Discover carefully selected products.",
          },
          {
            title: "Secure Payments",
            description: "Cash on Delivery and online payment options.",
          },
          {
            title: "Easy Shopping",
            description: "A simple and convenient shopping experience.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-gray-100 p-8 transition hover:border-orange-200 hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">{feature.title}</h2>

            <p className="mt-3 text-gray-500">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="bg-black px-6 py-8 text-center text-sm text-gray-400">
        © 2026 ZicZo Mart. All rights reserved.
      </footer>
    </main>
  );
}
