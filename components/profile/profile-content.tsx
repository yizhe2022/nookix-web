"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Crown, Camera, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/utils/supabase/client'
import { hasActiveSubscription } from '@/types/subscription'

export function ProfileContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, userProfile, refreshUserProfile } = useAuth()

  // 订阅状态
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  // 头像编辑状态
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string>('')

  // 昵称编辑状态
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState<string>('')

  // 获取用户数据（订阅信息）
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setSubscriptionLoading(false)
        return
      }

      try {
        // 获取订阅信息
        const subResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${user.id}&select=*`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            }
          }
        )

        if (subResponse.ok) {
          const data = await subResponse.json()
          if (data && data.length > 0) {
            setSubscription(data[0])
          }
        }
      } catch (err) {
        console.error('[ProfileContent] Failed to fetch user data:', err)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  // 初始化用户名
  useEffect(() => {
    if (userProfile?.display_name) {
      setNewUsername(userProfile.display_name)
    }
  }, [userProfile])

  // 头像文件验证
  const validateAvatarFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB (before compression)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (file.size > maxSize) {
      return 'File size cannot exceed 10MB'
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG, GIF, and WebP formats are supported'
    }

    return null
  }

  // 用户名验证
  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return 'Username cannot be empty'
    }

    if (username.length < 2) {
      return 'Username must be at least 2 characters'
    }

    if (username.length > 20) {
      return 'Username cannot exceed 20 characters'
    }

    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and Chinese characters'
    }

    return null
  }

  const compressAndCropImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      const reader = new FileReader()

      reader.onload = (e) => {
        img.src = e.target?.result as string
      }

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // 计算裁剪尺寸（1:1 正方形，取中心部分）
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2

        // 设置输出尺寸（最大 512x512）
        const outputSize = Math.min(size, 512)
        canvas.width = outputSize
        canvas.height = outputSize

        // 绘制裁剪后的图片
        ctx.drawImage(
          img,
          x, y, size, size,
          0, 0, outputSize, outputSize
        )

        // 尝试不同的质量级别，直到文件小于 50KB
        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }

              // 如果小于 50KB 或质量已经很低，就使用这个结果
              if (blob.size <= 50 * 1024 || quality <= 0.5) {
                resolve(blob)
              } else {
                // 否则降低质量重试
                tryCompress(quality - 0.1)
              }
            },
            'image/webp',
            quality
          )
        }

        // 从 0.9 质量开始尝试
        tryCompress(0.9)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const error = validateAvatarFile(file)
    if (error) {
      setAvatarError(error)
      return
    }

    setAvatarError('')
    setAvatarFile(file)

    // 创建预览URL
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setAvatarError('Please select a file')
      return
    }

    if (!user) {
      setAvatarError('User not authenticated')
      return
    }

    try {
      setIsUploadingAvatar(true)
      setAvatarError('')

      const compressedBlob = await compressAndCropImage(avatarFile)

      // 使用统一的客户端进行文件上传
      const supabase = createClient()

      const fileName = `${user.id}-${Date.now()}.webp`

      // 添加超时保护
      const uploadPromise = supabase.storage
        .from('user-avatars')
        .upload(fileName, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp'
        })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 10 seconds')), 10000)
      )

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any

      if (uploadError) {
        throw uploadError
      }

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName)

      // 获取当前用户的 session token
      const supabaseAuth = createClient()
      const { data: { session } } = await supabaseAuth.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      // 使用 fetch API 更新数据库，带上用户的认证 token
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ avatar_url: publicUrl })
        }
      )

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`Failed to update profile: ${errorText}`)
      }

      toast({
        title: "Avatar updated successfully",
        description: "Your avatar has been updated",
      })

      // 刷新 auth context 以更新所有组件中的头像
      await refreshUserProfile()

      // 关闭对话框和清理状态
      setIsAvatarDialogOpen(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to upload avatar. Please try again'
      setAvatarError(errorMessage)
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleUsernameUpdate = async () => {
    if (!user) return

    const error = validateUsername(newUsername)
    if (error) {
      setUsernameError(error)
      return
    }

    try {
      setIsUpdatingUsername(true)
      setUsernameError('')

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ display_name: newUsername.trim() })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update username')
      }

      setIsUsernameDialogOpen(false)

      toast({
        title: "Username updated successfully",
        description: "Your username has been updated",
      })

      // 刷新页面以更新用户名
      router.refresh()
    } catch (error: any) {
      console.error('Username update failed:', error)
      setUsernameError('Failed to update username. Please try again')
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const getUserDisplayName = (): string => {
    if (userProfile?.display_name) return userProfile.display_name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  const getUserInitial = (): string => {
    const displayName = getUserDisplayName()
    return displayName.charAt(0).toUpperCase()
  }

  const getDisplayUserId = (): string => {
    if (!user?.id) return 'Unknown'
    return user.id.split('-')[0].toUpperCase() // 取前8位并转大写
  }

  const getSubscriptionDisplay = () => {
    if (!subscription || !hasActiveSubscription(
      subscription.subscription_status || 'free',
      subscription.subscription_plan || 'none',
      subscription.end_date || null
    )) {
      return { planName: 'Free', hasSubscription: false }
    }

    const planName = subscription.subscription_plan === 'yearly' ? 'Premium (Yearly)' : 'Premium (Monthly)'
    const isRedeemBenefit = !subscription.stripe_subscription_id
    return {
      planName: isRedeemBenefit ? 'Premium' : planName,
      hasSubscription: true,
      plan: subscription.subscription_plan,
      endDate: subscription.end_date,
      isRedeemBenefit
    }
  }

  const subscriptionDisplay = getSubscriptionDisplay()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Please log in to view your profile</div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 lg:space-y-12">
      <div className="space-y-8 lg:space-y-12">
        {/* 个人信息模块 */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-4 tracking-wide">Personal Information</h3>
          <div className="bg-white px-4 sm:px-6 rounded-lg">
            <div className="space-y-0">
              {/* Avatar */}
              <div className="flex items-center justify-between py-5 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">Avatar</span>
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    {userProfile?.avatar_url ? (
                      <Image
                        src={userProfile.avatar_url}
                        alt="User avatar"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {getUserInitial()}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAvatarDialogOpen(true)}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between py-5 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">Username</span>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{getUserDisplayName()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsUsernameDialogOpen(true)}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between py-5">
                <span className="text-sm font-medium text-gray-900">User ID</span>
                <span className="text-sm text-gray-600 font-mono">{getDisplayUserId()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 账户信息模块 */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-4 tracking-wide">Account Information</h3>
          <div className="bg-white px-4 sm:px-6 rounded-lg">
            <div className="space-y-0">
              <div className="flex items-center justify-between py-5 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">Account</span>
                <span className="text-sm text-gray-600">{user?.email || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between py-5">
                <span className="text-sm font-medium text-gray-900">Registration Date</span>
                <span className="text-sm text-gray-600">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 订阅信息模块 */}
        <div>
          {/* 标题行 + 操作按钮，右对齐 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-gray-400 tracking-wide">Subscription</h3>
            {subscriptionDisplay.hasSubscription && (
              <div className="flex items-center gap-3">
                {/* Upgrade — 仅月费用户显示 */}
                {subscriptionDisplay.plan === 'monthly' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-blue-400 text-blue-600 hover:bg-blue-50 h-6 px-2.5"
                    onClick={() => router.push('/dashboard/premium')}
                  >
                    Upgrade ↑
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white px-4 sm:px-6 rounded-lg">
            <div className="space-y-0">
              <div className="flex items-start justify-between py-5">
                <span className="text-sm font-medium text-gray-900 mt-0.5">Current Plan</span>
                <div className="flex flex-col items-end space-y-2">
                  {/* 套餐名称 */}
                  <div className="flex items-center space-x-2">
                    {subscriptionDisplay.hasSubscription ? (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    ) : null}
                    <span className="text-sm text-gray-600 capitalize flex items-center gap-1">
                      {subscriptionDisplay.planName}
                      {subscriptionDisplay.plan === 'monthly' && <span className="text-xs text-gray-400 ml-1">(Monthly)</span>}
                      {subscriptionDisplay.plan === 'yearly' && <span className="text-xs text-gray-400 ml-1">(Yearly)</span>}
                    </span>
                  </div>

                  {/* 权益有效期 */}
                  {subscriptionDisplay.hasSubscription && subscriptionDisplay.endDate && (
                    <span className="text-sm text-gray-400">
                      {subscriptionDisplay.isRedeemBenefit ? 'Valid until' : 'Next billing date'}: {new Date(subscriptionDisplay.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  )}

                  {/* 免费用户：Upgrade to Premium 引导 */}
                  {!subscriptionDisplay.hasSubscription && (
                    <Button
                      variant="link"
                      className="text-blue-500 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                      onClick={() => router.push('/dashboard/premium')}
                    >
                      Upgrade to Premium →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Avatar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  userProfile?.avatar_url ? (
                    <Image
                      src={userProfile.avatar_url}
                      alt="Current avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Upload Image</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
              />
              {avatarError && (
                <p className="text-sm text-red-500">{avatarError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAvatarUpload}
                disabled={!avatarFile || isUploadingAvatar}
              >
                {isUploadingAvatar ? 'Uploading...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
              />
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsUsernameDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUsernameUpdate}
                disabled={!newUsername || isUpdatingUsername}
              >
                {isUpdatingUsername ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
