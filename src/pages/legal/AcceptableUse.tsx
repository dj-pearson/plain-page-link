import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SEOHead } from "@/components/SEOHead";

export default function AcceptableUse() {
  const lastUpdated = new Date().toLocaleDateString();

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://agentbio.net/acceptable-use#webpage",
    "url": "https://agentbio.net/acceptable-use",
    "name": "Acceptable Use Policy - AgentBio",
    "description": "AgentBio Acceptable Use Policy defining prohibited content, activities, and professional standards for real estate agents using the platform.",
    "isPartOf": {
      "@id": "https://agentbio.net/#website"
    },
    "about": {
      "@type": "Thing",
      "name": "Acceptable Use Policy"
    },
    "datePublished": "2024-01-01",
    "dateModified": lastUpdated,
    "inLanguage": "en-US"
  };

  return (
    <>
      <SEOHead
        title="Acceptable Use Policy - AgentBio | Platform Guidelines & Standards"
        description="AgentBio Acceptable Use Policy: Prohibited content, Fair Housing compliance, professional standards for real estate agents. Learn about platform rules and enforcement."
        keywords={["acceptable use policy", "platform guidelines", "prohibited content", "Fair Housing compliance", "professional standards", "real estate agent conduct", "platform rules"]}
        canonicalUrl="https://agentbio.net/acceptable-use"
        schema={schema}
      />
      <PublicHeader />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Acceptable Use Policy</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground mb-6">
            Last updated: {lastUpdated}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              This Acceptable Use Policy ("AUP") governs your use of AgentBio.net and describes prohibited conduct that may result in account suspension or termination. This AUP is incorporated into and part of our Terms of Service.
            </p>
            <p className="mb-4">
              By using AgentBio.net, you agree to comply with this AUP. Violations may result in immediate account suspension or termination without notice or refund, and may be reported to law enforcement authorities when appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Prohibited Content</h2>
            <p className="mb-4">
              You may NOT upload, post, transmit, or otherwise make available through AgentBio.net any content that:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Violates Intellectual Property Rights</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Infringes any copyright, trademark, patent, trade secret, or other intellectual property right</li>
              <li>Uses photos you do not own or have authorization to use</li>
              <li>Displays brokerage logos or trademarks without current authorization</li>
              <li>Uses the REALTOR® mark without active NAR membership</li>
              <li>Copies content, photos, or descriptions from other agents or websites</li>
              <li>Uses MLS photos beyond the scope of MLS authorization</li>
              <li>Violates photographer copyrights or licensing agreements</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Violates Fair Housing Laws</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Indicates any preference, limitation, or discrimination based on race, color, religion, sex, handicap, familial status, national origin, or other protected characteristics</li>
              <li>Uses discriminatory language in property descriptions (e.g., "perfect for single professionals," "great for empty nesters," "ideal Christian community")</li>
              <li>Displays symbols or imagery suggesting discriminatory preferences</li>
              <li>Steers clients based on protected characteristics</li>
              <li>Violates Equal Housing Opportunity requirements</li>
              <li>Contains any language prohibited by HUD's Fair Housing guidelines</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Contains False or Misleading Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>False property information (pricing, square footage, features, condition)</li>
              <li>Misrepresentation of your credentials, licenses, experience, or qualifications</li>
              <li>Fake testimonials or reviews</li>
              <li>False claims about sales history or performance</li>
              <li>Deceptive bait-and-switch tactics</li>
              <li>Fraudulent investment or financing claims</li>
              <li>Misrepresentation of property availability or status</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Is Illegal or Promotes Illegal Activity</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Violates any federal, state, or local law or regulation</li>
              <li>Promotes illegal activities or transactions</li>
              <li>Facilitates money laundering or other financial crimes</li>
              <li>Violates real estate licensing laws or regulations</li>
              <li>Breaches fiduciary duties to clients</li>
              <li>Violates anti-fraud or consumer protection laws</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.5 Is Harmful, Abusive, or Offensive</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Harassing, threatening, or abusive content</li>
              <li>Hate speech or content promoting violence</li>
              <li>Defamatory, libelous, or slanderous statements</li>
              <li>Pornographic, sexually explicit, or obscene material</li>
              <li>Graphic violence or disturbing imagery</li>
              <li>Content exploiting or harming minors</li>
              <li>Bullying or targeted harassment of individuals</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.6 Violates Privacy Rights</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Posts others' personal information without consent (doxxing)</li>
              <li>Violates reasonable expectations of privacy</li>
              <li>Uses testimonials without proper consent</li>
              <li>Publishes private communications without authorization</li>
              <li>Misappropriates publicity rights or likeness without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Prohibited Activities</h2>
            <p className="mb-4">
              You may NOT engage in any of the following activities:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Account Misuse</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Creating multiple accounts to evade enforcement actions</li>
              <li>Sharing account credentials or allowing unauthorized access</li>
              <li>Impersonating another person, agent, or entity</li>
              <li>Creating accounts with false identity information</li>
              <li>Operating accounts without valid real estate licenses</li>
              <li>Using accounts after license expiration, suspension, or revocation</li>
              <li>Transferring accounts to other individuals</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Platform Interference</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Attempting to gain unauthorized access to Platform systems or data</li>
              <li>Interfering with or disrupting Platform services or servers</li>
              <li>Circumventing security measures or access controls</li>
              <li>Probing, scanning, or testing Platform vulnerabilities</li>
              <li>Overloading systems with excessive requests (DoS attacks)</li>
              <li>Reverse engineering Platform software or features</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Data Misuse</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Scraping, harvesting, or crawling Platform content or data</li>
              <li>Using automated tools to collect user information</li>
              <li>Creating databases of Platform users or listings</li>
              <li>Selling or licensing Platform data to third parties</li>
              <li>Using Platform data for spam or unsolicited marketing</li>
              <li>Reverse-engineering user contact information</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Spam and Malicious Content</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Uploading viruses, malware, or malicious code</li>
              <li>Sending spam or unsolicited bulk communications</li>
              <li>Posting repetitive or duplicate content</li>
              <li>Creating fake engagement (fake views, clicks, or interactions)</li>
              <li>Link farming or SEO manipulation schemes</li>
              <li>Phishing attempts or social engineering attacks</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Commercial Misuse</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Advertising non-real estate products or services</li>
              <li>Multi-level marketing or pyramid scheme promotion</li>
              <li>Affiliate marketing unrelated to real estate services</li>
              <li>Unauthorized commercial solicitation of other users</li>
              <li>Posting listings you are not authorized to market</li>
              <li>False claims about exclusive listings or representation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Professional Standards</h2>
            <p className="mb-4">
              As a platform for licensed real estate professionals, we expect users to maintain professional standards:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Licensing Requirements</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You must hold an active, valid real estate license in all states where you claim to practice</li>
              <li>You must promptly update your profile if your license status changes (suspension, revocation, expiration)</li>
              <li>You must comply with all state real estate licensing laws and regulations</li>
              <li>You must display required licensing information as mandated by your state(s)</li>
              <li>You may not practice real estate without proper authorization</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Accuracy and Honesty</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Provide accurate, complete, and current information in your profile</li>
              <li>Ensure all listing information is accurate to the best of your knowledge</li>
              <li>Promptly update information when circumstances change</li>
              <li>Disclose material facts and defects as required by law</li>
              <li>Do not make promises or guarantees you cannot fulfill</li>
              <li>Correct errors or inaccuracies when discovered</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Ethical Conduct</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Comply with the NAR Code of Ethics (if a REALTOR®)</li>
              <li>Respect fiduciary duties to clients</li>
              <li>Maintain client confidentiality</li>
              <li>Avoid conflicts of interest or disclose them appropriately</li>
              <li>Treat all parties and other agents with respect and professionalism</li>
              <li>Do not disparage competitors or engage in unfair competitive practices</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Brokerage Relationships</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Accurately represent your current brokerage affiliation</li>
              <li>Remove brokerage logos and trademarks immediately upon leaving a brokerage</li>
              <li>Comply with your brokerage's policies regarding online marketing</li>
              <li>Update your profile within 10 days of changing brokerages</li>
              <li>Do not misrepresent your role or authority within your brokerage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Fair Housing Compliance</h2>
            <p className="mb-4">
              Compliance with the Fair Housing Act and state fair housing laws is mandatory and strictly enforced.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Prohibited Language and Content</h3>
            <p className="mb-4">
              Your listings, descriptions, and profile must NOT contain:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>References to race or color (e.g., "diverse neighborhood," "traditional community")</li>
              <li>Religious references suggesting preference (e.g., "close to churches," "perfect for Christian families")</li>
              <li>Sex or gender indications (e.g., "bachelor pad," "perfect for career women")</li>
              <li>Familial status preferences (e.g., "great for empty nesters," "ideal for young families," "adults only," "no kids")</li>
              <li>Disability or handicap references (e.g., "able-bodied," "great for active individuals," "must see stairs")</li>
              <li>National origin indicators (e.g., "close to ethnic markets," "English-speaking preferred")</li>
              <li>Age preferences (except legally qualified senior housing)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Required Equal Housing Opportunity Compliance</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>All listings are available to qualified buyers regardless of protected characteristics</li>
              <li>Marketing must be conducted in a non-discriminatory manner</li>
              <li>Agents must display the Equal Housing Opportunity logo in their advertising</li>
              <li>Any steering or discriminatory practices will result in immediate account termination and reporting to HUD</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Reporting Fair Housing Violations</h3>
            <p className="mb-4">
              If you encounter content that violates fair housing laws, please report it immediately to <strong>legal@agentbio.net</strong> with the subject line "Fair Housing Complaint."
            </p>
            <p className="mb-4">
              We investigate all fair housing complaints within 24-48 hours and take prompt action, including content removal and account termination when warranted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Enforcement and Consequences</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Violation Review</h3>
            <p className="mb-4">
              When we become aware of potential AUP violations (through user reports, automated monitoring, or copyright complaints), we will:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Review the reported content or activity</li>
              <li>Assess the severity and nature of the violation</li>
              <li>Consider the user's history and any prior violations</li>
              <li>Take appropriate enforcement action based on our policies</li>
              <li>Document all actions taken</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Enforcement Actions</h3>
            <p className="mb-4">
              Depending on the severity and nature of the violation, we may take the following actions:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Content Removal:</strong> Remove specific content that violates this AUP</li>
              <li><strong>Warning:</strong> Issue a written warning for first-time or minor violations</li>
              <li><strong>Account Suspension:</strong> Temporarily suspend account access (typically 7-30 days)</li>
              <li><strong>Account Termination:</strong> Permanently terminate account without refund</li>
              <li><strong>Permanent Ban:</strong> Prevent creation of future accounts</li>
              <li><strong>Legal Referral:</strong> Report serious violations to law enforcement or regulatory authorities</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Immediate Termination Violations</h3>
            <p className="mb-4">
              The following violations result in <strong>immediate permanent account termination</strong> without warning:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Operating without a valid real estate license</li>
              <li>Egregious Fair Housing Act violations</li>
              <li>Fraud or deceptive practices causing consumer harm</li>
              <li>Three DMCA copyright notices within 12 months (repeat infringer policy)</li>
              <li>Uploading illegal content (child exploitation, terrorism)</li>
              <li>Hacking, unauthorized access, or security violations</li>
              <li>Creating accounts to circumvent prior terminations</li>
              <li>Serious violations of state licensing or consumer protection laws</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.4 Appeals</h3>
            <p className="mb-4">
              You may appeal content removals or account suspensions (but not permanent terminations) by emailing <strong>legal@agentbio.net</strong> within <strong>10 business days</strong> of the action. Include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your account username and email</li>
              <li>Description of the enforcement action</li>
              <li>Explanation of why you believe the action was in error</li>
              <li>Supporting evidence or documentation</li>
            </ul>
            <p className="mb-4">
              We will review appeals within 10 business days and notify you of our decision. Our decision is final.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Reporting Violations</h2>
            <p className="mb-4">
              If you encounter content or conduct that violates this Acceptable Use Policy, please report it:
            </p>
            <div className="bg-muted p-4 rounded-md mb-4">
              <p className="font-mono mb-2"><strong>Fair Housing Violations:</strong></p>
              <p className="font-mono mb-1">Email: legal@agentbio.net</p>
              <p className="font-mono mb-4">Subject: Fair Housing Complaint</p>

              <p className="font-mono mb-2 mt-4"><strong>Copyright Infringement:</strong></p>
              <p className="font-mono mb-1">Email: dmca@agentbio.net</p>
              <p className="font-mono mb-4">Subject: DMCA Takedown Notice</p>

              <p className="font-mono mb-2 mt-4"><strong>Other AUP Violations:</strong></p>
              <p className="font-mono mb-1">Email: support@agentbio.net</p>
              <p className="font-mono mb-1">Subject: AUP Violation Report</p>
              <p className="font-mono">Include: URL of content, description of violation, your contact information</p>
            </div>
            <p className="mb-4">
              We review all reports and take appropriate action. However, we cannot respond individually to every report or disclose specific enforcement actions taken against other users due to privacy considerations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Platform Rights and Discretion</h2>
            <p className="mb-4">
              AgentBio.net reserves the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Remove any content for any reason, with or without notice</li>
              <li>Suspend or terminate any account for violations or suspicious activity</li>
              <li>Modify this AUP at any time with notice to users</li>
              <li>Refuse service to anyone for any lawful reason</li>
              <li>Cooperate with law enforcement investigations</li>
              <li>Report illegal activity to appropriate authorities</li>
              <li>Implement additional content moderation or filtering systems</li>
            </ul>
            <p className="mb-4">
              We are not obligated to pre-screen content but may do so at our discretion. Our failure to enforce this AUP in one instance does not waive our right to enforce it in other instances.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Updates to This Policy</h2>
            <p className="mb-4">
              We may update this Acceptable Use Policy from time to time. Material changes will be communicated via:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Email notification at least 30 days in advance</li>
              <li>Prominent notice on the Platform</li>
              <li>Updated "Last Updated" date at the top of this policy</li>
            </ul>
            <p className="mb-4">
              Your continued use of the Platform after changes become effective constitutes acceptance of the updated AUP.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
            <p className="mb-4">
              Questions about this Acceptable Use Policy should be sent to:
            </p>
            <div className="bg-muted p-4 rounded-md mb-4">
              <p className="font-mono">Email: legal@agentbio.net</p>
              <p className="font-mono">Subject: Acceptable Use Policy Question</p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-100">
              📋 Key Takeaways
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-blue-900 dark:text-blue-100">
              <li>Only upload content you own or have explicit authorization to use</li>
              <li>Ensure all content complies with Fair Housing laws</li>
              <li>Maintain accurate, honest information in your profile and listings</li>
              <li>Keep your license current and update profile if status changes</li>
              <li>Treat all users with respect and professionalism</li>
              <li>Report violations to help maintain platform integrity</li>
              <li>Violations may result in account termination without refund</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
      <PublicFooter />
    </>
  );
}
