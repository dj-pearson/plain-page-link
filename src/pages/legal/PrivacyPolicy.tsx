export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              AgentBio.net ("we," "us," "our," or "Platform") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p className="mb-4">
              By using AgentBio.net, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide Directly</h3>
            <p className="mb-4">We collect information that you voluntarily provide to us, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Registration:</strong> Full name, username, email address, password (encrypted), phone number</li>
              <li><strong>Profile Information:</strong> Professional bio, headshot/profile photo, real estate license number(s), brokerage affiliation, office location (city and state), states where licensed, years of experience, specialties, service areas</li>
              <li><strong>Listing Content:</strong> Property photos, descriptions, pricing information, addresses, features, square footage, and other property details</li>
              <li><strong>Payment Information:</strong> Credit card information, billing address (processed and stored by our payment processor Stripe; we do not store complete credit card numbers)</li>
              <li><strong>Communication Data:</strong> Messages you send through our platform, customer support inquiries, feedback, and survey responses</li>
              <li><strong>Marketing Preferences:</strong> Email subscription preferences, SMS opt-in status, communication preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <p className="mb-4">When you use our Platform, we automatically collect certain information, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on pages, links clicked, search queries, referral sources</li>
              <li><strong>Device Information:</strong> IP address, browser type and version, device type, operating system, unique device identifiers</li>
              <li><strong>Location Data:</strong> General geographic location based on IP address (city/state level, not precise GPS)</li>
              <li><strong>Cookies and Tracking Technologies:</strong> Session cookies, persistent cookies, web beacons, analytics data (see Section 9 for details)</li>
              <li><strong>Log Data:</strong> Access times, error logs, crash data, API calls</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Information from Third-Party Sources</h3>
            <p className="mb-4">We may receive information from:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Public Records:</strong> State real estate commission license verification databases (to verify active licenses)</li>
              <li><strong>Social Media:</strong> If you link your social media accounts, we may receive profile information you choose to share</li>
              <li><strong>Payment Processors:</strong> Transaction confirmation and payment status from Stripe</li>
              <li><strong>Analytics Services:</strong> Aggregated usage statistics from Google Analytics or similar services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use your personal information for the following purposes:</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Service Provision</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Create and maintain your account</li>
              <li>Display your agent profile and listings to potential clients</li>
              <li>Process subscription payments and manage billing</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send transactional emails (account confirmations, password resets, billing notifications, account updates)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Platform Improvement and Analytics</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Analyze usage patterns to improve user experience</li>
              <li>Conduct research and development for new features</li>
              <li>Monitor platform performance and fix technical issues</li>
              <li>Perform data analytics and statistical analysis</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Marketing and Communications (With Your Consent)</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Send marketing emails about new features, tips, and platform updates (only if you opt-in)</li>
              <li>Send SMS marketing messages (only with prior express written consent)</li>
              <li>Conduct surveys and request feedback</li>
              <li>Promote your listings to interested buyers (this is a core platform feature)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Legal Compliance and Safety</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Comply with legal obligations, court orders, and regulatory requirements</li>
              <li>Enforce our Terms of Service, DMCA Policy, and Acceptable Use Policy</li>
              <li>Detect, prevent, and address fraud, security issues, and technical problems</li>
              <li>Respond to Fair Housing complaints and copyright infringement notices</li>
              <li>Verify real estate license status to maintain platform integrity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
            <p className="mb-4">
              <strong>We do NOT sell your personal information to third parties.</strong> We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Public Profile Information</h3>
            <p className="mb-4">
              Your agent profile, including your name, photo, bio, license information, brokerage affiliation, and listings, is publicly displayed to all Platform visitors. This is the core purpose of the Platform—to showcase your professional profile to potential clients.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Third-Party Service Providers</h3>
            <p className="mb-4">We share information with trusted service providers who assist us in operating our Platform:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Payment Processing:</strong> Stripe (payment processing, subscription management, fraud detection)</li>
              <li><strong>Email Services:</strong> SendGrid or similar (transactional and marketing emails)</li>
              <li><strong>Cloud Hosting:</strong> AWS, Google Cloud, or similar (data storage and platform hosting)</li>
              <li><strong>Analytics:</strong> Google Analytics or similar (usage analytics and reporting)</li>
              <li><strong>Customer Support:</strong> Support ticket systems and live chat providers</li>
              <li><strong>Security Services:</strong> DDoS protection, firewall services, security monitoring</li>
            </ul>
            <p className="mb-4">
              These service providers are contractually obligated to protect your information and use it only for the purposes we specify.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Legal Requirements</h3>
            <p className="mb-4">We may disclose your information to comply with:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Legal processes (subpoenas, court orders, legal proceedings)</li>
              <li>Law enforcement requests</li>
              <li>Regulatory requirements (e.g., Iowa Attorney General data breach notifications)</li>
              <li>National security requirements</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Business Transfers</h3>
            <p className="mb-4">
              If AgentBio.net is involved in a merger, acquisition, asset sale, or bankruptcy, your information may be transferred to the successor entity. You will be notified of any such change via email and/or prominent notice on our Platform.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.5 With Your Consent</h3>
            <p className="mb-4">
              We may share your information for any other purpose with your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Email and SMS Marketing Communications</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Email Marketing (CAN-SPAM Compliance)</h3>
            <p className="mb-4">
              We comply with the CAN-SPAM Act (15 U.S.C. § 7701) for all commercial email communications. All marketing emails include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Clear identification as an advertisement</li>
              <li>Our valid physical postal address</li>
              <li>A clear and conspicuous unsubscribe mechanism</li>
              <li>Accurate "From" and subject line information</li>
            </ul>
            <p className="mb-4">
              You may opt out of marketing emails at any time by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Clicking the "Unsubscribe" link in any marketing email</li>
              <li>Updating your preferences in your account settings</li>
              <li>Emailing privacy@agentbio.net with "Unsubscribe" in the subject line</li>
            </ul>
            <p className="mb-4">
              We will process opt-out requests within <strong>10 business days</strong>. Note that you cannot opt out of transactional emails (account confirmations, password resets, billing notifications).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 SMS Marketing (TCPA Compliance)</h3>
            <p className="mb-4">
              We comply with the Telephone Consumer Protection Act (47 U.S.C. § 227) for all SMS marketing. We will NEVER send you marketing text messages unless you provide <strong>Prior Express Written Consent</strong> by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Checking a clear consent checkbox</li>
              <li>Providing your mobile phone number</li>
              <li>Acknowledging that you're agreeing to receive automated marketing texts</li>
              <li>Understanding that consent is not required to purchase services</li>
            </ul>
            <p className="mb-4">
              If you opt in to SMS marketing:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Message frequency varies (typically 2-4 messages per month)</li>
              <li>Standard message and data rates apply</li>
              <li>Reply STOP to opt out at any time</li>
              <li>Reply HELP for assistance</li>
              <li>We will honor opt-outs within 10 business days</li>
              <li>We will not send messages before 8 AM or after 9 PM in your local time zone</li>
            </ul>
            <p className="mb-4">
              Transactional SMS messages (appointment confirmations, account security alerts) require only basic consent and are not subject to the same restrictions as marketing messages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Technical Safeguards</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Encryption:</strong> HTTPS/TLS encryption for all data in transit</li>
              <li><strong>Database Encryption:</strong> Encryption at rest for sensitive data</li>
              <li><strong>Password Security:</strong> Passwords hashed using bcrypt or Argon2</li>
              <li><strong>Access Controls:</strong> Role-based access permissions for admin accounts</li>
              <li><strong>Two-Factor Authentication:</strong> Available for account protection</li>
              <li><strong>Security Monitoring:</strong> Continuous monitoring for suspicious activity</li>
              <li><strong>Regular Backups:</strong> Daily automated backups stored securely</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Organizational Safeguards</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Limited employee access to personal information on a need-to-know basis</li>
              <li>Background checks for employees with data access</li>
              <li>Regular security training for staff</li>
              <li>Documented data breach response plan</li>
              <li>Third-party security audits</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Limitations</h3>
            <p className="mb-4">
              Despite our security measures, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Breach Notification</h2>
            <p className="mb-4">
              In compliance with Iowa Code Chapter 715C and other applicable data breach notification laws, if we discover a data breach compromising your personal information, we will:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Notify affected users in the most expeditious manner possible and without unreasonable delay (typically within 30-60 days)</li>
              <li>Notify the Iowa Attorney General within 5 business days if 500+ Iowa residents are affected</li>
              <li>Notify other state attorneys general as required by their laws</li>
              <li>Provide written, electronic, or substitute notice as appropriate</li>
              <li>Include in notifications: description of breach, approximate date, types of personal information obtained, credit bureau contact information, advice to report identity theft</li>
            </ul>
            <p className="mb-4">
              You can report suspected security incidents to security@agentbio.net.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Privacy Rights</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.1 General Rights (All Users)</h3>
            <p className="mb-4">All users have the following rights:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
              <li><strong>Data Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong>Opt-Out of Marketing:</strong> Unsubscribe from marketing emails and SMS messages</li>
              <li><strong>Account Deletion:</strong> Delete your account and associated data</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 California Residents (CCPA/CPRA Rights)</h3>
            <p className="mb-4">
              If you are a California resident and we meet the CCPA applicability thresholds (annual revenue &gt; $26.625 million OR processing data of 100,000+ California residents), you have additional rights:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Right to Know:</strong> Request disclosure of categories and specific pieces of personal information we collect, use, and disclose</li>
              <li><strong>Right to Delete:</strong> Request deletion of personal information (with exceptions for legal compliance, fraud prevention, etc.)</li>
              <li><strong>Right to Opt-Out of Sale/Sharing:</strong> We do NOT sell or share personal information for cross-context behavioral advertising</li>
              <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
              <li><strong>Right to Limit Sensitive Personal Information Use:</strong> We do not use sensitive personal information for purposes requiring opt-out under CCPA</li>
              <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising CCPA rights</li>
            </ul>
            <p className="mb-4">
              <strong>Do Not Sell My Personal Information:</strong> We do NOT sell personal information. We have not sold personal information in the preceding 12 months.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Iowa Residents (Iowa CDPA Rights)</h3>
            <p className="mb-4">
              If you are an Iowa resident and we meet the Iowa CDPA applicability thresholds (processing data of 100,000+ Iowa residents OR 25,000+ Iowa residents AND deriving 50%+ revenue from data sales), you have rights to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate personal data</li>
              <li>Delete personal data</li>
              <li>Obtain a portable copy of your data</li>
              <li>Opt out of: (a) sale of personal data, (b) targeted advertising, (c) profiling with legal/significant effects</li>
            </ul>
            <p className="mb-4">
              We will respond to Iowa consumer rights requests within <strong>45 days</strong> (extendable by 45 additional days with notice).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.4 How to Exercise Your Rights</h3>
            <p className="mb-4">
              To exercise any privacy rights, contact us at:
            </p>
            <div className="bg-muted p-4 rounded-md mb-4">
              <p className="font-mono">Email: privacy@agentbio.net</p>
              <p className="font-mono">Subject Line: Privacy Rights Request</p>
              <p className="font-mono">Include: Your name, email address, and specific request</p>
            </div>
            <p className="mb-4">
              We will verify your identity before processing requests and respond within 45 days (or as required by applicable law). You may designate an authorized agent to submit requests on your behalf by providing written authorization.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking Technologies</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Types of Cookies We Use</h3>
            <p className="mb-4">We use the following types of cookies:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for platform functionality (login sessions, security, shopping cart). Cannot be disabled.</li>
              <li><strong>Performance Cookies:</strong> Analytics and usage statistics (Google Analytics) to improve platform performance</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences (language, display settings)</li>
              <li><strong>Targeting Cookies:</strong> Track visits across websites for advertising purposes (if applicable)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Cookie Management</h3>
            <p className="mb-4">
              You can control cookies through:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Browser settings (most browsers allow you to refuse cookies or delete existing cookies)</li>
              <li>Our cookie preference center (accessible in the footer)</li>
              <li>Global Privacy Control (GPC) signals (we honor GPC browser settings)</li>
            </ul>
            <p className="mb-4">
              Note: Disabling essential cookies may prevent you from using certain platform features.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.3 Analytics Services</h3>
            <p className="mb-4">
              We use Google Analytics to understand platform usage. Google Analytics collects information such as how often users visit the Platform, what pages they visit, and what other sites they used prior to visiting. We use this information only to improve our Platform.
            </p>
            <p className="mb-4">
              Google's ability to use and share information collected by Google Analytics is restricted by the <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Terms of Service</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Privacy Policy</a>. You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-out Browser Add-on</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Retention Periods</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Active Accounts:</strong> Personal information retained while account is active</li>
              <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days of account deletion; some data retained for legal compliance</li>
              <li><strong>Financial Records:</strong> Payment and billing records retained for 7 years (tax and accounting compliance)</li>
              <li><strong>DMCA Notices:</strong> Copyright infringement records retained for 4+ years</li>
              <li><strong>Email Opt-Out Records:</strong> Unsubscribe lists retained for 4+ years (CAN-SPAM compliance)</li>
              <li><strong>SMS Consent Records:</strong> Retained indefinitely (TCPA compliance - burden of proof)</li>
              <li><strong>Legal Hold:</strong> Data subject to litigation, investigations, or legal proceedings retained until matter resolves</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Data Deletion</h3>
            <p className="mb-4">
              When we delete data, we use secure deletion methods including overwriting, degaussing, or physical destruction of storage media. Backup copies may persist for up to 90 days before permanent deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
            <p className="mb-4">
              AgentBio.net is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18. If we learn we have collected personal information from a child under 18 without parental consent, we will delete that information as quickly as possible.
            </p>
            <p className="mb-4">
              If you believe we have collected information from a child under 18, please contact us immediately at privacy@agentbio.net.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
            <p className="mb-4">
              AgentBio.net is based in the United States. If you access our Platform from outside the United States, your information will be transferred to, stored, and processed in the United States.
            </p>
            <p className="mb-4">
              The United States may have data protection laws that differ from the laws of your country. By using our Platform, you consent to the transfer of your information to the United States and processing in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Third-Party Links</h2>
            <p className="mb-4">
              Our Platform may contain links to third-party websites, including brokerage websites, MLS systems, social media platforms, and other real estate services. We are not responsible for the privacy practices of these third parties.
            </p>
            <p className="mb-4">
              We encourage you to read the privacy policies of any third-party sites you visit. This Privacy Policy applies only to information collected by AgentBio.net.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Material changes will be communicated via:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Email notification at least <strong>30 days in advance</strong></li>
              <li>Prominent notice on the Platform</li>
              <li>Updated "Last Updated" date at the top of this policy</li>
            </ul>
            <p className="mb-4">
              Your continued use of the Platform after the effective date of changes constitutes acceptance of the revised Privacy Policy. We encourage you to review this Privacy Policy periodically.
            </p>
            <p className="mb-4">
              We maintain archived versions of previous Privacy Policies available upon request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-md mb-4">
              <p className="font-mono text-sm">
                <strong>Privacy Inquiries:</strong><br />
                Email: privacy@agentbio.net<br />
                Subject: Privacy Policy Question<br />
                <br />
                <strong>Privacy Rights Requests:</strong><br />
                Email: privacy@agentbio.net<br />
                Subject: Privacy Rights Request<br />
                <br />
                <strong>Data Breach Reports:</strong><br />
                Email: security@agentbio.net<br />
                Subject: Security Incident<br />
                <br />
                <strong>General Legal Inquiries:</strong><br />
                Email: legal@agentbio.net<br />
                <br />
                <strong>Mailing Address:</strong><br />
                AgentBio.net Privacy Department<br />
                [Physical Address - To be added]<br />
                Des Moines, IA [ZIP]
              </p>
            </div>
            <p className="mb-4">
              We will respond to privacy inquiries within 45 days (or as required by applicable law).
            </p>
          </section>

          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-100">
              📋 Summary of Key Privacy Practices
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-blue-900 dark:text-blue-100">
              <li>We do NOT sell your personal information</li>
              <li>Your profile is publicly displayed to showcase your professional services</li>
              <li>We use trusted service providers (Stripe, SendGrid) bound by confidentiality</li>
              <li>You can opt out of marketing emails and SMS at any time</li>
              <li>We comply with CCPA, Iowa CDPA, CAN-SPAM, TCPA, and data breach notification laws</li>
              <li>You have rights to access, correct, delete, and port your data</li>
              <li>We implement strong security measures but cannot guarantee absolute security</li>
              <li>Contact privacy@agentbio.net for privacy rights requests or questions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
