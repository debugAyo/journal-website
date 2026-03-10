import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-[var(--gray-50)]">
        <DashboardSidebar />
        <main className="lg:pl-64">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
