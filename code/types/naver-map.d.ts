export {};

declare global {
  type NaverMapsLatLng = {
    readonly __naverMapsLatLng: unique symbol;
  };

  interface NaverMapsMap {
    panTo(position: NaverMapsLatLng): void;
  }

  type NaverMapsMarker = {
    readonly __naverMapsMarker: unique symbol;
  };

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
    }) => NaverMapsMarker;
    Event: {
      addListener(target: NaverMapsMarker, eventName: "click", handler: () => void): void;
    };
  }

  interface Window {
    naver?: {
      maps?: NaverMapsNamespace;
    };
  }
}
