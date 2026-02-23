import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Package,
  DollarSign,
  FileText,
  ImagePlus,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { mockFactories } from '../../data/mockData';

const RFQ_LABELS = Array.from(
  new Set(mockFactories.map((f) => f.category))
).sort();

interface CreateRFQScreenProps {
  onBack: () => void;
  onSubmit?: (data: CreateRFQFormData) => void;
}

export interface CreateRFQFormData {
  label: string;
  title: string;
  quantity: number;
  budget: number;
  details: string;
  refImages: string[];
}

export function CreateRFQScreen({ onBack, onSubmit }: CreateRFQScreenProps) {
  const [label, setLabel] = useState<string>('');
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [budget, setBudget] = useState<number>(0);
  const [details, setDetails] = useState('');
  const [refImages, setRefImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setRefImages((prev) => (prev.length >= 4 ? prev : [...prev, dataUrl]));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const data: CreateRFQFormData = {
      label: label || RFQ_LABELS[0],
      title: title || 'คำขอใบเสนอราคา',
      quantity: quantity || 1,
      budget: budget || 0,
      details: details.trim(),
      refImages,
    };
    onSubmit?.(data);
    onBack();
  };

  const canSubmit =
    (label || RFQ_LABELS[0]) &&
    (quantity > 0 && budget >= 0) &&
    details.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header - ธีมเด่น ทันสมัย */}
      <div className="relative border-b border-white/10 sticky top-0 z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-10%] right-[-5%] w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-white/90 hover:bg-white/10 transition-colors"
              aria-label="กลับ"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="text-white/90 text-sm font-semibold">
                สร้างคำขอใหม่
              </span>
            </div>
            <div className="w-10" />
          </div>
          <div className="mt-2">
            <span className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] block mb-0.5">
              Request for Quote
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              เขียนใบเสนอราคา
            </h1>
            <p className="text-white/80 text-sm mt-1">
              กรอกข้อมูลส่งไปยังโรงงานในหมวดที่เลือก
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        className="px-4 pt-6 space-y-6"
      >
        {/* เลือก Label / หมวดหมู่ */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-purple-100">
                <Package className="w-4 h-4 text-[#4F4F9F]" />
              </div>
              <Label className="text-slate-800 font-semibold">
                หมวดหมู่ส่งถึงโรงงาน
              </Label>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              เลือกประเภทสินค้า/บริการ ที่ต้องการให้โรงงานในหมวดนี้รับคำขอ
            </p>
            <div className="flex flex-wrap gap-2">
              {RFQ_LABELS.map((cat) => {
                const isSelected = label === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLabel(cat)}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${isSelected
                        ? 'bg-[#4F4F9F] text-white shadow-md ring-2 ring-[#4F4F9F]/30'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ชื่อคำขอ (optional but nice) */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <Label htmlFor="rfq-title" className="text-slate-800 font-semibold flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              ชื่อคำขอ (ถ้ามี)
            </Label>
            <Input
              id="rfq-title"
              placeholder="เช่น ขนมสุนัข Freeze Dried สูตรตับไก่"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-slate-200 h-11"
            />
          </CardContent>
        </Card>

        {/* จำนวน + งบประมาณ */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rfq-qty" className="text-slate-800 font-semibold flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  จำนวน (ชิ้น)
                </Label>
                <Input
                  id="rfq-qty"
                  type="number"
                  min={1}
                  placeholder="0"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
              <div>
                <Label htmlFor="rfq-budget" className="text-slate-800 font-semibold flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  งบประมาณ (บาท)
                </Label>
                <Input
                  id="rfq-budget"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={budget || ''}
                  onChange={(e) => setBudget(Number(e.target.value) || 0)}
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* รายละเอียด */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <Label htmlFor="rfq-details" className="text-slate-800 font-semibold flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              รายละเอียดที่ต้องการให้โรงงานทราบ
            </Label>
            <p className="text-xs text-slate-500 mb-2">
              ระบุสเปก ขนาด วัสดุ มาตรฐาน หรือเงื่อนไขอื่นๆ
            </p>
            <Textarea
              id="rfq-details"
              placeholder="เช่น ต้องการขนมสุนัขฟรีซดราย สูตรตับไก่แท้ ไม่เค็ม ไม่มีสารกันเสีย บรรจุถุงซิปล็อค ขนาด 50g/ถุง ต้องมีใบรับรอง อย."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="rounded-xl border-slate-200 min-h-[120px] resize-y"
            />
          </CardContent>
        </Card>

        {/* ภาพอ้างอิง */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-100">
                <ImagePlus className="w-4 h-4 text-amber-700" />
              </div>
              <Label className="text-slate-800 font-semibold">
                ภาพอ้างอิงให้โรงงาน
              </Label>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              อัปโหลดรูปสินค้า/ดีไซน์ที่ต้องการ (สูงสุด 4 รูป)
            </p>

            <div className="flex flex-wrap gap-3">
              {refImages.map((src, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm"
                >
                  <img
                    src={src}
                    alt={`อ้างอิง ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                    aria-label="ลบรูป"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {refImages.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-100 hover:border-[#4F4F9F]/40 hover:text-[#4F4F9F] transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[10px] font-medium">เพิ่มรูป</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </CardContent>
        </Card>

        {/* ปุ่มส่ง */}
        <div className="pt-2 pb-4">
          <Button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:opacity-95 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:shadow-none"
          >
            <Send className="w-5 h-5 mr-2" />
            ส่งคำขอไปยังโรงงาน
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
