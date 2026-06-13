import React, { useRef, useState } from 'react';
import { useDisclosure } from '@/hooks/ui/useDisclosure';
import { useToggle } from '@/hooks/ui/useToggle';
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
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { mediaApi } from '@/services/api/factoryApi';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { AppDialog } from '@/components/ui/app-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ข้อมูลเทมเพลต (สามารถเพิ่ม/ลด ได้ตามต้องการ)

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
| **ระยะเวลาผลิตจริง** | [เช่น 30 - 45 วัน หลังยืนยันแบบ] |`,
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
- ✅ [เช่น ผ่านการตรวจวิเคราะห์ทางห้องปฏิบัติการ (Lab Tested)]`,
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

*สนใจเริ่มต้นทำแบรนด์สินค้าตามเทรนด์เหล่านี้ ปรึกษาเราได้เลย!*`,
  },
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
  const textareaMinHeight = Math.max(minHeight, 500);

  // Upload and focus states
  const { state: uploading, toggle: toggleUploading, close: closeUploading } = useToggle(false);
  const { state: focused, open: focusOn, close: focusOff } = useToggle(false);

  const {
    isOpen: isTemplateModalOpen,
    onOpen: openTemplate,
    onClose: closeTemplate,
  } = useDisclosure();
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
          textareaRef.current.setSelectionRange(
            s + prefix.length,
            s + prefix.length + selected.length,
          );
        }
      }
    });
  };

  const onPickImage = async (file: File | null) => {
    if (!file || disabled) return;
    toggleUploading();
    try {
      const up = await mediaApi.upload(file);
      const url = String(up.url ?? '').trim();
      if (!url) return;
      applyInsert(`![](${url})`);
    } finally {
      closeUploading();
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
    closeTemplate();
  };

  return (
    <div className='relative'>
      <div
        className={`rounded-xl border bg-white overflow-hidden ${
          focused ? 'border-gray-300' : 'border-gray-200'
        }`}
      >
        <div
          className={`px-3 pt-2 pb-2 flex items-center border-b border-gray-100 ${
            label ? 'justify-between' : 'justify-end'
          }`}
        >
          {label ? <p className='text-xs text-gray-500'>{label}</p> : null}
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => setTab('write')}
              variant='outline'
              size='xs'
              className={`px-2 py-1 text-xs rounded-md border shadow-none ${
                tab === 'write'
                  ? 'bg-brand-lavender border-brand-purple/20 text-brand-purple/80'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Write
            </Button>
            <Button
              onClick={() => setTab('preview')}
              variant='outline'
              size='xs'
              className={`px-2 py-1 text-xs rounded-md border shadow-none ${
                tab === 'preview'
                  ? 'bg-brand-lavender border-brand-purple/20 text-brand-purple/80'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Preview
            </Button>
          </div>
        </div>

        {tab === 'write' ? (
          <>
            <div className='px-2 py-1.5 border-b border-gray-100 flex items-center flex-wrap gap-2 bg-white'>
              <div className='flex items-center gap-0.5 pr-2 border-r border-gray-200'>
                <Button
                  onClick={() => applyInsert('**', '**')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='ตัวหนา (Bold)'
                >
                  <Bold size={15} />
                </Button>
                <Button
                  onClick={() => applyInsert('_', '_')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='ตัวเอียง (Italic)'
                >
                  <Italic size={15} />
                </Button>
                <Button
                  onClick={() => applyInsert('`', '`')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='ไฮไลท์โค้ด (Inline Code)'
                >
                  <Code size={15} />
                </Button>
              </div>

              <div className='flex items-center gap-0.5 pr-2 border-r border-gray-200'>
                <Button
                  onClick={() => applyInsert('\n### ')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='หัวข้อ (Heading)'
                >
                  <Heading size={15} />
                </Button>
                <Button
                  onClick={() => applyInsert('\n> ')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='คำคม (Blockquote)'
                >
                  <Quote size={15} />
                </Button>
                <Button
                  onClick={() => applyInsert('\n\n---\n\n')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='เส้นคั่น (Divider)'
                >
                  <Minus size={15} />
                </Button>
              </div>

              <div className='flex items-center gap-0.5 pr-2 border-r border-gray-200'>
                <Button
                  onClick={() => applyInsert('\n- ')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='รายการแบบจุด (Bullet List)'
                >
                  <List size={15} />
                </Button>
                <Button
                  onClick={() => applyInsert('\n1. ')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='รายการตัวเลข (Numbered List)'
                >
                  <ListOrdered size={15} />
                </Button>
              </div>

              <div className='flex items-center gap-0.5'>
                <Button
                  onClick={() => applyInsert('[', '](url)')}
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='แทรกลิงก์ (Link)'
                >
                  <Link size={15} />
                </Button>
                <Button
                  onClick={() =>
                    applyTemplate('\n| หัวข้อ 1 | หัวข้อ 2 |\n| --- | --- |\n| ค่า A | ค่า B |\n')
                  }
                  disabled={disabled}
                  variant='ghost'
                  size='icon-xs'
                  className='p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='แทรกตาราง (Table)'
                >
                  <TableIcon size={15} />
                </Button>
                <Button
                  onClick={() => fileRef.current?.click()}
                  disabled={disabled || uploading}
                  variant='ghost'
                  size='sm'
                  className='inline-flex items-center gap-1.5 p-1.5 px-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                  title='แนบรูปภาพ (Image)'
                >
                  <ImageIcon size={15} />
                  {uploading && (
                    <span className='text-xs font-medium text-brand-purple'>กำลังอัปโหลด...</span>
                  )}
                </Button>
                <Label htmlFor='file-input' className='hidden'>
                  อัปโหลดรูปภาพ
                </Label>
                <Input
                  id='file-input'
                  ref={fileRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = '';
                    void onPickImage(f);
                  }}
                  aria-label='อัปโหลดรูปภาพ'
                />
              </div>

              <div className='ml-auto flex items-center'>
                <Button
                  onClick={() => openTemplate()}
                  disabled={disabled}
                  variant='outline'
                  size='sm'
                  className='inline-flex items-center gap-1.5 p-1.5 px-2.5 rounded-md border border-brand-purple/20 bg-brand-lavender text-[13px] font-medium text-brand-purple transition-colors hover:bg-brand-lavender/60 disabled:opacity-40 shadow-none'
                >
                  <LayoutTemplate size={14} />
                  เลือกเทมเพลต...
                </Button>
              </div>
            </div>

            <div className='px-3 py-2 border-b border-gray-100 bg-gray-50/60 flex flex-col gap-1 text-[11px] text-gray-500'>
              <div className='flex items-center justify-between'>
                <p>
                  <span className='mr-1 inline-flex items-center gap-1 font-semibold text-gray-700'>
                    <Lightbulb size={13} />
                    ทิปส์:
                  </span>
                  ใช้ <code>**หนา**</code>, <code>_เอียง_</code>, สร้างตารางด้วย <code>|</code>,
                  หรือเลือกเทมเพลตเพื่อประหยัดเวลา
                </p>
                <a
                  href='https://www.markdownguide.org/basic-syntax/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1 text-brand-lavender0 hover:text-brand-purple hover:underline'
                >
                  ดูไกด์ไลน์ Markdown ทั้งหมด
                </a>
              </div>
            </div>

            <Textarea
              ref={textareaRef}
              className='mb-0 block w-full resize-y border-0 px-3 pt-3 pb-0 font-mono text-sm leading-relaxed text-gray-700 outline-none'
              style={{ minHeight: `${textareaMinHeight}px` }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'พิมพ์เนื้อหาของคุณที่นี่ รองรับ Markdown...'}
              disabled={disabled}
              onFocus={focusOn}
              onBlur={focusOff}
            />
          </>
        ) : (
          <div className='px-4 py-3 min-h-[200px]'>
            {value.trim() ? (
              <MarkdownBody
                source={normalizeMarkdownContent(value)}
                className='max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]'
              />
            ) : (
              <p className='text-[13px] text-gray-400'>ยังไม่มีรายละเอียดเพิ่มเติม</p>
            )}
          </div>
        )}
      </div>

      <AppDialog
        open={isTemplateModalOpen}
        onOpenChange={(v) => {
          if (!v) closeTemplate();
        }}
        title='เลือกเทมเพลตเริ่มต้น'
        variant='center'
        size='xl'
        className='flex flex-col overflow-hidden'
        bodyClassName='p-0 flex flex-1 overflow-hidden flex-col md:flex-row min-h-[min(70vh,640px)]'
        headerClassName='bg-gray-50/50'
        overlayClassName='bg-black/60 backdrop-blur-sm'
        footerClassName='px-5 py-4 bg-gray-50/50 justify-end gap-3'
        footer={
          <>
            <Button
              onClick={() => closeTemplate()}
              variant='ghost'
              className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors'
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSelectTemplate}
              className='flex items-center gap-2 rounded-lg bg-brand-purple px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-purple/80'
            >
              <CheckCircle2 size={16} />
              นำเทมเพลตนี้ไปใช้
            </Button>
          </>
        }
      >
        <div className='hidden'>
          <LayoutTemplate size={20} className='text-brand-lavender0' />
        </div>

        <>
          <div className='w-full md:w-1/3 border-r border-gray-100 bg-gray-50/30 overflow-y-auto p-4 flex flex-col gap-3'>
            <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 px-1'>
              รูปแบบที่มีให้เลือก
            </p>
            {TEMPLATES.map((tpl, idx) => (
              <Button
                key={tpl.id}
                onClick={() => setActiveTemplateIndex(idx)}
                variant='outline'
                className={`text-left p-3 rounded-xl border transition-all duration-200 relative overflow-hidden h-auto flex-col items-start ${
                  activeTemplateIndex === idx
                    ? 'bg-brand-lavender border-brand-purple/25 ring-1 ring-brand-purple/25 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-brand-purple/20 hover:shadow-sm'
                }`}
              >
                <div className='flex justify-between items-start w-full mb-1'>
                  <h4
                    className={`text-[13px] font-medium ${
                      activeTemplateIndex === idx ? 'text-brand-purple' : 'text-gray-800'
                    }`}
                  >
                    {tpl.title}
                  </h4>
                  {activeTemplateIndex === idx && (
                    <CheckCircle2 size={16} className='ml-2 shrink-0 text-brand-lavender0' />
                  )}
                </div>
                <p
                  className={`text-[11px] font-normal leading-snug whitespace-normal ${
                    activeTemplateIndex === idx ? 'text-brand-purple/80' : 'text-gray-500'
                  }`}
                >
                  {tpl.description}
                </p>
              </Button>
            ))}
          </div>

          <div className='w-full md:w-2/3 bg-white flex flex-col overflow-hidden'>
            <div className='px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between shadow-sm z-10'>
              <span className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
                ตัวอย่างการแสดงผล (Preview)
              </span>
              <span className='text-[11px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full'>
                ทดลองอ่านได้
              </span>
            </div>
            <div className='p-6 overflow-y-auto flex-1 custom-scrollbar'>
              <MarkdownBody
                source={normalizeMarkdownContent(TEMPLATES[activeTemplateIndex].content)}
                className='max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]'
              />
            </div>
          </div>
        </>
      </AppDialog>
    </div>
  );
}
