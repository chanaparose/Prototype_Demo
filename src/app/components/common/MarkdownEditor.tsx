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
  Image as ImageIcon,
  LayoutTemplate,
  X,
  CheckCircle2
} from 'lucide-react';
import { mediaApi } from '../../services/api';
import { MarkdownBody } from '../../shared/markdown/MarkdownBody';

// ---------------------------------------------------------------------------
// ข้อมูลเทมเพลต (สามารถเพิ่ม/ลด ได้ตามต้องการ)
// ---------------------------------------------------------------------------
const TEMPLATES = [
  {
    id: 'oem',
    title: 'บริการรับผลิต / OEM',
    description: 'โครงสร้างสำหรับโปรโมทโรงงาน บริการรับผลิตสินค้า',
    content: `> **[ระบุหัวข้อโปรโมทหลัก หรือ คำโปรยที่น่าสนใจ]**
> [ระบุคำอธิบายย่อย หรือ สโลแกนสั้นๆ เช่น รับผลิตอะไร, ขั้นต่ำเท่าไหร่]

---

# [ใส่ชื่อบริษัท หรือ บริการหลักของคุณ] 
[อธิบายสั้นๆ ว่าคุณคือใคร เชี่ยวชาญด้านไหน และช่วยแก้ปัญหาให้ลูกค้าได้อย่างไร]

✨ **จุดเด่นบริการของเรา**
1. **[จุดเด่นข้อที่ 1 เช่น รองรับการเริ่มต้น (Low MOQ)]:** [อธิบายรายละเอียด]
2. **[จุดเด่นข้อที่ 2 เช่น ปรับแต่งสูตรได้ตามต้องการ]:** [อธิบายรายละเอียด]
3. **[จุดเด่นข้อที่ 3 เช่น ระยะเวลาผลิตชัดเจน]:** [อธิบายรายละเอียด]

### ข้อมูลที่ต้องเตรียมก่อนเริ่มงาน
- **[กลุ่มเป้าหมาย]:** [ระบุสิ่งที่คุณต้องการทราบ]
- **[สเปกสินค้า]:**
  - [รายละเอียดย่อย 1]
  - [รายละเอียดย่อย 2]
- **[รูปแบบบรรจุภัณฑ์]:** [เช่น ขนาดซอง, จำนวน]

---

✅ \`มาตรฐานที่เรามอบให้\`
1. [มาตรฐานที่ 1]
2. [มาตรฐานที่ 2]

[ข้อความปิดท้าย เช่น "ยินดีให้คำปรึกษาฟรี!"]`
  },
  {
    id: 'ecommerce',
    title: 'รายละเอียดสินค้า (E-commerce)',
    description: 'โครงสร้างสำหรับขายสินค้า สเปก และการจัดส่ง',
    content: `# [ชื่อสินค้า]
> [คำโปรยสั้นๆ ดึงดูดลูกค้าให้คลิกซื้อ]

## 🌟 จุดเด่นของสินค้า
- **[จุดเด่น 1]:** [อธิบาย]
- **[จุดเด่น 2]:** [อธิบาย]
- **[จุดเด่น 3]:** [อธิบาย]

## 📋 ข้อมูลจำเพาะ (Specifications)
| คุณสมบัติ | รายละเอียด |
| --- | --- |
| **ขนาด** | [กว้าง x ยาว x สูง] |
| **น้ำหนัก** | [ระบุน้ำหนัก] |
| **วัสดุ** | [ระบุวัสดุ] |
| **สีที่มี** | [ระบุสี] |

## 📦 การจัดส่งและการรับประกัน
- **การจัดส่ง:** จัดส่งฟรีเมื่อสั่งซื้อครบ [จำนวนเงิน] บาท (ใช้เวลา [จำนวน] วัน)
- **การรับประกัน:** รับประกันสินค้า [ระยะเวลา] (เงื่อนไข: [ระบุเงื่อนไขสั้นๆ])`
  },
  {
    id: 'partner',
    title: 'รับสมัครพาร์ทเนอร์ / ตัวแทน',
    description: 'โครงสร้างสำหรับหาพาร์ทเนอร์หรือตัวแทนจำหน่าย',
    content: `# 🚀 เปิดรับสมัครตัวแทนจำหน่าย [ชื่อแบรนด์/สินค้า]
ร่วมเป็นส่วนหนึ่งกับเราและเติบโตไปด้วยกัน! เปิดรับสมัครทั่วประเทศ โควต้าจำกัด

## 💡 ทำไมต้องเป็นตัวแทนกับเรา?
1. **สินค้าขายง่าย:** [อธิบายเหตุผล เช่น เป็นที่รู้จัก, การตลาดแน่น]
2. **กำไรดี:** รับส่วนลดสูงสุดถึง [ตัวเลข]%
3. **ไม่ต้องสต๊อกสินค้า (Dropship):** [อธิบายเงื่อนไขถ้ามี]
4. **มีสื่อการตลาดให้:** รูปภาพ, วิดีโอ, และคอนเทนต์พร้อมโพสต์

## 🎯 คุณสมบัติผู้สมัคร
- [คุณสมบัติ 1 เช่น อายุ 20 ปีขึ้นไป]
- [คุณสมบัติ 2 เช่น มีช่องทางการขายออนไลน์ของตัวเอง]
- [คุณสมบัติ 3 เช่น มีความรับผิดชอบและพร้อมเรียนรู้]

## 📝 ขั้นตอนการสมัคร
1. กรอกฟอร์ม: [ใส่ลิงก์ฟอร์ม]
2. รอเจ้าหน้าที่ติดต่อกลับภายใน [จำนวน] ชั่วโมง
3. เซ็นสัญญาและรับรหัสตัวแทน

**สอบถามเพิ่มเติม:** ติดต่อ [ช่องทางการติดต่อ เช่น Line OA, เบอร์โทร]`
  }
];

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
  
  // States สำหรับ Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyInsert = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const s = textarea.selectionStart;
    const e = textarea.selectionEnd;
    const currentValue = textarea.value;
    const selected = currentValue.slice(s, e);

    const nextValue = currentValue.slice(0, s) + prefix + selected + suffix + currentValue.slice(e);
    onChange(nextValue);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (s === e) {
          const cursorPos = s + prefix.length;
          textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        } else {
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

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPos = s + text.length;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    });
  };

  const handleSelectTemplate = () => {
    const selectedTemplate = TEMPLATES[activeTemplateIndex];
    applyTemplate(selectedTemplate.content + '\n\n');
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="relative">
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
            {/* Toolbar */}
            <div className="px-2 py-1.5 border-b border-gray-100 flex items-center flex-wrap gap-2 bg-white">
              
              <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
                <button type="button" onClick={() => applyInsert('**', '**')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="ตัวหนา (Bold)"><Bold size={15} /></button>
                <button type="button" onClick={() => applyInsert('_', '_')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="ตัวเอียง (Italic)"><Italic size={15} /></button>
                <button type="button" onClick={() => applyInsert('`', '`')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="ไฮไลท์โค้ด (Inline Code)"><Code size={15} /></button>
              </div>

              <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
                <button type="button" onClick={() => applyInsert('\n### ')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="หัวข้อ (Heading)"><Heading size={15} /></button>
                <button type="button" onClick={() => applyInsert('\n> ')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="คำคม (Blockquote)"><Quote size={15} /></button>
                <button type="button" onClick={() => applyInsert('\n\n---\n\n')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="เส้นคั่น (Divider)"><Minus size={15} /></button>
              </div>

              <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
                <button type="button" onClick={() => applyInsert('\n- ')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="รายการแบบจุด (Bullet List)"><List size={15} /></button>
                <button type="button" onClick={() => applyInsert('\n1. ')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="รายการตัวเลข (Numbered List)"><ListOrdered size={15} /></button>
              </div>

              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => applyInsert('[', '](url)')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="แทรกลิงก์ (Link)"><Link size={15} /></button>
                <button type="button" onClick={() => applyTemplate('\n| หัวข้อ 1 | หัวข้อ 2 |\n| --- | --- |\n| ค่า A | ค่า B |\n')} disabled={disabled} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="แทรกตาราง (Table)"><TableIcon size={15} /></button>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={disabled || uploading} className="inline-flex items-center gap-1.5 p-1.5 px-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40" title="แนบรูปภาพ (Image)">
                  <ImageIcon size={15} />
                  {uploading && <span className="text-xs font-medium text-orange-600">กำลังอัปโหลด...</span>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; e.target.value = ''; void onPickImage(f); }} />
              </div>

              {/* ปุ่มเปิด Modal เลือกเทมเพลต */}
              <div className="ml-auto flex items-center">
                <button 
                  type="button" 
                  onClick={() => setIsTemplateModalOpen(true)} 
                  disabled={disabled} 
                  className="inline-flex items-center gap-1.5 p-1.5 px-2.5 rounded-md text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 disabled:opacity-40 text-[13px] font-medium transition-colors" 
                >
                  <LayoutTemplate size={14} />
                  เลือกเทมเพลต...
                </button>
              </div>
            </div>

            {/* Guideline */}
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/60 flex flex-col gap-1 text-[11px] text-gray-500">
              <div className="flex items-center justify-between">
                <p>
                  <span className="font-semibold text-gray-700 mr-1">💡 ทิปส์:</span> 
                  ใช้ <code>**หนา**</code>, <code>_เอียง_</code>, สร้างตารางด้วย <code>|</code>, หรือเลือกเทมเพลตเพื่อประหยัดเวลา
                </p>
                <a href="https://www.markdownguide.org/basic-syntax/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 hover:underline inline-flex items-center gap-1">
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

      {/* --------------------------------------------------------------------------- */}
      {/* TEMPLATE SELECTION MODAL */}
      {/* --------------------------------------------------------------------------- */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2 text-gray-800">
                <LayoutTemplate size={20} className="text-orange-500" />
                <h3 className="text-lg font-semibold">เลือกเทมเพลตเริ่มต้น</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Screen */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              
              {/* Left Side: Template List */}
              <div className="w-full md:w-1/3 border-r border-gray-100 bg-gray-50/30 overflow-y-auto p-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 px-1">รูปแบบที่มีให้เลือก</p>
                {TEMPLATES.map((tpl, idx) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setActiveTemplateIndex(idx)}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                      activeTemplateIndex === idx 
                        ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-300 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-medium ${activeTemplateIndex === idx ? 'text-orange-800' : 'text-gray-800'}`}>
                        {tpl.title}
                      </h4>
                      {activeTemplateIndex === idx && (
                        <CheckCircle2 size={18} className="text-orange-500 shrink-0" />
                      )}
                    </div>
                    <p className={`text-[13px] leading-snug ${activeTemplateIndex === idx ? 'text-orange-600/80' : 'text-gray-500'}`}>
                      {tpl.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Right Side: Live Preview */}
              <div className="w-full md:w-2/3 bg-white flex flex-col overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between shadow-sm z-10">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ตัวอย่างการแสดงผล (Preview)</span>
                  <span className="text-[11px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">ทดลองอ่านได้</span>
                </div>
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="prose prose-sm prose-orange max-w-none">
                    <MarkdownBody 
                      source={normalizeMarkdownContent(TEMPLATES[activeTemplateIndex].content)} 
                      className="text-gray-700"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSelectTemplate}
                className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 shadow-sm transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                นำเทมเพลตนี้ไปใช้
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}