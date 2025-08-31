import { Sneaker, SneakerBrand, SneakerCategory, SneakerCondition } from '@/types/sneaker';

export const mockSneakers: Sneaker[] = [
  {
    id: '1',
    name: 'Air Jordan 1 Retro High OG',
    brand: 'Jordan' as SneakerBrand,
    model: 'Air Jordan 1',
    category: 'Basketball' as SneakerCategory,
    size: { us: 10.5, uk: 9.5, eu: 44.5, cm: 28.5 },
    condition: 'New' as SneakerCondition,
    purchaseDate: '2024-01-15',
    purchasePrice: 170,
    purchaseLocation: 'Nike SNKRS',
    imageUrls: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop'
    ],
    details: {
      sku: 'DZ5485-612',
      styleCode: '555088-612',
      releaseDate: '2023-12-16',
      retailPrice: 170,
      currentMarketPrice: 220,
      materials: ['Leather', 'Synthetic'],
      colorway: {
        primary: '#DC143C',
        secondary: '#FFFFFF',
        accent: '#000000',
        nickname: 'Chicago'
      },
      limited: false,
      technology: ['Air-Sole', 'Encapsulated Air']
    },
    wearCount: 5,
    lastWorn: '2024-01-20',
    notes: 'Classic colorway, goes with everything',
    tags: ['retro', 'basketball', 'classic'],
    favorite: true,
    userId: 'user1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z'
  },
  {
    id: '2',
    name: 'Nike Air Force 1 Low',
    brand: 'Nike' as SneakerBrand,
    model: 'Air Force 1',
    category: 'Lifestyle' as SneakerCategory,
    size: { us: 10, uk: 9, eu: 44, cm: 28 },
    condition: 'Very Good' as SneakerCondition,
    purchaseDate: '2023-11-10',
    purchasePrice: 90,
    purchaseLocation: 'Foot Locker',
    imageUrls: [
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=300&fit=crop'
    ],
    details: {
      sku: 'CW2288-111',
      styleCode: '315122-111',
      releaseDate: '1982-01-01',
      retailPrice: 90,
      currentMarketPrice: 95,
      materials: ['Leather'],
      colorway: {
        primary: '#FFFFFF',
        secondary: '#FFFFFF',
        nickname: 'Triple White'
      },
      limited: false,
      technology: ['Air-Sole']
    },
    wearCount: 25,
    lastWorn: '2024-01-18',
    notes: 'Daily beater, super comfortable',
    tags: ['classic', 'white', 'versatile'],
    favorite: false,
    userId: 'user1',
    createdAt: '2023-11-10T14:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z'
  },
  {
    id: '3',
    name: 'Adidas Ultraboost 22',
    brand: 'Adidas' as SneakerBrand,
    model: 'Ultraboost',
    category: 'Running' as SneakerCategory,
    size: { us: 10.5, uk: 10, eu: 44.5, cm: 28.5 },
    condition: 'Good' as SneakerCondition,
    purchaseDate: '2023-08-22',
    purchasePrice: 180,
    purchaseLocation: 'Adidas Store',
    imageUrls: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop'
    ],
    details: {
      sku: 'GZ0127',
      styleCode: 'GZ0127',
      releaseDate: '2022-02-01',
      retailPrice: 180,
      currentMarketPrice: 140,
      materials: ['Primeknit', 'Boost'],
      colorway: {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#FF6B35'
      },
      limited: false,
      technology: ['Boost', 'Primeknit', 'Continental Rubber']
    },
    wearCount: 45,
    lastWorn: '2024-01-19',
    notes: 'Great for running and casual wear',
    tags: ['running', 'boost', 'comfortable'],
    favorite: true,
    userId: 'user1',
    createdAt: '2023-08-22T09:00:00Z',
    updatedAt: '2024-01-19T07:30:00Z'
  }
];

export const getRandomSneakers = (count: number = 3): Sneaker[] => {
  const shuffled = [...mockSneakers].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getSneakersByBrand = (brand: SneakerBrand): Sneaker[] => {
  return mockSneakers.filter(sneaker => sneaker.brand === brand);
};

export const getFavoriteSneakers = (): Sneaker[] => {
  return mockSneakers.filter(sneaker => sneaker.favorite);
};

export const searchMockSneakers = (query: string): Sneaker[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockSneakers.filter(sneaker => 
    sneaker.name.toLowerCase().includes(lowercaseQuery) ||
    sneaker.brand.toLowerCase().includes(lowercaseQuery) ||
    sneaker.model.toLowerCase().includes(lowercaseQuery) ||
    sneaker.details.colorway.nickname?.toLowerCase().includes(lowercaseQuery) ||
    sneaker.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};