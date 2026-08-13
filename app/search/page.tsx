import { redirect } from 'next/navigation'

/**
 * Search page - 重定向到explore页面
 * 解决Google Search Console中的404错误
 */
export default function SearchPage() {
  // 301 永久重定向到 /explore 页面
  redirect('/explore')
}
