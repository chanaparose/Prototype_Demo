import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

export function ExploreFooter() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 pt-12 mt-16 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-8">
        {/* Top 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div>
            <h3 className="font-bold text-[#352A55] mb-4 text-lg">ศูนย์ดูแลลูกค้า</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">ขั้นตอน "เปิดร้าน"</a></li>
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">เริ่มขายสินค้า/บริการ</a></li>
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">ติดต่อเรา</a></li>
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">ลงทะเบียนธุรกิจ</a></li>
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">ศูนย์ช่วยเหลือลูกค้า</a></li>
            </ul>
          </div>
          {/* Col 2 */}
          <div>
            <h3 className="font-bold text-[#352A55] mb-4 text-lg">หมวดหมู่บริการและสินค้า</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">โรงพยาบาลสัตว์</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">อาบน้ำตัดขน</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">รับฝากสัตว์เลี้ยง</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">โรงเรียนฝึกสอน</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">สระว่ายน้ำสุนัข</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">คาเฟ่-ร้านอาหาร</a></li>
              </ul>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">อาหารสัตว์</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">อุปกรณ์สัตว์เลี้ยง</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">ห้องน้ำและทราย</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">ทำความสะอาด</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">ชุดสัตว์เลี้ยง</a></li>
                <li><a href="#" className="hover:text-[#A020C8] transition-colors">ดูแลสุขภาพ</a></li>
              </ul>
            </div>
          </div>
          {/* Col 3 */}
          <div>
            <h3 className="font-bold text-[#352A55] mb-4 text-lg">แหล่งความรู้และคูปอง</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">คูปอง</a></li>
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">ค้นหาสถานที่และบริการ</a></li>
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">บทความ</a></li>
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">กิจกรรม</a></li>
              <li><a href="#" className="hover:text-[#A020C8] transition-colors">วิดีโอ</a></li>
            </ul>
          </div>
          {/* Col 4 */}
          <div>
            <h3 className="font-bold text-[#352A55] mb-4 text-lg">ดาวน์โหลดแอปพลิเคชัน</h3>
            <div className="flex flex-col gap-3 max-w-[160px]">
              <a href="#" className="bg-black text-white rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <div className="text-[10px] leading-tight">Download on the</div>
                  <div className="text-sm font-semibold leading-tight">App Store</div>
                </div>
              </a>
              <a href="#" className="bg-black text-white rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <div className="text-[10px] leading-tight">GET IT ON</div>
                  <div className="text-sm font-semibold leading-tight">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Middle 3 Columns (Logos & Socials) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-gray-100">
          {/* Socials */}
          <div>
            <h4 className="font-bold text-[#352A55] mb-4">ติดตามเรา</h4>
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"><span className="font-bold text-xs">LINE</span></a>
              <a href="#" className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"><Youtube size={20} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"><Instagram size={20} /></a>
            </div>
          </div>
          {/* Shipping */}
          <div>
            <h4 className="font-bold text-[#352A55] mb-4">การจัดส่ง</h4>
            <div className="flex flex-wrap items-center gap-4 opacity-70 grayscale">
              <span className="font-bold text-xl italic text-red-600">KERRY</span>
              <span className="font-bold text-xl italic text-yellow-500">FLASH</span>
              <span className="font-bold text-xl text-blue-800">EMS</span>
            </div>
          </div>
          {/* Payments */}
          <div>
            <h4 className="font-bold text-[#352A55] mb-4">ช่องทางการชำระเงิน</h4>
            <div className="flex flex-wrap items-center gap-4 opacity-70 grayscale">
              <span className="font-bold text-xl text-blue-700 italic">VISA</span>
              <span className="font-bold text-xl">Mastercard</span>
              <span className="font-bold text-xl text-blue-500">PromptPay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Purple Bar */}
      <div className="bg-[#A020C8] text-white py-4 text-sm mt-4">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>&copy; 2026 WeMake Shopping. By Digital Media Advertising Co., Ltd.</div>
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
