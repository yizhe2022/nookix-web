"use client"

export default function TermsOfServiceClient() {
  return (
    <div className="bg-[#fafbfc] min-h-screen">
      {/* Header */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-300">Your rights and our commitments</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms of Service for Nookix</h2>
              <p className="text-sm text-gray-600 mb-8">Last Updated: June 22, 2025</p>

              <div className="space-y-8">
                <section>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Welcome to Nookix! These Terms of Service ("Terms") govern your access to and use of the
                    Nookix website, applications, and services (collectively, the "Service"), operated by Nookix
                    Inc. ("Nookix", "we", "us", or "our").
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Please read these Terms carefully. By accessing, creating an account, or using our Service,
                    you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these
                    Terms, you may not use the Service.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Service Description</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Nookix is a premium digital audiobook platform that provides users with published
                    summaries of non-fiction books and access to a library of audiobooks ("Content").
                    Our Service includes, but is not limited to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                    <li>Book summaries and related reading content.</li>
                    <li>Streaming access to full-length audiobooks.</li>
                    <li>Personalized content recommendations.</li>
                    <li>Access to premium, exclusive Content through a subscription plan ("Subscription").</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right to modify, suspend, or discontinue the Service or any part of it at any
                    time, with or without notice.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">2. User Accounts & Eligibility</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Account Creation:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        To access certain features, you must create an account. You agree to
                        provide accurate, current, and complete information during the registration process and
                        to update such information to keep it accurate.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Account Responsibility:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        You are solely responsible for all activities that occur under
                        your account and for maintaining the confidentiality of your account password. You must
                        notify us immediately of any unauthorized use of your account.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Eligibility:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        The Service is not intended for individuals under the age of 13. If you are
                        between the ages of 13 and 18 (or the age of legal majority in your jurisdiction), you may
                        only use the Service under the supervision of a parent or legal guardian who agrees to be
                        bound by these Terms.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Subscriptions, Payments, and Cancellations</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Subscriptions:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        We offer paid Subscriptions for access to premium Content and features.
                        Subscription plans may be offered on a monthly or annual basis and are detailed on our
                        Premium page.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Billing and Automatic Renewal:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        By starting a Subscription, you authorize us to charge
                        you the applicable subscription fee at the then-current rate. <strong>YOUR SUBSCRIPTION
                          WILL AUTOMATICALLY RENEW AT THE END OF EACH BILLING CYCLE UNLESS YOU
                          CANCEL IT.</strong> You may cancel your Subscription at any time through your account settings.
                        The cancellation will take effect at the end of the current billing period.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Refund Policy:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        <strong>PAYMENTS ARE NON-REFUNDABLE AND THERE ARE NO REFUNDS
                          OR CREDITS FOR PARTIALLY USED PERIODS.</strong> Following any cancellation, however, you
                        will continue to have access to the service through the end of your current billing period.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Price Changes:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        We reserve the right to change our subscription prices. We will provide
                        you with reasonable prior notice of any price changes, at least 30 days before the
                        changes become effective. Your continued use of the Service after the price change
                        constitutes your agreement to pay the modified price.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Payment Processors:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        All payments are processed through third-party payment
                        gateways. We are not responsible for the processing of your payment and you may be
                        subject to the terms and conditions of those third parties.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Intellectual Property Rights</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Our Content:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        The Service and all Content, including but not limited to audiobooks,
                        summaries, text, graphics, logos, and software, are the exclusive property
                        of Nookix and its licensors, and are protected by copyright, trademark, and other
                        intellectual property laws.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Limited License:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        We grant you a limited, non-exclusive, non-transferable, revocable
                        license to access and use the Service and its Content for your personal, non-commercial
                        use, strictly in accordance with these Terms.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Restrictions:</h4>
                      <p className="text-gray-700 leading-relaxed">
                        You agree not to copy, reproduce, distribute, modify, create derivative
                        works of, publicly display, or otherwise exploit any part of the Service or Content without
                        our express prior written permission.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Conduct</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">You agree not to use the Service to:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Engage in any unlawful, fraudulent, or malicious activity.</li>
                    <li>Infringe upon the intellectual property or other rights of Nookix or any third party.</li>
                    <li>Harass, abuse, defame, or discriminate against others.</li>
                    <li>Scrape, reverse-engineer, decompile, or otherwise attempt to access the source code or
                      underlying structure of the Service.</li>
                    <li>Interfere with or disrupt the security or performance of the Service.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Termination</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We may terminate or suspend your account and access to the Service immediately, without
                    prior notice or liability, if you breach these Terms. Upon termination, your right to use the
                    Service will immediately cease. All provisions of the Terms which by their nature should survive
                    termination shall survive, including, without limitation, ownership provisions, warranty
                    disclaimers, indemnity, and limitations of liability.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">7. Disclaimer of Warranties</h3>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY
                      WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
                      IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
                      NON-INFRINGEMENT. NOOKIX DOES NOT WARRANT THAT THE SERVICE WILL BE
                      UNINTERRUPTED, SECURE, OR ERROR-FREE.</strong>
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    <strong>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL NOOKIX, ITS
                      AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS, BE LIABLE FOR ANY INDIRECT,
                      INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS
                      OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE,
                      GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.</strong>
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>IN NO EVENT SHALL NOOKIX'S AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE
                      SERVICE EXCEED THE GREATER OF ONE HUNDRED U.S. DOLLARS ($100) OR THE AMOUNTS
                      PAID BY YOU TO NOOKIX IN THE 12 MONTHS PRIOR TO THE CLAIM.</strong>
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">9. Governing Law and Dispute Resolution</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    These Terms shall be governed by the laws of the State of Delaware, United States, without
                    regard to its conflict of law provisions.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Any dispute arising from these Terms shall be resolved through final and binding arbitration,
                    rather than in court, except that you may assert claims in small claims court if your claims
                    qualify. By agreeing to these Terms, you agree to waive any right to a jury trial or to
                    participate in a class action.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
                    revision is material, we will provide at least 30 days' notice prior to any new terms taking
                    effect. By continuing to access or use our Service after those revisions become effective, you
                    agree to be bound by the revised terms.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Information</h3>
                  <p className="text-gray-700 leading-relaxed">
                    If you have any questions about these Terms, please contact us at:{" "}
                    <a href="mailto:nookixpod@gmail.com" className="text-blue-600 hover:text-blue-800">
                      nookixpod@gmail.com
                    </a>
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
