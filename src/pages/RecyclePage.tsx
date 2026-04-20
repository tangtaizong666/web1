import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Navigation2,
  Calendar,
  Clock,
  Info,
  Map as MapIcon,
  Search,
  LoaderCircle,
  Sparkles,
  Leaf,
  Recycle,
  Heart,
} from 'lucide-react';
import RecycleMapModal, {
  type MapLocation,
  type RecycleBin,
} from '../components/RecycleMapModal';
import { DEFAULT_MAP_LOCATION, RECYCLE_BIN_BLUEPRINTS } from '../data/recycle';

const CLOTHING_TYPES = ["上衣", "裤装", "裙装", "外套", "鞋履包袋", "旧床单/其他面料"];

const CONDITIONS = [
  { 
    level: "S级", desc: "全新未穿/带吊牌护袋", minPts: 80, maxPts: 120, 
    bgClass: "bg-[#F4F0E8]", 
    icon: Sparkles 
  },
  { 
    level: "A级", desc: "极轻度使用无瑕疵", minPts: 40, maxPts: 70, 
    bgClass: "bg-[#EAE3D5]", 
    icon: Leaf 
  },
  { 
    level: "B级", desc: "正常使用轻微褪色", minPts: 15, maxPts: 30, 
    bgClass: "bg-[#DED5C3]", 
    icon: Heart 
  },
  { 
    level: "C级", desc: "破损/污渍/严重变形", minPts: 5, maxPts: 10, 
    bgClass: "bg-[#D3C7AE]", 
    icon: Recycle 
  },
];

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type NominatimReverseResult = {
  display_name?: string;
};

type LocateTarget = 'dropoff' | 'pickup';

export default function RecyclePage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'dropoff' | 'pickup'>('dropoff');
  const [showMap, setShowMap] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [mapLocation, setMapLocation] = useState<MapLocation | null>(null);
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const [locationError, setLocationError] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [clothingType, setClothingType] = useState(CLOTHING_TYPES[0]);
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState(CONDITIONS[1].level);

  const selectedCond = CONDITIONS.find(c => c.level === condition)!;
  const minPoints = selectedCond.minPts * qty;
  const maxPoints = selectedCond.maxPts * qty;
  const activeLocation = mapLocation ?? userLocation ?? DEFAULT_MAP_LOCATION;
  const nearbyBins = useMemo(() => buildNearbyBins(activeLocation), [activeLocation]);
  const availableBins = nearbyBins.filter((bin) => bin.status === 'available');
  const nearestAvailableBin = availableBins[0] ?? nearbyBins[0];

  const handleSearchLocation = async () => {
    const query = addressSearch.trim();

    if (!query) {
      setLocationError('请先输入小区、街道、校园或回收箱附近的位置。');
      setShowMap(true);
      return;
    }

    setIsSearchingLocation(true);
    setLocationError('');

    try {
      const result = await geocodeLocation(query);
      setMapLocation(result);
      setAddressSearch(result.label);
      setShowMap(true);
    } catch (error) {
      setLocationError(getErrorMessage(error, '没有找到这个位置，请换一个更具体的关键词。'));
      setShowMap(true);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleOpenMap = async () => {
    if (addressSearch.trim()) {
      await handleSearchLocation();
      return;
    }

    setLocationError('');
    setShowMap(true);
  };

  const handleAutoLocate = (target: LocateTarget = 'dropoff') => {
    if (!navigator.geolocation) {
      setLocationError('当前浏览器不支持定位功能，请先手动输入位置。');
      if (target === 'dropoff') {
        setShowMap(true);
      }
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let label = `当前位置 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

        try {
          label = await reverseGeocodeLocation(latitude, longitude);
        } catch {
          // Reverse geocoding failure should not block direct positioning.
        }

        const nextLocation: MapLocation = {
          lat: latitude,
          lng: longitude,
          label,
          source: 'device',
        };

        setUserLocation(nextLocation);
        setMapLocation(nextLocation);

        if (target === 'dropoff') {
          setAddressSearch(label);
          setShowMap(true);
        } else {
          setPickupAddress(label);
        }

        setIsLocating(false);
      },
      (error) => {
        setLocationError(getGeolocationErrorMessage(error));
        if (target === 'dropoff') {
          setShowMap(true);
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F5EE] relative overflow-hidden font-sans selection:bg-[#B58B66] selection:text-[#F8F5EE]">
      {/* Warm Tea Aesthetic Background Elements */}
      <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-[#CDA885]/30 to-transparent blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-[20%] -right-32 w-[600px] h-[600px] bg-[#BB9D7E]/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Subtle noisy overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} 
      />

      <div className="pt-8 px-6 md:px-12 lg:px-20 pb-32 relative z-10">
        {/* Top Nav */}
        <nav className="mb-12 flex justify-between items-center max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#7F6B58] hover:text-[#9A6D46] transition-colors font-serif italic text-lg shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" /> 返回首页
          </button>
          <div className="font-serif italic text-xl tracking-widest text-[#4A3D30] border border-[#DECFBE] rounded-full px-5 py-1.5 bg-white/40 backdrop-blur-sm">
            Rennale Renuelly
          </div>
        </nav>

        <main className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          {/* Left Column - Retrieval Method */}
          <div className="w-full lg:w-1/2 space-y-10">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-serif text-[#362A1F] tracking-wider drop-shadow-sm">
                归还流转
              </h1>
              <p className="text-[#6C5B49] font-light leading-relaxed text-lg max-w-md">
                为旧衣物寻找新归宿。如同冲泡一壶散发着醇香的秋茶，静待新生的芬芳。您可以选择查找附近的终端，或预约上门。
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-1.5 bg-[#EAE3D4]/60 rounded-full w-fit backdrop-blur-md border border-[#E0D5C1] shadow-inner">
                 <button 
                     onClick={() => setMethod('dropoff')}
                     className={`px-8 py-3 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${method === 'dropoff' ? 'bg-[#986E4B] text-[#FDFBF7] shadow-md' : 'text-[#847463] hover:text-[#4A3D30]'}`}
                 >
                     智能箱投递
                 </button>
                 <button 
                     onClick={() => setMethod('pickup')}
                     className={`px-8 py-3 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${method === 'pickup' ? 'bg-[#986E4B] text-[#FDFBF7] shadow-md' : 'text-[#847463] hover:text-[#4A3D30]'}`}
                 >
                     预约上门回收
                 </button>
            </div>

            {/* Form Content */}
            <div className="h-[300px]">
              <AnimatePresence mode="wait">
                 {method === 'dropoff' ? (
                     <motion.div 
                       key="dropoff"
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 10 }}
                       transition={{ duration: 0.3 }}
                       className="space-y-6"
                     >
                         <div className="space-y-4">
                             <label className="text-xs text-[#986E4B] font-bold uppercase tracking-wider block">Find Bin / 查找附近的智能箱</label>
                             <div className="bg-[#FDFBF7] border border-[#DECFBE] rounded-2xl overflow-hidden focus-within:border-[#986E4B] transition-colors shadow-sm">
                                   <input 
                                     type="text" 
                                     placeholder="输入小区或街道名称..." 
                                    value={addressSearch}
                                    onChange={(e) => setAddressSearch(e.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') {
                                        event.preventDefault();
                                        void handleSearchLocation();
                                      }
                                    }}
                                     className="w-full min-w-0 py-4 px-5 outline-none text-[#362A1F] placeholder:text-[#BAAFA0] bg-transparent" 
                                   />
                                   <div className="grid grid-cols-2 border-t border-[#DECFBE]">
                                     <button
                                       onClick={() => void handleSearchLocation()}
                                       disabled={isSearchingLocation}
                                       className="px-4 py-3.5 text-[#986E4B] hover:text-[#6C4B30] flex items-center justify-center gap-2 text-sm font-medium bg-[#F4F0E8] transition-colors disabled:opacity-60 disabled:cursor-wait"
                                     >
                                       {isSearchingLocation ? (
                                         <LoaderCircle className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Search className="w-4 h-4" />
                                      )}
                                      搜索位置
                                    </button>
                                     <button
                                       onClick={() => handleAutoLocate('dropoff')}
                                       disabled={isLocating}
                                       className="px-4 py-3.5 text-[#986E4B] hover:text-[#6C4B30] flex items-center justify-center gap-2 text-sm font-medium border-l border-[#DECFBE] bg-[#F4F0E8] transition-colors disabled:opacity-60 disabled:cursor-wait"
                                     >
                                       {isLocating ? (
                                         <LoaderCircle className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Navigation2 className="w-4 h-4" />
                                      )}
                                      自动定位
                                    </button>
                                  </div>
                             </div>
                         </div>

                         <div className="space-y-2">
                           <div className="text-sm text-[#6C5B49]">
                             当前地图中心: <span className="font-medium text-[#362A1F]">{activeLocation.label}</span>
                           </div>
                           {locationError ? (
                             <div className="text-sm text-[#A25344] bg-[#F8E5DE] border border-[#EBCABE] rounded-2xl px-4 py-3">
                               {locationError}
                             </div>
                           ) : null}
                         </div>

                          <div className="bg-[#EAE3D4] text-[#4A3D30] rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm mt-8 border border-[#DFD3BF] relative overflow-hidden">
                             <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                                <Leaf className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8 text-[#986E4B]" />
                             </div>
                             <div className="relative z-10">
                                 <h4 className="font-serif italic text-xl mb-2 tracking-wide text-[#362A1F]">
                                   周边共有 {nearbyBins.length} 个回收点，其中 {availableBins.length} 个可投递
                                 </h4>
                                 <p className="text-[#7F6B58] text-sm font-light">
                                   最近的回收箱约 {nearestAvailableBin ? formatDistance(nearestAvailableBin.distanceMeters) : '暂无数据'}
                                 </p>
                             </div>
                             <button 
                                onClick={() => void handleOpenMap()}
                                className="bg-[#FDFBF7] border border-[#DECFBE] text-[#986E4B] px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#986E4B] hover:text-[#FDFBF7] transition-colors shrink-0 shadow-sm relative z-10"
                             >
                                 <MapIcon className="w-4 h-4" /> 打开地图
                             </button>
                         </div>
                     </motion.div>
                 ) : (
                     <motion.div 
                       key="pickup"
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 10 }}
                       transition={{ duration: 0.3 }}
                       className="space-y-6"
                     >
                           <div className="space-y-4">
                               <label className="text-xs text-[#986E4B] font-bold uppercase tracking-wider block">Address / 上门地址</label>
                               <div className="bg-[#FDFBF7] border border-[#DECFBE] rounded-2xl overflow-hidden focus-within:border-[#986E4B] transition-colors shadow-sm">
                                    <div className="flex items-center px-5 py-4">
                                      <MapPin className="w-5 h-5 text-[#BAAFA0] mr-3" />
                                      <input
                                        type="text"
                                        value={pickupAddress}
                                        onChange={(event) => setPickupAddress(event.target.value)}
                                        placeholder="请输入详细地址 (省市区/街道/门牌号)"
                                        className="w-full outline-none text-[#362A1F] placeholder:text-[#BAAFA0] bg-transparent"
                                      />
                                    </div>
                                    <div className="border-t border-[#DECFBE] bg-[#F4F0E8] px-4 py-3 flex items-center justify-between gap-3">
                                      <div className="text-xs text-[#7F6B58]">可自动填入当前位置，方便预约上门回收。</div>
                                      <button
                                        type="button"
                                        onClick={() => handleAutoLocate('pickup')}
                                        disabled={isLocating}
                                        className="shrink-0 px-4 py-2 rounded-full border border-[#DECFBE] bg-[#FDFBF7] text-[#986E4B] hover:text-[#6C4B30] text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-wait"
                                      >
                                        {isLocating ? (
                                          <LoaderCircle className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Navigation2 className="w-4 h-4" />
                                        )}
                                        自动定位
                                      </button>
                                    </div>
                               </div>
                               {locationError ? (
                                 <div className="text-sm text-[#A25344] bg-[#F8E5DE] border border-[#EBCABE] rounded-2xl px-4 py-3">
                                   {locationError}
                                 </div>
                               ) : null}
                           </div>

                           <div className="grid grid-cols-2 gap-4 mt-4">
                               <div className="space-y-3">
                                   <label className="text-xs text-[#986E4B] font-bold uppercase tracking-wider block">Date / 预约日期</label>
                                   <div className="flex items-center bg-[#FDFBF7] border border-[#DECFBE] rounded-xl px-4 py-3.5 shadow-sm focus-within:border-[#986E4B] transition-colors">
                                       <Calendar className="w-5 h-5 text-[#BAAFA0] mr-3" />
                                       <input type="date" className="w-full outline-none text-[#362A1F] bg-transparent text-sm" />
                                   </div>
                               </div>
                               <div className="space-y-3">
                                   <label className="text-xs text-[#986E4B] font-bold uppercase tracking-wider block">Time / 预约时段</label>
                                   <div className="flex items-center bg-[#FDFBF7] border border-[#DECFBE] rounded-xl px-4 py-3.5 shadow-sm focus-within:border-[#986E4B] transition-colors">
                                       <Clock className="w-5 h-5 text-[#BAAFA0] mr-3" />
                                       <input type="time" className="w-full outline-none text-[#362A1F] bg-transparent text-sm" />
                                   </div>
                               </div>
                           </div>
                     </motion.div>
                 )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column - Estimation */}
          <div className="w-full lg:w-1/2">
              <div className="bg-[#FAF8F3]/80 backdrop-blur-2xl border border-[#E8DFC9] p-8 md:p-10 rounded-[2.5rem] shadow-[0_15px_40px_rgba(100,80,60,0.06)] relative overflow-hidden">
                 <h2 className="text-2xl font-serif text-[#362A1F] mb-8 border-b border-[#E8DFC9] pb-4">
                   物品预估 & 获取积分
                 </h2>
                 
                 <div className="space-y-8 relative z-10">
                     {/* Type & Qty */}
                     <div className="flex flex-col sm:flex-row gap-6">
                         <div className="flex-1">
                             <label className="text-xs mb-3 block text-[#986E4B] font-bold uppercase tracking-wider">Type / 服装类别</label>
                             <div className="relative">
                               <select 
                                 className="w-full appearance-none bg-[#F4F0E8] border border-[#DECFBE] rounded-xl px-5 py-4 text-sm font-medium outline-none text-[#4A3D30] focus:border-[#986E4B] cursor-pointer shadow-inner"
                                 value={clothingType}
                                 onChange={e => setClothingType(e.target.value)}
                               >
                                 {CLOTHING_TYPES.map(t => <option key={t}>{t}</option>)}
                               </select>
                             </div>
                         </div>
                         <div className="w-full sm:w-1/3">
                             <label className="text-xs mb-3 block text-[#986E4B] font-bold uppercase tracking-wider">Qty / 数量(件)</label>
                             <input 
                                type="number" 
                                min="1" 
                                max="100" 
                                value={qty}
                                onChange={e => setQty(Number(e.target.value) || 1)}
                                className="w-full bg-[#F4F0E8] border border-[#DECFBE] rounded-xl px-5 py-4 text-sm font-medium outline-none text-[#4A3D30] focus:border-[#986E4B] shadow-inner" 
                             />
                         </div>
                     </div>

                     {/* Condition */}
                     <div>
                          <label className="text-xs mb-4 block text-[#986E4B] font-bold uppercase tracking-wider">Condition / 物品状态评估</label>
                          <div className="grid grid-cols-2 gap-4">
                              {CONDITIONS.map(c => {
                                  const Icon = c.icon;
                                  return (
                                  <button 
                                      key={c.level}
                                      onClick={() => setCondition(c.level)}
                                      className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm ${
                                          condition === c.level 
                                            ? 'border-[#986E4B] ring-1 ring-[#986E4B]/40 scale-[1.02] shadow-[#986E4B]/10 z-10' 
                                            : 'border-[#DECFBE] hover:border-[#BCAE9C]'
                                      } ${c.bgClass}`}
                                  >
                                      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center bg-white/40 backdrop-blur-sm ${condition === c.level ? 'border-[#986E4B]/30' : 'border-[#CEBCA8]'}`}>
                                              <Icon className={`w-4 h-4 ${condition === c.level ? 'text-[#986E4B]' : 'text-[#847463]'}`} />
                                          </div>
                                          <div>
                                              <div className={`font-serif text-xl mb-1 tracking-wide ${condition === c.level ? 'text-[#362A1F]' : 'text-[#4A3D30]'}`}>{c.level}</div>
                                              <div className="text-xs font-medium text-[#7F6B58]">{c.desc}</div>
                                          </div>
                                      </div>
                                  </button>
                                  )
                              })}
                          </div>
                     </div>

                     {/* Results */}
                     <div className="mt-10 p-8 bg-[#F4F0E8] rounded-3xl border border-[#DECFBE] text-center relative overflow-hidden shadow-inner">
                          <div className="text-[#986E4B] font-bold text-sm mb-3 tracking-widest uppercase">
                            预估可获积分
                          </div>
                          <div className="text-5xl md:text-6xl font-serif text-[#362A1F] mb-6 tracking-wide">
                              {minPoints} <span className="text-3xl text-[#BAAFA0] mx-2">-</span> {maxPoints}
                          </div>
                          
                          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-[#7F6B58] bg-[#FDFBF7] py-2 px-5 rounded-full w-fit mx-auto border border-[#DECFBE] shadow-sm">
                              <Info className="w-4 h-4 text-[#986E4B]" />
                              积分抵扣比例: 100积分 = ¥1
                          </div>
                     </div>

                     <button 
                       onClick={() => alert('感谢您的预约！我们会尽快与您联系。')}
                       className="w-full py-5 mt-4 bg-[#8E6545] text-[#FDFBF7] font-serif tracking-[0.2em] hover:bg-[#6C4B30] transition-colors rounded-2xl text-lg shadow-[0_8px_20px_rgba(142,101,69,0.25)]"
                     >
                         {method === 'dropoff' ? '保存预约信息' : '确认提交并预约'}
                     </button>
                 </div>
              </div>
          </div>

        </main>
      </div>

      {/* Map Modal */}
      <AnimatePresence>
        {showMap && (
          <RecycleMapModal
            activeLocation={activeLocation}
            bins={nearbyBins}
            errorMessage={locationError}
            isLocating={isLocating}
            isSearching={isSearchingLocation}
            locationQuery={addressSearch}
            onAutoLocate={() => handleAutoLocate('dropoff')}
            onClose={() => setShowMap(false)}
            onQueryChange={setAddressSearch}
            onSearch={() => void handleSearchLocation()}
            userLocation={userLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function buildNearbyBins(center: MapLocation): RecycleBin[] {
  return RECYCLE_BIN_BLUEPRINTS.map((bin) => {
    const lat = center.lat + bin.latOffset;
    const lng = center.lng + bin.lngOffset;
    const distanceMeters = calculateDistanceMeters(center.lat, center.lng, lat, lng);

    return {
      id: bin.id,
      name: bin.name,
      lat,
      lng,
      status: bin.status,
      distanceMeters,
    };
  }).sort((left, right) => left.distanceMeters - right.distanceMeters);
}

async function geocodeLocation(query: string): Promise<MapLocation> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Accept-Language': 'zh-CN',
      },
    },
  );

  if (!response.ok) {
    throw new Error('地图服务暂时不可用，请稍后再试。');
  }

  const results = (await response.json()) as NominatimSearchResult[];
  const [firstResult] = results;

  if (!firstResult) {
    throw new Error('没有找到这个位置，请换一个更具体的关键词。');
  }

  return {
    lat: Number.parseFloat(firstResult.lat),
    lng: Number.parseFloat(firstResult.lon),
    label: firstResult.display_name,
    source: 'search',
  };
}

async function reverseGeocodeLocation(lat: number, lng: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    {
      headers: {
        'Accept-Language': 'zh-CN',
      },
    },
  );

  if (!response.ok) {
    throw new Error('反向定位失败');
  }

  const result = (await response.json()) as NominatimReverseResult;
  return result.display_name ?? `当前位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

function calculateDistanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadius = 6371000;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} 米`;
  }

  return `${(distanceMeters / 1000).toFixed(distanceMeters < 3000 ? 1 : 0)} 公里`;
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case 1:
      return '定位权限被拒绝了，请允许浏览器访问位置后重试。';
    case 2:
      return '暂时无法获取你的位置，请检查网络或 GPS 设置。';
    case 3:
      return '定位超时了，请稍后再试。';
    default:
      return '定位失败了，请先手动输入位置。';
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
