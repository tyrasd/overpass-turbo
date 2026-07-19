---

## 1. 执行摘要

对 overpass-turbo 项目进行源码级安全审计，重点验证 `map.html` / `js/map.ts` 中 `postMessage` 监听器是否缺乏来源验证（origin validation），从而导致跨源 Overpass 查询注入。

**审计结论：确认存在漏洞。** `js/map.ts` 中的 `window.addEventListener("message", ...)` 未对 `evt.origin` 进行任何校验，恶意网页可向嵌入 overpass-turbo 的 iframe 发送任意 Overpass 查询指令，实现跨源查询注入。

---

## 2. 测试范围

| 项目 | 内容 |
|------|------|
| 仓库 | https://github.com/tyrasd/overpass-turbo |
| 分支 | master (commit 9d49f2703e1ccce836dcc967c1b6e1d57387eea0) |
| 审计文件 | `map.html`, `js/map.ts`, `js/configs.ts`, `js/urlParameters.ts`, `js/overpass.ts`, `js/josmRemoteControl.ts` |
| 审计方法 | 源码审查、postMessage 通信链路追踪、iframe 嵌入场景分析 |

---

## 3. 技术发现详情

### [1.1] postMessage 监听器缺乏来源验证 — 跨源 Overpass 查询注入

- **漏洞类型**: 不安全的跨源通信 / 跨源查询注入 (CWE-942, CWE-79)
- **漏洞等级**: **高**
- **CVSS 参考**: 类似 XSS/注入类漏洞，因可执行任意地图数据查询，影响数据隐私和完整性
- **影响组件**: `js/map.ts`（由 `map.html` 加载）
- **触发条件**: 目标页面通过 iframe 嵌入 overpass-turbo 的 `map.html` 端点

#### 漏洞详情

**文件**: `js/map.ts`（约第 16–34 行）

```typescript
window.addEventListener(
    "message",
    async (evt) => {
      const data = typeof evt.data === "string" ? JSON.parse(evt.data) : {};
      if (data.cmd === "update_map") {
        settings.code["overpass"] = data.value[0];
        ide.update_map();
      } else if (data.cmd === "cache") {
        settings.code["overpass"] = data.value[0];
        const query = await ide.getQuery();
        const query_lang = ide.getQueryLang();
        overpass.run_query(
          query,
          query_lang,
          cache,
          true,
          undefined,
          undefined,
          ide.mapcss
        );
      }
    },
    false
  );
```

**问题分析：**

1. **无任何 origin 校验**：`evt.origin` 和 `evt.source` 完全未被检查。这意味着来自任意域名（包括恶意站点）的 `postMessage` 均可被接受。

2. **两个危险命令**：
   - `cmd: "update_map"` — 设置 `settings.code["overpass"]` 为 `data.value[0]` 并立即执行 `ide.update_map()`，触发 Overpass API 查询
   - `cmd: "cache"` — 同上，但以缓存模式运行查询

3. **数据直接来源于消息体**：`data.value[0]` 直接作为 Overpass 查询语句执行，无任何 sanitization 或白名单限制。攻击者可注入任意 Overpass QL/XML 查询。

4. **`map.html` 设计为可嵌入端点**：`map.html` 是一个独立的轻量级页面，仅加载 `js/map.ts` 模块用于地图渲染。其 URL 参数支持 `silent` 模式：
   ```
   map.html?silent&Q=<查询>
   ```
   当 `silent=true` 时，查询错误会 `parent.postMessage(..., "*")` 回传父窗口（目标也为 `*`，即任意源）。

5. **`parent.postMessage(..., "*")` 同样无限制**：
   ```typescript
   overpass.handlers["onAjaxError"] = (errmsg) => {
     parent.postMessage(
       JSON.stringify({handler: "OnAjaxError", msg: errmsg}),
       "*"
     );
   };
   overpass.handlers["onRawDataPresent"] = () => {
     parent.postMessage(
       JSON.stringify({
         query: settings.code["overpass"],
         resultType: overpass.resultType,
         resultText: overpass.resultText
       }),
       "*"
     );
   };
   ```
   响应数据也以 `*` 为目标发回，可能导致敏感查询结果泄露。

#### 攻击场景

假设攻击者构建如下恶意页面 `evil.com/payload.html`：

```html
<iframe id="target" src="https://overpass-turbo.eu/map.html"></iframe>
<script>
  window.frames[0].postMessage(JSON.stringify({
    cmd: "update_map",
    value: ["node[amenity=restaurant]; out;"]
  }), "*");
</script>
```

或更恶意的注入：

```javascript
window.frames[0].postMessage(JSON.stringify({
  cmd: "update_map",
  value: ["(node[amenity=restaurant](bbox); relation(bn); out;); out;"]
}, "*");
```

攻击者可以：
- 强制 overpass-turbo 执行任意 Overpass 查询
- 通过查询结果回传（`onRawDataPresent`）窃取查询到的 OSM 数据
- 结合 `silent` 模式和 `parent.postMessage(..., "*")` 实现跨源数据泄露

#### 修复建议

**优先级：高**

1. **必须添加 origin 白名单校验**：
```typescript
window.addEventListener("message", async (evt) => {
  // 白名单校验：只接受来自可信源的 message
  const allowedOrigins = [
    "https://overpass-turbo.eu",
    "https://tyrasd.github.io"
  ];
  if (!allowedOrigins.includes(evt.origin)) {
    console.warn("Rejected message from unauthorized origin:", evt.origin);
    return;
  }
  
  const data = typeof evt.data === "string" ? JSON.parse(evt.data) : {};
  // ... 后续处理
}, false);
```

2. **校验 `evt.source`**：确保消息来自预期的窗口对象。

3. **修改 `parent.postMessage` 的目标**：将 `"*"` 替换为具体的 `evt.origin`：
```typescript
parent.postMessage(data, evt.origin);  // 而非 "*"
```

4. **对 `data.value[0]` 做基本格式校验**：防止恶意构造的查询语句。

---

### [1.2] 配置文件中的硬编码凭据

- **漏洞类型**: 敏感信息泄露 (CWE-798)
- **漏洞等级**: **低**
- **文件**: `js/configs.ts`

**发现：**

```typescript
osmnamesApiKey: "gtXyh2mBSaN5zWqqqQRh",
osmAuth: {
  url: "https://www.openstreetmap.org",
  client_id: "lIifli2M7Enpi1LUqCxSNe3yDXhBHwf_n8HzJ03mKFg"
}
```

- `osmnamesApiKey` — osmnames 地理编码器 API Key 硬编码在前端
- `osmAuth.client_id` — OSM OAuth consumer key 硬编码在前端

**说明**：这些凭据为公开前端服务使用，风险较低，但建议定期轮换。

---

## 4. 漏洞验证与排除证明

### 已确认存在的漏洞

| 编号 | 漏洞类型 | 等级 | 状态 |
|------|----------|------|------|
| 1.1 | postMessage 来源验证缺失 — 跨源查询注入 | 高 | ✅ 存在 |
| 1.2 | 硬编码 API 凭据 | 低 | ✅ 存在 |

### 已排除的漏洞

| 漏洞类型 | 测试结果 | 证明 |
|----------|----------|------|
| SQL 注入 | ❌ 不存在 | 项目为纯前端应用，无后端数据库 |
| 命令执行 | ❌ 不存在 | 无服务端代码 |
| 文件包含 | ❌ 不存在 | 无服务端文件包含逻辑 |
| XXE | ❌ 不存在 | XML 解析仅用于 Overpass API 响应，且使用 DOMParser（非 XMLDocument 解析外部实体） |
| SSRF | ❌ 不存在 | 查询目标由用户配置，非从消息体直接构造 URL |
| CSRF | ❌ 不适用 | 纯前端应用，无会话认证表单提交 |
| 路径遍历 | ❌ 不存在 | 无服务端文件操作 |
| 不安全反序列化 | ❌ 不存在 | JSON.parse 用于结构化数据，无可执行 payload |
| IDOR | ❌ 不存在 | 无用户权限体系 |
| 弱加密算法 | ❌ 不适用 | 仅使用 HTTPS 通信 |
| 默认口令 | ❌ 不存在 | 无认证机制 |
| 目录浏览 | ❌ 不存在 | 静态资源部署 |
| 邮件轰炸 | ❌ 不存在 | 无邮件功能 |

---

## 5. 系统信息

| 项目 | 值 |
|------|-----|
| 目标应用 | overpass-turbo |
| 版本 | master (9d49f2703e1ccce836dcc967c1b6e1d57387eea0) |
| 技术栈 | TypeScript + Leaflet + jQuery + CodeMirror |
| 前端框架 | 无 SPA 框架，传统多页面应用 |
| 部署方式 | GitHub Pages / overpass-turbo.eu |
| 构建工具 | Vite + pnpm |

---

## 6. 总结与建议

### 核心发现

overpass-turbo 的 `map.html` 端点（通过 `js/map.ts` 实现）存在 **postMessage 监听器缺乏来源验证** 的安全漏洞。该漏洞允许任意第三方网页向嵌入的 overpass-turbo iframe 发送恶意 Overpass 查询指令，实现跨源查询注入。

### 建议

1. **立即修复**：在 `js/map.ts` 的 `message` 事件监听器中添加 `evt.origin` 白名单校验
2. **修改 `parent.postMessage` 目标**：将通配符 `"*"` 改为具体的来源域名
3. **考虑增加命令白名单**：对 `cmd` 字段做严格校验
4. **定期轮换** `osmnamesApiKey` 和 `osmAuth.client_id`

