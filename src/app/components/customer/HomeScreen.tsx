import { Search, SlidersHorizontal, Star, MapPin, Award } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { mockFactories, mockReviews } from '../../data/mockData';

export function HomeScreen() {
  const categories = [
    { id: '1', name: 'อาหารสัตว์', icon: '🐾' },
    { id: '2', name: 'เสื้อผ้าสัตว์เลี้ยง', icon: '👕' },
    { id: '3', name: 'อาหารเสริม', icon: '💊' },
    { id: '4', name: 'แพ็กเกจจิ้ง', icon: '📦' }
  ];

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 pb-8">
        <h1 className="text-white text-2xl font-semibold mb-4">ค้นหาโรงงานของคุณ</h1>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ค้นหาโรงงาน, ประเภทสินค้า..."
              className="pl-10 bg-white"
            />
          </div>
          <Button variant="outline" size="icon" className="bg-white">
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 -mt-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-2xl">
                    {cat.icon}
                  </div>
                  <span className="text-xs text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Factories */}
      <div className="mb-6">
        <div className="px-6 mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">โรงงานแนะนำ</h2>
          <Button variant="link" className="text-blue-600 text-sm p-0 h-auto">
            ดูทั้งหมด
          </Button>
        </div>
        <div className="px-6 overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {mockFactories.map((factory) => (
              <Card key={factory.id} className="min-w-[280px] hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={factory.image}
                      alt={factory.name}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                    {factory.verified && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        <Award className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{factory.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{factory.province}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{factory.rating}</span>
                      </div>
                      {factory.lowMOQ && (
                        <Badge variant="secondary" className="text-xs">
                          MOQ ต่ำ
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {factory.certifications.map((cert) => (
                        <Badge key={cert} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="mb-6 px-6">
        <h2 className="text-lg font-semibold mb-3">รีวิวจากผู้ใช้งานจริง</h2>
        <div className="space-y-3">
          {mockReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {review.customerName.charAt(2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{review.customerName}</span>
                      <span className="text-sm text-gray-500">• {review.brandName}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">{review.review}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Near Me */}
      <div className="mb-6 px-6">
        <h2 className="text-lg font-semibold mb-3">โรงงานใกล้ฉัน</h2>
        <div className="grid grid-cols-2 gap-3">
          {mockFactories.slice(0, 2).map((factory) => (
            <Card key={factory.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3">
                <img
                  src={factory.image}
                  alt={factory.name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{factory.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{factory.province}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
