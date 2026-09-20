import { redirect } from "next/navigation";

export default async function OrganizationRootPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  redirect(`/app/o/${organizationId}/dashboard`);
}
