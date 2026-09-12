import { redirect } from "next/navigation";

// Root path just forwards into the app shell for now.
// Once Step 2 (Auth UI) exists, this will redirect to /login
// for unauthenticated users instead.
export default function RootPage() {
  redirect("/dashboard");
}
