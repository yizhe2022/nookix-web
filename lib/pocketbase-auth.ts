import pb from './pocketbase';

/**
 * 确保PocketBase管理员认证的函数
 * 在每次数据库查询前调用，确保认证有效
 */
export async function ensureAdminAuth(): Promise<boolean> {
  try {
    // 检查当前是否已有有效的管理员认证
    if (pb.authStore.isValid && pb.authStore.model) {
      // 检查是否是管理员用户（根据模型类型判断）
      const model = pb.authStore.model;
      if (model.collectionName === '_superusers' || model.collectionName === 'admins') {
        return true;
      }
    }
    
    // 如果没有有效的管理员认证，尝试重新认证
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;
    
    // 检查是否连接到生产环境
    const isProduction = process.env.NEXT_PUBLIC_POCKETBASE_URL?.includes('api.nookix.net');
    
    if (!adminEmail || !adminPassword) {
      // 仅在非生产环境显示警告，避免本地开发时频繁报错
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ 缺少管理员认证环境变量');
      }
      return false;
    }
    
    // 如果连接到生产环境，不尝试管理员认证（避免使用本地凭据）
    if (isProduction) {
      // 生产环境不需要管理员认证，直接返回 true
      return true;
    }
    
    console.log('🔐 正在重新进行管理员认证...');
    
    // PocketBase v0.23+ 使用 _superusers collection
    try {
      await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
      console.log('✅ 管理员认证成功 (_superusers)');
      return true;
    } catch (superuserErr: any) {
      // 如果 _superusers 不存在 (404), 回退到 admins
      if (superuserErr.status === 404 && pb.admins) {
        try {
          await pb.admins.authWithPassword(adminEmail, adminPassword);
          console.log('✅ 管理员认证成功 (admins)');
          return true;
        } catch (adminErr: any) {
          console.error('❌ 管理员认证失败 (admins):', adminErr);
          return false;
        }
      } else {
        console.error('❌ 管理员认证失败 (_superusers):', superuserErr);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ 确保管理员认证过程中出错:', error);
    return false;
  }
}

/**
 * 检查并确保PocketBase连接正常
 * 在关键数据查询前调用
 */
export async function ensurePocketBaseConnection(): Promise<boolean> {
  try {
    // 简单的健康检查 - 尝试获取服务器时间
    await pb.health.check();
    console.log('✅ PocketBase 连接正常');
    return true;
  } catch (error) {
    console.error('❌ PocketBase 连接检查失败:', error);
    return false;
  }
}

/**
 * 安全的数据查询包装器
 * 在查询前确保认证和连接正常
 */
export async function withPocketBaseAuth<T>(
  queryFn: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    // 1. 确保连接正常
    const isConnected = await ensurePocketBaseConnection();
    if (!isConnected) {
      console.warn('⚠️ PocketBase 连接异常，使用备用值');
      return fallbackValue;
    }
    
    // 2. 确保管理员认证
    const isAuthenticated = await ensureAdminAuth();
    if (!isAuthenticated) {
      console.warn('⚠️ 管理员认证失败，尝试无认证查询');
      // 即使认证失败，也尝试执行查询（某些表可能允许公开访问）
    }
    
    // 3. 执行查询
    return await queryFn();
  } catch (error) {
    console.error('❌ 安全查询执行失败:', error);
    return fallbackValue;
  }
}