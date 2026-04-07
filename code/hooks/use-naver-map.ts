"use client";

import { useEffect, useState } from "react";

type NaverMapStatus = "idle" | "loading" | "ready" | "error";

const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";

let scriptLoadingPromise: Promise<void> | null = null;

function loadNaverMapSdk(clientId: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Naver Map SDK can only be loaded in the browser."));
  }

  if (window.naver?.maps) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Naver Map SDK.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.id = NAVER_MAP_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;

    script.onload = () => {
      if (window.naver?.maps) {
        resolve();
        return;
      }

      reject(new Error("Naver Map SDK loaded, but window.naver.maps is unavailable."));
    };

    script.onerror = () => {
      reject(new Error("Failed to load Naver Map SDK."));
    };

    document.head.appendChild(script);
  }).catch((error) => {
    scriptLoadingPromise = null;
    throw error;
  });

  return scriptLoadingPromise;
}

export function useNaverMap(clientId?: string) {
  const [status, setStatus] = useState<NaverMapStatus>(clientId ? "loading" : "error");
  const [error, setError] = useState<string | null>(
    clientId ? null : "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다."
  );

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let cancelled = false;

    loadNaverMapSdk(clientId)
      .then(() => {
        if (!cancelled) {
          setStatus("ready");
        }
      })
      .catch((sdkError: Error) => {
        if (!cancelled) {
          setStatus("error");
          setError(sdkError.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return {
    error,
    isReady: status === "ready",
    status
  };
}
