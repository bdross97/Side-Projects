import Link from "next/link";
import { Container } from "./Container";
import { DesktopNav, MobileNav } from "./Nav";
import { Wordmark } from "./Wordmark";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/40 bg-white/45 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="w-28 sm:w-32">
          <Wordmark tone="dark" />
        </Link>
        <DesktopNav />
        <MobileNav />
      </Container>
    </header>
  );
}
