import { getSession } from "@/lib/oidc";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

  redirect("https://tdb.tadgroupe.com/");
}
