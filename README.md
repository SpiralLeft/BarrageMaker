# BarrageMaker · 弹幕打轴与渲染工具

一个纯前端的弹幕打轴与渲染工具。导入视频或音频，在时间轴上给弹幕打轴，实时预览 Canvas 渲染效果，最后导出**带透明通道**的 WebM 视频或 PNG 序列，供剪辑软件（Premiere / After Effects / DaVinci Resolve 等）叠加到原片之上。

所有处理均在浏览器本地完成，媒体文件不会上传到任何服务器。

## 功能特性

- **本地媒体导入** —— 支持视频（mp4 / mov / webm）与音频（mp3 / wav / flac / m4a），经由 `URL.createObjectURL` 在浏览器内播放，无上传、无后端。
- **三种弹幕模式** —— 滚动（从右向左）、顶部（居中定住）、底部（居中定住），支持自定义颜色（8 个预设色 + 取色器）与停留时长。
- **实时 Canvas 预览** —— 弹幕层以 Canvas 覆盖在播放器之上，播放、暂停、拖动进度时均实时渲染。
- **轨道自动避让** —— 滚动弹幕与顶部/底部弹幕分别维护独立的轨道池，按贪心策略分配，尽量保证弹幕互不重叠（见[轨道分配算法](#轨道分配算法)）。
- **可视化时间轴** —— 支持滚轮/按钮缩放、拖拽弹幕标记修改时间点、点击空白处跳转播放位置；不同模式用不同颜色区分，重叠的弹幕自动分层显示。
- **单条弹幕编辑** —— 修改文本、时间（可一键跳转预览）、模式、颜色、停留时长。
- **全局样式设置** —— 字号、字重、描边宽度、分辨率、FPS 均为全局参数，修改后实时生效。
- **视频导出** —— WebM（透明通道，VP9 优先）或 PNG 序列，可配置分辨率、FPS、是否叠加阴影，带进度显示与取消能力。
- **工程存档** —— 将弹幕与设置保存为 `.barrage.json`，随时加载回来继续制作。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 构建工具 | Vite 5 |
| 框架 | React 18 + TypeScript 5.5 |
| 状态管理 | Zustand 4 |
| 渲染 | 原生 Canvas 2D API |
| 视频导出 | `HTMLCanvasElement.captureStream()` + `MediaRecorder` |

无运行时后端依赖，无 UI 组件库。

## 快速开始

环境要求：Node.js 18+ 与 npm。

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:3000，自动打开浏览器）
npm run dev

# 类型检查 + 生产构建，产物输出到 dist/
npm run build

# 本地预览构建产物
npm run preview
```

## 使用流程

1. **导入媒体** —— 点击工具栏「导入媒体」，选择要打轴的视频或音频文件。仅音频时，预览区会显示纯色背景（颜色来自 `bgColor`）。
2. **设置全局参数** —— 在输入区的「全局字号 / 字重 / 描边」与导出面板的「分辨率 / FPS」中设定好成片规格。默认 1920×1080 @ 60fps。
3. **打轴** —— 播放或拖动进度条到目标时间点，在输入框中输入弹幕内容，选择模式与颜色，按 <kbd>Enter</kbd> 或点击「发送」；弹幕会记录在当前时间点，并立即出现在预览画面中。
4. **微调** —— 在时间轴上拖动弹幕标记可调整时间点；点击标记后在右侧编辑面板精修文本、时间、模式、颜色、停留时长。拖拽时间轴空白处可快速跳转播放位置。
5. **导出** —— 在导出面板选择格式（WebM / PNG 序列），点击「开始导出」。导出的是**纯弹幕层**（背景透明），在剪辑软件中叠加到原片即可。
6. **存档** —— 「保存项目」导出 `.barrage.json`；「加载项目」读回弹幕与设置（媒体文件需要重新手动导入，见[已知限制](#已知限制)）。

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| <kbd>Space</kbd> | 播放 / 暂停（播放结束后按空格会从头开始） |
| <kbd>Delete</kbd> | 删除当前选中的弹幕 |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>C</kbd> | 复制选中的弹幕（文本、模式、颜色、时长、时间） |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>V</kbd> | 粘贴到相同时间点，生成一条新弹幕 |

焦点位于输入框 / 下拉框等表单元素时，快捷键不生效。

时间轴操作：滚轮缩放，点击空白处跳转时间，拖动标记调整弹幕时间，<kbd>+</kbd> / <kbd>−</kbd> 按钮缩放。

## 项目结构

```
src/
├── main.tsx                    # 应用入口
├── App.tsx                     # 根布局 + 全局快捷键
├── App.css                     # 全部样式（深色主题）
├── types/
│   └── danmaku.ts              # DanmakuItem / ProjectData / TrackInfo 等类型定义
├── store/
│   └── useStore.ts             # Zustand 全局状态（媒体、时间、参数、弹幕列表、工程导入导出）
├── engine/
│   ├── DanmakuEngine.ts        # 弹幕可见性计算与 Canvas 绘制
│   └── TrackManager.ts         # 轨道池与防重叠分配
└── components/
    ├── Toolbar.tsx             # 媒体导入、播放控制、工程存读档
    ├── MediaPlayer.tsx         # 媒体元素与 store 时间同步
    ├── DanmakuCanvas.tsx       # 覆盖层 Canvas，rAF 渲染循环
    ├── DanmakuInput.tsx        # 弹幕输入区 + 全局样式设置
    ├── Timeline.tsx            # 时间轴（缩放、拖拽打轴、分层显示）
    ├── DanmakuEditor.tsx       # 单条弹幕属性编辑
    └── ExportPanel.tsx         # 导出设置与渲染流程
```

## 核心实现说明

### 状态管理

所有应用状态集中在 [useStore.ts](src/store/useStore.ts) 的单个 Zustand store 中：媒体源、当前时间、播放状态、全局渲染参数、弹幕列表与选中项。弹幕列表在增删改后始终按 `time` 升序排列，时间轴与渲染引擎因此可以直接依赖其有序性。

播放时的时间同步是有方向性的，避免 store 与媒体元素互相回写造成抖动：

- **播放中** —— 由媒体元素驱动，`requestAnimationFrame` 循环把 `video.currentTime` 写入 store；
- **暂停时** —— 由 store 驱动，`currentTime` 变化才写回媒体元素（且只在差值 > 0.1s 时 seek）。

### 轨道分配算法

[TrackManager.ts](src/engine/TrackManager.ts) 把画布划分为三类独立的轨道池：

- **滚动轨道** —— 轨道数量上限为画布高度的 70%（按轨道高度折算），自 `y = 8` 起向下排列；
- **顶部轨道** —— 轨道数量上限为画布高度的 30%，自 `y = 8` 起向下排列（从上往下占位）；
- **底部轨道** —— 同上限，自画布底部 `y = height - trackHeight` 起向上排列（从下往上占位）。

轨道高度 = `fontSize + trackPadding`（默认 padding 为 4px）。每条轨道记录一个 `occupiedUntil` 时间戳，分配时自第一条轨道起线性扫描，取第一条已释放（`occupiedUntil <= item.time + buffer`，buffer 默认 0.05s）的轨道；若全部占用，则退化到"最早释放"的轨道强行复用，保证任何情况下都有位置可用。

占用时长按模式区分：

- 滚动弹幕：`textWidth / scrollSpeed`，即文字尾部完全越过画布右边缘所需的时间；
- 顶部/底部弹幕：`item.duration`（默认 3s）。

轨道分配只依赖弹幕的**文本、模式、时间**，[DanmakuEngine.ts](src/engine/DanmakuEngine.ts) 用这三项拼成哈希，只有哈希变化时才重新计算全量分配结果 —— 播放过程中每帧渲染的成本因此只是可见性判断与绘制。

### 渲染

`DanmakuEngine.render()` 遍历预排序的弹幕列表，按当前时间筛出可见项后逐条绘制：

- 滚动弹幕：`x = width - scrollSpeed * elapsed`，总行程为 `width + textWidth`，`scrollSpeed` 固定为 350 px/s；左对齐；
- 顶部/底部弹幕：水平居中（`x = width / 2`），在 `[time, time + duration]` 区间内以全不透明度显示；居中对其。

文字样式为字重 + 字号 + `"Microsoft YaHei", "PingFang SC", sans-serif`，先 `fillText` 填充颜色，再以 `rgba(0,0,0,0.85)` 描边，线宽为 `max(1, fontSize * strokeWidth)`（描边宽度是相对字号的比例，因此改变分辨率不会改变描边的视觉粗细），`lineJoin = round` 保证转角平滑。导出时可额外开启 `shadowBlur` 阴影。

### 导出

两种格式共用同一个"离屏 Canvas + DanmakuEngine"的渲染管线，逐帧计算 `t = frame / fps` 并绘制：

- **WebM** —— `canvas.captureStream(fps)` 配合 `MediaRecorder`，优先使用 `video/webm; codecs="vp9"`（回退到 `video/webm`），码率 5 Mbps。Canvas 每帧 `clearRect` 后不清屏背景，因此保留透明通道，可导出带 alpha 的弹幕层。录制按真实时间推进，导出耗时约等于视频时长。
- **PNG 序列** —— 逐帧 `toBlob` 并单独下载为 `frame_000000.png`。适合需要无损画质或逐帧后期处理的场景。

导出总时长取 `max(媒体时长, 所有弹幕的 time + 尾部时长) + 2s`，其中滚动弹幕尾部按 8s 估算，固定弹幕按实际 `duration` 计算。

### 工程文件格式

「保存项目」输出 JSON（文件名 `<媒体名>.barrage.json`），结构与 [types/danmaku.ts](src/types/danmaku.ts) 中的 `ProjectData` 一致：

```jsonc
{
  "version": 1,
  "media": "example.mp4",     // 仅记录文件名，不嵌入媒体数据
  "mediaType": "video",
  "width": 1920,
  "height": 1080,
  "fps": 60,
  "fontSize": 36,
  "fontWeight": 700,
  "strokeWidth": 0.06,        // 相对字号的比例
  "bgColor": "#000000",
  "danmakus": [
    {
      "id": "dm_1715678901234_1",
      "time": 3.5,            // 秒
      "text": "前方高能",
      "mode": "scroll",       // scroll | top | bottom
      "color": "#ffffff",
      "duration": 3           // 秒，仅 top / bottom 使用
    }
  ]
}
```

导入时后三个字段（`fontSize` / `fontWeight` / `strokeWidth`）缺省则回退为 36 / 700 / 0.06，兼容早期版本存档。

## 已知限制

- **媒体文件不随工程保存**。受浏览器安全限制，页面无法读取本地文件路径，加载 `.barrage.json` 后需要重新手动导入媒体文件（加载时会提示原文件名）。
- **PNG 序列会触发大量下载**。导出长视频时浏览器可能提示"允许多个文件下载"，请允许后再开始导出。
- **WebM 导出依赖实时录制**。录制过程中请保持标签页在前台，切换标签页可能因浏览器限流导致丢帧；确需后台运行时建议改用 PNG 序列。
- **WebM 透明度依赖浏览器编码器**。VP8/VP9 的 alpha 通道在部分浏览器与剪辑软件中支持不完整，若叠加后出现黑底，请检查剪辑软件的 WebM 解码设置或改用 PNG 序列。
- **滚动速度固定为 350 px/s**，暂未提供 UI 调节；如需修改，请同时调整 [DanmakuCanvas.tsx](src/components/DanmakuCanvas.tsx) 与 [ExportPanel.tsx](src/components/ExportPanel.tsx) 中的 `scrollSpeed`（两处必须保持一致，否则预览与导出结果不符）。
- **导出内容是纯弹幕层**，不包含原片画面与音轨，也不包含背景色（背景始终透明），需要在剪辑软件中自行合成。
- **文本测量基于 Canvas `measureText`**，长文本的宽度估算与实际渲染一致，但轨道分配不考虑字号之外的缩放变换。
