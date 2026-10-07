import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { pricing } from "@/content/pricing";
import {
  buildEstimate,
  DEFAULT_SELECTION,
  formatUSD,
  selectionFromParams,
  selectionToParams,
  type PackageId,
  type Selection,
  type ZoneId,
} from "./estimate";

const base: Selection = {
  packageId: null,
  overtimeHours: 0,
  zoneId: null,
  offRoad: false,
  djHours: 0,
};

const withPackage = (packageId: PackageId | null): Selection => ({ ...base, packageId, zoneId: "local" });

describe("package prices", () => {
  test("each package alone totals its price", () => {
    assert.equal(buildEstimate(withPackage("popup")).total, 200);
    assert.equal(buildEstimate(withPackage("halfday")).total, 400);
    assert.equal(buildEstimate(withPackage("fullday")).total, 850);
  });

  test("overtime adds $150 per hour", () => {
    const sel = { ...withPackage("halfday"), overtimeHours: 3 };
    assert.equal(buildEstimate(sel).total, 400 + 450);
  });

  test("overtime is clamped to the maximum", () => {
    const sel = { ...withPackage("popup"), overtimeHours: 99 };
    assert.equal(buildEstimate(sel).total, 200 + 8 * 150);
  });
});

describe("travel zones", () => {
  test("local is included", () => {
    assert.equal(buildEstimate(withPackage("popup")).total, 200);
  });

  test("regional and extended add flat fees", () => {
    assert.equal(buildEstimate({ ...withPackage("popup"), zoneId: "regional" }).total, 300);
    assert.equal(buildEstimate({ ...withPackage("popup"), zoneId: "extended" }).total, 450);
  });

  test("long range becomes a custom quote and drops out of the total", () => {
    const estimate = buildEstimate({ ...withPackage("fullday"), zoneId: "longRange" });
    assert.equal(estimate.customQuote, true);
    assert.equal(estimate.total, 850);
  });

  test("off-road access adds $50", () => {
    assert.equal(buildEstimate({ ...withPackage("popup"), offRoad: true }).total, 250);
  });
});

describe("add-ons", () => {
  test("house DJ hours multiply by the hourly rate", () => {
    assert.equal(buildEstimate({ ...withPackage("popup"), djHours: 3 }).total, 200 + 300);
  });

  test("DJ hours are clamped to the maximum", () => {
    assert.equal(
      buildEstimate({ ...withPackage("popup"), djHours: 999 }).total,
      200 + pricing.hourlyMaxHours * pricing.addOns.houseDj.price
    );
  });

  test("combined selection sums every priced line", () => {
    const sel: Selection = {
      packageId: "fullday",
      overtimeHours: 2,
      zoneId: "extended",
      offRoad: true,
      djHours: 4,
    };
    // 850 + 300 + 250 + 50 + 400
    assert.equal(buildEstimate(sel).total, 1850);
  });
});

describe("every combination", () => {
  const packages: PackageId[] = ["popup", "halfday", "fullday"];
  const zones: ZoneId[] = ["local", "regional", "extended", "longRange"];
  const zoneFee: Record<ZoneId, number> = { local: 0, regional: 100, extended: 250, longRange: 0 };
  const packagePrice: Record<PackageId, number> = { popup: 200, halfday: 400, fullday: 850 };

  for (const packageId of packages) {
    for (const zoneId of zones) {
      for (const offRoad of [false, true]) {
        for (const overtimeHours of [0, 1, 8]) {
          for (const djHours of [0, 1, 5, 12]) {
            const sel: Selection = { packageId, overtimeHours, zoneId, offRoad, djHours };
            const label = JSON.stringify(sel);

            test(label, () => {
              const expected =
                packagePrice[packageId] +
                overtimeHours * pricing.overtime.price +
                zoneFee[zoneId] +
                (offRoad ? pricing.offRoad.price : 0) +
                djHours * pricing.addOns.houseDj.price;

              const estimate = buildEstimate(sel);
              assert.equal(estimate.customQuote, zoneId === "longRange");
              assert.equal(estimate.total, expected);
            });
          }
        }
      }
    }
  }
});

describe("incomplete estimates", () => {
  test("missing package or zone is flagged", () => {
    assert.equal(buildEstimate(base).incomplete, true);
    assert.equal(buildEstimate({ ...base, packageId: "popup" }).incomplete, true);
    assert.equal(buildEstimate(withPackage("popup")).incomplete, false);
  });
});

describe("URL params", () => {
  test("round trips a full selection", () => {
    const sel: Selection = {
      packageId: "halfday",
      overtimeHours: 2,
      zoneId: "regional",
      offRoad: true,
      djHours: 3,
    };
    assert.deepEqual(selectionFromParams(selectionToParams(sel)), sel);
  });

  test("default selection round trips", () => {
    assert.deepEqual(selectionFromParams(selectionToParams(DEFAULT_SELECTION)), DEFAULT_SELECTION);
  });

  test("no package param means no preset", () => {
    assert.equal(selectionFromParams(new URLSearchParams("type=Guest%20DJ")), null);
  });

  test("bad values are dropped or clamped", () => {
    const sel = selectionFromParams(new URLSearchParams("pkg=mega&zone=mars&ot=50&dj=-4"));
    assert.ok(sel);
    assert.equal(sel.packageId, null);
    assert.equal(sel.zoneId, null);
    assert.equal(sel.overtimeHours, pricing.overtime.maxHours);
    assert.equal(sel.djHours, 0);
  });
});

describe("formatting", () => {
  test("formats whole dollars with separators", () => {
    assert.equal(formatUSD(850), "$850");
    assert.equal(formatUSD(1850), "$1,850");
  });
});
