export const SOCKET_EVENTS = {
  // Generic
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Chat
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",

  // Ride tracking
  RIDE_TRACKING_JOIN: "ride:tracking:join",
  RIDE_TRACKING_JOINED: "ride:tracking:joined",
  RIDE_TRACKING_LEAVE: "ride:tracking:leave",
  RIDE_TRACKING_LEFT: "ride:tracking:left",
  RIDE_TRACKING_UPDATE: "ride:tracking:update",
  RIDE_TRACKING_SNAPSHOT: "ride:tracking:snapshot",
  RIDE_TRACKING_STOPPED: "ride:tracking:stopped",
  RIDE_TRACKING_STOP: "ride:tracking:stop",
  RIDE_TRACKING_ERROR: "ride:tracking:error",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
