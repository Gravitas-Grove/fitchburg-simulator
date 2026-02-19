import { useEffect, useRef, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

interface StreetViewEmbedProps {
  lat: number;
  lng: number;
}

let googleInited = false;

async function ensureGoogleMaps(): Promise<typeof google.maps> {
  if (googleInited && window.google?.maps) return google.maps;

  const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
  setOptions({ key: API_KEY! });
  await importLibrary('streetView');
  googleInited = true;
  return google.maps;
}

export function StreetViewEmbed({ lat, lng }: StreetViewEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!API_KEY || !containerRef.current) return;

    setError(null);
    setLoaded(false);

    let cancelled = false;

    async function init() {
      try {
        const maps = await ensureGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const sv = new maps.StreetViewService();
        const position = new maps.LatLng(lat, lng);

        sv.getPanorama(
          { location: position, radius: 200 },
          (data: google.maps.StreetViewPanoramaData | null, status: google.maps.StreetViewStatus) => {
            if (cancelled || !containerRef.current) return;

            if (status === maps.StreetViewStatus.OK && data?.location?.latLng) {
              new maps.StreetViewPanorama(containerRef.current!, {
                position: data.location.latLng,
                pov: { heading: 0, pitch: 0 },
                zoom: 1,
                disableDefaultUI: true,
                enableCloseButton: false,
                clickToGo: true,
                scrollwheel: false,
              });
              setLoaded(true);
            } else {
              setError('No Street View coverage');
            }
          }
        );
      } catch {
        if (!cancelled) {
          setError('Failed to load Street View');
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (!API_KEY) {
    return (
      <div className="px-4 py-3 text-center">
        <p className="text-[10px] text-[#5a6a7d]">
          Set <code className="text-[#8896a7]">VITE_GOOGLE_MAPS_API_KEY</code> to enable Street View
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full h-[200px] bg-[#151c25]"
      />
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#151c25]">
          <span className="text-[11px] text-[#5a6a7d]">Loading Street View...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#151c25]">
          <span className="text-[11px] text-[#5a6a7d]">{error}</span>
        </div>
      )}
    </div>
  );
}
