import { Wordmark } from "@/components/motion/Wordmark";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-neutral-900 px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <span style={{ color: site.truckColor }}>
          <Wordmark size="footer" skipDecode trademark />
        </span>

        <div
          className="flex flex-col gap-2 font-sans text-xs uppercase tracking-[0.3em] sm:flex-row sm:gap-8"
          style={{ color: site.truckColor }}
        >
          <a href={site.social.instagram} className="hover:opacity-70">
            Instagram
          </a>
          <a href={site.social.youtube} className="hover:opacity-70">
            YouTube
          </a>
          <a href={`mailto:${site.social.email}`} className="hover:opacity-70">
            {site.social.email}
          </a>
          <a href="/faq" className="hover:opacity-70">
            FAQ
          </a>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-5xl flex-col gap-2 font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-700">
        <div className="flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} The TECHOMA. All rights reserved.</span>
          <span>STATUS: {site.status}</span>
        </div>
        <span>
          THE TECHOMA<sup className="tm">™</sup> and its logo are trademarks of The TECHOMA.
        </span>
      </div>
    </footer>
  );
}
