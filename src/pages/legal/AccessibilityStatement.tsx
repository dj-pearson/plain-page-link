import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SEOHead } from "@/components/SEOHead";
import { SkipNavContent } from "@/components/ui/skip-nav";

export default function AccessibilityStatement() {
  const lastUpdated = "January 12, 2026";

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://agentbio.net/accessibility#webpage",
    "url": "https://agentbio.net/accessibility",
    "name": "Accessibility Statement - AgentBio",
    "description": "AgentBio's commitment to digital accessibility. Learn about our WCAG 2.1 AA conformance, accessibility features, and how to report accessibility issues.",
    "isPartOf": {
      "@id": "https://agentbio.net/#website"
    },
    "about": {
      "@type": "Thing",
      "name": "Accessibility Statement"
    },
    "datePublished": "2026-01-12",
    "dateModified": lastUpdated,
    "inLanguage": "en-US"
  };

  return (
    <>
      <SEOHead
        title="Accessibility Statement - AgentBio | WCAG 2.1 AA Conformance"
        description="AgentBio is committed to digital accessibility. Learn about our WCAG 2.1 Level AA conformance, accessibility features, assistive technology support, and how to report accessibility issues."
        keywords={["accessibility statement", "WCAG 2.1", "ADA compliance", "digital accessibility", "screen reader support", "keyboard navigation", "accessible real estate platform"]}
        canonicalUrl="https://agentbio.net/accessibility"
        schema={schema}
      />
      <PublicHeader />
      <SkipNavContent>
        <div className="min-h-screen bg-background py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Accessibility Statement</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
              <p className="text-muted-foreground mb-6">
                Last updated: {lastUpdated}
              </p>

              {/* Commitment Section */}
              <section aria-labelledby="commitment-heading">
                <h2 id="commitment-heading" className="text-2xl font-semibold mb-4">
                  Our Commitment to Accessibility
                </h2>
                <p className="mb-4">
                  AgentBio.net is committed to ensuring digital accessibility for people with disabilities.
                  We are continually improving the user experience for everyone and applying the relevant
                  accessibility standards to ensure we provide equal access to all users.
                </p>
                <p className="mb-4">
                  We believe that the internet should be available and accessible to anyone, and are
                  committed to providing a website that is accessible to the widest possible audience,
                  regardless of circumstance and ability.
                </p>
              </section>

              {/* Conformance Status */}
              <section aria-labelledby="conformance-heading">
                <h2 id="conformance-heading" className="text-2xl font-semibold mb-4">
                  Conformance Status
                </h2>
                <p className="mb-4">
                  The <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Web Content Accessibility Guidelines (WCAG)</a> defines
                  requirements for designers and developers to improve accessibility for people with
                  disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    AgentBio.net is substantially conformant with WCAG 2.1 Level AA.
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                    "Substantially conformant" means that while we have made significant efforts to meet
                    WCAG 2.1 Level AA standards, some parts of the content may not yet fully conform.
                  </p>
                </div>
                <p className="mb-4">
                  We have undertaken a comprehensive accessibility audit and are actively working to
                  remediate any identified issues. Our goal is full conformance with WCAG 2.1 Level AA.
                </p>
              </section>

              {/* Accessibility Features */}
              <section aria-labelledby="features-heading">
                <h2 id="features-heading" className="text-2xl font-semibold mb-4">
                  Accessibility Features
                </h2>
                <p className="mb-4">
                  AgentBio.net includes the following accessibility features:
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Keyboard Navigation</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>All interactive elements are accessible via keyboard navigation</li>
                  <li>Skip navigation links allow users to bypass repetitive content</li>
                  <li>Focus indicators are visible on all interactive elements</li>
                  <li>Logical tab order throughout the application</li>
                  <li>Keyboard shortcuts for common actions</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Screen Reader Support</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Semantic HTML structure for proper content hierarchy</li>
                  <li>ARIA landmarks to identify page regions</li>
                  <li>ARIA labels for icons and non-text elements</li>
                  <li>Live regions for dynamic content updates</li>
                  <li>Descriptive alt text for all meaningful images</li>
                  <li>Form labels properly associated with input fields</li>
                  <li>Error messages announced to assistive technologies</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Visual Accessibility</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Color contrast ratios meet WCAG 2.1 AA requirements (4.5:1 for normal text, 3:1 for large text)</li>
                  <li>Text can be resized up to 200% without loss of functionality</li>
                  <li>Content does not rely solely on color to convey information</li>
                  <li>Dark mode support for reduced eye strain</li>
                  <li>Consistent layout and navigation across all pages</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Motion and Animation</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Respects user's "prefers-reduced-motion" system setting</li>
                  <li>No content flashes more than three times per second</li>
                  <li>Animations can be paused or disabled</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Mobile Accessibility</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Touch targets are at least 44x44 pixels for easy interaction</li>
                  <li>Responsive design works on all screen sizes</li>
                  <li>Content is scrollable and zoomable</li>
                  <li>Compatible with mobile screen readers (VoiceOver, TalkBack)</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Forms and Input</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>All form fields have visible labels</li>
                  <li>Required fields are clearly indicated</li>
                  <li>Error messages are clear and specific</li>
                  <li>Form validation errors are associated with their fields</li>
                  <li>Input fields have appropriate autocomplete attributes</li>
                </ul>
              </section>

              {/* Assistive Technologies */}
              <section aria-labelledby="technologies-heading">
                <h2 id="technologies-heading" className="text-2xl font-semibold mb-4">
                  Compatibility with Assistive Technologies
                </h2>
                <p className="mb-4">
                  AgentBio.net is designed to be compatible with the following assistive technologies:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li><strong>Screen Readers:</strong> NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)</li>
                  <li><strong>Voice Control:</strong> Dragon NaturallySpeaking, Windows Speech Recognition, Voice Control (macOS)</li>
                  <li><strong>Magnification Software:</strong> ZoomText, Windows Magnifier, macOS Zoom</li>
                  <li><strong>Switch Access:</strong> Compatible with switch navigation devices</li>
                  <li><strong>Keyboard-Only Navigation:</strong> Full functionality available without a mouse</li>
                </ul>
                <p className="mb-4">
                  We recommend using the latest versions of assistive technologies and browsers for the
                  best experience.
                </p>
              </section>

              {/* Browser Support */}
              <section aria-labelledby="browsers-heading">
                <h2 id="browsers-heading" className="text-2xl font-semibold mb-4">
                  Supported Browsers
                </h2>
                <p className="mb-4">
                  For the best accessible experience, we recommend using the following browsers:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Google Chrome (latest two versions)</li>
                  <li>Mozilla Firefox (latest two versions)</li>
                  <li>Apple Safari (latest two versions)</li>
                  <li>Microsoft Edge (latest two versions)</li>
                </ul>
              </section>

              {/* Known Limitations */}
              <section aria-labelledby="limitations-heading">
                <h2 id="limitations-heading" className="text-2xl font-semibold mb-4">
                  Known Limitations
                </h2>
                <p className="mb-4">
                  Despite our best efforts to ensure accessibility of AgentBio.net, there may be some
                  limitations. Below is a description of known limitations:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    <strong>Third-Party Content:</strong> Some property images and content uploaded by
                    real estate agents may not include appropriate alt text. We encourage all agents
                    to add descriptive alt text to their images.
                  </li>
                  <li>
                    <strong>PDF Documents:</strong> Some older PDF documents may not be fully accessible.
                    We are working to remediate these documents.
                  </li>
                  <li>
                    <strong>Embedded Maps:</strong> Interactive maps from third-party providers may have
                    limited accessibility. Alternative address information is always provided.
                  </li>
                  <li>
                    <strong>User-Generated Content:</strong> Blog posts and content created by users may
                    not always meet accessibility standards. We provide guidelines to encourage accessible
                    content creation.
                  </li>
                </ul>
                <p className="mb-4">
                  We are continuously working to identify and address accessibility barriers. If you
                  encounter any issues not listed here, please contact us.
                </p>
              </section>

              {/* Technical Specifications */}
              <section aria-labelledby="technical-heading">
                <h2 id="technical-heading" className="text-2xl font-semibold mb-4">
                  Technical Specifications
                </h2>
                <p className="mb-4">
                  Accessibility of AgentBio.net relies on the following technologies to work with the
                  particular combination of web browser and any assistive technologies or plugins
                  installed on your computer:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>HTML5</li>
                  <li>WAI-ARIA 1.2</li>
                  <li>CSS3</li>
                  <li>JavaScript (ES6+)</li>
                </ul>
                <p className="mb-4">
                  These technologies are relied upon for conformance with the accessibility standards used.
                </p>
              </section>

              {/* Assessment Methods */}
              <section aria-labelledby="assessment-heading">
                <h2 id="assessment-heading" className="text-2xl font-semibold mb-4">
                  Assessment Methods
                </h2>
                <p className="mb-4">
                  AgentBio.net assesses the accessibility of our platform through the following methods:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li><strong>Self-Assessment:</strong> Regular internal audits using automated accessibility testing tools</li>
                  <li><strong>Automated Testing:</strong> Integration of accessibility testing in our development workflow</li>
                  <li><strong>Manual Testing:</strong> Keyboard navigation testing and screen reader testing</li>
                  <li><strong>User Feedback:</strong> Ongoing collection and review of accessibility feedback from users</li>
                </ul>
              </section>

              {/* Feedback and Contact */}
              <section aria-labelledby="feedback-heading">
                <h2 id="feedback-heading" className="text-2xl font-semibold mb-4">
                  Feedback and Contact Information
                </h2>
                <p className="mb-4">
                  We welcome your feedback on the accessibility of AgentBio.net. If you encounter
                  accessibility barriers or have suggestions for improvement, please let us know:
                </p>
                <div className="bg-muted p-4 rounded-md mb-4">
                  <p className="font-mono text-sm">
                    <strong>Accessibility Feedback:</strong><br />
                    Email: <a href="mailto:accessibility@agentbio.net" className="text-primary hover:underline">accessibility@agentbio.net</a><br />
                    Subject: Accessibility Feedback<br />
                    <br />
                    <strong>Response Time:</strong><br />
                    We aim to respond to accessibility feedback within 5 business days.<br />
                    <br />
                    <strong>General Support:</strong><br />
                    Email: <a href="mailto:support@agentbio.net" className="text-primary hover:underline">support@agentbio.net</a><br />
                    <br />
                    <strong>Mailing Address:</strong><br />
                    AgentBio.net Accessibility Team<br />
                    Des Moines, IA
                  </p>
                </div>
                <p className="mb-4">
                  When reporting accessibility issues, please include:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>The URL of the page where you experienced the issue</li>
                  <li>A description of the accessibility barrier you encountered</li>
                  <li>The assistive technology you were using (if applicable)</li>
                  <li>Your browser and operating system</li>
                  <li>Your contact information (optional, but helpful for follow-up)</li>
                </ul>
              </section>

              {/* Enforcement Procedure */}
              <section aria-labelledby="enforcement-heading">
                <h2 id="enforcement-heading" className="text-2xl font-semibold mb-4">
                  Enforcement Procedure
                </h2>
                <p className="mb-4">
                  If you are not satisfied with our response to your accessibility feedback, you may
                  escalate the issue through the following channels:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    <strong>Internal Escalation:</strong> Contact our management team at{" "}
                    <a href="mailto:legal@agentbio.net" className="text-primary hover:underline">legal@agentbio.net</a>
                  </li>
                  <li>
                    <strong>External Resources:</strong> You may file a complaint with the{" "}
                    <a href="https://www.ada.gov/file-a-complaint/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      U.S. Department of Justice
                    </a>{" "}
                    or your state's attorney general office
                  </li>
                </ul>
              </section>

              {/* Continuous Improvement */}
              <section aria-labelledby="improvement-heading">
                <h2 id="improvement-heading" className="text-2xl font-semibold mb-4">
                  Continuous Improvement
                </h2>
                <p className="mb-4">
                  We are committed to continuously improving the accessibility of AgentBio.net. Our
                  ongoing efforts include:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Regular accessibility audits and testing</li>
                  <li>Training our development team on accessibility best practices</li>
                  <li>Including accessibility requirements in our development process</li>
                  <li>Engaging with users with disabilities to gather feedback</li>
                  <li>Monitoring changes in accessibility guidelines and updating our practices accordingly</li>
                </ul>
              </section>

              {/* Related Resources */}
              <section aria-labelledby="resources-heading">
                <h2 id="resources-heading" className="text-2xl font-semibold mb-4">
                  Related Resources
                </h2>
                <p className="mb-4">
                  Learn more about web accessibility:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    <a href="https://www.w3.org/WAI/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      W3C Web Accessibility Initiative (WAI)
                    </a>
                  </li>
                  <li>
                    <a href="https://www.ada.gov/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Americans with Disabilities Act (ADA)
                    </a>
                  </li>
                  <li>
                    <a href="https://www.section508.gov/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Section 508 Accessibility
                    </a>
                  </li>
                  <li>
                    <a href="https://webaim.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      WebAIM - Web Accessibility in Mind
                    </a>
                  </li>
                </ul>
              </section>

              {/* Summary Box */}
              <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-100">
                  Accessibility Commitment Summary
                </h3>
                <ul className="list-disc pl-6 space-y-1 text-blue-900 dark:text-blue-100">
                  <li>We strive for WCAG 2.1 Level AA conformance</li>
                  <li>Full keyboard navigation support</li>
                  <li>Compatible with major screen readers and assistive technologies</li>
                  <li>Color contrast meets WCAG requirements</li>
                  <li>Respects user motion preferences</li>
                  <li>Mobile-accessible with appropriate touch targets</li>
                  <li>Regular accessibility audits and improvements</li>
                  <li>Dedicated accessibility feedback email: accessibility@agentbio.net</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SkipNavContent>
      <PublicFooter />
    </>
  );
}
