import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";

export const metadata = { title: "Privacy Policy · Quiko" };

export default function PrivacyPage() {
  return (
    <PhoneFrame>
      <TopBar title="Privacy Policy" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
        <p className="mt-2 text-[13px] text-muted">Last updated: August 2026</p>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          This policy explains what information Quiko collects, how we use it, and
          the choices you have. We collect only what we need to match Senders and
          Travellers and complete deliveries safely.
        </p>

        <Section n="1" title="Information we collect">
          Your phone number (to sign in), your name and email, and the pickup and
          drop-off locations you pin for packages and trips. We also keep records of
          your requests, matches, deliveries and ratings.
        </Section>

        <Section n="2" title="How we use it">
          To create your account, match you with the other side of a delivery,
          calculate prices, process payments, send you updates and notifications,
          and keep the platform safe from fraud and misuse.
        </Section>

        <Section n="3" title="What we share">
          When you match with someone, we share the details needed to complete the
          delivery — such as names, the package or trip route, and the receiver&rsquo;s
          contact for hand-off. We use trusted service providers (for SMS, maps and
          payments) who process data on our behalf. We do not sell your data.
        </Section>

        <Section n="4" title="Location data">
          Pickup and destination pins are used to match routes and estimate distance
          and price. We use a map provider to turn coordinates into readable place
          names. We don&rsquo;t track your live location in the background.
        </Section>

        <Section n="5" title="Data retention">
          We keep your information for as long as your account is active and as needed
          to provide the service, resolve disputes, and meet legal obligations.
        </Section>

        <Section n="6" title="Your rights">
          You can view and edit your name and email in your profile at any time. You
          may request a copy of your data or ask us to delete your account by
          contacting us.
        </Section>

        <Section n="7" title="Security">
          We protect your account with one-time-code sign-in and store data securely.
          No system is perfectly secure, so please keep your phone and account safe.
        </Section>

        <Section n="8" title="Changes">
          We may update this policy as Quiko evolves. Material changes will be
          notified in the app.
        </Section>

        <Section n="9" title="Contact">
          Privacy questions? Email us at{" "}
          <a href="mailto:privacy@quiko.app" className="font-semibold text-info">privacy@quiko.app</a>.
        </Section>

        <p className="mt-8 rounded-xl bg-surface px-3 py-2.5 text-[13px] leading-snug text-muted">
          This is a placeholder policy for the current build and should be reviewed by
          legal counsel before launch.
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
