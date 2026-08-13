import { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { toSiteUrl } from "@/lib/site-config"

const baseMetadata: Metadata = {
  title: "Data Policy & Account Management | Nookix",
  description: "Control your personal information and account settings. Learn about your data rights, how we protect your information, and how to manage your Nookix account.",
  alternates: {
    canonical: toSiteUrl('/data-policy'),
  },
  openGraph: {
    title: "Data Policy & Account Management | Nookix",
    description: "Control your personal information and account settings. Learn about your data rights, how we protect your information, and how to manage your Nookix account.",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/data-policy', baseMetadata)
}

export default function DataPolicyPage() {
  return (
    <div className="bg-[#FCFAF7] min-h-screen">
      {/* Header */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Your Data & Account Management</h1>
            <p className="text-lg text-gray-300">Control your personal information and account settings</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Data Management</h2>
              <p className="text-sm text-gray-600 mb-8">Last updated: January 2025</p>

              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Data Rights</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    At Nookix, we believe in transparency and giving you full control over your personal data.
                    We are committed to protecting your privacy and respecting your rights under applicable data protection laws,
                    including GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    You have the right to access, modify, or delete your personal information at any time.
                    We make it easy for you to manage your data and account preferences through our platform.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">What Data We Store</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    When you use Nookix, we may collect and store the following types of information:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Account Information:</strong> Name, email address, and profile preferences</li>
                    <li><strong>Listening History:</strong> Books you've played, progress, and bookmarks</li>
                    <li><strong>Usage Analytics:</strong> How you interact with our platform (anonymized when possible)</li>
                    <li><strong>Payment Information:</strong> Billing details (securely processed by third-party providers)</li>
                    <li><strong>Device Information:</strong> Basic technical data to improve your experience</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Security & Protection</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We implement industry-standard security measures to protect your personal information.
                    Your data is encrypted both in transit and at rest, and we regularly review our security practices
                    to ensure your information remains safe. We never sell your personal data to third parties,
                    and we only share information as outlined in our Privacy Policy.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Management Options</h3>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <strong>Update Your Information:</strong> You can modify your account details,
                          preferences, and privacy settings directly through your profile page.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          <strong>Download Your Data:</strong> Request a copy of all personal data we have
                          about you in a portable format.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Temporary Account Deactivation:</strong> Pause your account while
                          keeping your data safe for future reactivation.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Account & Data Deletion</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We respect your right to be forgotten. If you decide you no longer want to use Nookix,
                    you can request complete deletion of your account and all associated data.
                  </p>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                    <h4 className="text-lg font-semibold text-red-800 mb-3">🗑️ Complete Account Deletion</h4>
                    <p className="text-red-700 mb-4">
                      To permanently delete your account and all related data, please send an email request to:
                    </p>
                    <div className="bg-white border border-red-200 rounded p-3 mb-4">
                      <p className="text-center">
                        <a href="mailto:support@nookix.net" className="text-lg font-semibold text-red-600 hover:text-red-800">
                          support@nookix.net
                        </a>
                      </p>
                    </div>
                    <p className="text-sm text-red-600">
                      <strong>Important:</strong> This action is irreversible. Once deleted, your account,
                      listening history, preferences, and all associated data will be permanently removed from our systems.
                    </p>
                  </div>

                  <h4 className="text-lg font-semibold text-gray-900 mb-3">What to Include in Your Deletion Request:</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                    <li>Your registered email address</li>
                    <li>Your full name as it appears on the account</li>
                    <li>Confirmation that you want to permanently delete all data</li>
                    <li>Any specific concerns or feedback (optional)</li>
                  </ul>

                  <p className="text-gray-700 leading-relaxed">
                    We will process your deletion request within 30 days and send you a confirmation email once completed.
                    Please note that some data may be retained for legal compliance purposes as outlined in our Privacy Policy.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Retention Policy</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We only retain your personal data for as long as necessary to provide our services or as required by law:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Active Accounts:</strong> Data retained while your account is active and for service provision</li>
                    <li><strong>Inactive Accounts:</strong> Account data may be deleted after 3 years of inactivity</li>
                    <li><strong>Legal Requirements:</strong> Some data may be retained longer for legal, tax, or regulatory compliance</li>
                    <li><strong>Anonymous Analytics:</strong> Aggregated, non-personal data may be retained for product improvement</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">International Data Transfers</h3>
                  <p className="text-gray-700 leading-relaxed">
                    If you're located outside the United States, please note that your data may be transferred to and
                    processed in the US where our servers are located. We ensure appropriate safeguards are in place
                    to protect your data in accordance with applicable privacy laws.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you have any questions about your data, account management, or need assistance with any of the above processes,
                    please don't hesitate to contact our support team:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      <strong>Email:</strong>{" "}
                      <a href="mailto:support@nookix.net" className="text-blue-600 hover:text-blue-800">
                        support@nookix.net
                      </a>
                    </p>
                    <p className="text-gray-700 mt-2">
                      <strong>Response Time:</strong> We typically respond within 15 business days
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    For privacy-related inquiries, you can also reach us at{" "}
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