import { redirect } from 'next/navigation'

/**
 * Genres page - 重定向到首页
 * 首页已包含分类入口
 */
export default function GenresPage() {
  redirect('/')
}
