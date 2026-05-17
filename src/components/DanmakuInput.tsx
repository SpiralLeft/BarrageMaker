import { useCallback, useRef } from 'react';
import { useStore, createDanmaku } from '../store/useStore';
import type { DanmakuMode } from '../types/danmaku';

const MODES: { value: DanmakuMode; label: string }[] = [
  { value: 'scroll', label: '滚动' },
  { value: 'top', label: '顶部' },
  { value: 'bottom', label: '底部' },
];

const COLORS = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff9900'];

export default function DanmakuInput() {
  const inputText = useStore((s) => s.inputText);
  const inputMode = useStore((s) => s.inputMode);
  const inputColor = useStore((s) => s.inputColor);
  const fontSize = useStore((s) => s.fontSize);
  const fontWeight = useStore((s) => s.fontWeight);
  const strokeWidth = useStore((s) => s.strokeWidth);
  const currentTime = useStore((s) => s.currentTime);
  const addDanmaku = useStore((s) => s.addDanmaku);
  const setInputText = useStore((s) => s.setInputText);
  const setInputMode = useStore((s) => s.setInputMode);
  const setInputColor = useStore((s) => s.setInputColor);
  const setFontSize = useStore((s) => s.setFontSize);
  const setFontWeight = useStore((s) => s.setFontWeight);
  const setStrokeWidth = useStore((s) => s.setStrokeWidth);

  const inputRef = useRef<HTMLInputElement>(null);

  const send = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const dm = createDanmaku(currentTime, text, inputMode, inputColor);
    addDanmaku(dm);
    setInputText('');
    inputRef.current?.focus();
  }, [inputText, currentTime, inputMode, inputColor, addDanmaku, setInputText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="danmaku-input">
      <div className="input-row">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入弹幕内容，按 Enter 发送..."
          className="text-input"
        />
        <button onClick={send} className="send-btn">发送</button>
      </div>
      <div className="input-options">
        <div className="option-group">
          <label>模式</label>
          <select value={inputMode} onChange={(e) => setInputMode(e.target.value as DanmakuMode)}>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="option-group">
          <label>颜色</label>
          <div className="color-picker-row">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${inputColor === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setInputColor(c)}
                title={c}
              />
            ))}
            <input
              type="color"
              value={inputColor}
              onChange={(e) => setInputColor(e.target.value)}
              className="custom-color"
            />
          </div>
        </div>
        <div className="option-group">
          <label>全局字号</label>
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
        <div className="option-group">
          <label>字重</label>
          <select value={fontWeight} onChange={(e) => setFontWeight(Number(e.target.value))}>
            <option value="300">Light</option>
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
            <option value="800">Extrabold</option>
            <option value="900">Black</option>
          </select>
        </div>
        <div className="option-group">
          <label>描边</label>
          <select value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))}>
            <option value="0">无</option>
            <option value="0.03">细</option>
            <option value="0.06">标准</option>
            <option value="0.10">粗</option>
            <option value="0.15">特粗</option>
          </select>
        </div>
      </div>
    </div>
  );
}
