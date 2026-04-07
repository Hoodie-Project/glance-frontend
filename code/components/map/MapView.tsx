"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNaverMap } from "@/hooks/use-naver-map";
import { HotRegions } from "@/components/map/HotRegions";

type Coordinate = {
  lat: number;
  lng: number;
};

const markers = [
  {
    id: "1",
    title: "성수 카페 거리 지금 줄 길어요",
    tag: "성수",
    summary: "입장 대기 길고, 주변 골목은 비교적 한산해요.",
    createdAt: "방금 전",
    lat: 37.54484,
    lng: 127.05571
  },
  {
    id: "2",
    title: "을지로 야시장 분위기 올라오는 중",
    tag: "을지로",
    summary: "골목 안쪽은 아직 자리 있고 메인 라인만 붐비는 편입니다.",
    createdAt: "4분 전",
    lat: 37.5663,
    lng: 126.9911
  },
  {
    id: "3",
    title: "잠실 한강공원 바람 괜찮아요",
    tag: "잠실",
    summary: "돗자리 깔기 좋고 사람 밀도도 심하지 않아요.",
    createdAt: "12분 전",
    lat: 37.5207,
    lng: 127.103
  }
];

const SEOUL_CITY_HALL: Coordinate = {
  lat: 37.56661,
  lng: 126.97839
};

function toLatLng(maps: NaverMapsNamespace, coordinate: Coordinate) {
  return new maps.LatLng(coordinate.lat, coordinate.lng);
}

export function MapView() {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const { error, isReady, status } = useNaverMap(clientId);
  const isGeolocationSupported = typeof navigator !== "undefined" && "geolocation" in navigator;
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapsMap | null>(null);
  const markerRefs = useRef<NaverMapsMarker[]>([]);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string>(markers[0]?.id ?? "");
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    if (!isReady || !mapElementRef.current || mapRef.current || !window.naver?.maps) {
      return;
    }

    const { maps } = window.naver;

    mapRef.current = new maps.Map(mapElementRef.current, {
      center: toLatLng(maps, SEOUL_CITY_HALL),
      zoom: 12,
      minZoom: 10,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false
    });

    const mapInstance = mapRef.current;

    markerRefs.current = markers.map((marker) => {
      const markerInstance = new maps.Marker({
        map: mapInstance,
        position: new maps.LatLng(marker.lat, marker.lng),
        title: marker.title
      });

      maps.Event.addListener(markerInstance, "click", () => {
        setSelectedMarkerId(marker.id);
        mapInstance.panTo(new maps.LatLng(marker.lat, marker.lng));
      });

      return markerInstance;
    });
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !mapRef.current) {
      return;
    }

    if (!isGeolocationSupported) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!window.naver?.maps || !mapRef.current) {
          return;
        }

        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setCurrentLocation(nextLocation);
        setLocationError(null);
        mapRef.current.panTo(toLatLng(window.naver.maps, nextLocation));
      },
      () => {
        setLocationError("현재 위치 권한이 없어 서울 중심 지도를 표시합니다.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [isGeolocationSupported, isReady]);

  const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId) ?? markers[0];

  const handleMoveToCurrentLocation = () => {
    if (!currentLocation || !mapRef.current || !window.naver?.maps) {
      return;
    }

    mapRef.current.panTo(toLatLng(window.naver.maps, currentLocation));
  };

  const handleConfirmLocationThread = () => {
    if (!currentLocation) {
      return;
    }

    const params = new URLSearchParams({
      lat: String(currentLocation.lat),
      lng: String(currentLocation.lng),
      source: "current-location"
    });

    router.push(`/write?${params.toString()}`);
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
      <div className="map-overlay-top">
        <div className="map-title-card surface">
          <div>
            <strong style={{ display: "block", fontSize: 30, lineHeight: 1, letterSpacing: "-0.04em" }}>힐끔</strong>
            <span style={{ display: "block", marginTop: 8, color: "var(--muted)", fontSize: 14 }}>
              {locationError ??
                (!isGeolocationSupported
                  ? "이 브라우저에서는 현재 위치를 사용할 수 없습니다."
                  : status === "ready"
                    ? "현재 위치 기준으로 지도를 표시합니다."
                    : "지도를 불러오는 중입니다.")}
            </span>
          </div>
        </div>

        <div className="map-overlay-scroll">
          <HotRegions />
        </div>
      </div>

      <div
        ref={mapElementRef}
        className="map-canvas"
        style={{
          position: "relative",
          height: "100%",
          minHeight: "100dvh",
          background:
            "radial-gradient(circle at 20% 20%, rgba(143, 92, 255, 0.16), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
        }}
      >
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

        {currentLocation ? (
          <button
            type="button"
            aria-label="현재 위치로 스레드 작성"
            className="map-center-pin-button"
            onClick={() => setIsLocationModalOpen(true)}
          >
            <span className="map-center-pin-ring" />
            <span className="map-center-pin-core">
              <MapPin size={20} />
            </span>
          </button>
        ) : null}

        <div
          style={{
            position: "absolute",
            right: 16,
            top: "calc(env(safe-area-inset-top) + 154px)",
            zIndex: 10,
            display: "grid",
            gap: 12
          }}
        >
          <button className="map-floating-button" type="button" aria-label="검색">
            <Search size={20} />
          </button>
          <button className="map-floating-button" type="button" aria-label="필터">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        <button
          className="map-location-button"
          disabled={!currentLocation}
          onClick={handleMoveToCurrentLocation}
          type="button"
          aria-label="현재 위치로 이동"
        >
          <Crosshair size={22} />
        </button>

        <div
          className="surface"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: "calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 88px)",
            zIndex: 10,
            borderRadius: 24,
            padding: 18,
            background: "var(--card-strong)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>#{selectedMarker.tag}</div>
              <strong style={{ display: "block", marginTop: 4 }}>{selectedMarker.title}</strong>
              <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14 }}>{selectedMarker.summary}</p>
            </div>
            <div className="chip">{selectedMarker.createdAt}</div>
          </div>
        </div>

        {isLocationModalOpen ? (
          <>
            <button
              aria-label="모달 닫기"
              className="map-modal-backdrop"
              onClick={() => setIsLocationModalOpen(false)}
              type="button"
            />
            <div className="surface map-bottom-sheet">
              <div className="chip" style={{ width: "fit-content", background: "var(--accent-soft)" }}>
                현재 위치
              </div>
              <h2 style={{ margin: "14px 0 8px", fontSize: 22, lineHeight: 1.35 }}>
                현재 위치로 스레드를 추가하시겠습니까?
              </h2>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                서버에는 저장하지 않고, 클라이언트에서 확인한 현재 위치 기준으로 스레드 작성 화면으로 이동합니다.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
                <button className="button-primary" onClick={handleConfirmLocationThread} type="button">
                  예
                </button>
                <button className="button-secondary" onClick={() => setIsLocationModalOpen(false)} type="button">
                  아니오
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
