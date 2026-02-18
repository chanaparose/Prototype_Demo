import { ArrowUpRight, ArrowDownLeft, Download, Wallet } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { mockTransactions } from '../../data/mockData';

export function TransactionScreen() {
  const totalBalance = 5000;

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 pb-8">
        <h1 className="text-white text-xl font-semibold mb-4">ประวัติธุรกรรม</h1>
        
        {/* Wallet Balance */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ยอดเงินคงเหลือ</p>
                  <p className="text-2xl font-semibold">
                    ฿{totalBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button size="sm">
                เติมเงิน
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <div className="px-6 -mt-4">
        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-600 mb-3">รายการทั้งหมด</h2>
        </div>

        <div className="space-y-3">
          {mockTransactions.map((transaction) => {
            const isNegative = transaction.amount < 0;
            const Icon = isNegative ? ArrowUpRight : ArrowDownLeft;
            
            return (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isNegative ? 'bg-red-100' : 'bg-green-100'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isNegative ? 'text-red-600' : 'text-green-600'
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
                              isNegative ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {isNegative ? '' : '+'}
                            {transaction.amount.toLocaleString()} THB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <Badge
                          variant={
                            transaction.status === 'success'
                              ? 'default'
                              : transaction.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-xs"
                        >
                          {transaction.status === 'success' && 'สำเร็จ'}
                          {transaction.status === 'pending' && 'รอดำเนินการ'}
                          {transaction.status === 'failed' && 'ล้มเหลว'}
                        </Badge>
                        
                        {transaction.status === 'success' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-blue-600"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            <span className="text-xs">ใบเสร็จ</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
