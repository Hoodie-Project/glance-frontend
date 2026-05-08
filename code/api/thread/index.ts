import { apiClient } from "@/api/client";
import type {
  DeletePayload,
  FeedParams,
  FeedResponse,
  LikeToggleResponse,
  MapCluster,
  MapClusterResponse,
  MapClustersParams,
  NearbyFeedParams,
  PageResponse,
  SearchThreadsParams,
  ThreadCreatePayload,
  ThreadCreateResponse,
  ThreadDetail,
  ThreadPin,
  MapPinsParams,
  ThreadSummary
} from "@/api/thread/type";

export type {
  AnimalLook,
  CommentResponse,
  DeletePayload,
  FeedParams,
  FeedResponse,
  LikeToggleResponse,
  MapCluster,
  MapClusterLevel,
  MapClusterResponse,
  MapClustersParams,
  NearbyFeedParams,
  PageResponse,
  Region,
  SearchThreadsParams,
  ThreadCreatePayload,
  ThreadCreateResponse,
  ThreadDetail,
  ThreadGender,
  ThreadPin,
  MapPinsParams,
  ThreadSummary,
  VibeStyle
} from "@/api/thread/type";

export function getFeedThreads(params: FeedParams = {}) {
  return apiClient<FeedResponse>("/api/threads/feed", {
    method: "GET",
    query: {
      cursor: params.cursor,
      size: params.size ?? 20
    }
  });
}

export function getNearbyFeedThreads(params: NearbyFeedParams) {
  return apiClient<FeedResponse>("/api/threads/feed/nearby", {
    method: "GET",
    query: {
      lat: params.lat,
      lng: params.lng,
      radius: params.radius ?? "2",
      cursor: params.cursor,
      size: params.size ?? 20
    }
  });
}

export function createThread(payload: ThreadCreatePayload) {
  return apiClient<ThreadCreateResponse>("/api/threads", {
    method: "POST",
    body: payload
  });
}

export function getThread(threadId: number) {
  return apiClient<ThreadDetail>(`/api/threads/${threadId}`, {
    method: "GET"
  });
}

export function deleteThread(threadId: number, payload: DeletePayload) {
  return apiClient<void>(`/api/threads/${threadId}`, {
    method: "DELETE",
    body: payload
  });
}

export function toggleThreadLike(threadId: number) {
  return apiClient<LikeToggleResponse>(`/api/threads/${threadId}/likes`, {
    method: "POST"
  });
}

export function searchThreadsByTag(params: SearchThreadsParams) {
  return apiClient<PageResponse<ThreadSummary>>("/api/threads/search", {
    method: "GET",
    query: {
      tag: params.tag,
      page: params.page ?? 0,
      size: params.size ?? 20
    }
  });
}

export function getMapPins(params: MapPinsParams) {
  return apiClient<ThreadPin[]>("/api/threads/map/pins", {
    method: "GET",
    query: {
      ...params,
      gender: params.gender ?? "ALL"
    }
  });
}

export function normalizeMapCluster(cluster: MapClusterResponse): MapCluster {
  return {
    name: cluster.name || cluster.dong || cluster.sigungu || cluster.sido || "지역",
    count: cluster.count ?? cluster.threadCount ?? 0,
    latitude: cluster.latitude ?? cluster.lat ?? cluster.centerLat ?? 0,
    longitude: cluster.longitude ?? cluster.lng ?? cluster.centerLng ?? 0,
    level: cluster.level,
    sido: cluster.sido,
    sigungu: cluster.sigungu,
    dong: cluster.dong
  };
}

export function getMapClusters(params: MapClustersParams) {
  return apiClient<MapClusterResponse[]>("/api/threads/map/clusters", {
    method: "GET",
    query: {
      ...params,
      gender: params.gender ?? "ALL"
    }
  }).then((clusters) => clusters.map(normalizeMapCluster));
}
