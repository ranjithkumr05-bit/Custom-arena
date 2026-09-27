import type { Metadata } from "next";
import { isAuthed } from "@/lib/auth";
import { listRfqs } from "@/lib/db";
import { artProgress, catalogHistory, resolveCatalog } from "@/lib/catalog";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  if (!(await isAuthed())) return <AdminLogin />;

  const sp = await searchParams;
  const rows = listRfqs({ status: sp.status, q: sp.q });

  return (
    <AdminDashboard
      rfqs={JSON.parse(JSON.stringify(rows))}
      catalog={JSON.parse(JSON.stringify(resolveCatalog()))}
      history={JSON.parse(JSON.stringify(catalogHistory()))}
      art={artProgress()}
      filter={{ status: sp.status ?? "all", q: sp.q ?? "" }}
    />
  );
}
