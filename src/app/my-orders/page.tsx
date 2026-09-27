import type { Metadata } from "next";
import { currentBuyer, ordersFor } from "@/lib/portal";
import Portal from "@/components/Portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders",
  description:
    "Check the status of your enquiries, see past specifications and reorder in one click. No account needed — sign in with the phone number you enquired from.",
  robots: { index: false, follow: false },
};

export default async function MyOrdersPage() {
  const phone = await currentBuyer();
  const orders = phone ? ordersFor(phone) : [];
  return <Portal signedIn={!!phone} orders={JSON.parse(JSON.stringify(orders))} />;
}
