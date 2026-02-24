import { useNavigate } from 'react-router';
import {
  ChevronRight, Bell, Wallet, Shield, HelpCircle, LogOut, Star, Package,
  FileText, Settings, User, TrendingUp, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { currentUser, orders } from '../data/mockData';

const menuSections = [
  {
    title: 'บัญชี',
    items: [
      { icon: User, label: 'ข้อมูลส่วนตัว', sub: 'แก้ไขโปรไฟล์', color: '#6C47FF', bg: '#EDE9FF' },
      { icon: Star, label: 'รีวิวของฉัน', sub: 'รีวิวที่ให้กับโรงงาน', color: '#F59E0B', bg: '#FEF3C7' },
      { icon: Bell, label: 'การแจ้งเตือน', sub: 'จัดการการแจ้งเตือน', color: '#3B82F6', bg: '#DBEAFE' },
    ],
  },
  {
    title: 'ธุรกิจ',
    items: [
      { icon: FileText, label: 'RFQ ทั้งหมด', sub: 'ดูประวัติการขอใบเสนอราคา', color: '#8B5CF6', bg: '#EDE9FF' },
      { icon: Package, label: 'คำสั่งซื้อ', sub: 'ประวัติการสั่งซื้อทั้งหมด', color: '#22C55E', bg: '#DCFCE7' },
      { icon: TrendingUp, label: 'รายงาน', sub: 'สรุปการใช้จ่าย', color: '#F97316', bg: '#FEF3C7' },
    ],
  },
  {
    title: 'อื่นๆ',
    items: [
      { icon: Shield, label: 'ความปลอดภัย', sub: 'รหัสผ่านและความเป็นส่วนตัว', color: '#6B7280', bg: '#F3F4F6' },
      { icon: HelpCircle, label: 'ช่วยเหลือ', sub: 'FAQ และติดต่อ Support', color: '#6B7280', bg: '#F3F4F6' },
      { icon: Settings, label: 'ตั้งค่า', sub: 'ภาษา, การแสดงผล', color: '#6B7280', bg: '#F3F4F6' },
    ],
  },
];

const walletTransactions = [
  { id: 't1', label: 'ชำระมัดจำ - Sheet Metal Cabinet', amount: -57500, date: '15 ม.ค. 2026', type: 'debit' },
  { id: 't2', label: 'คืนเงินจาก RFQ ยกเลิก', amount: 5000, date: '10 ม.ค. 2026', type: 'credit' },
  { id: 't3', label: 'เติมเงิน', amount: 100000, date: '5 ม.ค. 2026', type: 'credit' },
];

export function Profile() {
  const navigate = useNavigate();
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const totalSpent = orders.reduce((s, o) => s + o.depositPaid, 0);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">บัญชี</p>
            <h1 className="text-gray-900" style={{ fontWeight: 700 }}>โปรไฟล์</h1>
          </div>
          <button className="relative w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
            <Bell size={20} style={{ color: '#6C47FF' }} />
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px]"
              style={{ background: '#6C47FF', fontWeight: 700 }}
            >
              3
            </span>
          </button>
        </div>

        {/* User Card */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #8B5CF6 60%, #A78BFA 100%)' }}
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 bg-white" />
          <div className="absolute right-4 bottom-0 w-16 h-16 rounded-full opacity-15 bg-white" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={currentUser.avatar}
                alt="avatar"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30"
              />
              <div>
                <p className="text-white" style={{ fontWeight: 700 }}>{currentUser.name}</p>
                <p className="text-white/70 text-xs">{currentUser.company}</p>
                <div
                  className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full w-fit"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <span className="text-yellow-300 text-[10px]">✓</span>
                  <span className="text-white text-[10px]">Verified Member</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-white" style={{ fontWeight: 700 }}>{completedOrders}</p>
                <p className="text-white/70 text-[10px]">คำสั่งซื้อ</p>
              </div>
              <div className="w-px bg-white/30" />
              <div className="text-center">
                <p className="text-white" style={{ fontWeight: 700 }}>4.8</p>
                <p className="text-white/70 text-[10px]">คะแนน</p>
              </div>
              <div className="w-px bg-white/30" />
              <div className="text-center">
                <p className="text-white" style={{ fontWeight: 700 }}>฿{(totalSpent / 1000).toFixed(0)}K</p>
                <p className="text-white/70 text-[10px]">ใช้จ่ายรวม</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Wallet Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#EDE9FF' }}
              >
                <Wallet size={18} style={{ color: '#6C47FF' }} />
              </div>
              <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>กระเป๋าเงิน</p>
            </div>
            <button className="text-xs" style={{ color: '#6C47FF', fontWeight: 600 }}>
              เติมเงิน +
            </button>
          </div>

          <div className="mb-4">
            <p className="text-[10px] text-gray-400 mb-1">ยอดคงเหลือ</p>
            <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
              ฿{currentUser.walletBalance.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px]" style={{ color: '#F59E0B' }}>
                รอดำเนินการ: ฿{currentUser.pendingBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mb-4">
            <button
              className="flex-1 py-2.5 rounded-xl text-xs text-white"
              style={{ background: '#6C47FF', fontWeight: 600 }}
            >
              โอนเงิน
            </button>
            <button
              className="flex-1 py-2.5 rounded-xl text-xs border"
              style={{ borderColor: '#6C47FF', color: '#6C47FF', fontWeight: 600 }}
            >
              ประวัติ
            </button>
          </div>

          {/* Transactions */}
          <div className="space-y-2.5">
            <p className="text-xs text-gray-500" style={{ fontWeight: 600 }}>รายการล่าสุด</p>
            {walletTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: tx.type === 'credit' ? '#DCFCE7' : '#FEE2E2',
                    }}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft size={14} style={{ color: '#22C55E' }} />
                    ) : (
                      <ArrowUpRight size={14} style={{ color: '#EF4444' }} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-700 truncate max-w-[160px]" style={{ fontWeight: 500 }}>
                      {tx.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{tx.date}</p>
                  </div>
                </div>
                <p
                  className="text-xs shrink-0"
                  style={{
                    fontWeight: 700,
                    color: tx.type === 'credit' ? '#22C55E' : '#EF4444',
                  }}
                >
                  {tx.type === 'credit' ? '+' : ''}฿{Math.abs(tx.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider px-4 pt-3 pb-2">
              {section.title}
            </p>
            {section.items.map((item, idx) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                style={{ borderTop: idx > 0 ? '1px solid #F9FAFB' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: item.bg }}
                  >
                    <item.icon size={17} style={{ color: item.color }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        ))}

        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl py-4 shadow-sm text-sm transition-all active:scale-[0.98]"
          style={{ color: '#EF4444', fontWeight: 600 }}>
          <LogOut size={18} />
          ออกจากระบบ
        </button>

        {/* Version */}
        <p className="text-center text-[10px] text-gray-400 pb-2">
          ManuConnect v1.0.0 · สมาชิกตั้งแต่ {currentUser.memberSince}
        </p>
      </div>
    </div>
  );
}
