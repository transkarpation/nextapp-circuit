import { redirect } from "next/navigation";

export default function Home() {
  // Головна одразу веде на список схем; він сам перенаправить на /login, якщо не залогінений.
  redirect("/circuits");
}
