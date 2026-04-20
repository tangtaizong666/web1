export const DEFAULT_MAP_LOCATION = {
  lat: 39.9042,
  lng: 116.4074,
  label: '北京市朝阳区三里屯商圈',
  source: 'search' as const,
};

export const RECYCLE_BIN_BLUEPRINTS = [
  {
    id: 'bin-east-gate',
    name: '校园东门智能箱',
    description: '适合从教学楼和主干道方向前往投递。',
    latOffset: 0.0036,
    lngOffset: 0.0024,
    status: 'available' as const,
  },
  {
    id: 'bin-library',
    name: '图书馆西侧回收点',
    description: '离图书馆、自习区和主广场较近，适合课间顺路投递。',
    latOffset: -0.0024,
    lngOffset: 0.0031,
    status: 'available' as const,
  },
  {
    id: 'bin-dormitory',
    name: '宿舍区北门回收点',
    description: '更方便从宿舍区出发的同学投递旧衣。',
    latOffset: 0.0018,
    lngOffset: -0.0032,
    status: 'available' as const,
  },
  {
    id: 'bin-cafe',
    name: '生活服务中心回收站',
    description: '靠近生活服务中心和日常服务区，当前通常作为满载或临时不可用点位提示。',
    latOffset: -0.0035,
    lngOffset: -0.0012,
    status: 'full' as const,
  },
  {
    id: 'bin-gym',
    name: '体育馆南侧回收点',
    description: '适合运动后或从体育馆方向经过时顺手投递。',
    latOffset: 0.0045,
    lngOffset: -0.0008,
    status: 'available' as const,
  },
  {
    id: 'bin-lake',
    name: '湖畔共享回收箱',
    description: '靠近湖畔步道与休闲区，适合周边活动后前往。',
    latOffset: -0.0015,
    lngOffset: 0.0048,
    status: 'available' as const,
  },
] as const;
