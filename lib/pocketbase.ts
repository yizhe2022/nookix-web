import PocketBase from 'pocketbase';

// 获取PocketBase服务地址，优先使用环境变量
export const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

// 创建一个新的 PocketBase 实例
const pb = new PocketBase(POCKETBASE_URL);

// 全局禁用请求的自动取消功能
pb.autoCancellation(false);

export default pb;

