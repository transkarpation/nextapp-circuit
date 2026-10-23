"use client";

import { TodoApi } from "@app/sdk-api";
import { auth } from "./firebase.client";

// Інстанс SDK-клієнта для браузера: токен бере з поточного Firebase-користувача.
export const todoApi = new TodoApi({
  getToken: async () => {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  },
});
