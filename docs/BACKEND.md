# MusicLab 后端接口约定（10.11 之后的自愿项目，暂不实现）

> 课程要求只涉及前端，当前站点是**纯前端模拟**：账号、学习进度、问卷、反馈、游乐园存档全部保存在浏览器
> `localStorage`，代码里**没有**任何后端调用。这份文档只是提前把数据结构和接口形状定下来，
> 等前端全部完工、审核通过之后再按它实现，避免到时返工。

真正开工时，建议在 `js/musiclab-ui.js` 的 `auth` / `progress` 与 `contact/contact.html` 的提交处
接入一层 `api` 适配（之前写过一版，已按成员要求撤掉），并按下面的约定实现接口。
所有请求 / 响应均为 JSON；登录后在 `Authorization: Bearer <token>` 里带令牌。
出错时返回非 2xx 状态码和 `{ "message": "给用户看的中文提示" }`。

## 接口

| 方法 | 路径 | 请求体 | 成功响应 | 说明 |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ username, password }` | `{ name, token }` | 用户名重复请返回 409 + message |
| POST | `/api/auth/login` | `{ username, password }` | `{ name, token }` | 用户不存在返回 **404**（前端据此把错误标在用户名框），密码错误返回 401 |
| POST | `/api/auth/logout` | – | `{}` | 可选；前端不等待结果 |
| POST | `/api/progress` | `{ lesson, at, score, total, skipped? }` | `{}` | 每次通过章节小测（或问卷跳级）时上报；`lesson` 取值见下 |
| POST | `/api/feedback` | `{ name, email, topic, message, wantsReply, user, page, createdAt }` | `{}` | 联系 / 反馈表单 |

`lesson` 的取值（与 `js/musiclab-ui.js` 里的 `LESSONS` 一致）：
`index` `pitches` `beat` `beat-instruments` `beat-track` `chords` `tones` `others`

## 尚未接口化、但数据结构已经稳定的部分

接后端时建议一并同步（目前仍在 localStorage）：

| 数据 | localStorage 键 | 结构 |
| --- | --- | --- |
| 学习进度 | `musiclab_progress_v2::user:<name>` | `{ [lesson]: { at, score, total, skipped? } }` |
| 问卷结果 | `musiclab_profile::user:<name>` | `{ level: 0\|1\|2, interest, goal, at }` |
| 最近章节 | `musiclab_last_lesson::user:<name>` | `lesson` 字符串 |
| 游乐园存档 | `musiclab_playground::user:<name>` | `{ bpm, savedAt, panels: { rhythm\|chords\|bass\|melody: { key, mode, cells: [[row, step], …] } } }` |

登录成功后可以增加一个 `GET /api/me` 一次性返回以上数据，前端在 `auth.setSession()` 里写回对应的键即可（该函数是唯一的登录入口）。

## 安全提示

- 密码只在前端明文提交一次（HTTPS 下），服务端请用 bcrypt / argon2 存储。
- 前端目前对用户名、密码没有长度限制（课程演示阶段的要求），上线前请在服务端加上限制并同步修改 `login/registration.html` 的提示文案。
