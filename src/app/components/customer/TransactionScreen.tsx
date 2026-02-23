import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Download, Wallet, Plus } from 'lucide-react';
import { motion } from 'framer-motion'; // แก้จาก 'motion/react' เป็น 'framer-motion'
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { mockTransactions } from '../../data/mockData';

export function TransactionScreen() {
  const totalBalance = 5000;

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* 1. Header เลื่อนไปกับหน้าจอได้เหมือน HomeScreen */}
      <div className="relative pt-0 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-32 h-32 bg-[#4F4F9F]/50 rounded-full blur-2xl" />
        <div className="relative z-10 pt-6 pb-2 flex items-center justify-between">
          <div>
            <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest block mb-1">
              My Wallet
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">ประวัติธุรกรรม</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Wallet className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* 2. Wallet Balance Card (เลื่อนตามจอ เหมือนส่วนลดใน HomeScreen) */}
      <div className="px-4 -mt-2 mb-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="bg-white rounded-[24px] p-5 shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">ยอดเงินคงเหลือ</p>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold text-slate-800 tracking-tight">
                  ฿{totalBalance.toLocaleString()}
                </span>
                <span className="text-slate-400 font-medium text-sm ml-1">.00</span>
              </div>
              <Button
                className="rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/20 px-5 h-11 gap-2 transition-transform active:scale-95 text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                เติมเงิน
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Transaction List */}
      <div className="px-4 pt-0">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">รายการล่าสุด</h2>
          <button className="text-[11px] font-semibold text-[#4F4F9F] hover:text-[#3E3F7F]">
            ดูทั้งหมด
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0.95, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
          className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden"
        >
          {mockTransactions.map((transaction, index) => {
            const isNegative = transaction.amount < 0;
            const Icon = isNegative ? ArrowUpRight : ArrowDownLeft;
            const isLast = index === mockTransactions.length - 1;

            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03, ease: [0.33, 1, 0.68, 1] }}
              >
                {/* เปลี่ยนจาก Card แยกแต่ละอัน เป็น Row ที่มี Border ขั้นตรงกลาง */}
                <div className={`p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors active:bg-slate-100 ${!isLast ? 'border-b border-slate-100' : ''}`}>
                  {/* Icon - ขนาดเท่า ProfileScreen (w-11 h-11) */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      isNegative
                        ? 'bg-rose-50 text-rose-500'
                        : 'bg-emerald-50 text-emerald-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content - ฟอนต์เท่า ProfileScreen (text-sm สำหรับ title, text-xs สำหรับ subtitle) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm text-slate-800 truncate">
                        {transaction.description}
                      </h3>
                      <p
                        className={`text-sm font-bold shrink-0 ${
                          isNegative ? 'text-slate-800' : 'text-emerald-600'
                        }`}
                      >
                        {isNegative ? '' : '+'}{transaction.amount.toLocaleString()} ฿
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500 mt-0.5">{transaction.date}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0 h-5 ${
                              transaction.status === 'success'
                                ? 'text-emerald-600 border-emerald-200 bg-emerald-50/50'
                                : transaction.status === 'pending'
                                ? 'text-amber-600 border-amber-200 bg-amber-50/50'
                                : 'text-rose-600 border-rose-200 bg-rose-50/50'
                            }`}
                        >
                          {transaction.status === 'success' && 'สำเร็จ'}
                          {transaction.status === 'pending' && 'รอดำเนินการ'}
                          {transaction.status === 'failed' && 'ล้มเหลว'}
                        </Badge>
                        {transaction.status === 'success' && (
                          <button
                            className="p-1.5 text-slate-400 hover:text-[#4F4F9F] hover:bg-slate-100 rounded-full transition-colors"
                            title="ดาวน์โหลดใบเสร็จ"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}