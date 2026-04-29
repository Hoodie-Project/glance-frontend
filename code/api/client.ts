export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
  query?: Record<string, string | number | boolean | null | undefined>;
};

function getApiBaseUrl() {
  const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

  if (typeof window !== "undefined") {
    return publicBaseUrl.startsWith("http") ? "" : publicBaseUrl;
  }

  return (process.env.API_BASE_URL ?? publicBaseUrl).replace(/\/+$/, "");
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${getApiBaseUrl()}${normalizedPath}`, "http://local-api-base");

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  const isRelative = getApiBaseUrl() === "";
  return isRelative ? `${url.pathname}${url.search}` : url.toString();
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiClient<T>(path: string, options: RequestOptions = {}) {
  const { body, headers, query, ...rest } = options;

  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof URLSearchParams || typeof body === "string") {
      requestBody = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: requestHeaders,
    body: requestBody
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError("API request failed", response.status, payload);
  }

  return payload as T;
}
