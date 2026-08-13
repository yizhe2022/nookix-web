/**
 * 将标题转换为URL友好的slug格式
 * @param title - 原始标题
 * @returns slug格式的字符串
 */
export function titleToSlug(title: string): string {
  // 检查title是否为undefined、null或空字符串
  if (!title || typeof title !== 'string') {
    return '';
  }

  // 1. 去除括号及方括号内的所有包围内容 (如 (Harley Quin, #1) )
  let baseTitle = title.replace(/\s*[([（【][^)\]）】]*[)\]）】]\s*/g, ' ');

  // 2. 截取冒号及带空格的破折号之前的核心书名
  // 正则解析：中英文冒号 ([:：])，中文/长破折号 ([—–])，或字面带前后空格的短横线 ( - )
  baseTitle = baseTitle.split(/[:：—–]|(?: - )/)[0];

  return baseTitle
    .toLowerCase()
    .trim()
    // 替换 & 为 -and- (保留语义)
    .replace(/\s*&\s*/g, '-and-')
    // 替换特殊字符为连字符
    .replace(/[^\w\s-]/g, '')
    // 将空格替换为连字符
    .replace(/\s+/g, '-')
    // 移除多余的连字符
    .replace(/-+/g, '-')
    // 移除开头和结尾的连字符
    .replace(/^-|-$/g, '')
}

/**
 * 检查给定字符串是否为有效的ID格式（通常是PocketBase的ID）
 * @param str - 要检查的字符串
 * @returns 是否为ID格式
 */
export function isValidId(str: string): boolean {
  // PocketBase ID通常是15个字符的字母数字组合
  return /^[a-zA-Z0-9]{15}$/.test(str)
}

/**
 * 检查给定字符串是否为有效的UUID格式（Supabase的ID）
 * @param str - 要检查的字符串
 * @returns 是否为UUID格式
 */
export function isValidUUID(str: string): boolean {
  // UUID格式: 8-4-4-4-12
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/**
 * 检查给定字符串是否为有效的PocketBase ID格式
 * @param str - 要检查的字符串
 * @returns 是否为PocketBase ID格式
 */
export function isPocketBaseId(str: string): boolean {
  return isValidId(str)
}

/**
 * 标签转slug（用于series标签页）
 * @param tag - 标签名
 * @returns slug格式的标签
 */
export function tagToSlug(tag: string): string {
  return titleToSlug(tag)
}

/**
 * 从slug转回标签（用于查询）
 * @param slug - slug格式的标签
 * @returns 原始标签格式
 */
export function slugToTag(slug: string): string {
  return slug
    // 将 -and- 转回 &
    .replace(/-and-/g, ' & ')
    // 将连字符替换为空格
    .replace(/-/g, ' ')
    // 将每个单词的首字母大写
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * 从 URL 参数中提取 PocketBase ID
 * 支持的格式：
 * 1. 纯 slug: atomic-habits → 返回 null (表示是 slug)
 * 2. 纯 PocketBase ID: bnxzh0v4i2e9mxh → 返回 ID
 * 3. PocketBase ID + slug: bnxzh0v4i2e9mxh-atomic-habits → 返回 ID
 * 
 * PocketBase ID 特征：15位字母数字组合
 */
export function extractIdFromSlug(param: string): string | null {
  if (!param) return null;

  // 检查是否以 PocketBase ID 开头（15位字母数字）
  // 可能的格式：
  // - bnxzh0v4i2e9mxh (纯ID)
  // - bnxzh0v4i2e9mxh-atomic-habits (ID + slug)
  const pbIdMatch = param.match(/^([a-z0-9]{15})(?:-.*)?$/i)
  if (pbIdMatch) {
    return pbIdMatch[1] // 返回 PocketBase ID 部分
  }

  // 否则认为是纯 slug
  return null
}

/**
 * 判断参数类型
 * @param param - URL 参数
 * @returns 'pb_id' | 'slug'
 * 
 * 识别规则：
 * - 如果以15位字母数字开头 → 'pb_id' (可能带 slug 后缀)
 * - 否则 → 'slug'
 */
export function getParamType(param: string): 'pb_id' | 'slug' {
  if (!param) return 'slug'
  
  // 提取 PocketBase ID（如果存在）
  const pbId = extractIdFromSlug(param)
  
  if (pbId && isPocketBaseId(pbId)) {
    return 'pb_id'
  }
  
  return 'slug'
}

/**
 * 生成书本详情页的 URL slug
 * 优先使用 book.slug，如果没有则从 title 生成，最后才使用 id
 * @param id 书本 ID（UUID 或 PocketBase ID）
 * @param slugOrTitle 书本的 slug 或 title
 * @returns 纯 slug 格式（推荐）或 ID（fallback）
 */
export function createIdSlug(id: string, slugOrTitle: string): string {
  // 如果没有提供 slugOrTitle，使用 ID
  if (!slugOrTitle) return id;
  
  // 如果 slugOrTitle 是 UUID 或 PocketBase ID，使用 ID
  if (isValidUUID(slugOrTitle) || isPocketBaseId(slugOrTitle)) {
    return id;
  }
  
  // 如果 slugOrTitle 看起来已经是一个 slug（全小写，包含连字符，没有空格）
  // 直接返回
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slugOrTitle)) {
    return slugOrTitle;
  }
  
  // 否则从 title 生成 slug
  const slug = titleToSlug(slugOrTitle);
  if (slug) return slug;
  
  // 最后才使用 ID 作为 fallback
  return id;
}

/**
 * 生成书本详情页的规范 URL 路径
 * 使用纯 ID 格式以确保 URL 稳定性和 SEO 最佳实践
 * @param id 书本 ID
 * @param title 书本标题（可选，用于向后兼容）
 * @returns URL 路径（如 /book/abc123def456789）
 */
export function getBookUrl(id: string, title?: string): string {
  // 始终返回纯 ID 格式，忽略 title 参数
  // 这确保了 URL 的稳定性，即使书名更改也不会影响 URL
  return `/book/${id}`;
} 