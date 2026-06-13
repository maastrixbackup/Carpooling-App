import { apiClient } from "@/lib/apiClient";

export function getMyChatRoomsApi() {
  return apiClient("/chats/my-rooms", {
    method: "GET",
  });
}

export function getRoomByBookingApi(bookingId: string) {
  return apiClient(`/chats/booking/${bookingId}`, {
    method: "GET",
  });
}

export function getChatMessagesApi(roomId: string) {
  return apiClient(`/chats/${roomId}/messages`, {
    method: "GET",
  });
}

export function sendChatMessageApi(roomId: string, message: string) {
  return apiClient(`/chats/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function markChatReadApi(roomId: string) {
  return apiClient(`/chats/${roomId}/read`, {
    method: "PATCH",
  });
}
