import { ContractDetailClient } from "./ContractDetailClient";

export const metadata = { title: "Contrato" };

export default async function ContractPage({ params }: PageProps<"/app/o/[organizationId]/contracts/[contractId]">) {
  const { contractId } = await params;
  return <ContractDetailClient contractId={contractId} />;
}
