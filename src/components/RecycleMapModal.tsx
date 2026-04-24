import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { LoaderCircle, Map as MapIcon, Navigation2, Search, X } from 'lucide-react';

export type MapLocation = {
  lat: number;
  lng: number;
  label: string;
  source: 'search' | 'device';
};

export type RecycleBin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'available' | 'full';
  distanceMeters: number;
};

type RecycleMapModalProps = {
  activeLocation: MapLocation;
  userLocation: MapLocation | null;
  bins: RecycleBin[];
  errorMessage: string;
  isLocating: boolean;
  isSearching: boolean;
  locationQuery: string;
  onAutoLocate: () => void;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
};

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const focusPinIcon = L.divIcon({
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: '<span class="recycle-map-pin recycle-map-pin--focus"></span>',
});

const availableBinIcon = L.divIcon({
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<span class="recycle-map-pin recycle-map-pin--available"></span>',
});

const fullBinIcon = L.divIcon({
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<span class="recycle-map-pin recycle-map-pin--full"></span>',
});

export default function RecycleMapModal({
  activeLocation,
  userLocation,
  bins,
  errorMessage,
  isLocating,
  isSearching,
  locationQuery,
  onAutoLocate,
  onClose,
  onQueryChange,
  onSearch,
}: RecycleMapModalProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const nearestBins = useMemo(
    () => bins.filter((bin) => bin.status === 'available').slice(0, 3),
    [bins],
  );

  useLayoutEffect(() => {
    if (!surfaceRef.current) {
      return;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out',
        },
      });

      timeline
        .fromTo(
          '[data-map-hero]',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 },
        )
        .fromTo(
          '[data-map-panel]',
          { opacity: 0, y: 28, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.1 },
          '-=0.25',
        )
        .fromTo(
          '[data-map-card]',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
          '-=0.3',
        );
    }, surfaceRef);

    return () => {
      context.revert();
    };
  }, []);

  useEffect(() => {
    L.Marker.prototype.options.icon = defaultMarkerIcon;

    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;

    if (!map || !markerLayer) {
      return;
    }

    markerLayer.clearLayers();
    const bounds = L.latLngBounds([]);

    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 10,
        color: '#8E6545',
        weight: 2,
        fillColor: '#FDFBF7',
        fillOpacity: 1,
      }).bindPopup(`你的位置<br/>${userLocation.label}`);

      markerLayer.addLayer(userMarker);
      bounds.extend([userLocation.lat, userLocation.lng]);
    }

    const focusMarker = L.marker([activeLocation.lat, activeLocation.lng], {
      icon: activeLocation.source === 'device' ? defaultMarkerIcon : focusPinIcon,
    }).bindPopup(`当前查看位置<br/>${activeLocation.label}`);

    markerLayer.addLayer(focusMarker);
    bounds.extend([activeLocation.lat, activeLocation.lng]);

    bins.forEach((bin) => {
      const marker = L.marker([bin.lat, bin.lng], {
        icon: bin.status === 'available' ? availableBinIcon : fullBinIcon,
      }).bindPopup(
        `${bin.name}<br/>${bin.status === 'available' ? '可投递' : '暂不可用'}<br/>约 ${formatDistance(
          bin.distanceMeters,
        )}`,
      );

      markerLayer.addLayer(marker);
      bounds.extend([bin.lat, bin.lng]);
    });

    requestAnimationFrame(() => {
      map.invalidateSize();

      if (bounds.isValid()) {
        if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
          map.setView(bounds.getCenter(), 15, { animate: true });
        } else {
          map.fitBounds(bounds.pad(0.2), { animate: true, duration: 0.8 });
        }
      }
    });
  }, [activeLocation, bins, userLocation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#362A1F]/50 p-2 backdrop-blur-xl sm:p-6 md:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(event) => event.stopPropagation()}
        ref={surfaceRef}
        className="relative flex h-[94svh] w-full max-w-[min(1520px,96vw)] flex-col overflow-hidden rounded-2xl border border-[#DECFBE] bg-[#FDFBF7] shadow-[0_20px_50px_rgba(54,42,31,0.25)] md:h-[90vh] md:rounded-3xl"
      >
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          className="absolute right-3 top-3 z-50 rounded-full border border-[#DECFBE] bg-[#F4F0E8] p-2.5 text-[#4A3D30] shadow-sm transition-all hover:scale-105 hover:bg-[#EAE3D4] md:right-5 md:top-5"
        >
          <X className="w-5 h-5" />
        </motion.button>

        <div className="relative z-40 flex flex-col gap-3 border-b border-[#DECFBE] bg-[#FDFBF7] px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col justify-between gap-3 pr-10 md:pr-12 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3" data-map-hero>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DECFBE] bg-[#F4F0E8] text-[#986E4B]">
                <MapIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-base tracking-wide text-[#362A1F] md:text-xl">附近回收网络</h3>
                <p className="max-w-[min(62vw,760px)] truncate text-xs text-[#7F6B58] md:text-sm">正在查看: {activeLocation.label}</p>
              </div>
            </div>

            <div
              className="flex flex-wrap gap-x-4 gap-y-1 self-start rounded-2xl border border-[#DECFBE] bg-[#F4F0E8] px-3 py-2 text-[11px] font-bold text-[#6C5B49] md:rounded-full md:text-xs lg:self-auto"
              data-map-hero
            >
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#986E4B] shrink-0 border border-[#835C3D]"></span>
                可用回收箱
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-[#BAAFA0] shrink-0"></span>
                已满暂不可用
              </span>
            </div>
          </div>

          {errorMessage ? (
            <div
              className="text-sm text-[#A25344] bg-[#F8E5DE] border border-[#EBCABE] rounded-2xl px-4 py-3"
              data-map-hero
            >
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex-1 relative bg-[#EAE3D4] overflow-hidden" data-map-panel>
          <div ref={mapContainerRef} className="absolute inset-0" />
          <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[#986E4B]/5" />

          <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex flex-col gap-3 md:inset-x-4 md:top-4">
            <div
              className="pointer-events-auto w-full max-w-[840px] overflow-hidden rounded-2xl border border-[#DECFBE] bg-[rgba(253,251,247,0.92)] shadow-[0_18px_40px_rgba(54,42,31,0.12)] backdrop-blur-xl"
              data-map-panel
            >
              <div className="flex flex-col md:flex-row">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(event) => onQueryChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onSearch();
                    }
                  }}
                  placeholder="输入小区、街道、校园或回收点周边位置"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#362A1F] outline-none placeholder:text-[#BAAFA0] md:px-5 md:py-4"
                />
                <div className="grid grid-cols-2 border-t md:border-t-0 md:border-l border-[#DECFBE] bg-[#F7F2EA]">
                  <motion.button
                    onClick={onSearch}
                    disabled={isSearching}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-[#986E4B] transition-colors hover:bg-[#F4F0E8] hover:text-[#6C4B30] disabled:cursor-wait disabled:opacity-60 md:px-4 md:py-4"
                  >
                    {isSearching ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    搜索位置
                  </motion.button>
                  <motion.button
                    onClick={onAutoLocate}
                    disabled={isLocating}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 border-l border-[#DECFBE] px-3 py-3 text-sm font-medium text-[#986E4B] transition-colors hover:bg-[#F4F0E8] hover:text-[#6C4B30] disabled:cursor-wait disabled:opacity-60 md:px-4 md:py-4"
                  >
                    {isLocating ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation2 className="w-4 h-4" />
                    )}
                    自动定位
                  </motion.button>
                </div>
              </div>
            </div>

            <div
              className="pointer-events-auto ml-auto max-h-[min(32vh,260px)] w-full max-w-full overflow-auto rounded-2xl border border-[#DECFBE] bg-[rgba(253,251,247,0.9)] p-3 shadow-[0_18px_40px_rgba(54,42,31,0.12)] backdrop-blur-xl md:max-h-[min(42vh,360px)] md:w-[300px] md:p-4"
              data-map-panel
            >
              <div className="text-xs uppercase tracking-[0.24em] text-[#986E4B] font-bold mb-3">
                最近可投递点
              </div>
              <div className="space-y-3">
                {nearestBins.map((bin) => (
                  <motion.div
                    key={bin.id}
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/75 border border-[#E5D9C9]"
                    data-map-card
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#362A1F] truncate">{bin.name}</div>
                      <div className="text-xs text-[#7F6B58]">步行约 {formatDistance(bin.distanceMeters)}</div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#EAE3D4] text-[#6C4B30] font-bold tracking-wide shrink-0">
                      可用
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .leaflet-container {
            width: 100%;
            height: 100%;
            background: #eae3d4;
            font-family: inherit;
          }

          .leaflet-control-zoom a {
            color: #4a3d30;
            background: rgba(253, 251, 247, 0.9);
            border-color: #decfbe;
          }

          .leaflet-control-attribution {
            background: rgba(253, 251, 247, 0.92);
            color: #7f6b58;
          }

          .recycle-map-pin {
            display: block;
            border-radius: 999px;
            box-shadow: 0 6px 16px rgba(54, 42, 31, 0.15);
          }

          .recycle-map-pin--focus {
            width: 28px;
            height: 28px;
            background: radial-gradient(circle at 35% 35%, #fdfbf7 0%, #f1dfc6 45%, #986e4b 100%);
            border: 2px solid #fdfbf7;
          }

          .recycle-map-pin--available {
            width: 18px;
            height: 18px;
            background: #986e4b;
            border: 3px solid rgba(253, 251, 247, 0.95);
          }

          .recycle-map-pin--full {
            width: 18px;
            height: 18px;
            background: #d6c8b8;
            border: 3px solid rgba(253, 251, 247, 0.95);
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} 米`;
  }

  return `${(distanceMeters / 1000).toFixed(distanceMeters < 3000 ? 1 : 0)} 公里`;
}
