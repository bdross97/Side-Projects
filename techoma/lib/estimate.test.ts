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
  hours: { houseDj: 0, secondOperator: 0, earlyArrival: 0 },
  lateNight: false,
};

const withPackage = (packageId: PackageId | null): Selection => ({ ...base, packageId, zoneId: "local" });

describe("package prices", () => {
  test("each package alone totals its price", () => {
    assert.equal(buildEstimate(withPackage("popup")).total, 500);
    assert.equal(buildEstimate(withPackage("halfday")).total, 850);
    assert.equal(buildEstimate(withPackage("fullday")).total, 1400);
  });

  test("overtime adds $150 per hour", () => {
    const sel = { ...withPackage("halfday"), overtimeHours: 3 };
    assert.equal(buildEstimate(sel).total, 850 + 450);
  });

  test("overtime is clamped to the maximum", () => {
    const sel = { ...withPackage("popup"), overtimeHours: 99 };
    assert.equal(buildEstimate(sel).total, 500 + 8 * 150);
  });
});

describe("travel zones", () => {
  test("local is included", () => {
    assert.equal(buildEstimate(withPackage("popup")).total, 500);
  });

  test("regional and extended add flat fees", () => {
    assert.equal(buildEstimate({ ...withPackage("popup"), zoneId: "regional" }).total, 600);
    assert.equal(buildEstimate({ ...withPackage("popup"), zoneId: "extended" }).total, 750);
  });

  test("long range becomes a custom quote and drops out of the total", () => {
    const estimate = buildEstimate({ ...withPackage("fullday"), zoneId: "longRange" });
    assert.equal(estimate.customQuote, true);
    assert.equal(estimate.total, 1400);
  });

  test("off-road access adds $150", () => {
    assert.equal(buildEstimate({ ...withPackage("popup"), offRoad: true }).total, 650);
  });
});

describe("add-ons", () => {
  test("hourly add-ons multiply by hours", () => {
    const sel = {
      ...withPackage("popup"),
      hours: { houseDj: 2, secondOperator: 3, earlyArrival: 1 },
    };
    // 500 + 2*100 + 3*50 + 1*75
    assert.equal(buildEstimate(sel).total, 500 + 200 + 150 + 75);
  });

  test("late night is a flat $100", () => {
    assert.equal(buildEstimate({ ...withPackage("popup"), lateNight: true }).total, 600);
  });

  test("combined selection sums every line", () => {
    const sel: Selection = {
      packageId: "fullday",
      overtimeHours: 2,
      zoneId: "extended",
      offRoad: true,
      hours: { houseDj: 4, secondOperator: 0, earlyArrival: 0 },
      lateNight: true,
    };
    // 1400 + 300 + 250 + 150 + 400 + 100
    assert.equal(buildEstimate(sel).total, 2600);
  });
});

describe("every combination", () => {
  const packages: PackageId[] = ["popup", "halfday", "fullday"];
  const zones: ZoneId[] = ["local", "regional", "extended", "longRange"];
  const zoneFee: Record<ZoneId, number> = { local: 0, regional: 100, extended: 250, longRange: 0 };
  const packagePrice: Record<PackageId, number> = { popup: 500, halfday: 850, fullday: 1400 };

  for (const packageId of packages) {
    for (const zoneId of zones) {
      for (const offRoad of [false, true]) {
        for (const overtimeHours of [0, 1, 8]) {
          for (const dj of [0, 1, 5]) {
            for (const operator of [0, 2]) {
              for (const early of [0, 3]) {
                for (const lateNight of [false, true]) {
                  const sel: Selection = {
                    packageId,
                    overtimeHours,
                    zoneId,
                    offRoad,
                    hours: { houseDj: dj, secondOperator: operator, earlyArrival: early },
                    lateNight,
                  };
                  const label = JSON.stringify(sel);

                  test(label, () => {
                    const expected =
                      packagePrice[packageId] +
                      overtimeHours * pricing.overtime.price +
                      zoneFee[zoneId] +
                      (offRoad ? pricing.offRoad.price : 0) +
                      dj * pricing.addOns.houseDj.price +
                      operator * pricing.addOns.secondOperator.price +
                      early * pricing.addOns.earlyArrival.price +
                      (lateNight ? pricing.addOns.lateNight.price : 0);

                    const estimate = buildEstimate(sel);
                    assert.equal(estimate.customQuote, zoneId === "longRange");
                    assert.equal(estimate.total, expected);
                  });
                }
              }
            }
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
      hours: { houseDj: 3, secondOperator: 1, earlyArrival: 2 },
      lateNight: true,
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
    const sel = selectionFromParams(
      new URLSearchParams("pkg=mega&zone=mars&ot=50&dj=-4&early=abc")
    );
    assert.ok(sel);
    assert.equal(sel.packageId, null);
    assert.equal(sel.zoneId, null);
    assert.equal(sel.overtimeHours, pricing.overtime.maxHours);
    assert.equal(sel.hours.houseDj, 0);
    assert.equal(sel.hours.earlyArrival, 0);
  });
});

describe("formatting", () => {
  test("formats whole dollars with separators", () => {
    assert.equal(formatUSD(1400), "$1,400");
    assert.equal(formatUSD(500), "$500");
  });
});
