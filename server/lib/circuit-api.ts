"use client";

import { CircuitApi } from "@/lib/sdk";
import { auth } from "./firebase.client";

// Інстанс SDK-клієнта для браузера: токен бере з поточного Firebase-користувача.
export const circuitApi = new CircuitApi({
  getToken: async () => {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  },
});
