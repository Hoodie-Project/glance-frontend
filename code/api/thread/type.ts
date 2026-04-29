export type ThreadGender = "MALE" | "FEMALE";

export type AnimalLook =
  | "DOG"
  | "CAT"
  | "FOX"
  | "RABBIT"
  | "DINOSAUR"
  | "DEER"
  | "WOLF"
  | "HAMSTER"
  | "BEAR";

export type VibeStyle =
  | "COLD_HANDSOME"
  | "COLD_BEAUTY"
  | "WARM_HANDSOME"
  | "WARM_BEAUTY"
  | "HARMLESS"
  | "DECADENT"
  | "CLASSIC_HANDSOME"
  | "CLASSIC_BEAUTY"
  | "FRESH";

export type Region = {
  id: number;
  sido: string;
  sigungu: string;
  dong: string;
};

export type ThreadSummary = {
  id: number;
  nickname: string;
  title: string;
  content: string;
  latitude: number;
  longitude: number;
  region: Region | null;
  tags: string[];
  gender: ThreadGender;
  animalLooks: AnimalLook[];
  vibeStyles: VibeStyle[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

export type CommentResponse = {
  id: number;
  nickname: string;
  content: string;
  likeCount: number;
  createdAt: string;
};

export type ThreadDetail = ThreadSummary & {
  comments: CommentResponse[];
};

export type ThreadCreatePayload = {
  nickname: string;
  title: string;
  content: string;
  latitude: number;
  longitude: number;
  gender: ThreadGender;
  password?: string;
  tags: string[];
  animalLooks?: AnimalLook[];
  vibeStyles?: VibeStyle[];
};

export type ThreadCreateResponse = ThreadSummary & {
  generatedPassword: string | null;
};

export type SearchThreadsParams = {
  tag: string;
  page?: number;
  size?: number;
};

export type PageResponse<T> = {
  totalElements: number;
  totalPages: number;
  size: number;
  content: T[];
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

export type FeedParams = {
  cursor?: number;
  size?: number;
};

export type FeedResponse = {
  threads: ThreadSummary[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type NearbyFeedParams = {
  lat: number;
  lng: number;
  radius?: "0.5" | "2" | "5";
  cursor?: number;
  size?: number;
};

export type MapPinsParams = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  gender: "ALL" | ThreadGender;
};

export type ThreadPin = {
  id: number;
  latitude: number;
  longitude: number;
};

export type DongMarkersParams = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

export type DongMarker = {
  sido: string;
  sigungu: string;
  dong: string;
  count: number;
  lat: number;
  lng: number;
};

export type DeletePayload = {
  password: string;
};

export type LikeToggleResponse = {
  liked: boolean;
  likeCount: number;
};
