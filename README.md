# yiquanfeng.github.io

个人主页 + 工具集，部署在 GitHub Pages。

## Schedule to ICS

将北邮「学生个人课表」XLS（或自定义 CSV）转换为 `.ics` 日历文件，可直接导入 iOS 日历、macOS 日历、Google Calendar 等任意支持 iCal 格式的软件。

### 使用方式

1. 打开 [Schedule to ICS](https://yiquanfeng.github.io/schedule-ics.html)
2. 选择**学期第一周的周一**日期
3. 上传课表文件（北邮教务系统导出的 XLS，或自定义 CSV）
4. 如有需要，在「临时课程」区域添加学期中只在某几周出现的课程
5. 点击「生成 ICS」
6. 下载生成的 `.ics` 文件，导入日历软件

### 效果截图

<!-- 截图待补充 -->

### 文件结构

| 文件 | 说明 |
|------|------|
| `index.html` | 主页 |
| `schedule-ics.html` | Schedule to ICS 工具页面 |
| `schedule-ics.js` | XLS / CSV 解析与 ICS 生成逻辑 |
| `styles.css` | 全站样式 |
| `favicon.svg` | 网站图标 |
