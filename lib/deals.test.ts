import { describe, expect, it } from "vitest";
import { computeEffectiveDealStatus } from "./deals";

describe("computeEffectiveDealStatus", () => {
  const startAt = "2026-06-01T00:00:00.000Z";
  const endAt = "2026-06-10T00:00:00.000Z";

  it("preserves draft and paused statuses regardless of dates", () => {
    const midWindow = new Date("2026-06-05T00:00:00.000Z").getTime();

    expect(
      computeEffectiveDealStatus({ status: "draft", start_at: startAt, end_at: endAt }, midWindow),
    ).toBe("draft");

    expect(
      computeEffectiveDealStatus({ status: "paused", start_at: startAt, end_at: endAt }, midWindow),
    ).toBe("paused");
  });

  it("returns scheduled before start_at, active during window, and expired after end_at", () => {
    const before = new Date("2026-05-31T23:59:59.000Z").getTime();
    const during = new Date("2026-06-05T00:00:00.000Z").getTime();
    const after = new Date("2026-06-10T00:00:01.000Z").getTime();

    expect(
      computeEffectiveDealStatus({ status: "active", start_at: startAt, end_at: endAt }, before),
    ).toBe("scheduled");

    expect(
      computeEffectiveDealStatus({ status: "active", start_at: startAt, end_at: endAt }, during),
    ).toBe("active");

    expect(
      computeEffectiveDealStatus({ status: "active", start_at: startAt, end_at: endAt }, after),
    ).toBe("expired");
  });
});
