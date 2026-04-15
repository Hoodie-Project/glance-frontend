export type ThreadMarker = {
  id: string;
  title: string;
  tag: string;
  dong: string;
  gu: string;
  city: string;
  metro: string;
  summary: string;
  createdAt: string;
  lat: number;
  lng: number;
};

type Coordinate = {
  lat: number;
  lng: number;
};

const OFFSETS: Array<[number, number]> = [
  [0.0, 0.0],
  [0.0006, 0.0004],
  [-0.0005, 0.0007],
  [0.0008, -0.0003],
  [-0.0007, -0.0005],
  [0.0011, 0.0002],
  [-0.001, 0.0001],
  [0.0004, -0.0009],
  [-0.0002, 0.001],
  [0.0013, -0.0006],
  [-0.0012, -0.0004],
  [0.0009, 0.0009],
  [-0.0009, 0.0008],
  [0.0014, 0.0005],
  [-0.0013, 0.0006],
  [0.0003, -0.0012],
  [-0.0004, -0.0011],
  [0.001, -0.001],
  [-0.0011, 0.0011],
  [0.0015, -0.0002],
  [-0.0014, -0.0001],
  [0.0007, 0.0013],
  [-0.0008, 0.0012],
  [0.0012, -0.0013],
  [-0.0012, -0.0012],
  [0.0016, 0.0008],
  [-0.0015, 0.0009],
  [0.0005, -0.0015],
  [-0.0006, -0.0014],
  [0.0017, -0.0009]
];

function createRegionMarkers(
  region: string,
  center: Coordinate,
  titlePrefix: string,
  summary: string,
  admin: {
    dong: string;
    gu: string;
    city: string;
    metro: string;
  }
) {
  return OFFSETS.map(([latOffset, lngOffset], index) => ({
    id: `${region}-${index + 1}`,
    title: `${titlePrefix} ${index + 1}`,
    tag: region,
    dong: admin.dong,
    gu: admin.gu,
    city: admin.city,
    metro: admin.metro,
    summary,
    createdAt: `${index + 1}분 전`,
    lat: Number((center.lat + latOffset).toFixed(6)),
    lng: Number((center.lng + lngOffset).toFixed(6))
  }));
}

export const threadMarkers: ThreadMarker[] = [
  ...createRegionMarkers(
    "원흥",
    { lat: 37.6509, lng: 126.8738 },
    "원흥 근처 지금 사람 많아요",
    "상가 쪽 유동인구 많고 메인 도로는 조금 붐비는 편입니다.",
    {
      dong: "원흥동",
      gu: "덕양구",
      city: "고양시",
      metro: "경기도"
    }
  ),
  ...createRegionMarkers(
    "원당",
    { lat: 37.6532, lng: 126.8433 },
    "원당역 앞 분위기 조용해요",
    "역 앞은 한산하고 골목 안쪽에만 조금 사람 있습니다.",
    {
      dong: "성사동",
      gu: "덕양구",
      city: "고양시",
      metro: "경기도"
    }
  ),
  ...createRegionMarkers(
    "삼송",
    { lat: 37.6531, lng: 126.8957 },
    "삼송역 주변 카페 자리 있어요",
    "역 근처는 무난하고 카페 쪽은 아직 여유 있습니다.",
    {
      dong: "삼송동",
      gu: "덕양구",
      city: "고양시",
      metro: "경기도"
    }
  )
];
