import { TopBar } from "@/components/topbar";
import { BottomNav } from "@/components/bottom-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1 pb-20 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
