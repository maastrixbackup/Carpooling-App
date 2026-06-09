import { API_URL } from "@/config/apiConfig";
import { logger } from "@/lib/logger";
import { getAccessToken } from "@/lib/storage";

export async function apiClient(
  endpoint: string,
  options: RequestInit & {
    auth?: boolean;
  } = {},
) {
  const token = await getAccessToken();
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const hasBody =
    options.body !== undefined && options.body !== null && options.body !== "";

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let requestBodyForLog: any = undefined;

  if (hasBody && typeof options.body === "string") {
    try {
      requestBodyForLog = JSON.parse(options.body);
    } catch {
      requestBodyForLog = options.body;
    }
  }

  logger.request(url, options.method || "GET", requestBodyForLog);

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (!hasBody) {
    delete fetchOptions.body;
  }

  try {
    const response = await fetch(url, fetchOptions);

    const text = await response.text();

    let data: any = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: false,
          message: text,
        };
      }
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
  } catch (error) {
    logger.error(url, error);
    throw error;
  }
}
