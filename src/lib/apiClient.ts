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

  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  logger.request(
    url,
    options.method || "GET",
    options.body ? JSON.parse(options.body as string) : undefined,
  );

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(url, {
        status: response.status,
        data,
      });

      throw new Error(data.message || "Something went wrong");
    }

    logger.response(url, data);

    return data;
  } catch (error) {
    logger.error(url, error);
    throw error;
  }
}
