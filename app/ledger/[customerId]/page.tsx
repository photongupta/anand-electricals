export const instant = false;

import { CustomerLedgerView } from "@/components/ledger/CustomerLedgerView";

export default async function CustomerLedgerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  return <CustomerLedgerView customerId={customerId} />;
}
