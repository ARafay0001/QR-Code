
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Mail, LockKeyhole } from "lucide-react";

const sections = [
  { id: "introduction", title: "1. Introduction" },
  { id: "information", title: "2. Information We Collect" },
  { id: "browser-processing", title: "3. Browser-Based Processing" },
  { id: "cookies", title: "4. Cookies and Similar Technologies" },
  { id: "analytics", title: "5. Analytics" },
  { id: "advertising", title: "6. Advertising and Third-Party Services" },
  { id: "sharing", title: "7. Data Sharing" },
  { id: "security", title: "8. Data Retention and Security" },
  { id: "rights", title: "9. Your Privacy Rights" },
  { id: "children", title: "10. Children's Privacy" },
  { id: "changes", title: "11. Changes to This Policy" },
  { id: "contact", title: "12. Contact Us" },
];

export default function PrivacyPolicy() {
  const effectiveDate = "October 24, 2026";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <header className="mb-10 rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <ShieldCheck size={30} />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Legal & Privacy
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-white">
            Privacy Policy
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-gray-600 dark:text-gray-400">
            Your privacy matters to us. This policy explains how Toolited
            handles information when you use our online tools.
          </p>

          <p className="mt-5 text-sm text-gray-500 dark:text-gray-500">
            Effective date: {effectiveDate}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-semibold text-gray-950 dark:text-white">
              On this page
            </h2>

            <nav aria-label="Privacy policy sections">
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-lg px-3 py-2 text-sm leading-5 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 sm:p-9 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-8 flex items-start gap-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40">
              <LockKeyhole
                className="mt-1 shrink-0 text-blue-600 dark:text-blue-400"
                size={20}
              />
              <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                Toolited is designed to provide useful online tools without
                requiring users to create an account. The handling of
                information depends on the tool and the services currently
                enabled on the website.
              </p>
            </div>

            <section id="introduction" className="scroll-mt-8">
              <h2 className="policy-heading">1. Introduction</h2>
              <p className="policy-text">
                Welcome to Toolited ("we," "our," or "us"). Toolited is an
                online platform providing browser-based tools for calculations,
                image processing, PDF tasks, text utilities, and other
                everyday activities.
              </p>
              <p className="policy-text">
                This Privacy Policy explains how information may be handled
                when you visit https://toolited.com/ and use our services.
              </p>
            </section>

            <section id="information" className="scroll-mt-8">
              <h2 className="policy-heading">2. Information We Collect</h2>
              <p className="policy-text">
                Toolited does not require an account to use its general tools.
                We do not intentionally collect personal information such as
                your name, home address, or phone number merely because you
                use the tools.
              </p>
              <p className="policy-text">
                Our hosting provider and other services involved in delivering
                the website may process technical information, such as IP
                addresses, browser type, device information, and access logs.
                If you contact us, we may receive the information you choose
                to provide, including your email address and message.
              </p>
            </section>

            <section id="browser-processing" className="scroll-mt-8">
              <h2 className="policy-heading">
                3. Browser-Based Processing and Files
              </h2>
              <p className="policy-text">
                Toolited's tools are designed to process files and user-provided
                content directly in your browser. Where processing takes place
                entirely on your device, that content is not uploaded to
                Toolited's servers for processing.
              </p>
              <p className="policy-text">
                Browser-based processing may temporarily use your device's
                memory. Processing behavior can differ when a tool relies on
                an external service or network request. We aim to describe
                such behavior accurately as our tools evolve.
              </p>
              <p className="policy-text">
                Avoid submitting sensitive or confidential information to an
                online tool unless you understand how that tool handles it.
              </p>
            </section>

            <section id="cookies" className="scroll-mt-8">
              <h2 className="policy-heading">
                4. Cookies and Similar Technologies
              </h2>
              <p className="policy-text">
                Cookies and similar technologies may be used by our website
                or third-party services for functionality, security, usage
                measurement, or advertising.
              </p>
              <p className="policy-text">
                You can manage or delete cookies through your browser settings.
                Blocking certain cookies may affect some website features.
                We will update this policy if our use of these technologies
                changes materially.
              </p>
            </section>

            <section id="analytics" className="scroll-mt-8">
              <h2 className="policy-heading">5. Analytics</h2>
              <p className="policy-text">
                Analytics services may be used to understand website traffic,
                identify popular tools, and improve the user experience.
                If Google Analytics or another analytics service is enabled
                on Toolited, it may process technical and usage information
                according to its configuration and applicable privacy policy.
              </p>
              <p className="policy-text">
                Analytics configured on a different website or deployment
                does not automatically apply to Toolited. This policy should
                be updated to reflect the actual analytics services enabled
                on this domain.
              </p>
            </section>

            <section id="advertising" className="scroll-mt-8">
              <h2 className="policy-heading">
                6. Advertising and Third-Party Services
              </h2>
              <p className="policy-text">
                Toolited does not currently display advertisements. We may
                introduce advertising services, such as Google AdSense, in
                the future.
              </p>
              <p className="policy-text">
                If advertising is introduced, providers may use cookies or
                similar technologies to serve, personalize, and measure ads,
                subject to applicable settings, policies, and laws.
              </p>
              <p className="policy-text">
                Toolited may also link to or rely on third-party services.
                Those services operate under their own privacy policies and
                practices.
              </p>
            </section>

            <section id="sharing" className="scroll-mt-8">
              <h2 className="policy-heading">7. Data Sharing</h2>
              <p className="policy-text">
                We do not sell personal information that we collect directly
                from users. Information may be processed or disclosed when
                necessary to operate the website, provide a requested service,
                maintain security, comply with legal obligations, or protect
                our rights.
              </p>
              <p className="policy-text">
                Third-party providers may process technical information as
                part of delivering their services.
              </p>
            </section>

            <section id="security" className="scroll-mt-8">
              <h2 className="policy-heading">
                8. Data Retention and Security
              </h2>
              <p className="policy-text">
                Browser-based processing may avoid transmitting your files
                to our servers. Information handled by your browser, hosting
                provider, or third-party services may be subject to their
                respective retention practices.
              </p>
              <p className="policy-text">
                We take reasonable steps to maintain a secure and reliable
                website. However, no website, internet transmission, or
                electronic storage system can be guaranteed to be completely
                secure.
              </p>
            </section>

            <section id="rights" className="scroll-mt-8">
              <h2 className="policy-heading">9. Your Privacy Rights</h2>
              <p className="policy-text">
                Depending on your location and applicable law, you may have
                rights to request access to, correction of, or deletion of
                personal information associated with you. You may also have
                rights to object to certain processing or withdraw consent
                where applicable.
              </p>
              <p className="policy-text">
                Contact us using the information below to submit a
                privacy-related request.
              </p>
            </section>

            <section id="children" className="scroll-mt-8">
              <h2 className="policy-heading">10. Children's Privacy</h2>
              <p className="policy-text">
                Toolited is a general-purpose website and is not specifically
                directed at children. We do not knowingly seek to collect
                personal information from children. If you believe a child
                has provided personal information to us, contact us so we
                can review the matter.
              </p>
            </section>

            <section id="changes" className="scroll-mt-8">
              <h2 className="policy-heading">
                11. Changes to This Privacy Policy
              </h2>
              <p className="policy-text">
                We may update this policy when our tools, analytics
                configuration, advertising arrangements, or legal obligations
                change. The latest version will be published on this page
                with an updated effective date. We encourage visitors to
                review this page periodically.
              </p>
            </section>

            <section id="contact" className="scroll-mt-8">
              <h2 className="policy-heading">12. Contact Us</h2>
              <p className="policy-text">
                If you have questions or concerns about this Privacy Policy
                or our privacy practices, contact us using the email address
                below.
              </p>

              <a
                href="mailto:toolitedbusiness@gmail.com"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-blue-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-800"
              >
                <Mail size={18} />
                toolitedbusiness@gmail.com
              </a>

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Replace this placeholder with your official contact email
                before publishing.
              </p>
            </section>

            <div className="mt-10 border-t border-gray-200 pt-6 dark:border-gray-800">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <ArrowLeft size={16} />
                Return to Toolited
              </Link>
            </div>
          </article>
        </div>

        <footer className="mt-10 text-center text-sm text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} Toolited. All rights reserved.
        </footer>
      </div>

      <style>{`
        .policy-heading {
          margin-top: 2.25rem;
          margin-bottom: 0.85rem;
          font-size: 1.25rem;
          line-height: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: inherit;
        }

        .policy-text {
          margin-bottom: 1rem;
          font-size: 0.95rem;
          line-height: 1.85;
          color: inherit;
          opacity: 0.88;
        }

        .policy-heading:first-child {
          margin-top: 0;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </main>
  );
}
