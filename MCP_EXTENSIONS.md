# MCP Extensions - LxzClaw

Model Context Protocol (MCP) 扩展支持，让 LxzClaw 连接更多工具和服务。

## 内置 MCP 服务器

LxzClaw 内置了以下 MCP 服务器，开箱即用：

### 1. Filesystem Server 📁

文件系统操作工具。

**工具列表：**
| 工具 | 说明 |
|------|------|
| `read_file` | 读取文件内容 |
| `write_file` | 写入文件内容 |
| `list_directory` | 列出目录内容 |
| `create_directory` | 创建目录 |
| `delete_file` | 删除文件 |
| `file_exists` | 检查文件是否存在 |
| `get_file_info` | 获取文件信息 |
| `search_files` | 搜索文件 |

**配置方式：**

```yaml
mcp:
  filesystem:
    enabled: true
```

或环境变量：

```bash
LXZ_MCP_FILESYSTEM_ENABLED=true
```

### 2. Git Server 📦

Git 版本控制操作工具。

**工具列表：**
| 工具 | 说明 |
|------|------|
| `git_status` | 查看工作区状态 |
| `git_log` | 查看提交历史 |
| `git_branch` | 列出分支 |
| `git_diff` | 查看变更 |
| `git_commit` | 创建提交 |
| `git_push` | 推送到远程 |
| `git_pull` | 从远程拉取 |
| `git_clone` | 克隆仓库 |

**配置方式：**

```yaml
mcp:
  git:
    enabled: true
```

### 3. Web Search Server 🔍

网页搜索和内容获取工具。

**工具列表：**
| 工具 | 说明 |
|------|------|
| `search` | 网络搜索 |
| `fetch_url` | 获取网页内容 |
| `extract_links` | 提取网页链接 |
| `get_headers` | 获取 HTTP 头 |

**配置方式：**

```yaml
mcp:
  websearch:
    enabled: true
```

## 第三方 MCP 服务器

除了内置服务器，LxzClaw 还支持连接第三方 MCP 服务器：

### NPM 包形式的 MCP 服务器

```yaml
mcp:
  servers:
    - name: github
      command: npx
      args: ["-y", "@modelcontextprotocol/server-github"]
      enabled: true
    
    - name: filesystem
      command: npx  
      args: ["-y", "@modelcontextprotocol/server-filesystem", "~/docs"]
      enabled: true
    
    - name: slack
      command: npx
      args: ["-y", "@modelcontextprotocol/server-slack"]
      enabled: false  # 需要配置 API Token
```

### 官方 MCP 服务器推荐

| 服务器 | 说明 | 安装命令 |
|--------|------|----------|
| `@modelcontextprotocol/server-filesystem` | 文件系统 | `npx -y @modelcontextprotocol/server-filesystem [目录]` |
| `@modelcontextprotocol/server-github` | GitHub API | `npx -y @modelcontextprotocol/server-github` |
| `@modelcontextprotocol/server-git` | Git 操作 | `npx -y @modelcontextprotocol/server-git [仓库路径]` |
| `@modelcontextprotocol/server-slack` | Slack | `npx -y @modelcontextprotocol/server-slack` |
| `@modelcontextprotocol/server-brave-search` | Brave 搜索 | `npx -y @modelcontextprotocol/server-brave-search` |
| `@modelcontextprotocol/server-google-maps` | Google 地图 | `npx -y @modelcontextprotocol/server-google-maps` |

## 完整配置示例

```yaml
mcp:
  # 内置服务器
  filesystem:
    enabled: true
  
  git:
    enabled: true
  
  websearch:
    enabled: true
  
  # 第三方服务器
  servers:
    - name: github
      command: npx
      args: ["-y", "@modelcontextprotocol/server-github"]
      enabled: true
    
    - name: filesystem
      command: npx
      args: ["-y", "@modelcontextprotocol/server-filesystem", "~/projects"]
      enabled: true
    
    - name: brave-search
      command: npx
      args: ["-y", "@modelcontextprotocol/server-brave-search"]
      enabled: false  # 需要 BRAVE_SEARCH_API_KEY
```

## 环境变量配置

```bash
# MCP 服务器开关
LXZ_MCP_FILESYSTEM_ENABLED=true
LXZ_MCP_GIT_ENABLED=true
LXZ_MCP_WEBSEARCH_ENABLED=true

# 第三方 MCP 服务器
LXZ_MCP_BRAVE_API_KEY=your_brave_api_key
LXZ_MCP_SLACK_TOKEN=your_slack_token
LXZ_MCP_GITHUB_TOKEN=your_github_token
```

## 使用示例

### 文件操作

```
用户: 帮我读取 /home/user/README.md 的内容
Agent: 调用 mcp_filesystem_read_file
结果: 返回文件内容
```

### Git 操作

```
用户: 查看当前 Git 状态
Agent: 调用 mcp_git_git_status
结果: 返回工作区状态

用户: 创建一个 commit
Agent: 调用 mcp_git_git_commit
结果: 创建提交成功
```

### 网页搜索

```
用户: 搜索最新的 AI 新闻
Agent: 调用 mcp_websearch_search
结果: 返回搜索结果列表

用户: 获取这个网页的内容
Agent: 调用 mcp_websearch_fetch_url
结果: 返回网页内容
```

## 开发自己的 MCP 服务器

如果你想开发自己的 MCP 服务器：

1. 实现 MCP 协议规范的服务器端
2. 使用 JSON-RPC 2.0 进行通信
3. 遵循 MCP 工具定义格式

参考规范：https://modelcontextprotocol.io

## 故障排除

### 服务器连接失败

检查：
1. npx 是否已安装
2. NPM 包是否正确安装
3. 命令路径是否正确

### 工具调用失败

1. 检查工具参数是否正确
2. 查看日志获取详细错误信息
3. 确认服务器已正确连接

### 性能问题

- 减少并发工具调用
- 对大文件操作使用分页
- 启用缓存减少重复请求
