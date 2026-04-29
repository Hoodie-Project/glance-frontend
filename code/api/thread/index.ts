import { apiClient } from "@/api/client";
import type {
  DeletePayload,
  DongMarker,
  DongMarkersParams,
  FeedParams,
  FeedResponse,
  LikeToggleResponse,
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
  DongMarker,
  DongMarkersParams,
  FeedParams,
  FeedResponse,
  LikeToggleResponse,
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
    query: params
  });
}

export function getDongMarkers(params: DongMarkersParams) {
  return apiClient<DongMarker[]>("/api/threads/map/dong", {
    method: "GET",
    query: params
  });
}
