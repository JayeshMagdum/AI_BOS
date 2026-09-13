import { redirect } from "next/navigation";

// Root path redirects to /login.
// Once auth context is wired up (Day 3), this will check for a valid
// session cookie first and forward authenticated users straight to /dashboard.
export default function RootPage() {
  redirect("/login");
}
