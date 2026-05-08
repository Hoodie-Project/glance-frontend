"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crosshair, MapPin, RefreshCcw } from "lucide-react";
import { getMapClusters, getMapPins, getThread } from "@/api/thread";
import type { MapCluster, ThreadDetail, ThreadGender, ThreadPin } from "@/api/thread";
import { useNaverMap } from "@/hooks/use-naver-map";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

type Coordinate = {
  lat: number;
  lng: number;
};

type ViewportBounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

type SelectedAddress = {
  address: string;
  region: string;
};

type ClusterLevel = "dong";
type GenderFilter = "ALL" | ThreadGender;

type MapViewProps = {
  isSelectMode?: boolean;
  returnTo?: string;
};

const SEOUL_CITY_HALL: Coordinate = {
  lat: 37.56661,
  lng: 126.97839
};

const INITIAL_ZOOM = 17;
const MIN_ZOOM = 6;
const ZOOM_CLUSTER_LEVELS = {
  marker: 15
} as const;

// 이전 기획안의 다단계 줌 정책은 현재 백엔드 지도 스펙과 맞지 않아 비활성 상태로 남겨둡니다.
// - 14 이상: 개별 스레드 마커
// - 11 이상 14 미만: 동 클러스터 단계
// - 9 이상 11 미만: 구 클러스터 단계
// - 7 이상 9 미만: 시 클러스터 단계
// - 7 미만: 시 이후 클러스터 단계
//
// function resolveClusterLevel(zoom: number): "dong" | "gu" | "city" | "metro" | "marker" {
//   if (zoom >= 14) return "marker";
//   if (zoom >= 11) return "dong";
//   if (zoom >= 9) return "gu";
//   if (zoom >= 7) return "city";
//   return "metro";
// }

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
  return "dong";
}

function clearMarkers(markers: NaverMapsMarker[]) {
  markers.forEach((marker) => {
    marker.setMap(null);
  });
}

function formatRegion(response?: NaverReverseGeocodeResponse) {
  const region = response?.v2?.results?.[0]?.region;
  return [region?.area1?.name, region?.area2?.name, region?.area3?.name].filter(Boolean).join(" ");
}

function resolveAddress(response?: NaverReverseGeocodeResponse) {
  const roadAddress = response?.v2?.address?.roadAddress?.trim();
  const jibunAddress = response?.v2?.address?.jibunAddress?.trim();
  const region = formatRegion(response);

  return {
    address: roadAddress || jibunAddress || "주소 정보를 찾을 수 없습니다.",
    region: region || "시/구/동 정보를 찾을 수 없습니다."
  };
}

function buildWriteLocationName(coordinate: Coordinate) {
  return `선택한 위치 (${coordinate.lat.toFixed(5)}, ${coordinate.lng.toFixed(5)})`;
}

function getThreadTags(thread: ThreadDetail) {
  if (thread.tags.length > 0) {
    return thread.tags;
  }

  return [thread.region?.dong, thread.region?.sigungu, thread.region?.sido].filter(Boolean) as string[];
}

function getThreadRegion(thread: ThreadDetail) {
  return [thread.region?.dong, thread.region?.sigungu, thread.region?.sido].filter(Boolean).join(" ");
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMinutes = Math.round((date.getTime() - Date.now()) / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute").replace(" ", "");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour").replace(" ", "");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day").replace(" ", "");
}

function getBounds(map: NaverMapsMap) {
  const bounds = map.getBounds();

  return {
    swLat: bounds.getSW().lat(),
    swLng: bounds.getSW().lng(),
    neLat: bounds.getNE().lat(),
    neLng: bounds.getNE().lng()
  };
}

function getNextZoom(level: ClusterLevel) {
  if (level === "dong") return ZOOM_CLUSTER_LEVELS.marker;
  return ZOOM_CLUSTER_LEVELS.marker;
}

function drawPinMarkers(
  maps: NaverMapsNamespace,
  map: NaverMapsMap,
  pins: ThreadPin[],
  onSelectPin: (threadId: number, coordinate: Coordinate) => void
) {
  return pins.map((pin) => {
    const markerInstance = new maps.Marker({
      map,
      position: new maps.LatLng(pin.latitude, pin.longitude),
      title: `thread-${pin.id}`,
      icon: {
        content: createMarkerContent(),
        anchor: {
          x: 15,
          y: 30
        }
      }
    });

    maps.Event.addListener(markerInstance, "click", () => {
      onSelectPin(pin.id, { lat: pin.latitude, lng: pin.longitude });
    });

    return markerInstance;
  });
}

function drawClusterMarkers(
  maps: NaverMapsNamespace,
  map: NaverMapsMap,
  clusters: MapCluster[],
  level: ClusterLevel,
  onSelectCluster: (coordinate: Coordinate, nextZoom: number) => void
) {
  return clusters.map((cluster) => {
    const markerInstance = new maps.Marker({
      map,
      position: new maps.LatLng(cluster.latitude, cluster.longitude),
      title: `${cluster.name} ${cluster.count}개`,
      icon: {
        content: createClusterContent(cluster.count),
        anchor: {
          x: 26,
          y: 26
        }
      }
    });

    maps.Event.addListener(markerInstance, "click", () => {
      onSelectCluster(
        {
          lat: cluster.latitude,
          lng: cluster.longitude
        },
        getNextZoom(level)
      );
    });

    return markerInstance;
  });
}

export function MapView({ isSelectMode = false, returnTo = "/write" }: MapViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const { error, hasGeocoder, isReady } = useNaverMap(clientId);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapsMap | null>(null);
  const markerRefs = useRef<NaverMapsMarker[]>([]);

  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<Coordinate | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("ALL");
  const [mapZoom, setMapZoom] = useState(INITIAL_ZOOM);
  const [mapBounds, setMapBounds] = useState<ViewportBounds | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isGeolocationSupported = useSyncExternalStore(
    subscribeGeolocationSupport,
    () => (typeof navigator !== "undefined" ? "geolocation" in navigator : false),
    () => false
  );

  const clusterLevel = resolveClusterLevel(mapZoom);
  const isMarkerView = clusterLevel === "marker";

  useEffect(() => {
    if (!isReady || !mapElementRef.current || mapRef.current || !window.naver?.maps) {
      return;
    }

    const { maps } = window.naver;
    const mapInstance = new maps.Map(mapElementRef.current, {
      center: toLatLng(maps, SEOUL_CITY_HALL),
      zoom: INITIAL_ZOOM,
      minZoom: MIN_ZOOM,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false
    });

    const syncViewport = () => {
      const center = mapInstance.getCenter();

      setMapZoom(mapInstance.getZoom());
      setCurrentLocation({
        lat: center.lat(),
        lng: center.lng()
      });
      setMapBounds(getBounds(mapInstance));
    };

    mapRef.current = mapInstance;
    syncViewport();

    maps.Event.addListener(mapInstance, "zoom_changed", () => {
      setSelectedMarkerId(null);
      syncViewport();
    });
    maps.Event.addListener(mapInstance, "idle", syncViewport);
    maps.Event.addListener(mapInstance, "click", () => {
      setSelectedMarkerId(null);
    });
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !mapRef.current || !isGeolocationSupported) {
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

  useEffect(() => {
    if (!isSelectMode || !isReady || !currentLocation) {
      return;
    }

    if (!window.naver?.maps?.Service) {
      return;
    }

    const timer = window.setTimeout(() => {
      const maps = window.naver?.maps;
      const service = maps?.Service;

      if (!maps || !service) {
        return;
      }

      setIsResolvingAddress(true);
      service.reverseGeocode(
        {
          coords: toLatLng(maps, currentLocation),
          orders: `${service.OrderType.ROAD_ADDR},${service.OrderType.ADDR}`
        },
        (status, response) => {
          if (!window.naver?.maps?.Service) {
            return;
          }

          if (status !== window.naver.maps.Service.Status.OK) {
            setSelectedAddress({
              address: `선택한 위치 (${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)})`,
              region: "시/구/동 정보를 찾을 수 없습니다."
            });
            setIsResolvingAddress(false);
            return;
          }

          setSelectedAddress(resolveAddress(response));
          setIsResolvingAddress(false);
        }
      );
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentLocation, isReady, isSelectMode]);

  const clusterQuery = useQuery({
    queryKey: ["mapClusters", mapBounds?.swLat, mapBounds?.swLng, mapBounds?.neLat, mapBounds?.neLng, refreshKey],
    queryFn: () =>
      getMapClusters({
        swLat: mapBounds!.swLat,
        swLng: mapBounds!.swLng,
        neLat: mapBounds!.neLat,
        neLng: mapBounds!.neLng
      }),
    enabled: isReady && !!mapBounds && !isMarkerView
  });

  const pinQuery = useQuery({
    queryKey: ["mapPins", mapBounds?.swLat, mapBounds?.swLng, mapBounds?.neLat, mapBounds?.neLng, genderFilter, refreshKey],
    queryFn: () =>
      getMapPins({
        swLat: mapBounds!.swLat,
        swLng: mapBounds!.swLng,
        neLat: mapBounds!.neLat,
        neLng: mapBounds!.neLng,
        gender: genderFilter
      }),
    enabled: isReady && !!mapBounds && isMarkerView
  });

  const selectedThreadQuery = useQuery({
    queryKey: ["mapSelectedThread", selectedMarkerId],
    queryFn: () => getThread(selectedMarkerId as number),
    enabled: !isSelectMode && selectedMarkerId !== null
  });

  const mapPins = useMemo(() => pinQuery.data ?? [], [pinQuery.data]);
  const selectedPin = mapPins.find((pin) => pin.id === selectedMarkerId) ?? null;
  const selectedThread = selectedThreadQuery.data ?? null;
  const fallbackAddress =
    currentLocation && !hasGeocoder
      ? {
          address: `선택한 위치 (${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)})`,
          region: "주소 기능을 사용하려면 네이버 콘솔에서 Reverse Geocoding을 활성화해야 합니다."
        }
      : null;
  const resolvedAddress = selectedAddress ?? fallbackAddress;
  const mapDataError = clusterQuery.error || pinQuery.error;

  useEffect(() => {
    if (!isReady || !mapRef.current || !window.naver?.maps) {
      return;
    }

    const { maps } = window.naver;
    const mapInstance = mapRef.current;
    clearMarkers(markerRefs.current);

    if (isMarkerView) {
      markerRefs.current = drawPinMarkers(maps, mapInstance, mapPins, (threadId, coordinate) => {
        setSelectedMarkerId(threadId);
        mapInstance.panTo(toLatLng(maps, coordinate));
      });
      return;
    }

    markerRefs.current = drawClusterMarkers(maps, mapInstance, clusterQuery.data ?? [], clusterLevel, (coordinate, nextZoom) => {
      mapInstance.panTo(toLatLng(maps, coordinate));
      mapInstance.setZoom(nextZoom);
    });
  }, [clusterLevel, clusterQuery.data, isMarkerView, isReady, mapPins]);

  const handleRefreshMarkers = () => {
    if (!mapRef.current || !window.naver?.maps) {
      return;
    }

    const { maps } = window.naver;
    const anchorLocation = deviceLocation ?? currentLocation ?? SEOUL_CITY_HALL;

    setSelectedMarkerId(null);
    mapRef.current.setZoom(INITIAL_ZOOM);
    mapRef.current.panTo(toLatLng(maps, anchorLocation));
    setCurrentLocation(anchorLocation);

    if (isGeolocationSupported) {
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
          setRefreshKey((value) => value + 1);
          queryClient.invalidateQueries({ queryKey: ["mapPins"] });
          queryClient.invalidateQueries({ queryKey: ["mapClusters"] });
        },
        () => {
          setRefreshKey((value) => value + 1);
          queryClient.invalidateQueries({ queryKey: ["mapPins"] });
          queryClient.invalidateQueries({ queryKey: ["mapClusters"] });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000
        }
      );
      return;
    }

    setRefreshKey((value) => value + 1);
    queryClient.invalidateQueries({ queryKey: ["mapPins"] });
    queryClient.invalidateQueries({ queryKey: ["mapClusters"] });
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
      address: resolvedAddress?.address || buildWriteLocationName(currentLocation),
      region: resolvedAddress?.region || "시/구/동 정보를 찾을 수 없습니다."
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

      {!isSelectMode ? (
        <>
          <div className="map-gender-filter">
            {[
              { label: "전체", value: "ALL" as const },
              { label: "남자", value: "MALE" as const },
              { label: "여자", value: "FEMALE" as const }
            ].map((item) => (
              <button
                className="map-gender-filter-button"
                data-active={genderFilter === item.value}
                key={item.value}
                onClick={() => setGenderFilter(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="chip" onClick={() => router.back()} type="button">
              뒤로가기
            </button>
            <button className="chip" onClick={() => router.push("/map")} type="button">
              메인화면
            </button>
          </div>
          <div
            className="surface"
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.92)",
              color: "#111",
              flexShrink: 0
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

      {!error && mapDataError ? (
        <div
          style={{
            position: "absolute",
            top: isSelectMode ? "calc(max(16px, env(safe-area-inset-top)) + 58px)" : "calc(max(16px, env(safe-area-inset-top)) + 108px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 11,
            borderRadius: 999,
            background: "rgba(162, 107, 107, 0.92)",
            color: "#fff",
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 700
          }}
        >
          지도 스레드 정보를 불러오지 못했습니다.
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
              {isResolvingAddress
                ? "주소를 확인하는 중입니다."
                : resolvedAddress?.address || "지도의 가운데 점 위치를 선택합니다."}
            </p>
            <p style={{ margin: "8px 0 0", color: "#8a8a8a", lineHeight: 1.5, fontSize: 14 }}>
              {resolvedAddress?.region ||
                (currentLocation
                  ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                  : "좌표를 불러오는 중입니다.")}
            </p>
            {!hasGeocoder ? (
              <p style={{ margin: "8px 0 0", color: "#a26b6b", lineHeight: 1.5, fontSize: 13 }}>
                현재는 좌표만 저장합니다. 네이버 콘솔에서 Geocoding/Reverse Geocoding 활성화가 필요합니다.
              </p>
            ) : null}
            <button className="map-wire-cta" onClick={handleConfirmLocation} type="button">
              이 위치 선택
            </button>
          </div>
        </div>
      ) : null}

      {!isSelectMode && selectedPin && selectedThread ? (
        <>
          <button
            aria-label="스레드 닫기"
            className="map-sheet-dismiss"
            onClick={() => setSelectedMarkerId(null)}
            type="button"
          />
          <div className="map-wire-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="map-wire-handle" />
            <h2 className="map-wire-title">{selectedThread.title}</h2>
            <div className="map-wire-meta">
              <div className="map-wire-author">
                <span className="map-wire-avatar" />
                <span>{selectedThread.nickname}</span>
              </div>
              <span>{formatRelativeTime(selectedThread.createdAt)}</span>
            </div>
            <p className="map-wire-body">{selectedThread.content}</p>
            <div className="map-wire-tags">{getThreadTags(selectedThread).map((tag) => `#${tag}`).join(" ")}</div>
            <div className="map-wire-stats">
              <span>♡ {selectedThread.likeCount > 99 ? "99+" : selectedThread.likeCount}</span>
              <span>◌ {selectedThread.commentCount > 99 ? "99+" : selectedThread.commentCount}</span>
            </div>
            <p style={{ margin: "10px 0 0", color: "#7f7f7f", fontSize: 14 }}>{getThreadRegion(selectedThread)}</p>
            <button className="map-wire-cta" onClick={() => router.push(`/thread/${selectedThread.id}`)} type="button">
              스레드 보기
            </button>
          </div>
        </>
      ) : null}

      {!isSelectMode && isMarkerView && pinQuery.isFetching ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 188,
            transform: "translateX(-50%)",
            zIndex: 11,
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            color: "#111",
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 700
          }}
        >
          지도 핀을 불러오는 중입니다.
        </div>
      ) : null}
    </section>
  );
}
