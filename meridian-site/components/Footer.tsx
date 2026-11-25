import Link from "next/link";
import { site } from "@/content/site";
import { Container } from "./Container";
import { MeridianLine } from "./MeridianLine";
import { SocialLinks } from "./SocialLinks";
import { Wordmark } from "./Wordmark";

export function Footer() {
  return (
    <footer className="mt-24">
      <MeridianLine />
      <Container className="grid gap-8 py-10 sm:grid-cols-[auto_1fr_auto] sm:items-start">
        <Link href="/" className="w-32">
          <Wordmark tone="dark" />
        </Link>
        <nav aria-label="footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm sm:justify-center">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="line-sweep text-ink/80 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <SocialLinks />
      </Container>
      <Container className="pb-8 text-xs text-ink/70">
        © {new Date().getFullYear()} {site.ui.copyright}
      </Container>
    </footer>
  );
}
