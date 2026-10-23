// Firebase Admin SDK — тільки сервер. Має повний доступ до Firestore,
// тож саме тут ми перевіряємо ID-токени й пишемо записи.
import "server-only";
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // У .env ключ зберігається одним рядком з \n — розгортаємо назад у переноси.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Відсутні змінні Firebase Admin: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

// Лінива ініціалізація: піднімаємо Admin SDK лише при першому зверненні (під час запиту),
// а не на імпорті модуля — інакше збірка падала б без креденшелів.
export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
