export {};

declare global {
  type NaverMapsLatLng = {
    readonly __naverMapsLatLng: unique symbol;
    lat(): number;
    lng(): number;
  };

  interface NaverMapsMap {
    panTo(position: NaverMapsLatLng): void;
    setZoom(zoom: number): void;
    getZoom(): number;
    getCenter(): NaverMapsLatLng;
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
    };
  }

  interface Window {
    naver?: {
      maps?: NaverMapsNamespace;
    };
  }
}
