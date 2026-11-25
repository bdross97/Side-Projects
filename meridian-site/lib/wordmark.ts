// Shared by the hero wordmark (client) and the inline head script in
// app/layout.tsx (server). Lives outside the "use client" module so the
// server gets the real string, not a client reference.
export const WORDMARK_SESSION_KEY = "meridian-wordmark-played";
