import { useStore } from '../store/useStore';
import type { DanmakuMode } from '../types/danmaku';

export default function DanmakuEditor() {
  const danmakus = useStore((s) => s.danmakus);
  const selectedId = useStore((s) => s.selectedDanmakuId);
  const updateDanmaku = useStore((s) => s.updateDanmaku);
  const deleteDanmaku = useStore((s) => s.deleteDanmaku);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const fontSize = useStore((s) => s.fontSize);
  const setFontSize = useStore((s) => s.setFontSize);

  const selected = danmakus.find((d) => d.id === selectedId);

  if (!selected) {
    return (
      <div className="danmaku-editor empty-editor">
        <p>点击时间轴上的弹幕进行编辑</p>
      </div>
    );
  }

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="danmaku-editor">
      <h4>弹幕编辑</h4>
      <div className="editor-field">
        <label>文本</label>
        <input
          type="text"
          value={selected.text}
          onChange={(e) => updateDanmaku(selected.id, { text: e.target.value })}
        />
      </div>
      <div className="editor-field">
        <label>时间</label>
        <div className="time-field-row">
          <input
            type="number"
            value={selected.time}
            step="0.01"
            min="0"
            onChange={(e) =>
              updateDanmaku(selected.id, { time: parseFloat(e.target.value) || 0 })
            }
          />
          <button onClick={() => setCurrentTime(selected.time)} title="跳转到此时间">
            {formatTime(selected.time)}
          </button>
        </div>
      </div>
      <div className="editor-field">
        <label>模式</label>
        <select
          value={selected.mode}
          onChange={(e) => updateDanmaku(selected.id, { mode: e.target.value as DanmakuMode })}
        >
          <option value="scroll">滚动</option>
          <option value="top">顶部</option>
          <option value="bottom">底部</option>
        </select>
      </div>
      <div className="editor-field">
        <label>颜色</label>
        <input
          type="color"
          value={selected.color}
          onChange={(e) => updateDanmaku(selected.id, { color: e.target.value })}
        />
      </div>
      {(selected.mode === 'top' || selected.mode === 'bottom') && (
        <div className="editor-field">
          <label>停留时间(秒)</label>
          <input
            type="number"
            value={selected.duration || 3}
            step="0.5"
            min="1"
            max="10"
            onChange={(e) =>
              updateDanmaku(selected.id, { duration: parseFloat(e.target.value) || 3 })
            }
          />
        </div>
      )}
      <div className="editor-field">
        <label>全局字号 (影响所有弹幕轨道间距)</label>
        <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
          <option value="24">24</option>
          <option value="28">28</option>
          <option value="32">32</option>
          <option value="36">36</option>
          <option value="42">42</option>
          <option value="48">48</option>
          <option value="56">56</option>
          <option value="64">64</option>
        </select>
      </div>
      <button className="delete-btn" onClick={() => deleteDanmaku(selected.id)}>
        删除弹幕
      </button>
    </div>
  );
}
