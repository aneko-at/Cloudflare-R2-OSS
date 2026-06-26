# Aneko - r2 oss

基于 Cloudflare Workers 的轻量级 R2 对象存储文件管理界面。

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS
- **后端**：Cloudflare Workers
- **存储**：Cloudflare R2
- **验证**：Cloudflare Turnstile

## 项目结构

```
├── frontend/          # React 前端源码
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── store/         # Zustand 状态管理
│   │   ├── utils/         # 工具函数和 API 封装
│   │   └── types/         # TypeScript 类型定义
│   └── public/            # 静态资源
└── worker/            # Cloudflare Worker 后端
    └── src/
        ├── index.ts       # 入口 + 路由
        └── services/      # R2 操作 + Turnstile 验证
```

### 前端：Turnstile 站点密钥

**文件**：`frontend/src/hooks/useTurnstile.ts`

第 22 行，将 `TURNSTILE_SITE_KEY` 替换为你的 Turnstile 站点密钥（Site Key）：

```ts
const TURNSTILE_SITE_KEY = '0x4AAAAAXXXXX'; // 改为你的站点密钥
```

> 在 Cloudflare Turnstile 控制台创建站点后可获取。

### Worker 配置：R2 存储桶绑定

**文件**：`wrangler.toml`

将 `[[r2_buckets]]` 中的 `bucket_name` 改为你的 R2 存储桶名称：

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "your-bucket-name"  # 改为你的存储桶名称
```

### 环境变量

部署后添加环境变量：

| 变量名 | 说明 | 加密 |
|---|---|---|
| `ACCESS_CODE` | 管理员登录访问码 | 建议加密 |
| `TURNSTILE_SECRET_KEY` | Turnstile 密钥（Secret Key） | 建议加密 |



