import React, { useRef, useState } from 'react';
import { Quote, Slash, Minus, Paperclip } from 'lucide-react';
import { mediaApi } from '../../services/api';
import { MarkdownBody } from '../../shared/markdown/MarkdownBody';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  label?: string;
  disabled?: boolean;
}

function normalizeMarkdownContent(raw: string): string {
  return raw
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .trim();
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix = '',
): string {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const selected = value.slice(s, e);
  return value.slice(0, s) + prefix + selected + suffix + value.slice(e);
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 300,
  label,
  disabled,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [uploading, setUploading] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyInsert = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    const next = insertAtCursor(textarea, prefix, suffix);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
    });
  };

  const onPickImage = async (file: File | null) => {
    if (!file || disabled) return;
    setUploading(true);
    try {
      const up = await mediaApi.upload(file);
      const url = String(up.url ?? '').trim();
      if (!url) return;
      applyInsert(`![](${url})`);
    } finally {
      setUploading(false);
    }
  };

  const applyTemplate = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    const next = insertAtCursor(textarea, text);
    onChange(next);
    requestAnimationFrame(() => textarea.focus());
  };

  return (
    <div>
      {label ? <p className="text-xs text-gray-500 mb-1">{label}</p> : null}
      <div
        className={`rounded-xl border bg-white overflow-hidden ${
          focused ? 'border-orange-300' : 'border-gray-200'
        }`}
        style={focused ? { boxShadow: 'inset 2px 0 0 #fb923c' } : undefined}
      >
        <div className="px-3 pt-2 pb-2 flex items-center justify-end border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('write')}
              className={`px-2 py-1 text-xs rounded-md border ${
                tab === 'write'
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`px-2 py-1 text-xs rounded-md border ${
                tab === 'preview'
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {tab === 'write' ? (
          <>
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyInsert('> ')}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                title="Blockquote"
              >
                <Quote size={12} />
              </button>
              <button
                type="button"
                onClick={() => applyInsert('\n# ')}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                title="หัวข้อ"
              >
                #
              </button>
              <button
                type="button"
                onClick={() => applyInsert('**', '**')}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                title="ตัวหนา"
              >
                **
              </button>
              <button
                type="button"
                onClick={() => applyInsert('`', '`')}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                title="ไฮไลท์ข้อความ"
              >
                `
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('\n\n')}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                title="เว้นบรรทัด"
              >
                ↵↵
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('\n| หัวข้อ 1 | หัวข้อ 2 |\n| --- | --- |\n| ค่า A | ค่า B |\n')}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                title="ตาราง"
              >
                |
              </button>
              <button
                type="button"
                onClick={() => applyInsert('\n\n---\n\n')}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                title="Divider"
              >
                <Minus size={12} />
                <span className="tracking-wider">---</span>
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled || uploading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                title="แนบรูป"
              >
                <Paperclip size={12} />
                {uploading ? 'กำลังอัปโหลด...' : 'แนบรูป'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = '';
                  void onPickImage(f);
                }}
              />
            </div>
            <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] text-gray-500 bg-gray-50/60">
              เวิร์กโฟลว์แนะนำ: เว้นบรรทัด 1 บรรทัดต่อบล็อก, แนบรูปด้วยปุ่ม 📎, ใช้ `|` สร้างตาราง, ใช้ `---` คั่น section
            </div>
            <textarea
              ref={textareaRef}
              className="w-full resize-y font-mono text-sm px-3 py-2.5 border-0 outline-none"
              style={{ minHeight: `${minHeight}px` }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </>
        ) : (
          <div className="px-4 py-3 min-h-[200px]">
            {value.trim() ? (
              <MarkdownBody
                source={normalizeMarkdownContent(value)}
                className="max-w-none text-gray-700"
              />
            ) : (
              <p className="text-[13px] text-gray-400">ยังไม่มีรายละเอียดเพิ่มเติม</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
