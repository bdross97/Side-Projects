import Link from "next/link";
import { Container } from "@/components/Container";
import { site } from "@/content/site";

export default function NotFound() {
  return (
    <Container className="py-24">
      <p>{site.ui.notFound}</p>
      <Link href="/" className="mt-4 inline-block text-sm text-accent hover:underline">
        {site.ui.backHome}
      </Link>
    </Container>
  );
}
