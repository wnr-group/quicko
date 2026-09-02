import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { SupportChat } from "@/components/SupportChat";
import { requireUser } from "@/lib/auth";
import { getMySupport } from "@/lib/queries/support";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ about?: string }>;
}) {
  const user = await requireUser();
  const { about } = await searchParams;
  const { thread, messages } = await getMySupport(user.id);

  // Deep-linked from a delivery → pre-fill a message with that context for the agent.
  const prefill = about ? `About my delivery ${about} — ` : "";

  return (
    <PhoneFrame>
      <TopBar title="Support" back />
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        <p className="mt-1 text-sm text-muted">
          Questions about a delivery, payment, or your account? We usually reply within a day.
        </p>
        <SupportChat
          threadId={thread?.id ?? null}
          status={thread?.status ?? null}
          prefill={prefill}
          messages={messages.map((m) => ({ id: m.id, fromStaff: m.fromStaff, body: m.body ?? "" }))}
        />
      </main>
    </PhoneFrame>
  );
}
