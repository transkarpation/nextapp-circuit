import { redirect } from "next/navigation";

export default function Home() {
  // Головна одразу веде на сторінку todo; вона сама перенаправить на /login, якщо не залогінений.
  redirect("/todos");
}
