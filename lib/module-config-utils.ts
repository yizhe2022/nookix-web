import { HomeModuleConfig } from './types';

/**
 * 预设的筛选类型映射
 */
const FILTER_TYPE_MAP = {
  latest: 'sort: "-created"',
  rating: 'sort: "-rating"',
  mixed: 'sort: "-rating,-created"',
  business: 'genres ~ "Business" && sort: "-rating"',
  self_help: 'genres ~ "Self-Help" && sort: "-rating"',
  premium: 'premium_type != "" && sort: "-created"',
  free: 'premium_type = "" && sort: "-rating"',
  fiction: 'genres ~ "Fiction" && sort: "-rating"',
  biography: 'genres ~ "Biography" && sort: "-rating"',
  custom: '' // 使用config中的自定义配置
};

/**
 * 将简化字段转换为完整的配置对象
 * @param module 模块配置
 * @returns 合并后的配置对象
 */
export function getModuleConfig(module: HomeModuleConfig) {
  // 基础配置优先级：简化字段 > config字段 > 默认值
  const config = {
    // 通用配置
    subtitle: module.subtitle || module.config?.subtitle || '',
    show_more: module.show_more ?? module.config?.show_more ?? true,
    background_color: module.config?.background_color || '#fafbfc',

    // Book Section 配置
    layout: module.layout || module.config?.layout || 'grid',
    section_id: module.section_id || module.config?.section_id || module.id,
    max_items: module.max_items || module.config?.max_items || getDefaultMaxItems(module.layout || 'grid'),

    // 新的内容选择逻辑
    content_mode: module.content_mode || 'latest',
    selected_books: module.selected_books || [],
    selected_series: module.selected_series || [],


    // 生成对应的筛选器（用于向后兼容）
    book_filter: getBookFilter(module),
    series_filter: getSeriesFilter(module),

    // Premium Section 配置
    premium_content: module.config?.premium_content || 'Get unlimited access to thousands of audiobooks and exclusive content for just $5.99/month',
    premium_link: module.config?.premium_link || '/premium',

    // Ad Section 配置
    ad_items: module.config?.ad_items || [],

    // 自定义内容
    custom_html: module.config?.custom_html || ''
  };

  return config;
}

/**
 * 根据内容模式生成book_filter
 */
function getBookFilter(module: HomeModuleConfig): string {
  // 如果有自定义config配置，优先使用
  if (module.config?.book_filter) {
    return module.config.book_filter;
  }

  // 如果是custom模式且有选择的书本，返回空字符串（将直接使用selected_books）
  if (module.content_mode === 'custom' && module.selected_books && module.selected_books.length > 0) {
    return '';
  }

  // 默认使用latest逻辑
  return 'sort: "-created"';
}

/**
 * 根据内容模式生成series_filter
 */
function getSeriesFilter(module: HomeModuleConfig): string {
  // 如果有自定义config配置，优先使用
  if (module.config?.series_filter) {
    return module.config.series_filter;
  }

  // 如果是custom模式且有选择的series，返回空字符串（将直接使用selected_series）
  if (module.content_mode === 'custom' && module.selected_series && module.selected_series.length > 0) {
    return '';
  }

  // 默认使用latest逻辑
  return 'sort: "-created"';
}



/**
 * 根据布局类型获取默认的max_items
 */
function getDefaultMaxItems(layout: string): number {
  switch (layout) {
    case 'grid':
      return 15;
    case 'list':
      return 9;
    case 'audio':
      return 12;
    default:
      return 12;
  }
}

/**
 * 获取内容模式的显示名称
 */
export function getContentModeLabel(contentMode: string): string {
  const labels: Record<string, string> = {
    latest: '显示最新内容',
    custom: '手工选择内容'
  };

  return labels[contentMode] || contentMode;
}

/**
 * 获取filter_type的显示名称
 */
export function getFilterTypeLabel(filterType: string): string {
  const labels: Record<string, string> = {
    latest: '最新发布',
    rating: '评分最高',
    mixed: '综合排序',
    business: '商业类书籍',
    self_help: '自助类书籍',
    premium: '会员专享',
    free: '免费书籍',
    fiction: '小说类',
    biography: '传记类',
    custom: '自定义配置'
  };

  return labels[filterType] || filterType;
} 