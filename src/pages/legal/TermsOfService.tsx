import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function TermsOfService() {
  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using AgentBio.net ("Platform", "Service", "we", "us", or "our"), you ("User", "Agent", "you", or "your") accept and agree to be bound by these Terms of Service, including our Privacy Policy, DMCA Policy, and Acceptable Use Policy, which are incorporated by reference. If you do not agree to these terms, you must not access or use this Service.
            </p>
            <p className="mb-4">
              By creating an account, uploading content, or using our services, you represent that you are at least 18 years of age and have the legal capacity to enter into this binding agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Platform Purpose and Services</h2>
            <p className="mb-4">
              AgentBio.net provides a platform for licensed real estate professionals to create professional profiles, showcase their listings, and connect with potential clients. The Platform is an interactive computer service that hosts user-generated content and is not responsible for content posted by users.
            </p>
            <p className="mb-4">
              <strong className="text-red-600">IMPORTANT:</strong> AgentBio.net is a passive hosting platform. We do NOT create, verify, endorse, or take responsibility for any content posted by agents, including but not limited to property listings, photographs, descriptions, pricing, agent credentials, testimonials, or any other information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Agent Representations, Warranties, and Responsibilities</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 General Warranties</h3>
            <p className="mb-4">
              By using this Platform and uploading any content ("User Content"), you represent, warrant, and covenant that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You are a licensed real estate professional in good standing in all jurisdictions where you claim to hold a license</li>
              <li>All information you provide is accurate, current, and complete</li>
              <li>You will maintain the accuracy of all information and promptly update any changes</li>
              <li>You have full authority to enter into this agreement and grant the licenses described herein</li>
              <li>Your use of the Platform complies with all applicable federal, state, and local laws and regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Content Ownership and Authorization</h3>
            <p className="mb-4">
              <strong>You represent and warrant that you own all User Content OR have obtained all necessary rights, licenses, consents, and permissions to upload and grant Platform rights to display such content.</strong>
            </p>
            <p className="mb-4">
              Specifically, for each piece of content you upload, you warrant that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Photographs:</strong> You either (a) took the photograph yourself and own the copyright, OR (b) have a written license from the copyright owner (photographer, MLS, previous listing agent, property owner, etc.) that explicitly permits third-party platform upload and public display for the duration content remains on AgentBio.net. You have verified any license permits this specific use and is not limited to MLS display, IDX, or active listing marketing only.</li>
              <li><strong>MLS Photos:</strong> You understand that most MLS licenses DO NOT authorize upload to third-party platforms like AgentBio.net. You warrant that any MLS photos you upload are either (a) authorized by specific MLS policy for third-party platform use, OR (b) you have obtained separate written authorization from the copyright owner.</li>
              <li><strong>Professional Photography:</strong> You understand that photographers retain copyright unless explicitly transferred in writing. Payment alone does not transfer copyright. You warrant you have obtained written authorization from photographers for third-party platform use, not merely for listing marketing.</li>
              <li><strong>Logos and Trademarks:</strong> You have current authorization to use any brokerage logos, company trademarks, REALTOR® marks, or other proprietary marks displayed on your profile. You will immediately remove any such marks upon termination of your affiliation or authorization.</li>
              <li><strong>Testimonials and Reviews:</strong> You have obtained written consent from all individuals named, quoted, or depicted in testimonials, including permission to use their name, likeness, and statements for commercial marketing purposes on this Platform.</li>
              <li><strong>Property Information:</strong> All listing information, including descriptions, pricing, features, square footage, and other property details, is accurate to the best of your knowledge and sourced from reliable information.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Fair Housing Compliance</h3>
            <p className="mb-4">
              You represent and warrant that all content you post complies with the Fair Housing Act (42 U.S.C. § 3604) and applicable state fair housing laws. Specifically, you warrant that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your listings, descriptions, and advertisements contain NO statements indicating any preference, limitation, or discrimination based on race, color, religion, sex, handicap, familial status, national origin, or other protected characteristics</li>
              <li>You will not use discriminatory language, symbols, or imagery</li>
              <li>You understand that violations of the Fair Housing Act may result in immediate account termination and reporting to appropriate authorities</li>
              <li>You will comply with all Equal Housing Opportunity requirements in your advertising</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 State-Specific Licensing and Advertising Requirements</h3>
            <p className="mb-4">
              <strong>AgentBio.net is a national platform serving licensed real estate professionals across all 50 states.</strong> You warrant that you will comply with ALL applicable state real estate licensing laws and advertising requirements in the state(s) where you hold a license and conduct business.
            </p>
            <p className="mb-4">
              Each state has unique advertising and disclosure requirements. Examples include (but are not limited to):
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>All States:</strong> Display your full name as licensed, brokerage affiliation, office location, and license number as required by your state</li>
              <li><strong>Iowa:</strong> Iowa Administrative Code 193E-10 requires display of licensed name (no abbreviations), city and state of office, and states where licensed on every page</li>
              <li><strong>California:</strong> Business and Professions Code § 10140.6 requires license number on all advertising</li>
              <li><strong>New York:</strong> 19 NYCRR § 175.25 requires firm name and location in all advertising</li>
              <li><strong>Texas:</strong> TREC Rule § 535.154 requires disclosure of license holder status and license number</li>
              <li><strong>Florida:</strong> Florida Statute § 475.42 requires brokerage name in all advertising</li>
            </ul>
            <p className="mb-4">
              <strong>You are solely responsible for knowing and complying with your state's specific requirements.</strong> Violations may result in fines, license suspension, or disciplinary action by your state real estate commission. We recommend consulting your state real estate commission website or legal counsel for complete requirements.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Full Responsibility for Listings</h3>
            <p className="mb-4">
              <strong className="text-red-600">YOU ACKNOWLEDGE AND AGREE THAT YOU BEAR FULL AND SOLE RESPONSIBILITY FOR ALL LISTINGS, CONTENT, AND INFORMATION YOU POST ON AGENTBIO.NET.</strong>
            </p>
            <p className="mb-4">
              This includes but is not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Accuracy of all property information, pricing, features, and descriptions</li>
              <li>Compliance with all copyright laws regarding photos and materials</li>
              <li>Compliance with Fair Housing laws and regulations</li>
              <li>Compliance with state real estate licensing and advertising requirements</li>
              <li>Obtaining all necessary permissions, licenses, and authorizations</li>
              <li>Any harm, damages, or legal consequences arising from your content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Indemnification</h2>
            <p className="mb-4">
              <strong>You agree to indemnify, defend, and hold harmless AgentBio.net, its owners, officers, directors, employees, agents, successors, and assigns ("Indemnified Parties") from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees and legal costs) arising from or related to:</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your use of the Platform</li>
              <li>Any User Content you upload, post, or transmit through the Platform</li>
              <li>Your breach of these Terms of Service</li>
              <li>Your violation of any law, regulation, or third-party right, including without limitation any copyright, trademark, publicity right, privacy right, or fair housing law</li>
              <li>Any claim that your User Content caused damage to a third party</li>
              <li>Any dispute between you and any third party arising from your use of the Platform</li>
            </ul>
            <p className="mb-4">
              This indemnification obligation survives termination of your account and these Terms. We reserve the right, at our own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, and you shall cooperate with our defense of such claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. License Grant to Platform</h2>
            <p className="mb-4">
              You retain all ownership rights in your User Content. By uploading User Content to the Platform, you grant AgentBio.net a non-exclusive, worldwide, royalty-free, transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your User Content in connection with providing and promoting the Platform and our services.
            </p>
            <p className="mb-4">
              This license continues until you remove your User Content from the Platform, except that cached or archived copies may persist for reasonable technical periods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Copyright Policy and DMCA Compliance</h2>
            <p className="mb-4">
              AgentBio.net respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). We maintain a repeat infringer policy and will terminate accounts of users who repeatedly infringe copyrights.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 DMCA Designated Agent</h3>
            <p className="mb-4">
              If you believe content on our Platform infringes your copyright, please send a DMCA notice to our designated agent:
            </p>
            <div className="bg-muted p-4 rounded-md mb-4">
              <p className="font-mono">Copyright Agent, AgentBio.net</p>
              <p className="font-mono">Email: dmca@agentbio.net</p>
              <p className="font-mono">Address: [Physical Address - To be added]</p>
            </div>
            <p className="mb-4">
              Your notice must include all information required by 17 U.S.C. § 512(c)(3). See our complete DMCA Policy for detailed requirements.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Repeat Infringer Policy</h3>
            <p className="mb-4">
              Users who receive <strong>three (3) valid DMCA notices within a twelve (12) month period</strong> will have their accounts permanently terminated. We maintain records of all copyright complaints and track violations per user. This policy is strictly enforced.
            </p>
            <p className="mb-4">
              Warnings will be issued after the first and second notices. The third valid notice results in immediate permanent account termination without refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses and Content</h2>
            <p className="mb-4">You may NOT use our Platform to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Upload content you do not own or have authorization to use</li>
              <li>Infringe any copyright, trademark, patent, or other intellectual property right</li>
              <li>Violate the Fair Housing Act or any civil rights laws</li>
              <li>Post false, misleading, or deceptive information about properties or your credentials</li>
              <li>Use another agent's photos, content, or credentials</li>
              <li>Continue using brokerage logos or trademarks after leaving that brokerage</li>
              <li>Harass, threaten, defame, or abuse any person</li>
              <li>Post discriminatory content or engage in discriminatory practices</li>
              <li>Violate any local, state, or federal law or regulation</li>
              <li>Interfere with the Platform's operation or security</li>
              <li>Scrape, copy, or harvest data from the Platform</li>
              <li>Upload malicious code, viruses, or harmful software</li>
            </ul>
            <p className="mb-4">
              Violation of these prohibited uses may result in immediate account suspension or termination without notice or refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Account Termination and Suspension</h2>
            <p className="mb-4">
              We reserve the right to suspend or terminate your account immediately, with or without notice, for any reason, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Breach of these Terms of Service</li>
              <li>Copyright infringement or repeat infringer status</li>
              <li>Fair Housing Act violations</li>
              <li>False or misleading information</li>
              <li>Loss of real estate license or license suspension</li>
              <li>Complaints from third parties regarding your content</li>
              <li>Fraudulent or illegal activity</li>
              <li>Non-payment of subscription fees</li>
            </ul>
            <p className="mb-4">
              Upon termination, your right to use the Platform immediately ceases. We may delete your account and all associated content. Termination does not relieve you of obligations under these Terms, including indemnification obligations.
            </p>
            <p className="mb-4">
              You may terminate your account at any time by contacting support. Termination does not entitle you to a refund except as provided in our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Subscription and Payment Terms</h2>
            <p className="mb-4">
              Certain features of the Platform require paid subscriptions. By subscribing, you agree to the following:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You will be billed in advance on a recurring monthly or annual basis</li>
              <li>You must provide accurate and complete payment information</li>
              <li>You authorize automatic recurring charges to your payment method</li>
              <li>Subscription fees are non-refundable except as specified in Section 10</li>
              <li>We reserve the right to modify subscription fees with 30 days advance notice</li>
              <li>Failure to pay may result in immediate account suspension or termination</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Refund Policy</h2>
            <p className="mb-4">
              We offer refunds within <strong>14 days of initial purchase</strong> for monthly and annual subscriptions. After 14 days, all subscription fees are non-refundable.
            </p>
            <p className="mb-4">
              No refunds are provided for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Account termination due to Terms of Service violations</li>
              <li>Account termination due to copyright infringement</li>
              <li>Voluntary account cancellation after 14-day period</li>
              <li>Partial subscription periods</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Disclaimers and "AS IS" Provision</h2>
            <p className="mb-4">
              <strong>THE PLATFORM AND ALL CONTENT, MATERIALS, INFORMATION, AND SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong>
            </p>
            <p className="mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, AGENTBIO.NET DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>WARRANTIES REGARDING ACCURACY, RELIABILITY, OR COMPLETENESS OF CONTENT</li>
              <li>WARRANTIES THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE</li>
              <li>WARRANTIES REGARDING USER-POSTED CONTENT ACCURACY OR LEGALITY</li>
            </ul>
            <p className="mb-4">
              We do not warrant or guarantee that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>The Platform will meet your specific requirements</li>
              <li>Any particular results will be achieved through Platform use</li>
              <li>User Content is accurate, lawful, or does not infringe third-party rights</li>
              <li>Agents using the Platform are properly licensed or compliant with laws</li>
            </ul>
            <p className="mb-4">
              <strong>YOU ASSUME ALL RISK ARISING FROM YOUR USE OF THE PLATFORM.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
            <p className="mb-4">
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AGENTBIO.NET OR ITS OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR:</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>LOSS OF PROFITS, REVENUE, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES</li>
              <li>DAMAGES ARISING FROM USER CONTENT OR THIRD-PARTY CONTENT</li>
              <li>DAMAGES ARISING FROM YOUR RELIANCE ON PLATFORM CONTENT</li>
              <li>DAMAGES ARISING FROM UNAUTHORIZED ACCESS TO YOUR ACCOUNT OR DATA</li>
              <li>DAMAGES ARISING FROM PLATFORM INTERRUPTIONS, ERRORS, OR DEFECTS</li>
            </ul>
            <p className="mb-4">
              <strong>OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED TO THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) FEES YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).</strong>
            </p>
            <p className="mb-4">
              These limitations apply regardless of the legal theory (contract, tort, negligence, strict liability, or otherwise), even if we have been advised of the possibility of such damages.
            </p>
            <p className="mb-4">
              <strong>Exceptions:</strong> Applicable state and federal laws may not permit limitation of liability for personal injury, death, gross negligence, willful misconduct, or fraud. These limitations do not apply to such claims where prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Arbitration and Dispute Resolution</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.1 Agreement to Arbitrate</h3>
            <p className="mb-4">
              Except as provided below, any dispute, claim, or controversy arising out of or relating to these Terms or the Platform shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.
            </p>
            <p className="mb-4">
              Arbitration shall be conducted by a single neutral arbitrator. The arbitration shall take place remotely via videoconference or telephone, or if in-person arbitration is required, in the federal judicial district where you reside or in Polk County, Iowa, at your option. The arbitrator's decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.2 Small Claims Court Exception</h3>
            <p className="mb-4">
              Either party may bring an individual action in small claims court as an alternative to arbitration for claims within that court's jurisdiction.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.3 Class Action Waiver</h3>
            <p className="mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, YOU AND AGENTBIO.NET AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A CLASS MEMBER OR REPRESENTATIVE IN ANY CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.4 Opt-Out Right</h3>
            <p className="mb-4">
              You may opt out of this arbitration agreement within <strong>thirty (30) days</strong> of account creation by sending written notice to legal@agentbio.net with the subject line "Arbitration Opt-Out" and including your name and account email.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.5 Injunctive Relief Exception</h3>
            <p className="mb-4">
              Notwithstanding the arbitration agreement, either party may seek injunctive or equitable relief in court to protect intellectual property rights or confidential information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law and Jurisdiction</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of Iowa, without regard to its conflict of law provisions.
            </p>
            <p className="mb-4">
              For any disputes not subject to arbitration, you consent to the exclusive jurisdiction and venue of the state and federal courts located in Polk County, Iowa.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Modifications to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. Material changes will be communicated via:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Email notification to your registered email address at least <strong>30 days in advance</strong></li>
              <li>Prominent notice on the Platform</li>
              <li>Login prompt requiring acknowledgment before continued use</li>
            </ul>
            <p className="mb-4">
              Your continued use of the Platform after the effective date of modified Terms constitutes acceptance of the changes. If you do not agree to the modified Terms, you must discontinue use and may terminate your account.
            </p>
            <p className="mb-4">
              We maintain archived versions of all Terms with effective dates for your reference.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
            <p className="mb-4">
              By using the Platform, you consent to our collection and use of information as described in the Privacy Policy. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Third-Party Services and Links</h2>
            <p className="mb-4">
              The Platform may contain links to third-party websites, services, or resources. We do not endorse and are not responsible for third-party content, privacy practices, or terms of service.
            </p>
            <p className="mb-4">
              Your interactions with third parties, including payment processors (Stripe), email service providers, and any other third-party services, are solely between you and such third parties. We shall not be liable for any damages arising from such interactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">18. Severability and Entire Agreement</h2>
            <p className="mb-4">
              If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
            <p className="mb-4">
              These Terms, together with the Privacy Policy, DMCA Policy, and Acceptable Use Policy, constitute the entire agreement between you and AgentBio.net regarding the Platform and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">19. Assignment</h2>
            <p className="mb-4">
              You may not assign or transfer these Terms or your account to any other person or entity. We may assign these Terms to any successor or affiliate without restriction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">20. Survival</h2>
            <p className="mb-4">
              The following sections survive termination of your account or these Terms: User Warranties (Section 3), Indemnification (Section 4), DMCA Repeat Infringer Policy (Section 6), Disclaimers (Section 11), Limitation of Liability (Section 12), Arbitration (Section 13), and Governing Law (Section 14).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">21. Contact Information</h2>
            <p className="mb-4">
              Questions about these Terms of Service should be sent to:
            </p>
            <div className="bg-muted p-4 rounded-md mb-4">
              <p className="font-mono">AgentBio.net Legal Department</p>
              <p className="font-mono">Email: legal@agentbio.net</p>
              <p className="font-mono">DMCA Agent: dmca@agentbio.net</p>
              <p className="font-mono">Support: support@agentbio.net</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">22. Acknowledgment</h2>
            <p className="mb-4">
              BY CREATING AN ACCOUNT OR USING THE PLATFORM, YOU ACKNOWLEDGE THAT:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You have read and understood these Terms of Service</li>
              <li>You agree to be bound by these Terms and all incorporated policies</li>
              <li>You understand your full responsibility for all content you upload</li>
              <li>You understand that AgentBio.net is NOT responsible for user-posted content</li>
              <li>You understand your obligations regarding copyright, Fair Housing, and licensing compliance</li>
              <li>You have obtained all necessary permissions for photos, logos, and other content</li>
              <li>You accept full legal responsibility for your listings and profile content</li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-yellow-900 dark:text-yellow-100">
              ⚠️ Important Legal Notice
            </h3>
            <p className="mb-2 text-yellow-900 dark:text-yellow-100">
              <strong>As a real estate professional using AgentBio.net, you bear full legal responsibility for:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1 text-yellow-900 dark:text-yellow-100">
              <li>Copyright compliance for all photos and materials you upload</li>
              <li>Fair Housing Act compliance in all listings and content</li>
              <li>Accuracy of all property information and credentials</li>
              <li>Obtaining photographer permissions and license authorizations</li>
              <li>State licensing and advertising requirement compliance</li>
            </ul>
            <p className="mt-3 text-yellow-900 dark:text-yellow-100">
              AgentBio.net is a passive hosting platform and is NOT responsible for your content. Violations may result in legal consequences including copyright lawsuits, Fair Housing enforcement, and license sanctions.
            </p>
          </div>
        </div>
      </div>
      </div>
      <PublicFooter />
    </>
  );
}
