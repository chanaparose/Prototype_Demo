import { Search, SlidersHorizontal, Bell, MapPin, Award, Star } from 'lucide-react';
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
      {/* --- Premium Header Section --- */}
      <div className="relative pt-12 pb-12 px-6 overflow-hidden">
        {/* Premium Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900"></div>
        
        {/* Decorative Blur Spheres (ลูกเล่นวงกลมฟุ้งๆ) */}
        <div className="absolute top-[-10%] left-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          {/* Top Row: Title & Notification */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col">
              <span className="text-blue-100/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                Premium Sourcing
              </span>
              <h1 className="text-3xl font-bold text-white leading-tight">
                Discover Your<br />
                Next <span className="text-blue-300">Partner</span>
              </h1>
            </div>
            
            {/* Notification Button */}
            <button className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300">
              <Bell className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar Group */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาโรงงาน, ประเภทสินค้า..."
              className="w-full h-14 bg-white/95 backdrop-blur-sm border-none rounded-2xl pl-12 pr-14 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400 shadow-2xl shadow-blue-900/20 transition-all"
            />
            {/* Filter Button inside Search Bar */}
            <button className="absolute inset-y-2 right-2 px-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-colors flex items-center justify-center shadow-lg shadow-blue-600/30">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories (ปรับ -mt ให้ลอยขึ้นมาทับ Header เล็กน้อย) */}
      <div className="px-6 -mt-6 mb-8 relative z-20">
        <Card className="border-none shadow-xl shadow-slate-200/60 rounded-3xl">
          <CardContent className="p-5">
            <div className="grid grid-cols-4 gap-2">
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
