import type { Metadata } from "next";
import { Suspense } from "react";
import { BookPageContent } from "@/components/forms/BookPageContent";

export const metadata: Metadata = {
  title: "Book",
  description: "Booking is pending. Apply to play a guest set with The TECHOMA.",
};

export default function BookPage() {
  return (
    <Suspense>
      <BookPageContent />
    </Suspense>
  );
}
