import { ArrowLeft, Plus, Trash2, Send } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface CreateBOQScreenProps {
  onBack: () => void;
  customerName: string;
}

interface BOQItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export function CreateBOQScreen({ onBack, customerName }: CreateBOQScreenProps) {
  const [items, setItems] = useState<BOQItem[]>([
    { id: '1', name: 'ค่าผลิตขนมแมวเลีย (500 ชิ้น)', unitPrice: 30, quantity: 500, total: 15000 }
  ]);
  const [paymentTerm, setPaymentTerm] = useState('50');
  const [message, setMessage] = useState('');

  const addItem = () => {
    const newItem: BOQItem = {
      id: Date.now().toString(),
      name: '',
      unitPrice: 0,
      quantity: 1,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BOQItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'unitPrice' || field === 'quantity') {
            updated.total = Number(updated.unitPrice) * Number(updated.quantity);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const depositAmount = (subtotal * Number(paymentTerm)) / 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-white font-semibold">ส่งใบเสนอราคา</h1>
            <p className="text-green-100 text-sm">ให้ {customerName}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* BOQ Items */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">รายการค่าใช้จ่าย (BOQ)</h3>
              <Button size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มรายการ
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">รายการที่ {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs">ชื่อรายการ</Label>
                    <Input
                      placeholder="เช่น ค่าผลิต, ค่าแม่พิมพ์, ค่าจัดส่ง"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">ราคาต่อหน่วย (บาท)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">จำนวน</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-600">รวม</p>
                    <p className="text-lg font-semibold text-green-600">
                      ฿{item.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">เงื่อนไขการชำระเงิน</h3>
            <Label className="text-xs mb-2 block">เลือกเงื่อนไข</Label>
            <Select value={paymentTerm} onValueChange={setPaymentTerm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">มัดจำ 50%</SelectItem>
                <SelectItem value="30">มัดจำ 30%</SelectItem>
                <SelectItem value="100">จ่ายเต็มจำนวน</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">สรุปใบเสนอราคา</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-700">ยอดรวม</span>
                <span className="font-semibold">฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-green-700">
                  มัดจำ {paymentTerm}%
                </span>
                <span className="font-bold text-green-600">
                  ฿{depositAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm mb-2 block">ข้อความถึงลูกค้า (ไม่บังคับ)</Label>
            <Textarea
              placeholder="เช่น ราคานี้รวมแพ็กเกจจิ้งแล้วครับ"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button className="w-full bg-green-600 hover:bg-green-700 h-12">
          <Send className="w-5 h-5 mr-2" />
          ส่งใบเสนอราคา
        </Button>
      </div>
    </div>
  );
}
