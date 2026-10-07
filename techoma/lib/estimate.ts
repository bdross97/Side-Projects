import { pricing } from "@/content/pricing";

export type PackageId = (typeof pricing.packages)[number]["id"];
export type ZoneId = (typeof pricing.travelZones)[number]["id"];

export type Selection = {
  packageId: PackageId | null;
  overtimeHours: number;
  zoneId: ZoneId | null;
  offRoad: boolean;
  // Hours for the only remaining paid add-on. 0 = off.
  djHours: number;
};

export type EstimateLine = {
  label: string;
  // null when the line is not priced (included or quoted individually).
  amount: number | null;
  note?: string;
};

export type Estimate = {
  lines: EstimateLine[];
  total: number;
  customQuote: boolean;
  // True when the package or travel zone has not been chosen.
  incomplete: boolean;
};

// Anything with get/has works, including Next's ReadonlyURLSearchParams.
type ParamReader = Pick<URLSearchParams, "get" | "has">;

export function formatUSD(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function toPackageId(value: string): PackageId | null {
  return pricing.packages.find((pkg) => pkg.id === value)?.id ?? null;
}

export function toZoneId(value: string): ZoneId | null {
  return pricing.travelZones.find((zone) => zone.id === value)?.id ?? null;
}

function clampInt(value: string | null | undefined, min: number, max: number): number {
  const n = Math.round(Number(value ?? 0));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function buildEstimate(selection: Selection): Estimate {
  const lines: EstimateLine[] = [];
  let total = 0;
  let customQuote = false;

  const pkg = pricing.packages.find((p) => p.id === selection.packageId);
  if (pkg) lines.push({ label: `${pkg.name} package`, amount: pkg.price });

  const overtimeHours = clampInt(String(selection.overtimeHours), 0, pricing.overtime.maxHours);
  if (overtimeHours > 0) {
    lines.push({
      label: `Overtime · ${overtimeHours} hr`,
      amount: overtimeHours * pricing.overtime.price,
    });
  }

  const zone = pricing.travelZones.find((z) => z.id === selection.zoneId);
  if (zone) {
    const label = `Travel · ${zone.label}`;
    if (zone.price === null) {
      customQuote = true;
      lines.push({ label, amount: null, note: "Quoted individually" });
    } else if (zone.price === 0) {
      lines.push({ label, amount: null, note: "Included" });
    } else {
      lines.push({ label, amount: zone.price });
    }
  }

  if (selection.offRoad) {
    lines.push({ label: pricing.offRoad.label, amount: pricing.offRoad.price });
  }

  const djHours = clampInt(String(selection.djHours), 0, pricing.hourlyMaxHours);
  if (djHours > 0) {
    lines.push({
      label: `${pricing.addOns.houseDj.label} · ${djHours} hr`,
      amount: djHours * pricing.addOns.houseDj.price,
    });
  }

  for (const line of lines) {
    if (line.amount !== null) total += line.amount;
  }

  return {
    lines,
    total,
    customQuote,
    incomplete: selection.packageId === null || selection.zoneId === null,
  };
}

const PARAM_PACKAGE = "pkg";
const PARAM_OVERTIME = "ot";
const PARAM_ZONE = "zone";
const PARAM_OFF_ROAD = "offroad";
const PARAM_DJ_HOURS = "dj";

export function selectionToParams(selection: Selection): URLSearchParams {
  const params = new URLSearchParams();
  if (selection.packageId) params.set(PARAM_PACKAGE, selection.packageId);
  if (selection.overtimeHours > 0) params.set(PARAM_OVERTIME, String(selection.overtimeHours));
  if (selection.zoneId) params.set(PARAM_ZONE, selection.zoneId);
  params.set(PARAM_OFF_ROAD, selection.offRoad ? "1" : "0");
  if (selection.djHours > 0) params.set(PARAM_DJ_HOURS, String(selection.djHours));
  return params;
}

/** Returns null unless the calculator sent a package, so plain /book visits stay blank. */
export function selectionFromParams(params: ParamReader): Selection | null {
  if (!params.has(PARAM_PACKAGE)) return null;

  return {
    packageId: toPackageId(params.get(PARAM_PACKAGE) ?? ""),
    overtimeHours: clampInt(params.get(PARAM_OVERTIME), 0, pricing.overtime.maxHours),
    zoneId: toZoneId(params.get(PARAM_ZONE) ?? ""),
    offRoad: params.get(PARAM_OFF_ROAD) === "1",
    djHours: clampInt(params.get(PARAM_DJ_HOURS), 0, pricing.hourlyMaxHours),
  };
}

export const DEFAULT_SELECTION: Selection = {
  packageId: "halfday",
  overtimeHours: 0,
  zoneId: "local",
  offRoad: false,
  djHours: 0,
};
