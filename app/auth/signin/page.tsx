import { Suspense } from "react"
import { Metadata } from "next"
import AuthLayout from "@/components/auth/auth-layout"
import AuthPageForm from "@/components/auth/auth-page-form"

export const metadata: Metadata = {
  title: "Sign in to Your Nookix Account | Nookix",
  description: "Sign in to Nookix with Google, Facebook, or email and continue your learning journey.",
}

export default function SignInPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <AuthPageForm mode="signin" />
      </Suspense>
    </AuthLayout>
  )
}
