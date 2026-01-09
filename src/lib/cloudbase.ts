import cloudbase from '@cloudbase/js-sdk';

// ⚠️ 注意：请在此处填入您的腾讯云开发环境 ID (EnvID)
// 您可以在腾讯云控制台 -> 云开发 -> 环境 -> 环境 ID 中找到
// 例如: 'mood-observer-123456'
export const ENV_ID = 'jieyou-3gr01mvob9ad92de';

export const app = cloudbase.init({
  env: ENV_ID,
  region: 'ap-shanghai' // 默认为上海，如果是其他区域请修改
});

export const auth = app.auth({
  persistence: 'local' // 设置登录状态持久化到本地
});

export const db = app.database();
