import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="mb-4 text-center text-3xl font-bold">Terms of Service</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-3 text-xl font-semibold">1. Acceptance of Terms</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                By accessing and using Curious HR: Synapse (&ldquo;the Service&rdquo;), you accept
                and agree to be bound by the terms and provision of this agreement. If you do not
                agree to abide by the above, please do not use this service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">2. Description of Service</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Curious HR: Synapse is an AI-powered HR and employee administration platform that
                provides expense management, team collaboration, and administrative tools. The
                Service includes:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Expense submission and management</li>
                <li>Receipt processing and analysis</li>
                <li>Team collaboration and approval workflows</li>
                <li>Analytics and reporting features</li>
                <li>Integration with third-party services</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">3. User Accounts</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>To use the Service, you must:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Be at least 18 years old or have parental consent</li>
                <li>Register for an account with valid information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">4. Acceptable Use</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with the Service&apos;s operation or other users</li>
                <li>Submit false or fraudulent expense information</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">5. Payment and Billing</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Some features of the Service may require payment. By subscribing to paid features,
                you agree to:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Pay all fees in advance and on time</li>
                <li>Provide accurate billing information</li>
                <li>Authorize recurring charges for subscription services</li>
                <li>Accept that fees are non-refundable except as required by law</li>
                <li>Understand that prices may change with notice</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">6. Data and Privacy</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Your privacy is important to us. Our collection and use of personal information is
                governed by our Privacy Policy, which is incorporated into these Terms by reference.
                You agree to:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Provide accurate and complete information</li>
                <li>Update your information as needed</li>
                <li>Respect the privacy of other users</li>
                <li>Comply with applicable data protection laws</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">7. Intellectual Property</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                The Service and its original content, features, and functionality are owned by
                Curious HR and are protected by international copyright, trademark, patent, trade
                secret, and other intellectual property laws. You retain ownership of content you
                submit, but grant us a license to use it for service provision.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">8. Disclaimers</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We
                disclaim all warranties, express or implied, including but not limited to:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Warranties that the Service will be uninterrupted or error-free</li>
                <li>Warranties regarding the accuracy of AI-generated content</li>
                <li>Warranties that defects will be corrected</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">9. Limitation of Liability</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                In no event shall Curious HR be liable for any indirect, incidental, special,
                consequential, or punitive damages, including without limitation, loss of profits,
                data, use, goodwill, or other intangible losses, resulting from your use of the
                Service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">10. Termination</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                We may terminate or suspend your account and access to the Service immediately,
                without prior notice, for conduct that we believe violates these Terms or is harmful
                to other users, us, or third parties. Upon termination, your right to use the
                Service will cease immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">11. Governing Law</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your
                Jurisdiction], without regard to its conflict of law provisions. Any disputes
                arising from these Terms or the Service shall be resolved in the courts of [Your
                Jurisdiction].
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">12. Changes to Terms</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any
                material changes by posting the new Terms on this page and updating the &ldquo;Last
                updated&rdquo; date. Your continued use of the Service after such changes
                constitutes acceptance of the new Terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">13. Contact Information</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">Synapse is brought to you by Curious Cat Consulting</p>
                <p>Email: privacy@curiouscat.consulting</p>
                <p>Address: Tampa, FL</p>
                <p>
                  Website:{" "}
                  <a href="https://curiouscat.consulting" className="text-primary hover:underline">
                    https://curiouscat.consulting
                  </a>
                </p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
