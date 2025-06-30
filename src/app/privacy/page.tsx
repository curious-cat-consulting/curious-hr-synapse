import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="mb-4 text-center text-3xl font-bold">Privacy Policy</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-3 text-xl font-semibold">1. Information We Collect</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                We collect information you provide directly to us, such as when you create an
                account, submit expenses, or contact us for support. This may include:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Name, email address, and contact information</li>
                <li>Data from the</li>
                <li>Expense data, receipts, and related documents</li>
                <li>Team and organizational information</li>
                <li>Communication records and support requests</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">2. How We Use Your Information</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>We use the information we collect to:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and manage expense submissions</li>
                <li>Send notifications and updates about your account</li>
                <li>Respond to your questions and support requests</li>
                <li>Detect and prevent fraud or abuse for your account</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">3. Information Sharing</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third
                parties except in the following circumstances:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>With service providers who assist in operating our platform</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">4. Data Security</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                We implement appropriate technical and organizational measures to protect your
                personal information against unauthorized access, alteration, disclosure, or
                destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">5. Data Retention</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                We retain your personal information for as long as necessary to provide our services
                and comply with legal obligations. You may request deletion of your account and
                associated data at any time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">6. Your Rights</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your personal information</li>
                <li>Object to or restrict certain processing activities</li>
                <li>Data portability in a structured format</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">7. Cookies and Tracking</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage
                patterns, and provide personalized content. You can control cookie settings through
                your browser preferences.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">8. Third-Party Services</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Our service may integrate with third-party services (such as authentication
                providers and payment processors). These services have their own privacy policies,
                and we encourage you to review them.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">9. Changes to This Policy</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                We may update this privacy policy from time to time. We will notify you of any
                material changes by posting the new policy on this page and updating the &ldquo;Last
                updated&rdquo; date.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">10. Contact Us</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                If you have any questions about this privacy policy or our data practices, please
                contact us at:
              </p>
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
