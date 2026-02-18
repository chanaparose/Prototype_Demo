import { ArrowDownLeft, ArrowUpRight, Wallet, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function WalletScreen() {
  const availableBalance = 45000;
  const pendingBalance = 30000;

  const transactions = [
    {
      id: '1',
      type: 'income',
      description: 'รับชำระงวดที่ 2 - ขนมสุนัข Freeze Dried',
      amount: 12500,
      status: 'completed',
      date: '2026-02-15 14:30'
    },
    {
      id: '2',
      type: 'income',
      description: 'รับชำระงวดที่ 1 - ขนมแมวเลีย',
      amount: 15000,
      status: 'completed',
      date: '2026-02-10 11:20'
    },
    {
      id: '3',
      type: 'withdrawal',
      description: 'ถอนเงินเข้าบัญชี xxx-x-x1234-x',
      amount: -20000,
      status: 'completed',
      date: '2026-02-08 09:15'
    },
    {
      id: '4',
      type: 'income',
      description: 'รับชำระงวดที่ 2 - อกไก่อบแห้ง',
      amount: 8000,
      status: 'pending',
      date: '2026-02-16 16:45'
    }
  ];

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 pb-8">
        <h1 className="text-white text-xl font-semibold mb-6">กระเป๋าเงิน</h1>
        
        {/* Balance Cards */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ยอดเงินถอนได้</p>
                    <p className="text-2xl font-semibold text-green-600">
                      ฿{availableBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button className="bg-green-600">
                  ถอนเงิน
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ยอดเงินรอเคลียร์</p>
                  <p className="text-xl font-semibold text-orange-600">
                    ฿{pendingBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">เงินมัดจำที่รอผลิตเสร็จ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-6 -mt-4">
        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-600 mb-3">ประวัติธุรกรรม</h2>
        </div>

        <div className="space-y-3">
          {transactions.map((transaction) => {
            const isIncome = transaction.type === 'income';
            const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
            
            return (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isIncome ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">
                            {transaction.description}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.date}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p
                            className={`font-semibold ${
                              isIncome ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isIncome ? '+' : ''}
                            {transaction.amount.toLocaleString()} THB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <Badge
                          variant={
                            transaction.status === 'completed'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {transaction.status === 'completed' && 'เสร็จสิ้น'}
                          {transaction.status === 'pending' && 'รอดำเนินการ'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 mt-6">
        <h2 className="text-sm font-medium text-gray-600 mb-3">สรุปรายได้เดือนนี้</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-green-600">+฿125,000</p>
              <p className="text-xs text-gray-600 mt-1">รายรับ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-blue-600">18</p>
              <p className="text-xs text-gray-600 mt-1">ธุรกรรม</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
