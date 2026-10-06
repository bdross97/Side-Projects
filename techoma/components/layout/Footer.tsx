import { Wordmark } from "@/components/motion/Wordmark";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-neutral-900 px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <span style={{ color: site.truckColor }}>
          <Wordmark size="footer" skipDecode />
        </span>

        <div
          className="flex flex-col gap-2 font-sans text-xs uppercase tracking-[0.3em] sm:flex-row sm:gap-8"
          style={{ color: site.truckColor }}
        >
          <a href={site.social.instagram} className="hover:opacity-70">
            Instagram
          </a>
          <a href={`mailto:${site.social.email}`} className="hover:opacity-70">
            {site.social.email}
          </a>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-5xl items-center justify-between font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-700">
        <span>&copy; {new Date().getFullYear()} The TECHOMA</span>
        <span>STATUS: {site.status}</span>
      </div>
    </footer>
  );
}
