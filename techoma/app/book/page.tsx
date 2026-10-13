import type { Metadata } from "next";
import { Suspense } from "react";
import { BookPageContent } from "@/components/forms/BookPageContent";

export const metadata: Metadata = {
  title: "Book",
  description: "Booking is pending. DJs can apply to play on the Play The TECHOMA page.",
};

export default function BookPage() {
  return (
    <Suspense>
      <BookPageContent />
    </Suspense>
  );
}
