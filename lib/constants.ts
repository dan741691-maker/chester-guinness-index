import type { RatingTier, ScoreCategory } from '@/types';

export const RATING_TIERS: RatingTier[] = [
  {
    label: 'Legendary',
    min: 46,
    max: 50,
    color: '#FFD700',
    bgClass: 'bg-yellow-400/10 border-yellow-400/30',
    textClass: 'text-yellow-400',
  },
  {
    label: 'Elite',
    min: 41,
    max: 45,
    color: '#C9A84C',
    bgClass: 'bg-gold/10 border-gold/30',
    textClass: 'text-gold',
  },
  {
    label: 'Strong',
    min: 36,
    max: 40,
    color: '#A0AEC0',
    bgClass: 'bg-slate-400/10 border-slate-400/30',
    textClass: 'text-slate-400',
  },
  {
    label: 'Decent',
    min: 31,
    max: 35,
    color: '#8B7355',
    bgClass: 'bg-amber-800/10 border-amber-800/30',
    textClass: 'text-amber-700',
  },
  {
    label: 'Weak',
    min: 21,
    max: 30,
    color: '#718096',
    bgClass: 'bg-gray-500/10 border-gray-500/30',
    textClass: 'text-gray-500',
  },
  {
    label: 'Avoid',
    min: 0,
    max: 20,
    color: '#E53E3E',
    bgClass: 'bg-red-500/10 border-red-500/30',
    textClass: 'text-red-500',
  },
];

export const CHESTER_AREAS = [
  'City Centre',
  'Boughton',
  'Handbridge',
  'Hoole',
  'Christleton',
  'Upton',
  'Saltney',
  'Blacon',
] as const;

export const SCORE_CATEGORIES: ScoreCategory[] = [
  { key: 'pub_look_cleanliness', label: 'Look & Cleanliness', icon: '✨' },
  { key: 'staff', label: 'Staff', icon: '🤝' },
  { key: 'glass_pour', label: 'Glass / Pour', icon: '🍺' },
  { key: 'taste_quality', label: 'Taste / Quality', icon: '👅' },
  { key: 'price_score', label: 'Price', icon: '💷' },
];

export const CHESTER_CENTER = { lat: 53.1905, lng: -2.8924 };
export const DEFAULT_ZOOM = 14;

export const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f0f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#c9a84c' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#e8c875' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

export const SOCIAL_HASHTAGS = '#Chester #Guinness #PintReview #ChesterPubs #GuinnessReview';
