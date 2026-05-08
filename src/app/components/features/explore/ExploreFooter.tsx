import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

export function ExploreFooter() {
  return (
    <footer className="w-full bg-[#F2F2F2] border-t border-gray-200 pt-10 mt-12 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Col 1 */}
          <div>
            <h3 className="font-bold text-[#292259] mb-3 text-base border-b-2 border-[#A656A0] pb-1 inline-block">ศูนย์ดูแลลูกค้า</h3>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">ขั้นตอน "เปิดร้าน"</a></li>
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">เริ่มขายสินค้า/บริการ</a></li>
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">ติดต่อเรา</a></li>
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">ลงทะเบียนธุรกิจ</a></li>
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">ศูนย์ช่วยเหลือลูกค้า</a></li>
            </ul>
          </div>
          {/* Col 2 */}
          <div>
            <h3 className="font-bold text-[#292259] mb-3 text-base">หมวดหมู่บริการและสินค้า</h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs text-gray-600">
              <ul className="space-y-2.5">
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">โรงพยาบาลสัตว์</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">อาบน้ำตัดขน</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">รับฝากสัตว์เลี้ยง</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">โรงเรียนฝึกสอน</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">สระว่ายน้ำสุนัข</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">คาเฟ่-ร้านอาหาร</a></li>
              </ul>
              <ul className="space-y-2.5">
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">อาหารสัตว์</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">อุปกรณ์สัตว์เลี้ยง</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">ห้องน้ำและทราย</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">ทำความสะอาด</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">ชุดสัตว์เลี้ยง</a></li>
                <li><a href="#" className="hover:text-[#A656A0] transition-colors">ดูแลสุขภาพ</a></li>
              </ul>
            </div>
          </div>
          {/* Col 3 */}
          <div>
            <h3 className="font-bold text-[#292259] mb-3 text-base">แหล่งความรู้และคูปอง</h3>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">คูปอง</a></li>
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">ค้นหาสถานที่และบริการ</a></li>
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">บทความ</a></li>
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">กิจกรรม</a></li>
              <li><a href="#" className="hover:text-[#A656A0] transition-colors">วิดีโอ</a></li>
            </ul>
          </div>
          {/* Col 4 */}
          <div>
            <h3 className="font-bold text-[#292259] mb-3 text-base">ดาวน์โหลดแอปพลิเคชัน</h3>
            <div className="flex flex-col gap-2.5 max-w-[150px]">
              <a href="#" className="bg-black text-white rounded-lg px-2.5 py-1.5 flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <div className="text-[9px] leading-tight">Download on the</div>
                  <div className="text-xs font-semibold leading-tight">App Store</div>
                </div>
              </a>
              <a href="#" className="bg-black text-white rounded-lg px-2.5 py-1.5 flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <div className="text-[9px] leading-tight">GET IT ON</div>
                  <div className="text-xs font-semibold leading-tight">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Middle 3 Columns (Logos & Socials) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t border-gray-300">
          {/* Socials */}
          <div>
            <h4 className="font-bold text-[#292259] mb-3 text-sm">ติดตามเรา</h4>
            <div className="flex items-center gap-2.5">
              <a href="#" className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"><Facebook size={18} /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"><span className="font-bold text-[11px]">LINE</span></a>
              <a href="#" className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"><Youtube size={18} /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F28A2E] via-[#F27830] to-[#A656A0] text-white flex items-center justify-center hover:opacity-90 transition-opacity"><Instagram size={18} /></a>
            </div>
          </div>
          {/* Shipping */}
          <div>
            <h4 className="font-bold text-[#292259] mb-3 text-sm">การจัดส่ง</h4>
            <div className="flex flex-wrap items-center gap-3 opacity-70 grayscale">
              <span className="font-bold text-lg italic text-red-600">KERRY</span>
              <span className="font-bold text-lg italic text-yellow-500">FLASH</span>
              <span className="font-bold text-lg text-blue-800">EMS</span>
            </div>
          </div>
          {/* Payments */}
          <div>
            <h4 className="font-bold text-[#292259] mb-3 text-sm">ช่องทางการชำระเงิน</h4>
            <div className="flex flex-wrap items-center gap-3 opacity-70 grayscale">
              <span className="font-bold text-lg text-blue-700 italic">VISA</span>
              <span className="font-bold text-lg">Mastercard</span>
              <span className="font-bold text-lg text-blue-500">PromptPay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Purple Bar */}
      <div className="bg-[#292259] text-white py-3 text-xs mt-3">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>&copy; 2026 Tryly Shopping. By Digital Media Advertising Co., Ltd.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:underline">เงื่อนไขในการให้บริการ</a>
            <a href="#" className="hover:underline">นโยบายความปลอดภัย</a>
            <a href="#" className="hover:underline">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
