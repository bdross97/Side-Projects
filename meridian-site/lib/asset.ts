// Plain <img>/<video> tags don't get Next's basePath automatically.
// Run every /public path through this so sub-path hosting (GitHub Pages) works.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}
