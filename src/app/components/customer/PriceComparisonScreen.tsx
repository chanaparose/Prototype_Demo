import React from 'react';
import { ArrowLeft, MessageCircle, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { mockRFQQuotesByRfqId } from '../../data/mockData';

interface PriceComparisonScreenProps {
  onBack: () => void;
  rfqId: string;
}

export function PriceComparisonScreen({ onBack, rfqId }: PriceComparisonScreenProps) {
  const quotes = mockRFQQuotesByRfqId[rfqId] ?? mockRFQQuotesByRfqId['1'];

  const comparisonRows = [
    { label: 'ราคา/ชิ้น', key: 'pricePerUnit', suffix: ' ฿' },
    { label: 'ค่าแม่พิมพ์', key: 'moldCost', suffix: ' ฿' },
    { label: 'ระยะเวลาผลิต', key: 'productionTime', suffix: '' },
    { label: 'รายละเอียด', key: 'details', suffix: '' },
    { label: 'คะแนน', key: 'rating', suffix: ' ⭐' }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-24">
      {/* 1. Header - Vibrant & Deep */}
      <div className="relative border-b border-white/10 sticky top-0 z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-white/90 hover:bg-white/10 transition-colors"
              aria-label="กลับ"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-white/70 text-xs font-bold uppercase tracking-[0.15em] block mb-0.5">
                Compare
              </span>
              <h1 className="text-xl font-bold text-white">เปรียบเทียบข้อเสนอ</h1>
              <p className="text-white/80 text-sm mt-0.5">{quotes.length} โรงงาน</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Comparison Table (Sticky Left Column) */}
      <div className="relative z-0 mt-4 mx-4">
        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide pb-2">
            <table className="w-full text-left border-collapse min-w-max">
              
              {/* Table Head: Factory Info */}
              <thead>
                <tr>
                  {/* Sticky Top-Left Corner (ว่างไว้) */}
                  <th className="sticky left-0 top-0 z-20 bg-white/95 backdrop-blur-sm border-r border-slate-100 p-4 w-[110px] min-w-[110px]">
                     {/* เว้นว่าง หรือใส่โลโก้แอปเล็กๆ */}
                  </th>
                  
                  {/* Factory Headers */}
                  {quotes.map((quote) => {
                    const isWinner = quote.isWinner;
                    return (
                      <th 
                        key={quote.id} 
                        className={`p-5 min-w-[220px] align-top relative ${
                          isWinner ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {isWinner && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                        )}
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            {isWinner && (
                              <Badge className="mb-3 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200/60 font-bold shadow-sm px-2.5 py-0.5">
                                <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                                คุ้มค่าที่สุด
                              </Badge>
                            )}
                            <h3 className="font-bold text-[15px] text-slate-800 mb-1 leading-snug whitespace-normal line-clamp-2">
                              {quote.factoryName}
                            </h3>
                          </div>
                          <div className="mt-4">
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">ยอดรวมสุทธิ</p>
                            <p className={`text-2xl font-extrabold ${isWinner ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600' : 'text-slate-900'}`}>
                              ฿{quote.totalPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body: Data Rows */}
              <tbody className="divide-y divide-slate-100/80">
                {comparisonRows.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50/50 transition-colors">
                    {/* Sticky Left Column: Labels */}
                    <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm border-r border-slate-100 p-4 w-[110px] min-w-[110px] shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                      <p className="text-[12px] font-bold text-slate-500">{row.label}</p>
                    </td>
                    
                    {/* Data Cells */}
                    {quotes.map((quote) => {
                      const value = (quote as Record<string, string | number>)[row.key];
                      const isWinner = quote.isWinner;
                      // ไฮไลต์สีเขียวถ้าเป็นราคาหรือเวลาที่ดีที่สุด (จำลองตัวอย่าง)
                      const isHighlight = row.key === 'pricePerUnit' && isWinner;

                      return (
                        <td 
                          key={`${quote.id}-${row.key}`} 
                          className={`p-4 text-[14px] font-semibold text-slate-800 ${isWinner ? 'bg-amber-50/20' : ''}`}
                        >
                          <span className={isHighlight ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md' : ''}>
                            {value}{row.suffix}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              {/* Table Footer: Action Buttons */}
              <tfoot>
                <tr>
                  <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm border-r border-slate-100 p-4 border-t border-slate-100 shadow-[4px_0_12px_rgba(0,0,0,0.02)]"></td>
                  {quotes.map((quote) => (
                    <td 
                      key={`action-${quote.id}`} 
                      className={`p-4 border-t border-slate-100 align-top ${quote.isWinner ? 'bg-amber-50/30' : ''}`}
                    >
                      <div className="space-y-2.5">
                        <Button 
                          className={`w-full h-11 rounded-xl shadow-md font-bold transition-transform active:scale-95 ${
                            quote.isWinner 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20' 
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          เลือกข้อเสนอนี้
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full h-11 rounded-xl border-slate-200 text-[#4F4F9F] hover:bg-indigo-50 font-semibold"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          แชทต่อรอง
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tfoot>
              
            </table>
          </div>
        </div>
      </div>

      {/* 3. Smart Summary Banner */}
      <div className="px-4 mt-6">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-5 shadow-sm">
           {/* Background Decoration */}
           <div className="absolute -right-4 -top-4 text-indigo-100/50">
             <Sparkles className="w-24 h-24" />
           </div>
           
           <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-bold text-indigo-900 text-[15px]">AI สรุปคำแนะนำ</h3>
            </div>
            <p className="text-[13.5px] text-indigo-900/80 leading-relaxed font-medium">
              <strong className="text-indigo-700">โรงงาน A</strong> มีราคารวมดีที่สุดและระยะเวลาผลิตเร็วที่สุด 
              แต่หากคุณต้องการประหยัดค่าแม่พิมพ์ในระยะยาว <strong className="text-indigo-700">โรงงาน C</strong> อาจเป็นตัวเลือกที่คุ้มค่ากว่า
            </p>
           </div>
        </div>
      </div>
    </div>
  );
}