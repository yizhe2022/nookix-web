// lib/types.ts

import type { RecordModel } from "pocketbase";

export interface LibraryBook {
  id: string;
  libraryItemId: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  duration: string;
  isPremium: boolean;
  progress: number;
  last_read_at?: string; // 添加最后阅读时间字段
  added_at?: string; // 添加加入书架时间字段
  created_at?: string; // 添加创建时间字段
  slug?: string; // 添加 slug 字段
}


// Banner 数据类型
export interface BannerData {
  id: string;
  page_slug: string;
  title: string;
  description?: string;
  image_H5: string; // H5端图片 URL
  image_PC: string; // PC端图片 URL
  cta_text?: string;
  cta_link?: string;
  is_rotating?: boolean;
  sort_order: number;
}



export interface Author extends RecordModel {
  name: string;
  description?: string;
  avatar?: string;
}

// Timeline 时间轴条目类型
export interface TimelineItem {
  timestamp: number;  // 秒数，例如 0, 300, 600
  title: string;      // 章节标题，例如 "Introduction", "Chapter 1: The Power of Habit"
  content: string;    // 章节正文内容（可折叠显示）
}

// Book Transcript 条目类型
export interface BookTranscriptItem {
  timestamp: number;  // 秒数
  text: string;       // 文本内容
}

export interface Book extends RecordModel {
  id: string;
  title: string;
  author?: string[] | Author[]; // Old relation array
  authors: string;              // New text field
  subtitle?: string;            // Subtitle field
  cover_image: string; // 注意字段名与PocketBase一致
  rating: number;
  duration: string;
  is_premium: boolean;
  genres: string[] | Genre[]; // 支持字符串数组（原始）或关联的Genre对象数组（expand后）
  
  // 音频相关字段
  summary_audio?: string;                    // 完整音频 URL
  preview_audio_url?: string;                // 预览音频 URL（约5分钟）
  audio_duration?: number;                   // 音频时长（秒）
  timeline?: TimelineItem[] | null;          // 音频时间轴数据
  book_transcript?: BookTranscriptItem[] | null; // 音频转录数据
  
  // 其他字段
  slug?: string;                             // URL slug
  description?: string;                      // 书本描述
  one_liner?: string;                        // 一句话简介
}




// 新增：Series系列类型定义
export interface Series extends RecordModel {
  title: string;
  description: string;
  cover_image: string;
  total_books: number;
  created: string;
  updated: string;
}

// === 新的模块化首页系统类型定义 ===

// 首页区块类型
export type HomeModuleType =
  | 'booklist'              // 书本区块 (layout: focus|grid|stream)
  | 'series_section'        // 系列区块  

  | 'ad_section'            // 广告区块
  | 'premium_section'       // 会员区块
  | 'custom_section'        // 自定义内容
  | 'recommend_section'     // 推荐书籍区块
  | 'book_list'             // 书本列表 (新)
  | 'series_list'           // 系列列表 (新)

  | 'ads'                   // 广告 (新)
  | 'premium_books'         // 会员书籍 (新)
  | 'free_books';           // 免费书籍 (新)


// booklist表类型
export interface BookSection extends RecordModel {
  id: string;
  title: string;
  subtitle?: string;
  tagline?: string;                          // 标语字段
  description?: string;                      // 描述字段
  sort_order: number;
  layout: 'focus' | 'grid' | 'stream';       // 布局类型：focus(原grid), grid(原list), stream(原audio)
  selected_books?: string[];                 // 手工选择的书本ID列表
  booklist_cover?: string;                   // 封面图字段
  featured_image?: string;                   // 特色图片字段
  is_enabled: boolean;
  featured_books: boolean;                   // 新增：是否作为特色书单 (取代 sort_order=0)
  type?: 'recommended' | 'latest' | 'series' | 'manual';  // 模块类型
  created?: string;
  updated?: string;
  expand?: {
    selected_books?: Book[];                 // 展开的书籍数据
  };
}

// ads表类型
export interface Advertisement extends RecordModel {
  title: string;                           // 广告名称(运营内部使用)
  image?: string;                          // 广告图片
  link_url?: string;                       // 广告跳转链接
  description?: string;                    // 广告描述(运营内部使用)
}


// book_popularity表类型（推荐算法的数据源）
export interface BookPopularity extends RecordModel {
  book_id: string;                         // 关联的书本ID（单选关联）
  popularity_score: number;                // 热门度评分
  total_bookshelf_count: number;           // 书架添加总数
  calculated_date: string;                 // 计算日期
}

// === 保留的旧类型定义(向后兼容) ===

export interface HomeModuleConfig extends RecordModel {
  id: string;
  title: string;
  module_type: HomeModuleType;
  sort_order: number;
  is_enabled: boolean;

  // 新增的简化字段
  subtitle?: string;
  layout?: 'grid' | 'list' | 'audio';
  max_items?: number;
  show_more?: boolean;
  section_id?: string;

  // 新的内容选择方式
  content_mode?: 'latest' | 'custom';
  selected_books?: string[];    // book_section使用：手工选择的书本ID列表
  selected_series?: string[];   // series_section使用：手工选择的series ID列表  


  // 保留原有的config字段(用于向后兼容和高级配置)
  config?: {
    // 通用配置
    subtitle?: string;
    show_more?: boolean;
    background_color?: string;

    // BookSection 特定配置
    layout?: 'grid' | 'list' | 'audio';
    section_id?: string;
    book_filter?: string;  // PocketBase查询过滤器
    max_items?: number;

    // SeriesSection 特定配置
    series_filter?: string;



    // AdSection 特定配置
    ad_items?: {
      image: string;
      link: string;
      alt?: string;
    }[];

    // PremiumSection 特定配置
    premium_content?: string;
    premium_link?: string;

    // 自定义内容
    custom_html?: string;
  };
}

/**
 * 通用Response类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * PocketBase记录的基础类型（继承自官方类型）
 */
export interface BaseRecord extends RecordModel {
  id: string;
  created: string;
  updated: string;
}

/**
 * 分类类型定义
 */
export interface Genre extends BaseRecord {
  title: string;
  description?: string;
  color?: string;
}