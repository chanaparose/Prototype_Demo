/**
 * FactoryNoteField
 * Shared markdown editor for factory-internal notes.
 *
 * Two modes:
 *   1. Controlled / form mode  — pass `value` + `onChange` (sync).
 *      "ตกลง" just commits the draft to the parent via onChange.
 *
 *   2. Async-save mode          — also pass `onAsyncSave`.
 *      "บันทึก" calls onAsyncSave(draft), shows loading spinner + error.
 *      onChange is still called on successful save so parent can sync state.
 *
 * Default view = MarkdownBody preview.
 * Edit mode    = Write / Preview tabs + full toolbar.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Code, Heading, Quote, Minus,
  List, ListOrdered, Link, Table as TableIcon,
  Check, Lock, Pencil, X,
} from 'lucide-react';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface FactoryNoteFieldProps {
  value: string;
  onChange: (v: string) => void;
  /** If provided, confirm button becomes an async "บันทึก" call */
  onAsyncSave?: (v: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

function normalizeMarkdown(raw: string): string {
  return raw.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').trim();
}

export function FactoryNoteField({
  value,
  onChange,
  onAsyncSave,
  disabled = false,
  className = '',
}: FactoryNoteFieldProps) {
  const isAsync = Boolean(onAsyncSave);

  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync from parent (form reset / parent re-fetch)
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Focus textarea when entering write tab
  useEffect(() => {
    if (editing && tab === 'write') textareaRef.current?.focus();
  }, [editing, tab]);

  // ── Toolbar helpers ────────────────────────────────────────────────────────
  const applyInsert = (prefix: string, suffix = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = draft.slice(s, e);
    const next = draft.slice(0, s) + prefix + selected + suffix + draft.slice(e);
    setDraft(next);
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      const pos = s === e ? s + prefix.length : s + prefix.length + selected.length;
      textareaRef.current.setSelectionRange(s === e ? pos : s + prefix.length, pos);
    });
  };

  const insertBlock = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const next = draft.slice(0, s) + text + draft.slice(s);
    setDraft(next);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(s + text.length, s + text.length);
    });
  };

  // ── Confirm / Cancel ───────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (isAsync) {
      setSaving(true);
      setError('');
      try {
        await onAsyncSave!(draft);
        onChange(draft);
        setEditing(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ';
        setError(msg);
      } finally {
        setSaving(false);
      }
    } else {
      onChange(draft);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') handleCancel();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void handleConfirm();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`rounded-lg border border-brand-purple/20 bg-brand-lavender/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className='flex items-center gap-2 px-4 py-2.5 border-b border-brand-purple/15'>
        <span className='flex flex-1 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-brand-purple'>
          <Lock size={11} />
          Note (สำหรับโรงงานเท่านั้น)
        </span>

        {!editing ? (
          !disabled ? (
            <button
              type='button'
              onClick={() => { setTab('write'); setEditing(true); }}
              className='inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-brand-purple hover:bg-brand-violet-soft transition-colors'
            >
              <Pencil size={11} /> แก้ไข
            </button>
          ) : null
        ) : (
          <div className='flex gap-1'>
            
            <button
              type='button'
              onClick={handleCancel}
              disabled={saving}
              className='inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-brand-violet-soft disabled:opacity-60 transition-colors'
            >
              <X size={11} /> ยกเลิก
            </button>
            <button
              type='button'
              onClick={() => void handleConfirm()}
              disabled={saving}
              className='inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white bg-brand-purple hover:bg-brand-purple disabled:opacity-60 transition-colors'
            >
              <Check size={11} />
              {isAsync ? (saving ? 'กำลังบันทึก…' : 'บันทึก') : 'ตกลง'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {!editing ? (
        <div className='px-4 py-3 min-h-[48px]'>
          {draft.trim() ? (
            <MarkdownBody
              source={normalizeMarkdown(draft)}
              className='max-w-none !text-[13px] text-slate-700 leading-relaxed [&_p]:!text-[13px] [&_li]:!text-[13px] [&_a]:!text-[13px] [&_blockquote]:!text-[13px] [&_h1]:!text-[14px] [&_h2]:!text-[13px] [&_h3]:!text-[13px]'
            />
          ) : (
            <p className='text-sm text-slate-400 italic'>
              {disabled ? 'ยังไม่มี note' : 'ยังไม่มี note — กด "แก้ไข" เพื่อเพิ่ม'}
            </p>
          )}
        </div>
      ) : (
        <div className='rounded-b-2xl border-t border-brand-purple/15 bg-white overflow-hidden'>
          {/* Write / Preview tabs */}
          <div className='flex items-center gap-2 px-3 pt-2 pb-2 border-b border-gray-100'>
            <Button
              type='button'
              onClick={() => setTab('write')}
              variant='outline'
              size='xs'
              className={`px-2 py-1 text-xs rounded-md border ${
                tab === 'write'
                  ? 'bg-brand-lavender border-brand-purple/20 text-brand-purple'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Write
            </Button>
            <Button
              type='button'
              onClick={() => setTab('preview')}
              variant='outline'
              size='xs'
              className={`px-2 py-1 text-xs rounded-md border ${
                tab === 'preview'
                  ? 'bg-brand-lavender border-brand-purple/20 text-brand-purple'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Preview
            </Button>
            <span className='ml-auto text-[10px] text-slate-400'>Ctrl+Enter {isAsync ? 'บันทึก' : 'ยืนยัน'}</span>
          </div>

          {tab === 'write' ? (
            <>
              {/* Toolbar */}
              <div className='px-2 py-1.5 border-b border-gray-100 flex items-center flex-wrap gap-1.5 bg-white'>
                <div className='flex items-center gap-0.5 pr-2 border-r border-gray-200'>
                  <ToolBtn title='ตัวหนา' onClick={() => applyInsert('**', '**')}><Bold size={14} /></ToolBtn>
                  <ToolBtn title='ตัวเอียง' onClick={() => applyInsert('_', '_')}><Italic size={14} /></ToolBtn>
                  <ToolBtn title='Inline Code' onClick={() => applyInsert('`', '`')}><Code size={14} /></ToolBtn>
                </div>
                <div className='flex items-center gap-0.5 pr-2 border-r border-gray-200'>
                  <ToolBtn title='หัวข้อ' onClick={() => insertBlock('\n### ')}><Heading size={14} /></ToolBtn>
                  <ToolBtn title='Blockquote' onClick={() => insertBlock('\n> ')}><Quote size={14} /></ToolBtn>
                  <ToolBtn title='เส้นคั่น' onClick={() => insertBlock('\n\n---\n\n')}><Minus size={14} /></ToolBtn>
                </div>
                <div className='flex items-center gap-0.5 pr-2 border-r border-gray-200'>
                  <ToolBtn title='Bullet List' onClick={() => insertBlock('\n- ')}><List size={14} /></ToolBtn>
                  <ToolBtn title='Numbered List' onClick={() => insertBlock('\n1. ')}><ListOrdered size={14} /></ToolBtn>
                </div>
                <div className='flex items-center gap-0.5'>
                  <ToolBtn title='ลิงก์' onClick={() => applyInsert('[', '](url)')}><Link size={14} /></ToolBtn>
                  <ToolBtn title='ตาราง' onClick={() => insertBlock('\n| หัวข้อ 1 | หัวข้อ 2 |\n| --- | --- |\n| ค่า A | ค่า B |\n')}><TableIcon size={14} /></ToolBtn>
                </div>
              </div>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={5}
                placeholder='พิมพ์ note ของโรงงาน รองรับ Markdown…'
                className='block w-full resize-y border-0 px-3 pt-3 pb-2 font-mono text-sm leading-relaxed text-gray-700 outline-none focus-visible:ring-0 min-h-[120px]'
              />
            </>
          ) : (
            <div className='px-4 py-3 min-h-[100px]'>
              {draft.trim() ? (
                <MarkdownBody
                  source={normalizeMarkdown(draft)}
                  className='max-w-none !text-[13px] text-slate-700 leading-relaxed [&_p]:!text-[13px] [&_li]:!text-[13px] [&_a]:!text-[13px] [&_blockquote]:!text-[13px] [&_h1]:!text-[14px] [&_h2]:!text-[13px] [&_h3]:!text-[13px]'
                />
              ) : (
                <p className='text-sm text-slate-400'>ยังไม่มีเนื้อหา</p>
              )}
            </div>
          )}

          {error ? (
            <p className='px-4 pb-2 text-xs text-red-600'>{error}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Small toolbar button helper ────────────────────────────────────────────
function ToolBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      title={title}
      onClick={onClick}
      className='p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors'
    >
      {children}
    </button>
  );
}
