export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily access the materials on our platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
            <p className="mb-4">Under this license you may not:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
            <p className="mb-4">
              You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Billing</h2>
            <p className="mb-4">
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis. Billing cycles are set on a monthly or annual basis.
            </p>
            <p className="mb-4">
              A valid payment method is required to process the payment for your subscription. You must provide accurate and complete billing information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Refund Policy</h2>
            <p className="mb-4">
              We offer refunds within 14 days of purchase for monthly subscriptions. Annual subscriptions are non-refundable after 14 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Content Ownership</h2>
            <p className="mb-4">
              You retain all rights to the content you upload to our platform. By uploading content, you grant us a license to use, store, and display that content as necessary to provide our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
            <p className="mb-4">You may not use our service:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, or local regulations</li>
              <li>To infringe upon the rights of others</li>
              <li>To harass, abuse, or harm another person</li>
              <li>To transmit spam or malicious code</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              In no event shall we be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <p className="mb-4">
              Questions about the Terms of Service should be sent to us at legal@example.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
