import React, { useRef, useState } from 'react';
import { 
  Quote, 
  Minus, 
  Paperclip, 
  Bold, 
  Italic, 
  Code, 
  Heading, 
  List, 
  ListOrdered, 
  Link, 
  Table as TableIcon, 
  Image as ImageIcon 
} from 'lucide-react';
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

    const s = textarea.selectionStart;
    const e = textarea.selectionEnd;
    const currentValue = textarea.value;
    const selected = currentValue.slice(s, e);

    // สร้างข้อความใหม่
    const nextValue = currentValue.slice(0, s) + prefix + selected + suffix + currentValue.slice(e);
    onChange(nextValue);

    // รอให้ React อัปเดต State ก่อน แล้วค่อยจัดการตำแหน่ง Cursor
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (s === e) {
          // ถ้าไม่ได้คลุมดำข้อความ ให้วาง Cursor ไว้หลัง Prefix (ตรงกลาง)
          // เช่น กด Bold จะได้ **|**
          const cursorPos = s + prefix.length;
          textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        } else {
          // ถ้าคลุมดำข้อความ ให้คลุมดำที่ข้อความเดิมต่อ (ขยับตำแหน่งตาม Prefix)
          // เช่น คลุมคำว่า Text แล้วกด Bold จะได้ **[Text]**
          textareaRef.current.setSelectionRange(s + prefix.length, s + prefix.length + selected.length);
        }
      }
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

    const s = textarea.selectionStart;
    const e = textarea.selectionEnd;
    const currentValue = textarea.value;

    const nextValue = currentValue.slice(0, s) + text + currentValue.slice(e);
    onChange(nextValue);

    // วาง Cursor ไว้ท้ายสุดของ Template ที่เพิ่งแทรกเข้าไป
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPos = s + text.length;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    });
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
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
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
            {/* Toolbar แบบจัดกลุ่ม */}
            <div className="px-2 py-1.5 border-b border-gray-100 flex items-center flex-wrap gap-2 bg-white">
              
              {/* กลุ่ม: จัดรูปแบบตัวอักษร */}
              <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
                <button type="button" onClick={() => applyInsert('**', '**')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="ตัวหนา (Bold)">
                  <Bold size={15} />
                </button>
                <button type="button" onClick={() => applyInsert('_', '_')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="ตัวเอียง (Italic)">
                  <Italic size={15} />
                </button>
                <button type="button" onClick={() => applyInsert('`', '`')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="ไฮไลท์โค้ด (Inline Code)">
                  <Code size={15} />
                </button>
              </div>

              {/* กลุ่ม: โครงสร้าง (หัวข้อ, คำคม, เส้นคั่น) */}
              <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
                <button type="button" onClick={() => applyInsert('\n### ')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="หัวข้อ (Heading)">
                  <Heading size={15} />
                </button>
                <button type="button" onClick={() => applyInsert('\n> ')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="คำคม (Blockquote)">
                  <Quote size={15} />
                </button>
                <button type="button" onClick={() => applyInsert('\n\n---\n\n')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="เส้นคั่น (Divider)">
                  <Minus size={15} />
                </button>
              </div>

              {/* กลุ่ม: รายการ (Lists) */}
              <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
                <button type="button" onClick={() => applyInsert('\n- ')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="รายการแบบจุด (Bullet List)">
                  <List size={15} />
                </button>
                <button type="button" onClick={() => applyInsert('\n1. ')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="รายการตัวเลข (Numbered List)">
                  <ListOrdered size={15} />
                </button>
              </div>

              {/* กลุ่ม: แทรกข้อมูล (ลิงก์, ตาราง, รูปภาพ) */}
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => applyInsert('[', '](url)')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="แทรกลิงก์ (Link)">
                  <Link size={15} />
                </button>
                <button type="button" onClick={() => applyTemplate('\n| หัวข้อ 1 | หัวข้อ 2 |\n| --- | --- |\n| ค่า A | ค่า B |\n')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="แทรกตาราง (Table)">
                  <TableIcon size={15} />
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={disabled || uploading} className="inline-flex items-center gap-1.5 p-1.5 px-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="แนบรูปภาพ (Image)">
                  <ImageIcon size={15} />
                  {uploading && <span className="text-xs font-medium text-orange-600">กำลังอัปโหลด...</span>}
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
            </div>

            {/* Guideline อ้างอิงตาม Markdown Guide */}
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/60 flex flex-col gap-1 text-[11px] text-gray-500">
              <div className="flex items-center justify-between">
                <p>
                  <span className="font-semibold text-gray-700 mr-1">💡 ทิปส์:</span> 
                  ใช้ <code>**หนา**</code>, <code>_เอียง_</code>, สร้างตารางด้วย <code>|</code>, หรือแนบรูปลากวาง
                </p>
                <a 
                  href="https://www.markdownguide.org/basic-syntax/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-orange-500 hover:text-orange-600 hover:underline inline-flex items-center gap-1"
                >
                  ดูไกด์ไลน์ Markdown ทั้งหมด
                </a>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className="w-full resize-y font-mono text-sm px-3 py-3 border-0 outline-none leading-relaxed text-gray-700"
              style={{ minHeight: `${minHeight}px` }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "พิมพ์เนื้อหาของคุณที่นี่ รองรับ Markdown..."}
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