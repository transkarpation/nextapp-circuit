"use client";

import { AccountApi } from "@/lib/sdk";
import { auth } from "./firebase.client";

// Інстанс клієнта "мого акаунта" для браузера: токен — від поточного Firebase-юзера.
export const accountApi = new AccountApi({
  getToken: async () => {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  },
});
