# AI HOT v1 API 参考
只在需要完整参数、字段、分页或构建客户端时读取本文件。普通资讯问答优先遵循 `SKILL.md` 的默认路由。
## 共同合同
- Base URL：`https://aihot.virxact.com`
- 匿名只读，不需要 API Key，不发送 cookie。
- OpenAPI：`https://aihot.virxact.com/openapi-v1.json`
- 所有 cursor 都是不透明书签：只原样回传给产生它的同一端点和同一查询，不解析、不修改、不跨查询复用。
- 未知参数、无效参数、损坏或跨查询 cursor 都返回明确的 Problem JSON，不会静默回到第一页。
- 对同一完整 URL 保存响应 `ETag`；下次发送 `If-None-Match`。`304` 表示内容未变化。
- items cursor 没有按时间自动失效，但 24 小时／7 天是滚动窗口，较老条目可能在两次翻页之间自然离开窗口；需要精确镜像时改用 selected snapshot + changes。
## 操作
### 最近资讯、分类与搜索
`GET /api/v1/items`
| 参数 | 合同 |
|---|---|
| `mode` | `selected` 或 `all`；默认 `selected` |
| `window` | `24h` 或 `7d`；默认 `7d` |
| `by` | `timeline` 或 `published`；默认 `timeline`（见下方「时间口径」） |
| `category` | `ai-models`、`ai-products`、`industry`、`paper`、`tip` |
| `q` | 2—200 字；使用服务端搜索 |
| `limit` | 1—100；默认 50。只需要头几条时显式调小，别默认拉满 50 |
| `cursor` | 原样回传上一页的 `page.nextCursor` |
#### 时间口径
`window` 从哪个时间点往回算、结果按哪个时间排序，由 `by` 决定。两个原始时间戳恒定随每条返回，可自行判断。
- `by=timeline`（默认）：与 aihot.virxact.com 网页看到的顺序和集合一致。规则是——原文发布后 72 小时内被收录，按收录时间；超过 72 小时才收录的历史回填，归位到原文发布日。所以官方博客、公众号、HuggingFace Daily 这类「原文两三天前发、今天才抓到」的慢推信源，仍会出现在 `window=24h` 里，同时旧文回填不会冒充最近。
- `by=published`：严格按第三方原文发布时间。只在对账、精确时间范围等场景显式指定，并向用户说明口径不同。
#### 响应
```json
{
  "page": {
    "items": [
      {
        "id": "itm_abc123",
        "title": "标题",
        "summary": "摘要（精选条目有，全量条目可能为空）",
        "source": { "name": "来源名称", "url": "…" },
        "publishedAt": "2026-01-01T00:00:00Z",
        "discoveredAt": "2026-01-01T12:00:00Z",
        "categories": ["ai-models"],
        "links": {
          "aihot": "https://aihot.virxact.com/items/itm_abc123",
          "original": "https://…"
        },
        "score": 0.95
      }
    ],
    "hasMore": false,
    "nextCursor": "opaque_string"
  }
}
```
### 当前热点
`GET /api/v1/hot-topics`
返回当前最热事件列表，含 `links.story`（可选）。
### 事件详情
`GET /api/v1/stories/{publicId}`
返回事件时间线、AI 综述（`digest`）与最新进展（`latest`）。
### 日报
`GET /api/v1/dailies/latest`
`GET /api/v1/dailies/{YYYY-MM-DD}`
`GET /api/v1/dailies?limit=N`
### 精选快照与变化
`GET /api/v1/selected/snapshot?fields=minimal&limit=500`
`GET /api/v1/selected/changes?cursor={opaque}&limit=100`