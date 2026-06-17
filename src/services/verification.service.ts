// services/verification.service.ts

import { apiClient } from "@/lib/apiClient";

export function getVerificationProfileApi() {
  return apiClient("/verification/me", {
    method: "GET",
  });
}

export function updateVerificationProfileApi(payload: any) {
  return apiClient("/verification/profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitAadhaarApi(payload: { aadhaarNumber: string }) {
  return apiClient("/verification/aadhaar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitBankDetailsApi(payload: any) {
  return apiClient("/verification/bank", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkCanRedeemApi() {
  return apiClient("/verification/can-redeem", {
    method: "GET",
  });
}
