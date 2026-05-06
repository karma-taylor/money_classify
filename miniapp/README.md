# 微信小程序迁移方案（已落地）

## 技术路线
- 采用原生小程序（WXML/WXSS/JS），目录：`miniapp/`
- 复用现有贪心算法并抽到 `miniapp/utils/classify.js`
- 复用 SheetJS：`miniapp/xlsx.full.min.js`
- 批量 Excel 工具封装：`miniapp/utils/excel.js`

## 项目结构
- `project.config.json`：微信开发者工具项目配置
- `miniapp/app.*`：全局配置
- `miniapp/pages/index`：单笔配钞页
- `miniapp/pages/batch`：批量导入导出页
- `miniapp/docs`：测试、提审、上线运维清单

## 依赖与包体
- 仅引入 SheetJS，当前 bundle 大约 0.8~0.9MB
- 如后续接近包体上限，可切换为精简构建版并保留当前接口

## 关键行为
- 单笔页勾选面额会缓存到 `selectedDenoms`
- 批量页导入后支持“按面额重算”
- 导出文件写入 `wx.env.USER_DATA_PATH` 并调用 `wx.openDocument`
