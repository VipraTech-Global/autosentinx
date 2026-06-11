import { ProcessingView } from "@/components/processing-view";

export default async function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProcessingView runId={id} />;
}
