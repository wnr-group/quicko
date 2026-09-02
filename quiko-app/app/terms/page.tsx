import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";

export const metadata = { title: "Terms & Conditions · Quiko" };

export default function TermsPage() {
  return (
    <PhoneFrame>
      <TopBar title="Terms & Conditions" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
        <p className="mt-2 text-[13px] text-muted">Last updated: August 2026</p>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          Welcome to Quiko. These terms govern your use of the Quiko peer-to-peer
          delivery platform, which connects people sending packages (&ldquo;Senders&rdquo;)
          with travellers already heading the same way (&ldquo;Travellers&rdquo;). By using
          Quiko you agree to these terms.
        </p>

        <Section n="1" title="Who can use Quiko">
          You must be at least 18 years old and able to enter a binding contract.
          You&rsquo;re responsible for keeping your account and phone number secure, and
          for everything that happens under your account.
        </Section>

        <Section n="2" title="How it works">
          Senders post a package with its route, weight and a short description.
          Travellers post trips with spare capacity. When both sides agree, a match
          is created. Quiko is a marketplace that introduces the two parties — the
          delivery itself is carried out directly between the Sender and Traveller.
        </Section>

        <Section n="3" title="Prohibited items">
          You may not send anything illegal, dangerous, perishable, or restricted —
          including cash, weapons, drugs, flammable or hazardous goods, live animals,
          or counterfeit items. Senders are responsible for the contents they hand
          over; Travellers may refuse or inspect any package.
        </Section>

        <Section n="4" title="Payments & fees">
          The price for a delivery is calculated automatically from distance, weight
          and how quickly it must arrive. Payment is held securely until the delivery
          is confirmed with the recipient&rsquo;s OTP, then released to the Traveller.
          Quiko charges a small service fee on each completed delivery.
        </Section>

        <Section n="5" title="Cancellations">
          A Sender or Traveller may cancel before a package is picked up. Once a
          delivery is in progress, cancellations are handled case by case. Repeated
          no-shows or cancellations may limit your access to the platform.
        </Section>

        <Section n="6" title="Responsibility & liability">
          Quiko provides the platform but is not a courier and does not take
          possession of packages. Travellers carry packages at the agreed value
          declared by the Sender. To the extent permitted by law, Quiko is not liable
          for loss or damage arising from the conduct of Senders, Travellers or third
          parties.
        </Section>

        <Section n="7" title="Your conduct">
          Be honest and respectful. Don&rsquo;t misrepresent packages or trips, harass
          other users, or attempt to move payments off the platform. We may suspend
          accounts that break these rules.
        </Section>

        <Section n="8" title="Changes to these terms">
          We may update these terms from time to time. If we make material changes,
          we&rsquo;ll let you know in the app. Continuing to use Quiko means you accept
          the updated terms.
        </Section>

        <Section n="9" title="Contact">
          Questions about these terms? Reach us at{" "}
          <a href="mailto:support@quiko.app" className="font-semibold text-info">support@quiko.app</a>.
        </Section>

        <p className="mt-8 rounded-xl bg-neutral-100 px-3 py-2.5 text-[12px] leading-snug text-muted">
          This is a placeholder agreement for the current build and should be
          reviewed by legal counsel before launch.
        </p>
      </div>
    </PhoneFrame>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[15px] font-bold">{n}. {title}</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{children}</p>
    </section>
  );
}
