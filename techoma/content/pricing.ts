// Every price, label, and policy line for The TECHOMA lives here.
// Components read from this file and never hardcode a number.

export const pricing = {
  tagline: "Every booking is operated by The TECHOMA crew.",

  // Shown under the packages block and used by the estimate calculator.
  estimateNote: "Estimate only. Final quote confirmed by the crew.",
  customQuoteNote:
    "Mileage and lodging are quoted individually. Lodging applies if the drive is over 3 hrs each way.",

  // Line shown under the booking form.
  bookingFootnote: "Every booking is operated by The TECHOMA crew. A 50% deposit holds your date.",

  packageIncludesHeading: "Every package includes",
  packageIncludes: ["The rig", "An operator", "Setup", "Sound check", "Teardown"],
  packageNote: "On-site time only. Setup and teardown are not counted.",

  packages: [
    { id: "popup", name: "Pop-Up", onSite: "Up to 2 hrs", price: 500 },
    { id: "halfday", name: "Half Day", onSite: "Up to 4 hrs", price: 850 },
    { id: "fullday", name: "Full Day", onSite: "Up to 8 hrs", price: 1400 },
  ],

  overtime: { price: 150, maxHours: 8 },

  // Distance is measured from Salt Lake City.
  travelZones: [
    { id: "local", label: "Local", distance: "0 to 25 mi", price: 0 },
    { id: "regional", label: "Regional", distance: "25 to 60 mi", price: 100 },
    { id: "extended", label: "Extended", distance: "60 to 120 mi", price: 250 },
    {
      id: "longRange",
      label: "Long Range",
      distance: "120+ mi",
      // null = no flat fee; the estimate becomes a custom quote.
      price: null,
      priceText: "$1.25/mi round trip + lodging",
    },
  ],

  offRoad: {
    label: "Off-road access",
    price: 150,
    // {price} is replaced with the formatted off-road fee.
    copy: "If the site needs four-wheel drive, so do we. Off-road access is {price}.",
  },

  // Hourly add-ons take an hours count; flat add-ons are a single toggle.
  addOns: {
    houseDj: { label: "House DJ", price: 100, billing: "hourly" },
    secondOperator: { label: "Second operator", price: 50, billing: "hourly" },
    earlyArrival: {
      label: "Early arrival / extended setup window",
      price: 75,
      billing: "hourly",
    },
    lateNight: { label: "Late night (after midnight)", price: 100, billing: "flat" },
  },

  // Listed on the pricing page as included, never as a paid add-on.
  includedExtras: [{ label: "Shore power hookup" }],

  // Upper limit for any hourly add-on in the calculator and booking form.
  hourlyMaxHours: 12,

  policies: [
    "50% deposit to book. Non-refundable within 14 days of the event.",
    "Client is responsible for permits, landowner permission, and local noise rules.",
    "Weather call is made 24 hours out. Weather cancellations get a reschedule credit instead of a refund.",
    "The crew may end a set early if conditions become unsafe, without refund.",
    "Client is responsible for damage caused by their guests.",
  ],
} as const;
