import { describe, expect, it } from "vitest";
import { cn, discountPercent, formatPrice, truncate } from "./utils";

describe("cn", () => {
  it("merges conditional class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2 py-1", false && "hidden", "px-4")).toBe("py-1 px-4");
  });
});

describe("formatPrice", () => {
  it("formats numbers as Sri Lankan Rupees with two decimals", () => {
    expect(formatPrice(1500)).toBe("Rs. 1,500.00");
    expect(formatPrice(99.5)).toBe("Rs. 99.50");
  });
});

describe("discountPercent", () => {
  it("calculates rounded discount percentage when compareAtPrice is higher", () => {
    expect(discountPercent(750, 1000)).toBe(25);
    expect(discountPercent(333, 1000)).toBe(67);
  });

  it("returns 0 when compareAtPrice is missing or not greater than price", () => {
    expect(discountPercent(500, 0)).toBe(0);
    expect(discountPercent(500, 500)).toBe(0);
    expect(discountPercent(600, 500)).toBe(0);
  });
});

describe("truncate", () => {
  it("returns original text when within maxLength", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("truncates and appends ellipsis when exceeding maxLength", () => {
    expect(truncate("Hello world", 5)).toBe("Hello…");
  });
});
