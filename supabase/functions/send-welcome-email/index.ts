// Supabase Edge Function: Send Welcome Email
// Triggered when a new user signs up

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: {
    id: string
    display_name?: string
    welcome_email_sent?: boolean
    created_at: string
  }
  old_record: any
}

serve(async (req) => {
  try {
    // 验证请求方法
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 解析 webhook payload
    const payload: WebhookPayload = await req.json()
    
    console.log('Received webhook:', payload.type, payload.table)

    // 只处理 user_profiles 表的 INSERT 事件
    if (payload.table !== 'user_profiles' || payload.type !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userId = payload.record.id
    const displayName = payload.record.display_name

    // 检查是否已发送欢迎邮件
    if (payload.record.welcome_email_sent) {
      console.log('Welcome email already sent for user:', userId)
      return new Response(
        JSON.stringify({ message: 'Email already sent' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 创建 Supabase 客户端
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // 获取用户邮箱
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      console.error('Failed to get user:', userError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userEmail = userData.user.email
    const userName = displayName || userEmail?.split('@')[0] || 'there'

    console.log('Sending welcome email to:', userEmail)

    // 构建欢迎邮件 HTML
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Nookix</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                Welcome to Nookix! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Thank you for joining <strong>Nookix</strong> — your gateway to the world's best book summaries and engaging audio books! 📚✨
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                We're excited to help you learn smarter and get actionable wisdom. Here's what you can do next:
              </p>
              
              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #333333;">
                      🎧 <strong>Listen to 30-minute audio summaries</strong><br>
                      <span style="color: #666666; font-size: 14px;">Perfect for your commute, workout, or downtime</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #333333;">
                      📖 <strong>Explore thousands of books across genres</strong><br>
                      <span style="color: #666666; font-size: 14px;">Business, self-help, psychology, and more</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #333333;">
                      ⭐ <strong>Build your personal library</strong><br>
                      <span style="color: #666666; font-size: 14px;">Save your favorites and track your progress</span>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://nookix.net" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Start Exploring Books
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Need help? Contact support@nookix.net.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Happy reading! 📚
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Nookix. All rights reserved.<br>
                <a href="https://nookix.net/terms" style="color: #999999; text-decoration: none;">Terms</a> ·
                <a href="https://nookix.net/data-policy" style="color: #999999; text-decoration: none;">Privacy</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const emailText = `
Hi ${userName},

Thank you for joining Nookix — your gateway to the world's best book summaries and engaging audio books!

We're excited to help you learn smarter and get actionable wisdom. Here's what you can do next:

🎧 Listen to 30-minute audio summaries
   Perfect for your commute, workout, or downtime

📖 Explore thousands of books across genres
   Business, self-help, psychology, and more

⭐ Build your personal library
   Save your favorites and track your progress

Start exploring: https://nookix.net

Need help? Contact support@nookix.net.

Happy reading! 📚

© ${new Date().getFullYear()} Nookix. All rights reserved.
    `

    // 发送邮件（使用 Resend API）
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Nookix <noreply@nookix.net>',
        to: [userEmail],
        subject: 'Welcome to Nookix - Start Your Reading Journey! 📚',
        html: emailHtml,
        text: emailText
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send email:', errorText)
      throw new Error(`Resend API error: ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    // 更新 welcome_email_sent 标记
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ welcome_email_sent: true })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update welcome_email_sent:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent',
        emailId: emailResult.id 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-welcome-email function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
