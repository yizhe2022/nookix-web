"use client"

export default function PrivacyPolicyClient() {
  return (
    <div className="bg-[#fafbfc] min-h-screen">
      {/* Header */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-300">How we protect your data and privacy</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy for Nookix</h2>
              <p className="text-sm text-gray-600 mb-8">Last Updated: June 22, 2025</p>

              <div className="space-y-8">
                <section>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Thank you for using Nookix! This Privacy Policy explains how Nookix Inc. ("Nookix", "we", "us",
                    or "our") collects, uses, and shares information about you when you use our website,
                    applications, and services (collectively, the "Service"). Your privacy is important to us, and we
                    are committed to protecting it.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    By using our Service, you agree to the collection and use of information in accordance with
                    this policy.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We collect information in a few different ways to provide and improve our Service.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">A. Information You Provide to Us:</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>
                          <strong>Account Information:</strong> When you create an account, we collect your name, email
                          address, and password.
                        </li>
                        <li>
                          <strong>Payment and Subscription Information:</strong> When you subscribe to our premium service,
                          we collect information necessary to process your payment. This may include your name,
                          billing address, and transaction details. Please note: We do not directly store your full
                          credit card number. All payments are processed securely by our third-party payment
                          processor, Stripe. We receive a secure token from Stripe that allows us to manage your
                          subscription and process future renewal payments without ever having access to your
                          sensitive card details.
                        </li>
                        <li>
                          <strong>Communications:</strong> If you contact us directly (e.g., for customer support), we may receive
                          additional information about you such as your name, email address, the contents of the
                          message, and any other information you may choose to provide.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">B. Information We Collect Automatically:</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>
                          <strong>Usage Data:</strong> We collect information about your activity on our Service, such as your
                          listening history, book progress, searches, and content preferences. This helps us
                          personalize your experience.
                        </li>
                        <li>
                          <strong>Device and Log Information:</strong> We collect information from and about the device you use
                          to access our Service, including your IP address, browser type, operating system, device
                          identifiers, and pages visited.
                        </li>
                        <li>
                          <strong>Cookies and Tracking Technologies:</strong> We use cookies and similar technologies to
                          operate and analyze our Service. For more details, please see the "Cookies and Tracking"
                          section below.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We use the information we collect for various purposes, including to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Provide, operate, and maintain our Service.</li>
                    <li>Process your transactions, manage your Subscription, and send you related information,
                      including purchase confirmations and billing receipts.</li>
                    <li>Improve, personalize, and expand our Service and content offerings.</li>
                    <li>Communicate with you, including responding to your comments and questions, and
                      sending you technical notices, updates, and security alerts.</li>
                    <li>Understand and analyze how you use our Service to monitor and prevent fraud.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">3. How We Share Your Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information in the following
                    limited situations:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>
                      <strong>Service Providers:</strong> We share information with third-party vendors and service providers
                      who perform services on our behalf, such as payment processing (e.g., Stripe), cloud
                      hosting, and analytics.
                    </li>
                    <li>
                      <strong>Legal Compliance and Protection:</strong> We may disclose your information if required to do
                      so by law or in the good faith belief that such action is necessary to comply with a legal
                      obligation, protect our rights or property, or prevent fraud or abuse.
                    </li>
                    <li>
                      <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your
                      information may be transferred as part of that transaction.
                    </li>
                    <li>
                      <strong>With Your Consent:</strong> We may share your information for any other purpose with your
                      explicit consent.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security and Retention</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Security:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        We implement appropriate technical and organizational security measures,
                        such as encryption, to protect your personal information. However, no electronic
                        transmission or storage is 100% secure, and we cannot guarantee absolute security.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Retention:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        We retain your personal information for as long as your account is active or as
                        needed to provide you with the Service. We may also retain information to comply with
                        our legal obligations, resolve disputes, and enforce our agreements.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">5. Your Data Rights and Choices (GDPR & CCPA/CPRA)</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Depending on your location, you may have certain rights regarding your personal information.
                    These include the right to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Access the personal information we hold about you.</li>
                    <li>Rectify or Correct inaccurate personal data.</li>
                    <li>Request the Erasure (deletion) of your personal data.</li>
                    <li>Restrict or Object to our processing of your personal data.</li>
                    <li>Data Portability (receive your data in a machine-readable format).</li>
                    <li>Opt-out of the "Sale" or "Sharing" of your personal information (as defined by
                      California law). Nookix does not sell your personal information.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    To exercise any of these rights, please contact us at the email address provided below.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We use cookies and similar technologies to help us operate our Service, understand user
                    activity, and improve your experience. You can instruct your browser to refuse all cookies or to
                    indicate when a cookie is being sent. However, if you do not accept cookies, you may not be
                    able to use some portions of our Service.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Our Service is not directed to anyone under the age of 13. We do not knowingly collect
                    personally identifiable information from children under 13. If you are a parent or guardian and
                    you are aware that your child has provided us with personal data without your consent, please
                    contact us.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Your information, including personal data, may be transferred to—and maintained
                    on—computers located outside of your state, province, country, or other governmental
                    jurisdiction where the data protection laws may differ. We will take all steps reasonably
                    necessary to ensure that your data is treated securely and in accordance with this Privacy
                    Policy.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to This Privacy Policy</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We may update our Privacy Policy from time to time. We will notify you of any material
                    changes by posting the new Privacy Policy on this page and, where feasible, by sending you
                    an email notification. We advise you to review this Privacy Policy periodically for any changes.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">10. Contact Us</h3>
                  <p className="text-gray-700 leading-relaxed">
                    If you have any questions about this Privacy Policy, please contact us at:{" "}
                    <a href="mailto:nookixpod@gmail.com" className="text-blue-600 hover:text-blue-800">
                      nookixpod@gmail.com
                    </a>
                    . For detailed information about how we manage your data and account settings, visit our{" "}
                    <a href="/data-policy" className="text-blue-600 hover:text-blue-800 font-medium">
                      Data Management Center
                    </a>
                    .
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
