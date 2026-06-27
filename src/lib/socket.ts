import { getAccessToken } from "@/lib/storage";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

let socketInstance: Socket | null = null;

export async function getAuthenticatedSocket() {
  if (!SOCKET_URL) {
    throw new Error("Missing EXPO_PUBLIC_SOCKET_URL");
  }

  const token = await getAccessToken();

  if (!token) {
    throw new Error("Missing access token");
  }

  if (socketInstance?.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: false,
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socketInstance.connect();

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function getSocketInstance() {
  return socketInstance;
}
