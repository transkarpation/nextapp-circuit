"use client";

import { EthoraAdminApi } from "@/lib/sdk";
import { auth } from "./firebase.client";

// Інстанс клієнта Ethora-адмінки для браузера: токен — від поточного Firebase-юзера.
// Сам Ethora SDK живе на сервері (у /api/ethora), сюди він не потрапляє.
export const ethoraAdminApi = new EthoraAdminApi({
  getToken: async () => {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  },
});
