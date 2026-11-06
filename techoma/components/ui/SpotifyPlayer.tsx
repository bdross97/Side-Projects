import { MicroLabel } from "@/components/ui/MicroLabel";

/**
 * Spotify's official embed — it ships its own play button and never starts
 * audio on load, so this never fights a visitor's browser autoplay-with-sound
 * block or starts playing before they've asked for it.
 */
export function SpotifyPlayer({ playlistUrl }: { playlistUrl: string }) {
  const playlistId = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
  if (!playlistId) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <MicroLabel className="mb-4 block">On Rotation</MicroLabel>
      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <iframe
          title="The TECHOMA — Spotify playlist"
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          style={{ border: 0 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}
