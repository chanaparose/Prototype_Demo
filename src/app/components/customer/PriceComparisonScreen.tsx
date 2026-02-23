import React from 'react';
import { ArrowLeft, MessageCircle, Trophy } from 'lucide-react';
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
    { label: 'ราคา/ชิ้น', key: 'pricePerUnit', suffix: ' บาท' },
    { label: 'ค่าแม่พิมพ์', key: 'moldCost', suffix: ' บาท' },
    { label: 'ระยะเวลาผลิต', key: 'productionTime', suffix: '' },
    { label: 'รายละเอียดเพิ่มเติม', key: 'details', suffix: '' },
    { label: 'คะแนนโรงงาน', key: 'rating', suffix: ' ⭐' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-white font-semibold text-lg">เปรียบเทียบข้อเสนอ</h1>
            <p className="text-blue-100 text-sm">{quotes.length} โรงงาน</p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="p-4">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Factory Headers */}
            <div className="flex gap-2 mb-4">
              <div className="w-32 flex-shrink-0" /> {/* Spacer for row labels */}
              {quotes.map((quote) => (
                <Card key={quote.id} className="flex-1 min-w-[200px] relative">
                  <CardContent className="p-3">
                    {quote.isWinner && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-yellow-500">
                          <Trophy className="w-3 h-3 mr-1" />
                          Best
                        </Badge>
                      </div>
                    )}
                    <h3 className="font-semibold text-sm mb-1">{quote.factoryName}</h3>
                    <p className="text-lg font-bold text-green-600">
                      ฿{quote.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">ยอดรวม</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison Rows */}
            <div className="space-y-2">
              {comparisonRows.map((row) => (
                <div key={row.key} className="flex gap-2">
                  <div className="w-32 flex-shrink-0">
                    <Card className="h-full">
                      <CardContent className="p-3 flex items-center">
                        <p className="text-sm font-medium text-gray-700">{row.label}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {quotes.map((quote) => (
                    <Card key={quote.id} className="flex-1 min-w-[200px]">
                      <CardContent className="p-3 flex items-center justify-center">
                        <p className="text-sm font-medium text-center">
                          {(quote as Record<string, string | number>)[row.key]}{row.suffix}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <div className="w-32 flex-shrink-0" />
              {quotes.map((quote) => (
                <div key={quote.id} className="flex-1 min-w-[200px] space-y-2">
                  <Button className="w-full bg-blue-600">
                    รับข้อเสนอ
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    แชทกับโรงงาน
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 mt-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">💡 คำแนะนำ</h3>
            <p className="text-sm text-gray-700">
              โรงงาน A มีราคารวมดีที่สุดและระยะเวลาผลิตเร็วที่สุด 
              แต่หากคุณต้องการประหยัดค่าแม่พิมพ์ โรงงาน C อาจเป็นตัวเลือกที่ดี
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
