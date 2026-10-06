import type { Metadata } from "next";
import { Suspense } from "react";
import { BookPageContent } from "@/components/forms/BookPageContent";

export const metadata: Metadata = {
  title: "Book",
  description: "Book The TECHOMA for your event, or apply to play a guest set.",
};

export default function BookPage() {
  return (
    <Suspense>
      <BookPageContent />
    </Suspense>
  );
}
