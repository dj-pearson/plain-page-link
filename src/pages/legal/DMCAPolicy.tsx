import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SEOHead } from "@/components/SEOHead";

export default function DMCAPolicy() {
  const lastUpdated = new Date().toLocaleDateString();

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://agentbio.net/dmca#webpage",
    "url": "https://agentbio.net/dmca",
    "name": "DMCA Copyright Policy - AgentBio",
    "description": "AgentBio DMCA Copyright Policy: Learn how to file copyright infringement notices, counter-notices, and our repeat infringer policy for real estate photos.",
    "isPartOf": {
      "@id": "https://agentbio.net/#website"
    },
    "about": {
      "@type": "Thing",
      "name": "DMCA Policy"
    },
    "datePublished": "2024-01-01",
    "dateModified": lastUpdated,
    "inLanguage": "en-US"
  };

  return (
    <>
      <SEOHead
        title="DMCA Copyright Policy - AgentBio | Takedown & Copyright Protection"
        description="AgentBio DMCA Policy: File copyright takedown notices, counter-notices, and understand our repeat infringer policy. Protect your real estate photography rights."
        keywords={["DMCA policy", "copyright takedown", "copyright infringement", "real estate photography copyright", "DMCA notice", "repeat infringer policy", "photographer rights"]}
        canonicalUrl="https://agentbio.net/dmca"
        schema={schema}
      />
      <PublicHeader />
      <main id="main-content" className="min-h-screen bg-background py-12 px-4" tabIndex={-1}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">DMCA Copyright Policy</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground mb-6">
            Last updated: {lastUpdated}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              AgentBio.net respects the intellectual property rights of others and expects our users to do the same. In compliance with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512, we have implemented procedures to respond to copyright infringement claims and to terminate the accounts of repeat infringers.
            </p>
            <p className="mb-4">
              This policy explains how copyright owners can report alleged infringements, how users can respond with counter-notices, and our repeat infringer policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. DMCA Designated Agent</h2>
            <p className="mb-4">
              Our designated agent for copyright infringement claims under the DMCA is:
            </p>
            <div className="bg-muted p-6 rounded-md mb-4 border border-border">
              <p className="font-mono text-lg mb-2"><strong>Copyright Agent, AgentBio.net</strong></p>
              <p className="font-mono mb-1">Email: <a href="mailto:dmca@agentbio.net" className="text-primary hover:underline">dmca@agentbio.net</a></p>
              <p className="font-mono mb-1">Physical Address: [To be added]</p>
              <p className="font-mono">Des Moines, IA [ZIP]</p>
            </div>
            <p className="mb-4">
              Our designated agent is registered with the U.S. Copyright Office. This information is publicly available in the Copyright Office's online directory at <a href="https://dmca.copyright.gov/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dmca.copyright.gov</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Filing a DMCA Takedown Notice</h2>
            <p className="mb-4">
              If you believe that content on AgentBio.net infringes your copyright, you may send a DMCA takedown notice to our designated agent at <strong>dmca@agentbio.net</strong>.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Required Elements</h3>
            <p className="mb-4">
              To be valid under 17 U.S.C. § 512(c)(3), your notice must include <strong>ALL</strong> of the following:
            </p>
            <ul className="list-decimal pl-6 mb-4 space-y-3">
              <li>
                <strong>Physical or Electronic Signature:</strong> A physical or electronic signature of the copyright owner or a person authorized to act on behalf of the copyright owner.
              </li>
              <li>
                <strong>Identification of Copyrighted Work:</strong> Identification of the copyrighted work claimed to have been infringed. If multiple copyrighted works are covered by a single notification, provide a representative list of such works.
              </li>
              <li>
                <strong>Identification of Infringing Material:</strong> Identification of the material that is claimed to be infringing, with information reasonably sufficient to permit us to locate the material. Please provide specific URLs or profile links where the allegedly infringing material appears.
              </li>
              <li>
                <strong>Your Contact Information:</strong> Your name, address, telephone number, and email address.
              </li>
              <li>
                <strong>Good Faith Statement:</strong> A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                <strong>Accuracy and Authority Statement:</strong> A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Sample DMCA Notice</h3>
            <div className="bg-muted p-4 rounded-md mb-4 text-sm font-mono">
              <p className="mb-2">To: dmca@agentbio.net</p>
              <p className="mb-2">Subject: DMCA Takedown Notice</p>
              <p className="mb-4">---</p>
              <p className="mb-2">I, [Your Full Name], am the copyright owner (or authorized agent) of the following work:</p>
              <p className="mb-2">[Describe the copyrighted work, e.g., "Professional real estate photographs of 123 Main Street, Des Moines, IA"]</p>
              <p className="mb-4 mt-4">The following material on AgentBio.net infringes my copyright:</p>
              <p className="mb-2">[Specific URL(s): https://agentbio.net/agent/username/photo-123]</p>
              <p className="mb-4 mt-4">My contact information is:</p>
              <p className="mb-1">Name: [Your Full Name]</p>
              <p className="mb-1">Address: [Your Address]</p>
              <p className="mb-1">Phone: [Your Phone]</p>
              <p className="mb-1">Email: [Your Email]</p>
              <p className="mb-4 mt-4">I have a good faith belief that use of the copyrighted materials described above is not authorized by the copyright owner, its agent, or the law.</p>
              <p className="mb-4">I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner, or am authorized to act on behalf of the copyright owner.</p>
              <p className="mb-2 mt-4">Signature: [Your Signature or Electronic Signature]</p>
              <p>Date: [Date]</p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Incomplete Notices</h3>
            <p className="mb-4">
              Notices that do not include all required elements may not be processed. We may request additional information before taking action. Please ensure your notice is complete to avoid delays.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Our Response to DMCA Notices</h2>
            <p className="mb-4">
              Upon receiving a valid DMCA notice, we will:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Expeditiously Remove or Disable Access:</strong> We will remove or disable access to the allegedly infringing material within <strong>24-48 hours</strong> of receiving a complete notice</li>
              <li><strong>Notify the User:</strong> We will forward a copy of the DMCA notice to the user who posted the material and inform them that the content has been removed</li>
              <li><strong>Document the Action:</strong> We maintain records of all DMCA notices, actions taken, and communications with all parties</li>
              <li><strong>Track Repeat Infringers:</strong> We add the incident to the user's account record for repeat infringer tracking (see Section 7)</li>
            </ul>
            <p className="mb-4">
              We do NOT evaluate the merits of copyright claims. Our role is to comply with the DMCA by promptly removing content when we receive proper notice and providing users an opportunity to file counter-notices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Filing a Counter-Notice</h2>
            <p className="mb-4">
              If you believe that content you posted was removed in error or that you have authorization to use the material, you may file a DMCA counter-notice.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Required Elements</h3>
            <p className="mb-4">
              To be valid under 17 U.S.C. § 512(g)(3), your counter-notice must include ALL of the following:
            </p>
            <ul className="list-decimal pl-6 mb-4 space-y-3">
              <li>
                <strong>Your Physical or Electronic Signature</strong>
              </li>
              <li>
                <strong>Identification of Material:</strong> Identification of the material that was removed and the location where it appeared before removal
              </li>
              <li>
                <strong>Good Faith Statement:</strong> A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification
              </li>
              <li>
                <strong>Your Contact Information:</strong> Your name, address, and telephone number
              </li>
              <li>
                <strong>Consent to Jurisdiction:</strong> A statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located (or the federal judicial district in which AgentBio.net's principal place of business is located if your address is outside the United States), and that you will accept service of process from the person who filed the original DMCA notice or their agent
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Counter-Notice Process</h3>
            <p className="mb-4">
              After we receive a valid counter-notice, we will:
            </p>
            <ul className="list-decimal pl-6 mb-4 space-y-2">
              <li>Forward a copy of the counter-notice to the original complainant within 2-3 business days</li>
              <li>Inform the complainant that we will restore the removed content in <strong>10-14 business days</strong> unless they file a lawsuit seeking a court order to restrain the user from engaging in infringing activity</li>
              <li>If the complainant notifies us that they have filed a lawsuit within the 10-14 day period, we will keep the content down pending litigation</li>
              <li>If we do not receive notice of a lawsuit within 10-14 business days, we will <strong>restore the content</strong></li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Important Warnings</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="mb-2 text-yellow-900 dark:text-yellow-100">
                <strong>⚠️ Legal Consequences of Filing a False Counter-Notice:</strong>
              </p>
              <p className="text-yellow-900 dark:text-yellow-100">
                Filing a counter-notice subjects you to potential liability for perjury if you misrepresent that material was removed by mistake. You may also be sued by the copyright owner for copyright infringement. Only file a counter-notice if you have a legitimate good faith belief that the content was removed in error or you have authorization to post it.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Misrepresentation and Section 512(f) Liability</h2>
            <p className="mb-4">
              Under 17 U.S.C. § 512(f), any person who knowingly materially misrepresents:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>That material or activity is infringing, OR</li>
              <li>That material or activity was removed or disabled by mistake or misidentification</li>
            </ul>
            <p className="mb-4">
              ...shall be liable for any damages, including costs and attorneys' fees, incurred by the alleged infringer or by the copyright owner who is injured by such misrepresentation.
            </p>
            <p className="mb-4">
              <strong>Please carefully consider the accuracy of your DMCA notice or counter-notice before submitting.</strong> Bad faith abuse of the DMCA process may result in legal liability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Repeat Infringer Policy</h2>
            <p className="mb-4">
              In accordance with the DMCA and as confirmed by case law (BMG v. Cox Communications, Sony Music v. Cox Communications), we maintain and enforce a policy of terminating the accounts of users who repeatedly infringe copyrights.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Definition of Repeat Infringer</h3>
            <p className="mb-4">
              A "repeat infringer" is a user who has received <strong>three (3) valid DMCA takedown notices</strong> within a <strong>twelve (12) month period</strong>.
            </p>
            <p className="mb-4">
              A "valid" DMCA notice is one that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Includes all required elements under 17 U.S.C. § 512(c)(3)</li>
              <li>Results in content removal or disabling</li>
              <li>Was not successfully countered by a valid counter-notice leading to content restoration</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Progressive Enforcement</h3>
            <p className="mb-4">
              Our repeat infringer policy is enforced as follows:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-3">
              <li>
                <strong>First Valid DMCA Notice:</strong> Content removed; user receives written warning about copyright compliance obligations and repeat infringer policy; incident recorded in user account
              </li>
              <li>
                <strong>Second Valid DMCA Notice (within 12 months):</strong> Content removed; user receives second warning with explicit notice that one more violation will result in permanent account termination; account placed on probationary status
              </li>
              <li>
                <strong>Third Valid DMCA Notice (within 12 months):</strong> <strong className="text-red-600">Immediate permanent account termination without refund</strong>; all content deleted; user permanently banned from creating new accounts; decision is final and not subject to appeal
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Tracking and Documentation</h3>
            <p className="mb-4">
              We maintain detailed records of all copyright complaints, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Date and time of each DMCA notice received</li>
              <li>Identity of complainant and claimed copyrighted work</li>
              <li>Specific content removed or disabled</li>
              <li>User notification sent and date</li>
              <li>Counter-notices filed (if any) and outcomes</li>
              <li>Actions taken (warnings, suspensions, terminations)</li>
              <li>User account history of violations</li>
            </ul>
            <p className="mb-4">
              These records are retained for a minimum of <strong>four (4) years</strong> and are available to law enforcement and in legal proceedings.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.4 No Tolerance for Willful Infringement</h3>
            <p className="mb-4">
              We reserve the right to immediately terminate accounts for egregious copyright violations, such as:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Mass upload of clearly infringing professional photographs</li>
              <li>Commercially selling or licensing infringing content</li>
              <li>Repeated violations within a short time period (e.g., multiple notices within days)</li>
              <li>Evidence of willful, knowing infringement</li>
            </ul>
            <p className="mb-4">
              In such cases, we may terminate accounts before the third notice threshold is reached.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Special Guidance for Real Estate Photos</h2>
            <p className="mb-4">
              Based on real estate industry copyright issues (VHT v. Zillow and similar cases), we provide specific guidance for agents:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Common Copyright Issues</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Professional Listing Photos:</strong> Photographers retain copyright unless explicitly transferred in writing. Payment does NOT transfer copyright. Licenses are typically limited to active listing marketing, not third-party platform upload.</li>
              <li><strong>MLS Photos:</strong> Most MLS licenses prohibit third-party platform upload. Authorization expires when listings close or expire. Verify your MLS policy before uploading.</li>
              <li><strong>Previous Listings:</strong> Photos from past listings may no longer be authorized for use, even if you originally had permission for listing marketing.</li>
              <li><strong>Brokerage Marketing Materials:</strong> Your brokerage may own copyright to marketing materials created by in-house teams. Authorization typically terminates when you leave the brokerage.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 What You CAN Upload</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Photos you personally took and own copyright to</li>
              <li>Photos with written authorization from the photographer explicitly permitting third-party platform upload and display</li>
              <li>Photos licensed under Creative Commons or similar open licenses (verify terms)</li>
              <li>Photos you purchased with rights explicitly covering third-party platform use</li>
              <li>Stock photos you licensed with appropriate usage rights</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Best Practices</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Obtain written photographer agreements specifying third-party platform rights</li>
              <li>Keep documentation of licenses and permissions</li>
              <li>When in doubt, ask the photographer or copyright owner</li>
              <li>Use your own photos or hire photographers with written work-for-hire agreements</li>
              <li>Remove photos from old listings unless you have perpetual licenses</li>
              <li>Update your profile when changing brokerages to remove brokerage-owned content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Trademark Complaints</h2>
            <p className="mb-4">
              While this policy primarily addresses copyright issues under the DMCA, we also respond to trademark infringement complaints.
            </p>
            <p className="mb-4">
              If you believe content on AgentBio.net infringes your trademark rights, please send a notice to <strong>legal@agentbio.net</strong> (not the DMCA agent) with:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Identification of the trademark (registration number if registered)</li>
              <li>Explanation of how it is being infringed</li>
              <li>Specific URL(s) where the infringement appears</li>
              <li>Your contact information</li>
              <li>Statement of good faith belief of infringement</li>
              <li>Statement of accuracy under penalty of perjury</li>
            </ul>
            <p className="mb-4">
              We will review trademark complaints on a case-by-case basis and may remove content or require users to modify their profiles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
            <p className="mb-4">
              For copyright-related inquiries:
            </p>
            <div className="bg-muted p-4 rounded-md mb-4">
              <p className="font-mono mb-2"><strong>DMCA Takedown Notices:</strong></p>
              <p className="font-mono mb-1">Email: dmca@agentbio.net</p>
              <p className="font-mono mb-4">Subject: DMCA Takedown Notice</p>

              <p className="font-mono mb-2 mt-4"><strong>Counter-Notices:</strong></p>
              <p className="font-mono mb-1">Email: dmca@agentbio.net</p>
              <p className="font-mono mb-4">Subject: DMCA Counter-Notice</p>

              <p className="font-mono mb-2 mt-4"><strong>General Copyright Questions:</strong></p>
              <p className="font-mono mb-1">Email: legal@agentbio.net</p>
              <p className="font-mono mb-4">Subject: Copyright Inquiry</p>

              <p className="font-mono mb-2 mt-4"><strong>Trademark Issues:</strong></p>
              <p className="font-mono mb-1">Email: legal@agentbio.net</p>
              <p className="font-mono">Subject: Trademark Complaint</p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-red-900 dark:text-red-100">
              ⚠️ Important Notice to Agents
            </h3>
            <p className="mb-2 text-red-900 dark:text-red-100">
              <strong>Copyright infringement is serious:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1 text-red-900 dark:text-red-100 mb-3">
              <li>Statutory damages range from $750 to $30,000 per work (up to $150,000 if willful)</li>
              <li>Copyright owners may sue you directly for infringement</li>
              <li>Three DMCA notices in 12 months results in permanent account termination</li>
              <li>You are personally liable for photos you upload without authorization</li>
            </ul>
            <p className="text-red-900 dark:text-red-100">
              <strong>When in doubt, don't upload.</strong> Use only photos you own or have explicit written permission to use on third-party platforms.
            </p>
          </div>
        </div>
      </div>
      </main>
      <PublicFooter />
    </>
  );
}
