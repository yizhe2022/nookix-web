"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function TestOAuthPage() {
  const [config, setConfig] = useState<any>(null)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // 获取当前配置
    const checkConfig = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      setConfig({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        origin: window.location.origin,
        callbackUrl: `${window.location.origin}/auth/callback`,
      })
    }
    
    checkConfig()
  }, [])

  const testGoogleOAuth = async () => {
    console.log('[Test] Starting Google OAuth test...')
    console.log('[Test] Callback URL:', `${window.location.origin}/auth/callback`)
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    
    if (error) {
      console.error('[Test] OAuth error:', error)
      alert(`OAuth Error: ${error.message}`)
    } else {
      console.log('[Test] OAuth initiated:', data)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">OAuth 配置测试</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">当前配置</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">当前 Session</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {session ? JSON.stringify(session, null, 2) : 'No active session'}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">测试 OAuth</h2>
          <button
            onClick={testGoogleOAuth}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            测试 Google OAuth
          </button>
          <p className="mt-4 text-sm text-gray-600">
            点击按钮后，查看浏览器控制台的日志
          </p>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">检查清单：</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>✓ Supabase Dashboard → Authentication → URL Configuration</li>
            <li>✓ Site URL: http://localhost:3000</li>
            <li>✓ Redirect URLs: http://localhost:3000/auth/callback</li>
            <li>✓ Google Cloud Console → OAuth 重定向 URI</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
