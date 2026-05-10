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
    id: 'factory_products',
    title: '1. รายละเอียดสินค้าที่โรงงานรับทำ',
    description: 'โครงสร้างสำหรับอธิบายหมวดหมู่สินค้า เงื่อนไข (MOQ) และบริการเสริม',
    content: `# [ชื่อประเภทสินค้า หรือ ชื่อแบรนด์โรงงาน]
> [คำโปรย เช่น รับผลิตอาหารสัตว์เลี้ยงเกรดพรีเมียม ตอบโจทย์ทุกความต้องการของแบรนด์คุณ]

## 📦 หมวดหมู่สินค้าที่รับผลิต
1. **[หมวดหมู่ที่ 1 เช่น ขนมสุนัขแบบฟรีซดราย]:** [อธิบายลักษณะเด่น เช่น คงคุณค่าทางอาหาร 100%]
2. **[หมวดหมู่ที่ 2 เช่น อาหารเม็ด (Kibble)]:** [อธิบายลักษณะเด่น เช่น สูตรเกรดโฮลิสติก ลดคราบน้ำตา]
3. **[หมวดหมู่ที่ 3 เช่น อาหารเปียก/ขนมแมวเลีย]:** [อธิบายลักษณะเด่น เช่น เนื้อสัมผัสเนียนนุ่ม ความน่ากินสูง]

## ✨ บริการของเรา (One-Stop Service)
- **R&D พัฒนาสูตร:** [เช่น คิดค้นสูตรใหม่โดยสัตวแพทย์และนักโภชนาการ]
- **Packaging Design:** [เช่น บริการออกแบบบรรจุภัณฑ์ให้โดดเด่น]
- **Registration:** [เช่น บริการขึ้นทะเบียนอาหารสัตว์ (อย.) ให้ถูกต้องตามกฎหมาย]

## 📊 เงื่อนไขการผลิต (MOQ & Lead Time)
| รายการ | รายละเอียด |
| --- | --- |
| **ขั้นต่ำการผลิต (MOQ)** | [เช่น เริ่มต้นเพียง 500 กิโลกรัม / 1,000 ซอง] |
| **ระยะเวลาพัฒนาสูตร** | [เช่น 14 - 30 วัน] |
| **ระยะเวลาผลิตจริง** | [เช่น 30 - 45 วัน หลังยืนยันแบบ] |`
  },
  {
    id: 'factory_materials',
    title: '2. รายละเอียดวัตถุดิบ (Raw Materials)',
    description: 'โครงสร้างสำหรับนำเสนอคุณภาพและแหล่งที่มาของวัตถุดิบ',
    content: `# 🥩 คุณภาพวัตถุดิบของเรา (Premium Raw Materials)
> [คำโปรย เช่น เราคัดสรรเฉพาะวัตถุดิบระดับ Human Grade เพื่อสุขภาพที่ดีที่สุดของสัตว์เลี้ยง]

## 🌟 แหล่งที่มาของโปรตีนหลัก
- **[วัตถุดิบที่ 1 เช่น เนื้อไก่สดเกรดพรีเมียม]:** [อธิบาย เช่น ปลอดสารเร่งเนื้อแดง แหล่งโปรตีนย่อยง่าย]
- **[วัตถุดิบที่ 2 เช่น ปลาแซลมอนนำเข้า]:** [อธิบาย เช่น อุดมไปด้วย Omega 3 & 6 บำรุงขนและผิวหนัง]
- **[วัตถุดิบที่ 3 เช่น เนื้อแกะออสเตรเลีย]:** [อธิบาย เช่น เหมาะสำหรับสัตว์เลี้ยงที่แพ้ง่าย (Hypoallergenic)]

## 🌿 ส่วนผสมเสริมและวิตามิน (Supplements & Superfoods)
1. **[เช่น น้ำมันปลา (Fish Oil)]:** [อธิบายสรรพคุณ บำรุงอะไร]
2. **[เช่น พรีไบโอติกส์ (Prebiotics)]:** [อธิบายสรรพคุณ เช่น ปรับสมดุลลำไส้และระบบขับถ่าย]
3. **[เช่น ผงผักโขม/ฟักทอง]:** [อธิบายสรรพคุณ เช่น เพิ่มกากใยและวิตามินตามธรรมชาติ]

## 🛡️ มาตรฐานความปลอดภัย (Safety Standards)
- ✅ [เช่น ปราศจากผลพลอยได้จากสัตว์ (By-Products)]
- ✅ [เช่น ไม่ใส่สี กลิ่นสังเคราะห์ หรือวัตถุกันเสีย]
- ✅ [เช่น ผ่านการตรวจวิเคราะห์ทางห้องปฏิบัติการ (Lab Tested)]`
  },
  {
    id: 'pet_trends_article',
    title: '3. บทความไอเดียเทรนด์สินค้าสัตว์เลี้ยง',
    description: 'โครงสร้างสำหรับเขียนแชร์ความรู้ หรือเทรนด์ตลาดใหม่ๆ',
    content: `# 📈 อัปเดตเทรนด์สินค้าสัตว์เลี้ยงปี [ระบุปี] ที่เจ้าของแบรนด์ต้องรู้!
> [คำนำ เช่น ตลาด Pet Care เติบโตอย่างต่อเนื่อง มาดูกันว่าสินค้าแบบไหนที่กำลังมาแรงและครองใจเหล่า Pet Parent]

## 1. [เทรนด์ที่ 1 เช่น สินค้ากลุ่ม Humanization (ดูแลสัตว์เลี้ยงเหมือนลูก)]
[อธิบายรายละเอียดเทรนด์ เช่น ผู้บริโภคยอมจ่ายแพงขึ้นเพื่ออาหารที่ใช้วัตถุดิบระดับ Human Grade หรือสินค้าที่หน้าตาเหมือนอาหารคน]
**💡 ไอเดียทำสินค้า:** [เช่น ขนมเค้ก/คุ้กกี้สำหรับสุนัข, อาหารเปียกสูตรพรีเมียม]

## 2. [เทรนด์ที่ 2 เช่น สุขภาพเฉพาะทาง (Personalized Health & Wellness)]
[อธิบายรายละเอียดเทรนด์ เช่น ความต้องการอาหารสูตรเฉพาะโรค หรือเสริมภูมิคุ้มกันเฉพาะจุด]
**💡 ไอเดียทำสินค้า:** [เช่น ขนมเสริมข้อต่อสำหรับสุนัขสูงวัย, ผงโรยข้าวเพิ่มความอยากอาหาร]

## 3. [เทรนด์ที่ 3 เช่น บรรจุภัณฑ์รักษ์โลก (Eco-Friendly Packaging)]
[อธิบายรายละเอียดเทรนด์ เช่น เจ้าของสัตว์เลี้ยงยุคใหม่ใส่ใจสิ่งแวดล้อมมากขึ้น]
**💡 ไอเดียทำสินค้า:** [เช่น ใช้ซองที่ย่อยสลายได้ หรือกระป๋องรีไซเคิล 100%]

---

**📌 สรุป:**
[เขียนสรุปสั้นๆ เช่น การจับเทรนด์เหล่านี้มาพัฒนาเป็นสินค้าใหม่ จะช่วยให้แบรนด์ของคุณแตกต่างและเติบโตได้อย่างยั่งยืนในตลาด]

*สนใจเริ่มต้นทำแบรนด์สินค้าตามเทรนด์เหล่านี้ ปรึกษาเราได้เลย!*`
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
                className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
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
                  <MarkdownBody
                    source={normalizeMarkdownContent(TEMPLATES[activeTemplateIndex].content)}
                    className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
                  />
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