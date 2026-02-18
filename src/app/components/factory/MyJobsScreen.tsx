import { Calendar, Upload, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { mockJobs } from '../../data/mockData';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function MyJobsScreen() {
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      molding: 'กำลังขึ้นรูป',
      packaging: 'กำลังบรรจุ',
      qc: 'ตรวจสอบคุณภาพ',
      shipping: 'เตรียมจัดส่ง'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      molding: 'bg-blue-500',
      packaging: 'bg-purple-500',
      qc: 'bg-orange-500',
      shipping: 'bg-green-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold">งานของฉัน</h1>
        </div>
      </div>

      <Tabs defaultValue="production" className="p-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="production">กำลังผลิต</TabsTrigger>
          <TabsTrigger value="delivered">ส่งมอบแล้ว</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          {mockJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 border-b">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{job.customerName}</span>
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusText(job.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    กำหนดส่ง: {job.dueDate}
                  </p>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex gap-4 mb-4">
                    {job.imageUrl && (
                      <img
                        src={job.imageUrl}
                        alt={job.productName}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">{job.productName}</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          ความคืบหน้า: {job.progress}%
                        </p>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1 bg-green-600">
                          <Upload className="w-4 h-4 mr-2" />
                          อัปเดตสถานะ
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>อัปเดตความคืบหน้า</DialogTitle>
                          <DialogDescription>
                            เลือกสถานะใหม่และอัปโหลดรูปภาพเพื่อแจ้งให้ลูกค้าทราบ
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>สถานะ</Label>
                            <Select defaultValue={job.status}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="molding">กำลังขึ้นรูป</SelectItem>
                                <SelectItem value="packaging">กำลังบรรจุ</SelectItem>
                                <SelectItem value="qc">ตรวจสอบคุณภาพ</SelectItem>
                                <SelectItem value="shipping">เตรียมจัดส่ง</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>อัปโหลดรูปภาพ *</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดรูปภาพ</p>
                              <p className="text-xs text-gray-500 mt-1">JPG, PNG (สูงสุด 5MB)</p>
                            </div>
                          </div>
                          <Button className="w-full bg-green-600">
                            ยืนยันการอัปเดต
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      แชท
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4">
          <div className="text-center py-12 text-gray-500">
            <p>ยังไม่มีงานที่ส่งมอบแล้ว</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
