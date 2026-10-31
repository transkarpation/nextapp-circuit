import "server-only";

const MAX_TITLE_LENGTH = 120;
// Документ Firestore обмежений 1 МіБ; найбільший шаблон займає близько 7 КБ.
const MAX_CONTENT_BYTES = 900_000;

/** Повертає текст помилки або null, якщо все гаразд. */
export function validateTitle(title: string): string | null {
  if (!title) return "Назва обов'язкова";
  if (title.length > MAX_TITLE_LENGTH) return `Назва довша за ${MAX_TITLE_LENGTH} символів`;
  return null;
}

/** Повертає текст помилки або null, якщо все гаразд. */
export function validateContent(content: unknown): string | null {
  if (typeof content !== "string") return "Текст схеми обов'язковий";
  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) return "Схема завелика";
  return null;
}
