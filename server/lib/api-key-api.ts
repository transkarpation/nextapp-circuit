"use client";

import { ApiKeyApi } from "@/lib/sdk";
import { auth } from "./firebase.client";

// Інстанс SDK-клієнта для браузера: токен бере з поточного Firebase-користувача.
export const apiKeyApi = new ApiKeyApi({
  getToken: async () => {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  },
});
