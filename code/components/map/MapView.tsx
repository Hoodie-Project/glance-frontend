"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, Crosshair, MapPin, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { threadMarkers } from "@/data/threadMarkers";
import { useNaverMap } from "@/hooks/use-naver-map";
import type { ThreadMarker } from "@/data/threadMarkers";

type Coordinate = {
  lat: number;
  lng: number;
};

type ClusterLevel = "dong" | "gu" | "city" | "metro";

const SEOUL_CITY_HALL: Coordinate = {
  lat: 37.56661,
  lng: 126.97839
};

const INITIAL_ZOOM = 17;
const MIN_ZOOM = 6;
const ZOOM_CLUSTER_LEVELS = {
  marker: 14,
  dong: 11,
  gu: 9,
  city: 7
} as const;

function toLatLng(maps: NaverMapsNamespace, coordinate: Coordinate) {
  return new maps.LatLng(coordinate.lat, coordinate.lng);
}

function subscribeGeolocationSupport() {
  return () => {};
}

function createClusterContent(count: number) {
  const label = count > 99 ? "99+" : String(count);

  return `
    <div style="width:52px;height:52px;border-radius:999px;background:rgba(59,130,246,0.22);border:2px solid rgba(59,130,246,0.5);color:#1d4ed8;display:grid;place-items:center;font-size:20px;font-weight:800;backdrop-filter:blur(8px);">
      ${label}
    </div>
  `;
}

function createMarkerContent() {
  return `
    <div style="width:30px;height:30px;transform:translate(-50%, -100%);">
      <div style="width:30px;height:30px;background:#111;border-radius:50% 50% 50% 0;transform:rotate(-45deg);position:relative;">
        <div style="width:10px;height:10px;border-radius:999px;background:#fff;position:absolute;top:10px;left:10px;"></div>
      </div>
    </div>
  `;
}

function resolveClusterLevel(zoom: number): ClusterLevel | "marker" {
  if (zoom >= ZOOM_CLUSTER_LEVELS.marker) return "marker";
  if (zoom >= ZOOM_CLUSTER_LEVELS.dong) return "dong";
  if (zoom >= ZOOM_CLUSTER_LEVELS.gu) return "gu";
  if (zoom >= ZOOM_CLUSTER_LEVELS.city) return "city";
  return "metro";
}

function getClusterCenters(markers: ThreadMarker[], level: ClusterLevel) {
  const grouped = markers.reduce<Record<string, { latSum: number; lngSum: number; count: number; label: string }>>(
    (acc, marker) => {
      const key = marker[level];

      if (!acc[key]) {
        acc[key] = { latSum: 0, lngSum: 0, count: 0, label: key };
      }

      acc[key].latSum += marker.lat;
      acc[key].lngSum += marker.lng;
      acc[key].count += 1;
      return acc;
    },
    {}
  );

  return Object.values(grouped).map((value) => ({
    label: value.label,
    count: value.count,
    lat: value.latSum / value.count,
    lng: value.lngSum / value.count
  }));
}

function clearMarkers(markers: NaverMapsMarker[]) {
  markers.forEach((marker) => {
    marker.setMap(null);
  });
}

function drawThreadMarkers(
  maps: NaverMapsNamespace,
  map: NaverMapsMap,
  onSelectMarker: (markerId: string, coordinate: Coordinate) => void
) {
  return threadMarkers.map((marker) => {
    const markerInstance = new maps.Marker({
      map,
      position: new maps.LatLng(marker.lat, marker.lng),
      title: marker.title,
      icon: {
        content: createMarkerContent(),
        anchor: {
          x: 15,
          y: 30
        }
      }
    });

    maps.Event.addListener(markerInstance, "click", () => {
      onSelectMarker(marker.id, { lat: marker.lat, lng: marker.lng });
    });

    return markerInstance;
  });
}

function drawClusterMarkers(
  maps: NaverMapsNamespace,
  map: NaverMapsMap,
  level: ClusterLevel,
  onSelectCluster: (coordinate: Coordinate, nextZoom: number) => void
) {
  return getClusterCenters(threadMarkers, level).map((cluster) => {
    const markerInstance = new maps.Marker({
      map,
      position: new maps.LatLng(cluster.lat, cluster.lng),
      title: `${cluster.label} ${cluster.count}개`,
      icon: {
        content: createClusterContent(cluster.count),
        anchor: {
          x: 26,
          y: 26
        }
      }
    });

    maps.Event.addListener(markerInstance, "click", () => {
      const nextZoom =
        level === "dong"
          ? ZOOM_CLUSTER_LEVELS.marker
          : level === "gu"
            ? ZOOM_CLUSTER_LEVELS.dong
            : level === "city"
              ? ZOOM_CLUSTER_LEVELS.gu
              : ZOOM_CLUSTER_LEVELS.city;

      onSelectCluster({ lat: cluster.lat, lng: cluster.lng }, nextZoom);
    });

    return markerInstance;
  });
}

type MapViewProps = {
  isSelectMode?: boolean;
  returnTo?: string;
};

function buildWriteLocationName(coordinate: Coordinate) {
  return `선택한 위치 (${coordinate.lat.toFixed(5)}, ${coordinate.lng.toFixed(5)})`;
}

export function MapView({ isSelectMode = false, returnTo = "/write" }: MapViewProps) {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const { error, isReady } = useNaverMap(clientId);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapsMap | null>(null);
  const markerRefs = useRef<NaverMapsMarker[]>([]);
  const renderMarkersRef = useRef<(() => void) | null>(null);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<Coordinate | null>(null);
  const isGeolocationSupported = useSyncExternalStore(
    subscribeGeolocationSupport,
    () => "geolocation" in navigator,
    () => null
  );

  useEffect(() => {
    if (!isReady || !mapElementRef.current || mapRef.current || !window.naver?.maps) {
      return;
    }

    const { maps } = window.naver;

    mapRef.current = new maps.Map(mapElementRef.current, {
      center: toLatLng(maps, SEOUL_CITY_HALL),
      zoom: INITIAL_ZOOM,
      minZoom: MIN_ZOOM,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false
    });

    const mapInstance = mapRef.current;
    const renderMarkers = () => {
      clearMarkers(markerRefs.current);
      const clusterLevel = resolveClusterLevel(mapInstance.getZoom());

      if (clusterLevel !== "marker") {
        markerRefs.current = drawClusterMarkers(maps, mapInstance, clusterLevel, (coordinate, nextZoom) => {
          mapInstance.panTo(toLatLng(maps, coordinate));
          mapInstance.setZoom(nextZoom);
        });
        setSelectedMarkerId(null);
        return;
      }

      markerRefs.current = drawThreadMarkers(maps, mapInstance, (markerId, coordinate) => {
        setSelectedMarkerId(markerId);
        mapInstance.panTo(toLatLng(maps, coordinate));
      });
    };
    renderMarkersRef.current = renderMarkers;

    const syncCenterLocation = () => {
      const center = mapInstance.getCenter();

      setCurrentLocation({
        lat: center.lat(),
        lng: center.lng()
      });
    };

    renderMarkers();
    syncCenterLocation();
    maps.Event.addListener(mapInstance, "zoom_changed", renderMarkers);
    maps.Event.addListener(mapInstance, "idle", syncCenterLocation);
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !mapRef.current) {
      return;
    }

    if (isGeolocationSupported !== true) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!window.naver?.maps || !mapRef.current) {
          return;
        }

        const { maps } = window.naver;
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setDeviceLocation(nextLocation);
        setCurrentLocation(nextLocation);
        mapRef.current.panTo(toLatLng(maps, nextLocation));
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [isGeolocationSupported, isReady]);

  const selectedMarker =
    threadMarkers.find((marker) => marker.id === selectedMarkerId) ?? threadMarkers[0];

  const handleRefreshMarkers = () => {
    if (!mapRef.current || !window.naver?.maps) {
      return;
    }

    const { maps } = window.naver;
    const anchorLocation = deviceLocation ?? currentLocation ?? SEOUL_CITY_HALL;

    clearMarkers(markerRefs.current);
    mapRef.current.setZoom(INITIAL_ZOOM);
    mapRef.current.panTo(toLatLng(maps, anchorLocation));
    setCurrentLocation(anchorLocation);

    if (isGeolocationSupported === true) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mapRef.current || !window.naver?.maps) {
            return;
          }

          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          setDeviceLocation(nextLocation);
          setCurrentLocation(nextLocation);
          mapRef.current.setZoom(INITIAL_ZOOM);
          mapRef.current.panTo(toLatLng(window.naver.maps, nextLocation));
          renderMarkersRef.current?.();
        },
        () => {
          renderMarkersRef.current?.();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000
        }
      );
      return;
    }

    renderMarkersRef.current?.();
  };

  const handleMoveToCurrentLocation = () => {
    if (!deviceLocation || !mapRef.current || !window.naver?.maps) {
      return;
    }

    mapRef.current.panTo(toLatLng(window.naver.maps, deviceLocation));
  };

  const handleConfirmLocation = () => {
    if (!currentLocation) {
      return;
    }

    const params = new URLSearchParams({
      lat: String(currentLocation.lat),
      lng: String(currentLocation.lng),
      locationName: buildWriteLocationName(currentLocation)
    });

    router.push(`${returnTo}?${params.toString()}`);
  };

  return (
    <section
      className="map-canvas-shell"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100dvh"
      }}
    >
      <div className="map-safe-area-fill" />
      <div
        ref={mapElementRef}
        className="map-canvas"
        style={{
          height: "100%",
          minHeight: "100dvh",
          background:
            "radial-gradient(circle at 20% 20%, rgba(143, 92, 255, 0.16), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
        }}
      />

      <div className="map-center-picker" aria-hidden="true">
        <span className="map-center-picker-ring" />
        <span className="map-center-picker-core" />
      </div>

      <div
        style={{
          position: "absolute",
          right: 17,
          bottom: isSelectMode ? 146 : 110,
          zIndex: 10,
          display: "grid",
          gap: 6
        }}
      >
        <button className="map-wire-button" onClick={handleRefreshMarkers} type="button" aria-label="새로고침">
          <RefreshCcw size={24} />
        </button>
        <button
          className="map-wire-button"
          disabled={!deviceLocation}
          onClick={handleMoveToCurrentLocation}
          type="button"
          aria-label="현재 위치로 이동"
        >
          <Crosshair size={24} />
        </button>
      </div>

      {isSelectMode ? (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: "max(16px, env(safe-area-inset-top))",
            zIndex: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}
        >
          <button className="chip" onClick={() => router.back()} type="button">
            <ChevronLeft size={16} />
            뒤로가기
          </button>
          <div
            className="surface"
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.92)",
              color: "#111"
            }}
          >
            <strong>장소 선택</strong>
          </div>
        </div>
      ) : null}

      {!clientId || error ? (
        <div
          className="surface"
          style={{
            position: "absolute",
            inset: 16,
            zIndex: 10,
            display: "grid",
            placeItems: "center",
            borderRadius: 20,
            padding: 24,
            background: "var(--card-strong)",
            textAlign: "center"
          }}
        >
          <div>
            <MapPin size={24} style={{ margin: "0 auto 12px" }} />
            <strong style={{ display: "block", marginBottom: 8 }}>지도를 불러올 수 없습니다.</strong>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
              {error ?? "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 확인하세요."}
            </p>
          </div>
        </div>
      ) : null}

      {isSelectMode ? (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: "calc(24px + env(safe-area-inset-bottom))",
            zIndex: 12
          }}
        >
          <div
            className="surface"
            style={{
              borderRadius: 28,
              padding: 18,
              background: "rgba(255, 255, 255, 0.98)",
              color: "#111",
              boxShadow: "0 18px 40px rgba(0, 0, 0, 0.08)"
            }}
          >
            <strong style={{ display: "block", fontSize: 18 }}>이 위치를 장소로 사용할까요?</strong>
            <p style={{ margin: "8px 0 0", color: "#666", lineHeight: 1.5 }}>
              지도의 가운데 점 위치가 선택됩니다.
              <br />
              {currentLocation
                ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                : "좌표를 불러오는 중입니다."}
            </p>
            <button className="map-wire-cta" onClick={handleConfirmLocation} type="button">
              이 위치 선택
            </button>
          </div>
        </div>
      ) : null}

      {!isSelectMode && selectedMarkerId ? (
        <>
          <button
            aria-label="스레드 닫기"
            className="map-sheet-dismiss"
            onClick={() => setSelectedMarkerId(null)}
            type="button"
          />
          <div className="map-wire-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="map-wire-handle" />
            <h2 className="map-wire-title">{selectedMarker.title}</h2>
            <div className="map-wire-meta">
              <div className="map-wire-author">
                <span className="map-wire-avatar" />
                <span>익명123</span>
              </div>
              <span>{selectedMarker.createdAt}</span>
            </div>
            <p className="map-wire-body">
              {selectedMarker.summary} 도서관 잘생긴 사람 발견도서관 잘생긴 사람 발견도서관 잘생긴 사람 발견...
            </p>
            <div className="map-wire-tags">#{selectedMarker.dong} #{selectedMarker.gu} #{selectedMarker.city}</div>
            <div className="map-wire-stats">
              <span>♡ 99+</span>
              <span>◌ 99+</span>
            </div>
            <button
              className="map-wire-cta"
              onClick={() => router.push(`/thread/${selectedMarker.id}`)}
              type="button"
            >
              스레드 보기
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
