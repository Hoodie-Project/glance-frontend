export {};

declare global {
  type NaverMapsLatLng = {
    readonly __naverMapsLatLng: unique symbol;
    lat(): number;
    lng(): number;
  };

  type NaverMapsBounds = {
    getSW(): NaverMapsLatLng;
    getNE(): NaverMapsLatLng;
  };

  interface NaverMapsMap {
    panTo(position: NaverMapsLatLng): void;
    setZoom(zoom: number): void;
    getZoom(): number;
    getCenter(): NaverMapsLatLng;
    getBounds(): NaverMapsBounds;
  }

  interface NaverMapsMarker {
    setMap(map: NaverMapsMap | null): void;
  }

  interface NaverMapsNamespace {
    LatLng: new (lat: number, lng: number) => NaverMapsLatLng;
    Map: new (
      element: HTMLElement,
      options: {
        center: NaverMapsLatLng;
        zoom: number;
        minZoom: number;
        scaleControl: boolean;
        logoControl: boolean;
        mapDataControl: boolean;
      }
    ) => NaverMapsMap;
    Marker: new (options: {
      map: NaverMapsMap;
      position: NaverMapsLatLng;
      title: string;
      icon?: {
        content: string;
        anchor?: {
          x: number;
          y: number;
        };
      };
    }) => NaverMapsMarker;
    Event: {
      addListener(target: NaverMapsMarker, eventName: "click", handler: () => void): void;
      addListener(target: NaverMapsMap, eventName: "zoom_changed", handler: () => void): void;
      addListener(target: NaverMapsMap, eventName: "idle", handler: () => void): void;
      addListener(target: NaverMapsMap, eventName: "click", handler: () => void): void;
    };
    Service?: {
      Status: {
        OK: string;
      };
      OrderType: {
        ADDR: string;
        ROAD_ADDR: string;
      };
      reverseGeocode(
        options: {
          coords: NaverMapsLatLng;
          orders?: string;
        },
        callback: (status: string, response?: NaverReverseGeocodeResponse) => void
      ): void;
    };
  }

  type NaverReverseGeocodeResponse = {
    v2?: {
      address?: {
        roadAddress?: string;
        jibunAddress?: string;
      };
      results?: Array<{
        region?: {
          area1?: { name?: string };
          area2?: { name?: string };
          area3?: { name?: string };
        };
      }>;
    };
  };

  interface Window {
    naver?: {
      maps?: NaverMapsNamespace;
    };
  }
}
