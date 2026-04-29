"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ApiError } from "@/api/client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiLocationMarker, HiOutlineChatAlt2, HiOutlineHeart } from "react-icons/hi";
import { getFeedThreads, getNearbyFeedThreads } from "@/api/thread";
import type { FeedResponse, ThreadSummary } from "@/api/thread";

type FeedScope = "all" | "nearby";
type FeedLocation = {
  lat: number;
  lng: number;
};

const SEOUL_CITY_HALL: FeedLocation = {
  lat: 37.56661,
  lng: 126.97839
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute").replace(" ", "");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour").replace(" ", "");
  }

  const days = Math.round(hours / 24);
  return formatter.format(days, "day").replace(" ", "");
}

function getLocationLabel(thread: ThreadSummary) {
  return thread.region?.dong || thread.region?.sigungu || thread.region?.sido || "위치 미상";
}

function getTagList(thread: ThreadSummary) {
  return thread.tags.slice(0, 3);
}

export function FeedList() {
  const [scope, setScope] = useState<FeedScope>("all");
  const [location, setLocation] = useState<FeedLocation>(SEOUL_CITY_HALL);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const supportsGeolocation = typeof window !== "undefined" && "geolocation" in navigator;
  const [locationStatus, setLocationStatus] = useState<"loading" | "ready" | "fallback">(
    supportsGeolocation ? "loading" : "fallback"
  );
  const queryKey = useMemo(() => ["feedThreads", scope, location.lat, location.lng], [scope, location.lat, location.lng]);

  useEffect(() => {
    if (!supportsGeolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus("ready");
      },
      () => {
        setLocationStatus("fallback");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [supportsGeolocation]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      scope === "nearby"
        ? getNearbyFeedThreads({
            lat: location.lat,
            lng: location.lng,
            radius: "2",
            cursor: pageParam ?? undefined,
            size: 10
          })
        : getFeedThreads({
            cursor: pageParam ?? undefined,
            size: 10
          }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage: FeedResponse) => {
      if (!lastPage.hasMore || lastPage.nextCursor === null) {
        return undefined;
      }

      return lastPage.nextCursor;
    }
  });

  const threads = useMemo(() => data?.pages.flatMap((page) => page.threads) ?? [], [data]);
  const isNearbyError = scope === "nearby" && error instanceof ApiError;

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) {
      return;
    }

    const node = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        });
      },
      {
        rootMargin: "240px 0px"
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 8
        }}
      >
        <div className="feed-scope-filter">
          {[
            { label: "전체", value: "all" as const },
            { label: "내 주변", value: "nearby" as const }
          ].map((item) => (
            <button
              key={item.value}
              className="feed-scope-filter-button"
              data-active={scope === item.value}
              onClick={() => setScope(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {scope === "nearby" && (!supportsGeolocation || locationStatus === "fallback") ? (
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, textAlign: "center" }}>
          현재 위치를 확인할 수 없어 서울 시청 기준으로 내 주변 피드를 표시합니다.
        </p>
      ) : null}

      {isLoading ? (
        <div className="feed-thread-card">
          <p style={{ margin: 0, color: "var(--muted)", textAlign: "center" }}>스레드를 불러오는 중입니다.</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="feed-thread-card">
          <p style={{ margin: 0, color: "#a26b6b", textAlign: "center" }}>
            {isNearbyError ? "내 주변 피드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." : "스레드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."}
          </p>
        </div>
      ) : null}

      {!isLoading && !error && threads.length === 0 ? (
        <div className="feed-thread-card">
          <p style={{ margin: 0, color: "var(--muted)", textAlign: "center" }}>표시할 스레드가 없습니다.</p>
        </div>
      ) : null}

      {threads.map((thread, index) => (
        <motion.div
          key={thread.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.05 }}
        >
          <Link
            className="feed-thread-card"
            href={`/thread/${thread.id}`}
          >
            <div className="feed-thread-head">
              <h2 className="feed-thread-title">{thread.title}</h2>
            </div>

            <div className="feed-thread-meta">
              <strong className="feed-thread-author">{thread.nickname}</strong>
              <span className="feed-thread-time">{formatRelativeTime(thread.createdAt)}</span>
            </div>

            <p className="feed-thread-body">{thread.content}</p>

            <div className="feed-thread-tags">
              {getTagList(thread).map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>

            <div className="feed-thread-footer">
              <div className="feed-thread-location">
                <HiLocationMarker size={20} />
                <span>{getLocationLabel(thread)}</span>
              </div>
              <div className="feed-thread-stats">
                <span>
                  <HiOutlineHeart size={21} />
                  {thread.likeCount > 99 ? "99+" : thread.likeCount}
                </span>
                <span>
                  <HiOutlineChatAlt2 size={21} />
                  {thread.commentCount > 99 ? "99+" : thread.commentCount}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}

      <div ref={loadMoreRef} style={{ height: 1 }} />

      {isFetchingNextPage || isRefetching ? (
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, textAlign: "center" }}>더 불러오는 중입니다.</p>
      ) : null}
    </section>
  );
}
