// Every FAQ question and answer. Prices and links are pulled from pricing.ts
// and site.ts so they stay in sync. Answers may link with [label](/path) or
// [label](https://...).

import { pricing } from "./pricing";
import { site } from "./site";

export type FaqItem = { question: string; answer: string };
export type FaqCategory = { id: string; index: string; label: string; items: FaqItem[] };

export const faq: FaqCategory[] = [
  {
    id: "booking",
    index: "001",
    label: "Booking",
    items: [
      {
        question: "What's included in every booking?",
        answer:
          "The rig, an operator, setup, sound check, and teardown. Every booking is run by The TECHOMA crew.",
      },
      {
        question: "Do you travel outside Salt Lake City?",
        answer: `Yes. Travel within 25 miles of Salt Lake City is included. Beyond that, a travel fee applies based on distance. See [pricing](/pricing) for zones.`,
      },
      {
        question: "How does the deposit work?",
        answer:
          "A 50% deposit holds your date. It's non-refundable within 14 days of the event, except for weather cancellations.",
      },
      {
        question: "What happens if the weather turns?",
        answer:
          "We make the call 24 hours out. If weather cancels your event, you can reschedule or get a refund. Travel fees are non-refundable, and for events more than 50 miles out, 10% of the booking total is kept to cover scheduling.",
      },
      {
        question: "Do I need a permit?",
        answer:
          "Permits, landowner permission, and local noise rules are the client's responsibility. We're happy to tell you what we know about a spot, but securing access is on you.",
      },
    ],
  },
  {
    id: "rig",
    index: "002",
    label: "The Rig",
    items: [
      {
        question: "How many people can it cover?",
        answer:
          "The TECHOMA is built for smaller, intimate spaces, not stadiums. Portability is the point. It comfortably covers up to about 150 people.",
      },
      {
        question: "Does it need power?",
        answer: "No. It runs on its own battery, or plugs into shore power if it's available.",
      },
      {
        question: "How much space does it need?",
        answer: "About one parking space, plus room for your crowd.",
      },
      {
        question: "Can it really go off road?",
        answer: "Yes. If a 4x4 vehicle can get there, so can The TECHOMA.",
      },
      {
        question: "Do you have lighting?",
        answer: "Sound only for now. Lighting is coming soon.",
      },
    ],
  },
  {
    id: "music",
    index: "003",
    label: "Music and DJs",
    items: [
      {
        question: "Can I bring my own DJ?",
        answer:
          "Yes. Your DJ will need to bring their own DJ gear, and we'll connect it to the system.",
      },
      {
        question: "How do DJs get to play The TECHOMA?",
        answer:
          "Use the [booking form](/book) and select Guest DJ as the event type.",
      },
      {
        question: "Can I use a microphone?",
        answer: `Yes. A wireless mic is available as a $${pricing.wirelessMic.price} add-on.`,
      },
    ],
  },
  {
    id: "events",
    index: "004",
    label: "Events",
    items: [
      {
        question: "How do I find out about pop-ups?",
        answer: `Locations drop on [Instagram](${site.social.instagram}) first. Follow along so you don't miss one.`,
      },
      {
        question: "Are there curfews, age limits, or alcohol rules?",
        answer: "Those are set by each event's organizer. Check with them before you go.",
      },
    ],
  },
];

/** Strips link markup so answers can be used as plain text, e.g. in JSON-LD. */
export function plainText(answer: string): string {
  return answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
