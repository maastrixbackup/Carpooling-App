import { API_URL } from "@/config/apiConfig";
import { logger } from "@/lib/logger";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
} from "@/lib/storage";

let refreshPromise: Promise<string | null> | null = null;

type ApiClientOptions = RequestInit & {
  auth?: boolean;
  _retry?: boolean;
  isFormData?: boolean;
};

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        await clearAuthTokens();
        return null;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        await clearAuthTokens();
        return null;
      }

      const accessToken =
        data?.data?.access_token || data?.access_token || null;

      const newRefreshToken =
        data?.data?.refresh_token || data?.refresh_token || refreshToken;

      if (!accessToken) {
        await clearAuthTokens();
        return null;
      }

      await saveAuthTokens({
        accessToken,
        refreshToken: newRefreshToken,
      });

      return accessToken;
    } catch {
      await clearAuthTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: text,
    };
  }
}

function buildHeaders(options: ApiClientOptions, token?: string | null) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const hasBody =
    options.body !== undefined && options.body !== null && options.body !== "";

  if (hasBody && !options.isFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function getBodyForLog(options: RequestInit) {
  if (!options.body || typeof options.body !== "string") return undefined;

  try {
    return JSON.parse(options.body);
  } catch {
    return options.body;
  }
}

export async function apiClient(
  endpoint: string,
  options: ApiClientOptions = {},
) {
  const url = `${API_URL}${endpoint}`;
  const token = await getAccessToken();

  const hasBody =
    options.body !== undefined && options.body !== null && options.body !== "";

  const headers = buildHeaders(options, token);
  const { isFormData, _retry, auth, ...cleanOptions } = options;

  const fetchOptions: RequestInit = {
    ...cleanOptions,
    headers,
  };

  if (!hasBody) {
    delete fetchOptions.body;
  }

  logger.request(url, options.method || "GET", getBodyForLog(options));

  const response = await fetch(url, fetchOptions);
  const data = await parseResponse(response);

  if (response.status === 401 && options.auth !== false && !options._retry) {
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      logger.error(url, {
        status: response.status,
        data,
      });

      throw new Error("Session expired. Please login again.");
    }

    return apiClient(endpoint, {
      ...options,
      _retry: true,
    });
  }

  if (!response.ok) {
    logger.error(url, {
      status: response.status,
      data,
    });

    throw new Error(data?.message || "Something went wrong");
  }

  logger.response(url, data);

  return data;
}
