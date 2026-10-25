"use client";

import { AdminApi } from "@/lib/sdk";
import { auth } from "./firebase.client";

// Інстанс адмін-клієнта для браузера: токен бере з поточного Firebase-користувача.
export const adminApi = new AdminApi({
  getToken: async () => {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  },
});
