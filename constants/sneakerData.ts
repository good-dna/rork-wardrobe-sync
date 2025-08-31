import { Sneaker, SneakerBrand, SneakerRelease } from '@/types/sneaker';

export const mockBrands: SneakerBrand[] = [
  { id: '1', name: 'Nike', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop' },
  { id: '2', name: 'Adidas', logo: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=100&h=100&fit=crop' },
  { id: '3', name: 'Jordan', logo: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=100&h=100&fit=crop' },
  { id: '4', name: 'New Balance', logo: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=100&h=100&fit=crop' },
  { id: '5', name: 'Converse', logo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100&h=100&fit=crop' },
];

export const mockSneakers: Sneaker[] = [
  {
    id: '1',
    name: 'Air Jordan 1 Retro High OG',
    brand: 'Jordan',
    model: 'Air Jordan 1',
    colorway: 'Chicago',
    releaseDate: '2015-05-30',
    retailPrice: 160,
    currentPrice: 2500,
    size: 10.5,
    condition: 'vnds',
    images: [
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop'
    ],
    sku: '555088-101',
    description: 'The iconic Chicago colorway that started it all.',
    purchaseDate: '2023-01-15',
    purchasePrice: 2200,
    tags: ['retro', 'og', 'chicago', 'classic'],
    category: 'basketball',
    rarity: 'grail',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Nike Dunk Low',
    brand: 'Nike',
    model: 'Dunk Low',
    colorway: 'Panda',
    releaseDate: '2021-03-10',
    retailPrice: 100,
    currentPrice: 120,
    size: 11,
    condition: 'deadstock',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop'
    ],
    sku: 'DD1391-100',
    description: 'Clean black and white colorway that goes with everything.',
    purchaseDate: '2023-02-20',
    purchasePrice: 100,
    tags: ['dunk', 'panda', 'black', 'white'],
    category: 'lifestyle',
    rarity: 'common',
    createdAt: '2023-02-20T14:30:00Z',
    updatedAt: '2023-02-20T14:30:00Z'
  },
  {
    id: '3',
    name: 'Yeezy Boost 350 V2',
    brand: 'Adidas',
    model: 'Yeezy 350 V2',
    colorway: 'Zebra',
    releaseDate: '2017-02-25',
    retailPrice: 220,
    currentPrice: 300,
    size: 10,
    condition: 'used',
    images: [
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=600&fit=crop'
    ],
    sku: 'CP9654',
    description: 'The iconic zebra stripe pattern on the popular 350 silhouette.',
    purchaseDate: '2023-03-10',
    purchasePrice: 280,
    tags: ['yeezy', 'zebra', 'boost', 'kanye'],
    category: 'lifestyle',
    rarity: 'rare',
    createdAt: '2023-03-10T09:15:00Z',
    updatedAt: '2023-03-10T09:15:00Z'
  },
  {
    id: '4',
    name: 'New Balance 550',
    brand: 'New Balance',
    model: '550',
    colorway: 'White Green',
    releaseDate: '2021-07-30',
    retailPrice: 110,
    currentPrice: 180,
    size: 9.5,
    condition: 'vnds',
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=600&fit=crop'
    ],
    sku: 'BB550WT1',
    description: 'Retro basketball shoe with vintage appeal.',
    purchaseDate: '2023-04-05',
    purchasePrice: 160,
    tags: ['550', 'retro', 'basketball', 'vintage'],
    category: 'basketball',
    rarity: 'uncommon',
    createdAt: '2023-04-05T16:45:00Z',
    updatedAt: '2023-04-05T16:45:00Z'
  },
  {
    id: '5',
    name: 'Travis Scott x Air Jordan 1 Low',
    brand: 'Jordan',
    model: 'Air Jordan 1 Low',
    colorway: 'Mocha',
    releaseDate: '2019-07-26',
    retailPrice: 130,
    currentPrice: 1800,
    size: 11,
    condition: 'deadstock',
    images: [
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=600&fit=crop'
    ],
    sku: 'CQ4277-001',
    description: 'Collaboration with Travis Scott featuring reverse swoosh.',
    tags: ['travis scott', 'collaboration', 'mocha', 'reverse swoosh'],
    category: 'lifestyle',
    rarity: 'grail',
    isWishlisted: true,
    createdAt: '2023-05-12T11:20:00Z',
    updatedAt: '2023-05-12T11:20:00Z'
  }
];

export const mockUpcomingReleases: SneakerRelease[] = [
  {
    id: '1',
    name: 'Air Jordan 4 Retro',
    brand: 'Jordan',
    model: 'Air Jordan 4',
    colorway: 'Military Black',
    releaseDate: '2024-05-04',
    retailPrice: 210,
    images: ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop'],
    description: 'Classic military-inspired colorway returns.',
    isUpcoming: true,
    raffleLinks: ['https://nike.com', 'https://footlocker.com']
  },
  {
    id: '2',
    name: 'Nike Dunk Low',
    brand: 'Nike',
    model: 'Dunk Low',
    colorway: 'University Blue',
    releaseDate: '2024-04-20',
    retailPrice: 100,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop'],
    description: 'Fresh blue and white colorway for spring.',
    isUpcoming: true
  }
];

export const sneakerCategories = [
  'basketball',
  'running', 
  'lifestyle',
  'skateboarding',
  'football',
  'other'
];

export const sneakerConditions = [
  'deadstock',
  'vnds',
  'used', 
  'beater'
];

export const sneakerRarities = [
  'common',
  'uncommon',
  'rare',
  'grail'
];