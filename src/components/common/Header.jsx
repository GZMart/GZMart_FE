import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PUBLIC_ROUTES, BUYER_ROUTES, SELLER_ROUTES, ADMIN_ROUTES } from '@constants/routes';
import { USER_ROLES } from '@constants';
import { selectUser, selectIsAuthenticated, logoutUser } from '@store/slices/authSlice';
import { selectCartTotalItems, fetchCart } from '@store/slices/cartSlice';
import { searchService } from '@services/api';
import {
  Tag,
  Search,
  User,
  ShoppingCart,
  ChevronDown,
  Globe,
  Heart,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Loader2,
  ChevronRight,
} from 'lucide-react';

import NotificationBell from './NotificationBell';

// Fashion categories data from Guangzhou market
const FAKE_CATEGORIES_DATA = [
  {
    id: 1,
    name: "Women's Fashion",
    subcategories: [
      {
        id: 101,
        name: 'Dresses',
        products: [
          {
            id: 10101,
            name: 'Floral Print Dress',
            brand: 'Mishow',
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200',
            price: 250000,
            originalPrice: 350000,
          },
          {
            id: 10102,
            name: 'Satin Silk Dress',
            brand: 'Realeft',
            image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200',
            price: 320000,
            originalPrice: 450000,
          },
          {
            id: 10103,
            name: 'Summer Maxi Dress',
            brand: 'Mishow',
            image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200',
            price: 280000,
            originalPrice: 400000,
          },
        ],
      },
      {
        id: 102,
        name: 'Shirts & Blouses',
        products: [
          {
            id: 10201,
            name: 'Office Chiffon Shirt',
            brand: 'Simple Retro',
            image: 'https://images.unsplash.com/photo-1564257577721-fa5be2c300b9?w=200',
            price: 180000,
            originalPrice: 260000,
          },
          {
            id: 10202,
            name: 'Bow Tie Blouse',
            brand: 'Syiwidii',
            image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=200',
            price: 210000,
            originalPrice: 300000,
          },
          {
            id: 10203,
            name: 'Silk Office Blouse',
            brand: 'Simple Retro',
            image: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=200',
            price: 195000,
            originalPrice: 280000,
          },
        ],
      },
      {
        id: 103,
        name: 'Skirts',
        products: [
          {
            id: 10301,
            name: 'A-Line Skirt',
            brand: 'Tangada',
            image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200',
            price: 150000,
            originalPrice: 220000,
          },
          {
            id: 10302,
            name: 'Long Pleated Skirt',
            brand: 'Toyouth',
            image: 'https://images.unsplash.com/photo-1611086967196-eb780a3a0dde?w=200',
            price: 240000,
            originalPrice: 340000,
          },
          {
            id: 10303,
            name: 'Midi Wrap Skirt',
            brand: 'Tangada',
            image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=200',
            price: 185000,
            originalPrice: 265000,
          },
        ],
      },
      { id: 104, name: 'Lingerie & Sleepwear' },
      { id: 105, name: 'Activewear' },
    ],
    featuredProducts: [
      {
        id: 1001,
        name: 'Floral Print Dress',
        brand: 'Mishow',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200',
        price: 250000,
        originalPrice: 350000,
      },
      {
        id: 1002,
        name: 'Satin Silk Dress',
        brand: 'Realeft',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200',
        price: 320000,
        originalPrice: 450000,
      },
      {
        id: 1003,
        name: 'Office Chiffon Shirt',
        brand: 'Simple Retro',
        image: 'https://images.unsplash.com/photo-1564257577721-fa5be2c300b9?w=200',
        price: 180000,
        originalPrice: 260000,
      },
    ],
    discountProduct: {
      id: 2001,
      name: 'Spring Collection 2026',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
      discount: 40,
      price: 299000,
      description: 'Latest collection from Guangzhou. Trendy designs, premium quality fabrics!',
    },
  },
  {
    id: 2,
    name: "Men's Fashion",
    subcategories: [
      {
        id: 201,
        name: 'T-Shirts',
        products: [
          {
            id: 20101,
            name: 'Basic Cotton T-Shirt',
            brand: 'Semir',
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
            price: 135000,
            originalPrice: 200000,
          },
          {
            id: 20102,
            name: 'Printed Graphic Tee',
            brand: 'Metersbonwe',
            image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200',
            price: 165000,
            originalPrice: 240000,
          },
          {
            id: 20103,
            name: 'Premium Cotton Polo',
            brand: 'Semir',
            image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=200',
            price: 180000,
            originalPrice: 260000,
          },
        ],
      },
      {
        id: 202,
        name: 'Jeans',
        products: [
          {
            id: 20201,
            name: 'Straight Cut Jeans',
            brand: 'Giordano',
            image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200',
            price: 350000,
            originalPrice: 500000,
          },
          {
            id: 20202,
            name: 'Distressed Knee Jeans',
            brand: 'Jeanswest',
            image: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=200',
            price: 380000,
            originalPrice: 540000,
          },
          {
            id: 20203,
            name: 'Slim Fit Denim',
            brand: 'Giordano',
            image: 'https://images.unsplash.com/photo-1548883354-1ee8b94b744d?w=200',
            price: 365000,
            originalPrice: 520000,
          },
        ],
      },
      {
        id: 203,
        name: 'Jackets',
        products: [
          {
            id: 20301,
            name: 'Bomber Jacket',
            brand: 'Peacebird',
            image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
            price: 550000,
            originalPrice: 780000,
          },
          {
            id: 20302,
            name: 'Khaki Jacket',
            brand: 'Mark Fairwhale',
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200',
            price: 480000,
            originalPrice: 680000,
          },
          {
            id: 20303,
            name: 'Denim Jacket',
            brand: 'Peacebird',
            image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=200',
            price: 520000,
            originalPrice: 740000,
          },
        ],
      },
      { id: 204, name: 'Formal Wear' },
      { id: 205, name: 'Shorts' },
    ],
    featuredProducts: [
      {
        id: 1004,
        name: 'Basic Cotton T-Shirt',
        brand: 'Semir',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
        price: 135000,
        originalPrice: 200000,
      },
      {
        id: 1005,
        name: 'Straight Cut Jeans',
        brand: 'Giordano',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200',
        price: 350000,
        originalPrice: 500000,
      },
      {
        id: 1006,
        name: 'Bomber Jacket',
        brand: 'Peacebird',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
        price: 550000,
        originalPrice: 780000,
      },
    ],
    discountProduct: {
      id: 2002,
      name: 'Summer Essentials',
      image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400',
      discount: 35,
      price: 199000,
      description: "Premium men's fashion from Guangzhou. Modern and elegant style!",
    },
  },
  {
    id: 3,
    name: 'Footwear',
    subcategories: [
      {
        id: 301,
        name: 'Sneakers',
        products: [
          {
            id: 30101,
            name: 'Classic Canvas Sneakers',
            brand: 'Warrior',
            image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200',
            price: 250000,
            originalPrice: 380000,
          },
          {
            id: 30102,
            name: 'Platform Sneakers',
            brand: 'Feiyue',
            image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=200',
            price: 450000,
            originalPrice: 650000,
          },
          {
            id: 30103,
            name: 'Running Shoes',
            brand: 'Warrior',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
            price: 380000,
            originalPrice: 540000,
          },
        ],
      },
      {
        id: 302,
        name: 'High Heels',
        products: [
          {
            id: 30201,
            name: '7cm Pointed Heels',
            brand: 'Dusto',
            image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200',
            price: 380000,
            originalPrice: 550000,
          },
          {
            id: 30202,
            name: 'High Heel Sandals',
            brand: 'Tata',
            image: 'https://images.unsplash.com/photo-1603808033587-e1906e4e97ed?w=200',
            price: 320000,
            originalPrice: 480000,
          },
          {
            id: 30203,
            name: 'Strappy Heels',
            brand: 'Dusto',
            image: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=200',
            price: 350000,
            originalPrice: 500000,
          },
        ],
      },
      {
        id: 303,
        name: "Men's Leather Shoes",
        products: [
          {
            id: 30301,
            name: 'Oxford Leather Shoes',
            brand: 'Spider King',
            image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=200',
            price: 750000,
            originalPrice: 1000000,
          },
          {
            id: 30302,
            name: 'Lazy Loafers',
            brand: 'Red Dragonfly',
            image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=200',
            price: 680000,
            originalPrice: 920000,
          },
          {
            id: 30303,
            name: 'Derby Dress Shoes',
            brand: 'Spider King',
            image: 'https://images.unsplash.com/photo-1582897085656-c561a83f5d2c?w=200',
            price: 720000,
            originalPrice: 950000,
          },
        ],
      },
      { id: 304, name: 'Sandals & Slippers' },
      { id: 305, name: 'Boots' },
    ],
    featuredProducts: [
      {
        id: 1007,
        name: 'Classic Canvas Sneakers',
        brand: 'Warrior',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200',
        price: 250000,
        originalPrice: 380000,
      },
      {
        id: 1008,
        name: '7cm Pointed Heels',
        brand: 'Dusto',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200',
        price: 380000,
        originalPrice: 550000,
      },
      {
        id: 1009,
        name: 'Oxford Leather Shoes',
        brand: 'Spider King',
        image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=200',
        price: 750000,
        originalPrice: 1000000,
      },
    ],
    discountProduct: {
      id: 2003,
      name: 'Footwear Collection',
      image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400',
      discount: 30,
      price: 249000,
      description: 'Guangzhou fashion footwear. High quality, great prices!',
    },
  },
  {
    id: 4,
    name: 'Bags & Accessories',
    subcategories: [
      {
        id: 401,
        name: "Women's Bags",
        products: [
          {
            id: 40101,
            name: 'Mini Crossbody Bag',
            brand: 'Micocah',
            image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200',
            price: 280000,
            originalPrice: 420000,
          },
          {
            id: 40102,
            name: 'Leather Tote Bag',
            brand: 'Charles & Keith',
            image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200',
            price: 420000,
            originalPrice: 600000,
          },
          {
            id: 40103,
            name: 'Shoulder Bag',
            brand: 'Micocah',
            image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=200',
            price: 350000,
            originalPrice: 500000,
          },
        ],
      },
      {
        id: 402,
        name: 'Backpacks',
        products: [
          {
            id: 40201,
            name: 'Waterproof Backpack',
            brand: 'Mr.ace Homme',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200',
            price: 350000,
            originalPrice: 500000,
          },
          {
            id: 40202,
            name: 'Laptop Backpack',
            brand: 'Ginye',
            image: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=200',
            price: 450000,
            originalPrice: 640000,
          },
          {
            id: 40203,
            name: 'Travel Backpack',
            brand: 'Mr.ace Homme',
            image: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=200',
            price: 480000,
            originalPrice: 680000,
          },
        ],
      },
      {
        id: 403,
        name: 'Belts & Wallets',
        products: [
          {
            id: 40301,
            name: 'Men Leather Wallet',
            brand: 'Septwolves',
            image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=200',
            price: 290000,
            originalPrice: 420000,
          },
          {
            id: 40302,
            name: 'Auto-Buckle Belt',
            brand: 'Goldlion',
            image: 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=200',
            price: 210000,
            originalPrice: 300000,
          },
          {
            id: 40303,
            name: 'Bifold Wallet',
            brand: 'Septwolves',
            image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200',
            price: 250000,
            originalPrice: 360000,
          },
        ],
      },
      { id: 404, name: 'Sunglasses' },
      { id: 405, name: 'Jewelry' },
    ],
    featuredProducts: [
      {
        id: 1010,
        name: 'Mini Crossbody Bag',
        brand: 'Micocah',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200',
        price: 280000,
        originalPrice: 420000,
      },
      {
        id: 1011,
        name: 'Waterproof Backpack',
        brand: 'Mr.ace Homme',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200',
        price: 350000,
        originalPrice: 500000,
      },
      {
        id: 1012,
        name: 'Aviator Sunglasses',
        brand: 'Bolon',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200',
        price: 550000,
        originalPrice: 780000,
      },
    ],
    discountProduct: {
      id: 2004,
      name: 'Accessories Bundle',
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
      discount: 45,
      price: 399000,
      description: 'Premium fashion accessories collection. Complete your style!',
    },
  },
  {
    id: 5,
    name: 'Kids & Baby',
    subcategories: [
      {
        id: 501,
        name: 'Newborn',
        products: [
          {
            id: 50101,
            name: 'Cotton Bodysuit',
            brand: 'Balabala',
            image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200',
            price: 120000,
            originalPrice: 180000,
          },
          {
            id: 50102,
            name: 'Baby Gloves & Socks Set',
            brand: 'Dave & Bella',
            image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200',
            price: 45000,
            originalPrice: 70000,
          },
          {
            id: 50103,
            name: 'Newborn Romper',
            brand: 'Balabala',
            image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200',
            price: 135000,
            originalPrice: 200000,
          },
        ],
      },
      {
        id: 502,
        name: "Girls' Dresses",
        products: [
          {
            id: 50201,
            name: 'Princess Dress',
            brand: 'Annil',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=200',
            price: 260000,
            originalPrice: 380000,
          },
          {
            id: 50202,
            name: 'Denim Overall Dress',
            brand: 'Souhait',
            image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200',
            price: 195000,
            originalPrice: 280000,
          },
          {
            id: 50203,
            name: 'Party Dress',
            brand: 'Annil',
            image: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=200',
            price: 280000,
            originalPrice: 400000,
          },
        ],
      },
      {
        id: 503,
        name: "Boys' Sets",
        products: [
          {
            id: 50301,
            name: 'Active Wear Set',
            brand: 'Yeehoo',
            image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200',
            price: 185000,
            originalPrice: 280000,
          },
          {
            id: 50302,
            name: 'Mini Vest Set',
            brand: 'Pepco',
            image: 'https://images.unsplash.com/photo-1519238483498-21e45be8a5e4?w=200',
            price: 350000,
            originalPrice: 500000,
          },
          {
            id: 50303,
            name: 'Casual T-shirt & Shorts',
            brand: 'Yeehoo',
            image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=200',
            price: 165000,
            originalPrice: 240000,
          },
        ],
      },
      { id: 504, name: "Kids' Shoes" },
      { id: 505, name: "Kids' Accessories" },
    ],
    featuredProducts: [
      {
        id: 1013,
        name: 'Cotton Bodysuit',
        brand: 'Balabala',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200',
        price: 120000,
        originalPrice: 180000,
      },
      {
        id: 1014,
        name: 'Princess Dress',
        brand: 'Annil',
        image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=200',
        price: 260000,
        originalPrice: 380000,
      },
      {
        id: 1015,
        name: 'Active Wear Set',
        brand: 'Yeehoo',
        image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200',
        price: 185000,
        originalPrice: 280000,
      },
    ],
    discountProduct: {
      id: 2005,
      name: 'Kids Collection',
      image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e4?w=400',
      discount: 35,
      price: 199000,
      description: 'Cute and comfortable kids fashion. Quality guaranteed!',
    },
  },
  {
    id: 6,
    name: 'Outdoor & Sports',
    subcategories: [
      {
        id: 601,
        name: 'Running Wear',
        products: [
          {
            id: 60101,
            name: 'Running Shorts',
            brand: 'Anta',
            image: 'https://images.unsplash.com/photo-1582143952969-de898403c772?w=200',
            price: 190000,
            originalPrice: 280000,
          },
          {
            id: 60102,
            name: 'Sport Windbreaker',
            brand: 'Li-Ning',
            image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200',
            price: 420000,
            originalPrice: 600000,
          },
          {
            id: 60103,
            name: 'Running Tank Top',
            brand: 'Anta',
            image: 'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=200',
            price: 150000,
            originalPrice: 220000,
          },
        ],
      },
      {
        id: 602,
        name: 'Basketball',
        products: [
          {
            id: 60201,
            name: 'Basketball Set',
            brand: 'Peak',
            image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=200',
            price: 280000,
            originalPrice: 420000,
          },
          {
            id: 60202,
            name: 'High-Top Basketball Shoes',
            brand: '361 Degrees',
            image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200',
            price: 850000,
            originalPrice: 1200000,
          },
          {
            id: 60203,
            name: 'Basketball Jersey',
            brand: 'Peak',
            image: 'https://images.unsplash.com/photo-1598551199889-4fd6d8f2a0c0?w=200',
            price: 220000,
            originalPrice: 320000,
          },
        ],
      },
      {
        id: 603,
        name: 'Swimwear',
        products: [
          {
            id: 60301,
            name: 'Two-Piece Bikini',
            brand: 'Hosa',
            image: 'https://images.unsplash.com/photo-1582639590011-f5a8416d1101?w=200',
            price: 220000,
            originalPrice: 330000,
          },
          {
            id: 60302,
            name: 'One-Piece Swimsuit',
            brand: 'Yingfa',
            image: 'https://images.unsplash.com/photo-1559333086-b0a56225a93c?w=200',
            price: 310000,
            originalPrice: 450000,
          },
          {
            id: 60303,
            name: 'Men Swim Trunks',
            brand: 'Hosa',
            image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=200',
            price: 180000,
            originalPrice: 260000,
          },
        ],
      },
      { id: 604, name: 'Hiking Gear' },
      { id: 605, name: 'Sports Accessories' },
    ],
    featuredProducts: [
      {
        id: 1016,
        name: 'Running Shorts',
        brand: 'Anta',
        image: 'https://images.unsplash.com/photo-1582143952969-de898403c772?w=200',
        price: 190000,
        originalPrice: 280000,
      },
      {
        id: 1017,
        name: 'Basketball Set',
        brand: 'Peak',
        image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=200',
        price: 280000,
        originalPrice: 420000,
      },
      {
        id: 1018,
        name: 'Two-Piece Bikini',
        brand: 'Hosa',
        image: 'https://images.unsplash.com/photo-1582639590011-f5a8416d1101?w=200',
        price: 220000,
        originalPrice: 330000,
      },
    ],
    discountProduct: {
      id: 2006,
      name: 'Sports Collection',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
      discount: 40,
      price: 299000,
      description: 'Professional sports gear. Performance and comfort combined!',
    },
  },
  {
    id: 7,
    name: 'Streetwear',
    subcategories: [
      {
        id: 701,
        name: 'Hoodies & Sweatshirts',
        products: [
          {
            id: 70101,
            name: 'Oversize Hoodie',
            brand: 'Beaster',
            image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200',
            price: 450000,
            originalPrice: 650000,
          },
          {
            id: 70102,
            name: 'Crewneck Sweatshirt',
            brand: 'Randomevent',
            image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=200',
            price: 380000,
            originalPrice: 540000,
          },
          {
            id: 70103,
            name: 'Graphic Hoodie',
            brand: 'Beaster',
            image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200',
            price: 420000,
            originalPrice: 600000,
          },
        ],
      },
      {
        id: 702,
        name: 'Jogger & Cargo Pants',
        products: [
          {
            id: 70201,
            name: 'Cargo Pants',
            brand: 'Inflation',
            image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200',
            price: 320000,
            originalPrice: 480000,
          },
          {
            id: 70202,
            name: 'Jogger Pants',
            brand: 'Simple Project',
            image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=200',
            price: 260000,
            originalPrice: 380000,
          },
          {
            id: 70203,
            name: 'Multi-Pocket Cargo',
            brand: 'Inflation',
            image: 'https://images.unsplash.com/photo-1603252109373-7a3d5d8a6015?w=200',
            price: 340000,
            originalPrice: 500000,
          },
        ],
      },
      {
        id: 703,
        name: 'Sweaters & Cardigans',
        products: [
          {
            id: 70301,
            name: 'Pattern Cardigan',
            brand: 'Guuka',
            image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200',
            price: 480000,
            originalPrice: 680000,
          },
          {
            id: 70302,
            name: 'Turtleneck Sweater',
            brand: 'Unvesno',
            image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200',
            price: 350000,
            originalPrice: 500000,
          },
          {
            id: 70303,
            name: 'Knit Cardigan',
            brand: 'Guuka',
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200',
            price: 420000,
            originalPrice: 600000,
          },
        ],
      },
      { id: 704, name: 'Headwear' },
      { id: 705, name: 'Urban Sets' },
    ],
    featuredProducts: [
      {
        id: 1019,
        name: 'Oversize Hoodie',
        brand: 'Beaster',
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200',
        price: 450000,
        originalPrice: 650000,
      },
      {
        id: 1020,
        name: 'Cargo Pants',
        brand: 'Inflation',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200',
        price: 320000,
        originalPrice: 480000,
      },
      {
        id: 1021,
        name: 'Pattern Cardigan',
        brand: 'Guuka',
        image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200',
        price: 480000,
        originalPrice: 680000,
      },
    ],
    discountProduct: {
      id: 2007,
      name: 'Street Style',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea1f1c64?w=400',
      discount: 38,
      price: 399000,
      description: 'Urban streetwear collection. Stand out with style!',
    },
  },
  {
    id: 8,
    name: 'Underwear & Loungewear',
    subcategories: [
      {
        id: 801,
        name: 'Pajamas',
        products: [
          {
            id: 80101,
            name: 'Silk Pajama Set',
            brand: 'Gukoo',
            image: 'https://images.unsplash.com/photo-1594369003016-6b0a89f50370?w=200',
            price: 350000,
            originalPrice: 500000,
          },
          {
            id: 80102,
            name: 'Cotton Pajama',
            brand: 'Many many',
            image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=200',
            price: 280000,
            originalPrice: 400000,
          },
          {
            id: 80103,
            name: 'Long Sleeve Silk PJs',
            brand: 'Gukoo',
            image: 'https://images.unsplash.com/photo-1615397349754-f8d6b632c925?w=200',
            price: 350000,
            originalPrice: 500000,
          },
        ],
      },
      {
        id: 802,
        name: "Men's Underwear",
        products: [
          {
            id: 80201,
            name: 'Boxer Set (3 pieces)',
            brand: 'Miiow',
            image: 'https://images.unsplash.com/photo-1600095472779-38a55464d9ce?w=200',
            price: 180000,
            originalPrice: 270000,
          },
          {
            id: 80202,
            name: 'Cotton Briefs',
            brand: 'Hodoh',
            image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=200',
            price: 55000,
            originalPrice: 80000,
          },
          {
            id: 80203,
            name: 'Premium Boxer 5-Pack',
            brand: 'Miiow',
            image: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=200',
            price: 250000,
            originalPrice: 360000,
          },
        ],
      },
      {
        id: 803,
        name: 'Socks',
        products: [
          {
            id: 80301,
            name: 'High Socks with Pattern',
            brand: 'Tutuanna',
            image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=200',
            price: 35000,
            originalPrice: 50000,
          },
          {
            id: 80302,
            name: 'No-Show Socks 5-Pack',
            brand: 'Caramella',
            image: 'https://images.unsplash.com/photo-1580713019097-fc2d36aa6865?w=200',
            price: 90000,
            originalPrice: 130000,
          },
          {
            id: 80303,
            name: 'Cotton Crew Socks',
            brand: 'Tutuanna',
            image: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=200',
            price: 45000,
            originalPrice: 65000,
          },
        ],
      },
      { id: 804, name: 'Bath Robes' },
      { id: 805, name: 'House Slippers' },
    ],
    featuredProducts: [
      {
        id: 1022,
        name: 'Silk Pajama Set',
        brand: 'Gukoo',
        image: 'https://images.unsplash.com/photo-1594369003016-6b0a89f50370?w=200',
        price: 350000,
        originalPrice: 500000,
      },
      {
        id: 1023,
        name: 'Boxer Set (3 pieces)',
        brand: 'Miiow',
        image: 'https://images.unsplash.com/photo-1600095472779-38a55464d9ce?w=200',
        price: 180000,
        originalPrice: 270000,
      },
      {
        id: 1024,
        name: 'Cotton Bath Robe',
        brand: 'Grace',
        image: 'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=200',
        price: 450000,
        originalPrice: 630000,
      },
    ],
    discountProduct: {
      id: 2008,
      name: 'Comfort Collection',
      image: 'https://images.unsplash.com/photo-1578302537155-c5ce1b36a0e4?w=400',
      discount: 30,
      price: 249000,
      description: 'Premium loungewear for home comfort. Relax in style!',
    },
  },
];

const Header = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const cartTotalItems = useSelector(selectCartTotalItems);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);

  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState(''); // 'wishlist' or 'cart'
  const dropdownRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const megaMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setHoveredCategory(null);
        setActiveSubcategory(null);
        setActiveBrand(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    },
    []
  );

  // Fetch cart data when user logs in (only when authentication state changes to true)
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    // Only fetch cart when user transitions from not authenticated to authenticated
    if (isAuthenticated && !prevAuthRef.current) {
      dispatch(fetchCart());
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, dispatch]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate(PUBLIC_ROUTES.HOME);
      setShowProfileDropdown(false);
    } catch (error) {
      // noop
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't fetch suggestions for empty or very short queries
    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    // Set loading state
    setSearchLoading(true);

    // Debounce API call (wait 300ms after user stops typing)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchService.getAutocomplete(value.trim());

        // Handle response - backend returns data directly or nested
        const suggestions = response.data?.data || response.data || {};

        setSearchSuggestions(suggestions);

        // Show dropdown if we have any suggestions
        const hasResults =
          (suggestions.products && suggestions.products.length > 0) ||
          (suggestions.categories && suggestions.categories.length > 0) ||
          (suggestions.brands && suggestions.brands.length > 0);

        setShowSearchDropdown(hasResults);
      } catch (error) {
        setSearchSuggestions({});
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  // Handle search submit (Enter key or Search button click)
  const handleSearchSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedQuery = searchQuery.trim();
    // Navigate to products page (with or without search query)
    if (trimmedQuery) {
      navigate(`${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      // No query - show all products
      navigate(PUBLIC_ROUTES.PRODUCTS);
    }
    setShowSearchDropdown(false);
    setSearchQuery(''); // Clear search input after submit
    setSearchLoading(false); // Reset loading state
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product' && suggestion._id) {
      navigate(`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', suggestion._id)}`);
    } else if (suggestion.type === 'category' && suggestion._id) {
      navigate(`${PUBLIC_ROUTES.CATEGORY_PRODUCTS.replace(':categoryId', suggestion._id)}`);
    } else if (suggestion.name) {
      setSearchQuery(suggestion.name);
      navigate(`${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(suggestion.name)}`);
    }
    setShowSearchDropdown(false);
  };

  // Handle search icon click
  const handleSearchIconClick = () => {
    handleSearchSubmit();
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    if (activeCategory?.id === category.id) {
      setActiveCategory(null);
      setHoveredCategory(null);
    } else {
      setActiveCategory(category);
      setHoveredCategory(category);
    }
    setActiveSubcategory(null);
    setActiveBrand(null);
  };

  // Handle wishlist click
  const handleWishlistClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setLoginModalType('wishlist');
      setShowLoginModal(true);
    }
  };

  // Handle cart click
  const handleCartClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setLoginModalType('cart');
      setShowLoginModal(true);
    }
  };

  // Handle login modal confirm
  const handleLoginModalConfirm = () => {
    setShowLoginModal(false);
    navigate(PUBLIC_ROUTES.LOGIN);
  };

  // Handle login modal cancel
  const handleLoginModalCancel = () => {
    setShowLoginModal(false);
    setLoginModalType('');
  };

  // Get user display name and avatar
  const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const userAvatar =
    user?.avatar ||
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=random`;

  // Get current category data
  const currentCategoryData = hoveredCategory || activeCategory;

  return (
    <header>
      {/* Top Bar */}
      <div
        style={{ backgroundColor: '#191C1F' }}
        className="text-light py-2 small d-none d-md-block"
      >
        <div className="container">
          <div className="d-flex justify-content-between align-items-center text-nowrap">
            <div>
              {(!isAuthenticated || user?.role === USER_ROLES.BUYER) && (
                <>
                  Wanna become a seller?
                  <Link
                    to={BUYER_ROUTES.SELLER_APPLICATION}
                    className="text-warning text-decoration-none fw-bold ms-1"
                    style={{ transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.target.style.color = '#ffc107')}
                    onMouseLeave={(e) => (e.target.style.color = '')}
                  >
                    Sent application here
                  </Link>
                </>
              )}
            </div>
            <div className="d-flex align-items-center justify-content-end gap-3">
              <NotificationBell />
              <span className="text-secondary">|</span>
              <div className="position-relative" ref={languageDropdownRef}>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="d-flex align-items-center gap-1 border-0 bg-transparent p-0 text-light"
                  style={{ cursor: 'pointer' }}
                >
                  <Globe size={14} />
                  <span>{i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: showLanguageDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {showLanguageDropdown && (
                  <div
                    className="position-absolute bg-white border rounded shadow-lg"
                    style={{
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      minWidth: '180px',
                      zIndex: 1000,
                      padding: '6px 0',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <button
                      className="border-0 bg-transparent w-100 px-3 py-2 text-dark"
                      style={{
                        display: 'block',
                        transition: 'background-color 0.2s',
                        textAlign: 'left',
                        color: i18n.language === 'vi' ? '#EE4D2D' : '#212529',
                        fontWeight: i18n.language === 'vi' ? '600' : '400',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        i18n.changeLanguage('vi');
                        setShowLanguageDropdown(false);
                      }}
                    >
                      Tiếng Việt
                    </button>
                    <button
                      className="border-0 bg-transparent w-100 px-3 py-2 text-dark"
                      style={{
                        display: 'block',
                        transition: 'background-color 0.2s',
                        textAlign: 'left',
                        color: i18n.language === 'en' ? '#EE4D2D' : '#212529',
                        fontWeight: i18n.language === 'en' ? '600' : '400',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        i18n.changeLanguage('en');
                        setShowLanguageDropdown(false);
                      }}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              <span className="text-secondary">|</span>

              {isAuthenticated && user ? (
                <div className="position-relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="d-flex align-items-center gap-2 text-light border-0 bg-transparent p-0"
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={userAvatar}
                      alt={userDisplayName}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid rgba(255,255,255,0.35)',
                      }}
                    />
                    <span>{userDisplayName}</span>
                    <ChevronDown
                      size={13}
                      style={{
                        transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>

                  {showProfileDropdown && (
                    <div
                      className="position-absolute bg-white border rounded shadow-lg"
                      style={{
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        minWidth: '200px',
                        zIndex: 1000,
                        padding: '8px 0',
                      }}
                    >
                      <Link
                        to={
                          user?.role === USER_ROLES.ADMIN
                            ? ADMIN_ROUTES.DASHBOARD
                            : user?.role === USER_ROLES.SELLER
                              ? SELLER_ROUTES.DASHBOARD
                              : BUYER_ROUTES.DASHBOARD
                        }
                        className="d-flex align-items-center gap-2 text-decoration-none text-dark px-3 py-2"
                        style={{
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <LayoutDashboard size={18} />
                        <span>{t('header.dashboard')}</span>
                      </Link>
                      <div className="border-top my-1"></div>
                      <Link
                        to={
                          user?.role === USER_ROLES.ADMIN
                            ? ADMIN_ROUTES.PROFILE
                            : user?.role === USER_ROLES.SELLER
                              ? SELLER_ROUTES.PROFILE
                              : BUYER_ROUTES.PROFILE
                        }
                        className="d-flex align-items-center gap-2 text-decoration-none text-dark px-3 py-2"
                        style={{
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <UserCircle size={18} />
                        <span>{t('header.profile')}</span>
                      </Link>
                      <div className="border-top my-1"></div>
                      <Link
                        to="/change-password"
                        className="d-flex align-items-center gap-2 text-decoration-none text-dark px-3 py-2"
                        style={{
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span>{t('header.change_password')}</span>
                      </Link>
                      <div className="border-top my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="d-flex align-items-center gap-2 text-decoration-none text-dark border-0 bg-transparent w-100 px-3 py-2"
                        style={{
                          transition: 'background-color 0.2s',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                      >
                        <LogOut size={18} />
                        <span>{t('header.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={PUBLIC_ROUTES.LOGIN}
                  className="d-flex align-items-center gap-2 text-decoration-none text-light"
                >
                  <User size={16} />
                  <span>{t('header.login')}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white py-3 py-lg-4 shadow-sm border-bottom">
        <div className="container">
          <div className="row align-items-center gy-3">
            {/* Logo & Menu */}
            <div className="col-6 col-lg-3 d-flex align-items-center gap-3">
              <Link
                to={PUBLIC_ROUTES.HOME}
                className="text-decoration-none text-dark d-flex align-items-center gap-2"
              >
                <img
                  src="/logo.png"
                  alt="GZMart"
                  style={{ height: '90px', objectFit: 'contain' }}
                />
                <span className="text-secondary mx-1">|</span>
                <h2 className="h3 fw-bolder mb-0 tracking-tight">GZMart</h2>
              </Link>
              <div className="d-none d-xl-block">
                <Link to={PUBLIC_ROUTES.DEALS}>
                  <img
                    src="/flashsale.png"
                    alt="Flash Sale"
                    style={{ height: '45px', objectFit: 'contain', cursor: 'pointer' }}
                  />
                </Link>
              </div>
            </div>

            {/* Actions (Mobile) */}
            <div className="col-6 d-lg-none d-flex justify-content-end align-items-center gap-3">
              <Link
                to={BUYER_ROUTES.CART}
                className="text-dark position-relative"
                onClick={handleCartClick}
              >
                <ShoppingCart size={24} />
                {cartTotalItems > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                    style={{ fontSize: '0.6rem' }}
                  >
                    {cartTotalItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Search Bar */}
            <div className="col-12 col-lg-5">
              <div className="d-flex align-items-center w-100">
                <div className="position-relative flex-grow-1 w-100" ref={searchDropdownRef}>
                  <form onSubmit={handleSearchSubmit} className="input-group">
                    <span
                      className="input-group-text border-0 pe-0 rounded-start"
                      style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }}
                      onClick={handleSearchIconClick}
                    >
                      {searchLoading ? (
                        <Loader2
                          size={20}
                          className="text-secondary"
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                      ) : (
                        <Search size={20} className="text-secondary" />
                      )}
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 ps-3 text-dark py-2"
                      style={{
                        backgroundColor: '#F3F4F6',
                        boxShadow: 'none',
                        outline: 'none',
                      }}
                      placeholder={t('header.search_placeholder')}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() =>
                        searchQuery.trim().length >= 2 &&
                        searchSuggestions.length > 0 &&
                        setShowSearchDropdown(true)
                      }
                    />
                  </form>

                  {/* Search Suggestions Dropdown */}
                  {showSearchDropdown && (
                    <div
                      className="position-absolute bg-white border rounded shadow-lg w-100"
                      style={{
                        top: '100%',
                        left: 0,
                        marginTop: '8px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        zIndex: 1000,
                      }}
                    >
                      {/* Products Section */}
                      {searchSuggestions.products && searchSuggestions.products.length > 0 && (
                        <div className="py-2">
                          <div className="px-3 py-1 text-muted small fw-bold">
                            {t('header.search_results.products')}
                          </div>
                          {searchSuggestions.products.slice(0, 5).map((product) => (
                            <div
                              key={product._id}
                              className="px-3 py-2 d-flex align-items-center gap-3"
                              style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f8f9fa')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                              }
                              onClick={() => handleSuggestionClick({ ...product, type: 'product' })}
                            >
                              {product.images && product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                  }}
                                />
                              )}
                              <div className="flex-grow-1">
                                <div className="text-dark small">{product.name}</div>
                                {product.price && (
                                  <div className="text-primary small fw-bold">
                                    {new Intl.NumberFormat('vi-VN', {
                                      style: 'currency',
                                      currency: 'VND',
                                    }).format(product.price)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Categories Section */}
                      {searchSuggestions.categories && searchSuggestions.categories.length > 0 && (
                        <div className="py-2 border-top">
                          <div className="px-3 py-1 text-muted small fw-bold">
                            {t('header.search_results.categories')}
                          </div>
                          {searchSuggestions.categories.slice(0, 3).map((category) => (
                            <div
                              key={category._id}
                              className="px-3 py-2 d-flex align-items-center gap-2"
                              style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f8f9fa')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                              }
                              onClick={() =>
                                handleSuggestionClick({ ...category, type: 'category' })
                              }
                            >
                              <Tag size={16} className="text-secondary" />
                              <span className="text-dark small">{category.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Brands Section */}
                      {searchSuggestions.brands && searchSuggestions.brands.length > 0 && (
                        <div className="py-2 border-top">
                          <div className="px-3 py-1 text-muted small fw-bold">
                            {t('header.search_results.brands')}
                          </div>
                          {searchSuggestions.brands.slice(0, 3).map((brand) => (
                            <div
                              key={brand._id}
                              className="px-3 py-2 d-flex align-items-center gap-2"
                              style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f8f9fa')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                              }
                              onClick={() => handleSuggestionClick({ ...brand, type: 'brand' })}
                            >
                              {brand.logo && (
                                <img
                                  src={brand.logo}
                                  alt={brand.name}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    objectFit: 'contain',
                                  }}
                                />
                              )}
                              <span className="text-dark small">{brand.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="col-12 col-lg-4 d-none d-lg-flex justify-content-end align-items-center">
              <Link
                to={BUYER_ROUTES.WISHLIST}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
                onClick={handleWishlistClick}
              >
                <Heart size={24} /> <span>{t('header.wishlist')}</span>
              </Link>
              <span className="mx-3 text-secondary opacity-25">|</span>
              <Link
                to={BUYER_ROUTES.CART}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark position-relative"
                onClick={handleCartClick}
              >
                <div className="position-relative">
                  <ShoppingCart size={24} />
                  {cartTotalItems > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                      style={{ fontSize: '0.6rem' }}
                    >
                      {cartTotalItems}
                    </span>
                  )}
                </div>
                <span>{t('header.cart')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar with Mega Menu */}
      <div className="bg-white border-bottom shadow-sm position-relative" ref={megaMenuRef}>
        <div className="container">
          <div
            className="d-flex justify-content-start justify-content-lg-center overflow-auto py-2 gap-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FAKE_CATEGORIES_DATA.map((category) => {
              const isActive =
                activeCategory?.id === category.id || hoveredCategory?.id === category.id;
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill cursor-pointer border flex-shrink-0 ${
                    isActive ? 'bg-dark text-white border-dark' : 'text-dark border-0'
                  }`}
                  style={{
                    fontSize: '14px',
                    backgroundColor: isActive ? '#212529' : '#F3F9FB',
                    userSelect: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span className="fw-medium">{category.name}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        {currentCategoryData &&
          (() => {
            // Extract unique brands from selected subcategory
            const uniqueBrands = activeSubcategory?.products
              ? [...new Set(activeSubcategory.products.map((p) => p.brand).filter(Boolean))]
              : [];

            // Filter products by selected brand
            const displayProducts = activeSubcategory?.products
              ? activeBrand
                ? activeSubcategory.products.filter((p) => p.brand === activeBrand)
                : activeSubcategory.products
              : currentCategoryData.featuredProducts;

            return (
              <div
                className="position-absolute bg-white shadow-lg border-top mega-menu-scroll"
                style={{
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000,
                  maxWidth: '1200px',
                  width: '95%',
                  maxHeight: '520px',
                  overflowY: 'auto',
                  borderRadius: '0 0 12px 12px',
                  animation: 'slideDown 0.3s ease-out',
                }}
              >
                <div
                  className="d-flex gap-3 py-3 px-3"
                  style={{
                    minHeight: '400px',
                  }}
                >
                  {/* Column 1 - Subcategories */}
                  <div
                    style={{
                      width: '200px',
                      flexShrink: 0,
                      borderRight: '1px solid #e9ecef',
                      paddingRight: '12px',
                    }}
                  >
                    <h6
                      className="fw-bold mb-2 text-uppercase"
                      style={{ fontSize: '0.75rem', color: '#6c757d' }}
                    >
                      Categories
                    </h6>
                    <div className="d-flex flex-column gap-1">
                      {currentCategoryData.subcategories.map((subcategory) => (
                        <div
                          key={subcategory.id}
                          onClick={() => {
                            setActiveSubcategory(subcategory);
                            setActiveBrand(null); // Reset brand when changing subcategory
                          }}
                          className={`d-flex align-items-center justify-content-between px-2 py-2 rounded ${
                            activeSubcategory?.id === subcategory.id
                              ? 'bg-dark text-white'
                              : 'text-dark'
                          }`}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.85rem',
                            backgroundColor:
                              activeSubcategory?.id === subcategory.id ? '#212529' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (activeSubcategory?.id !== subcategory.id) {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeSubcategory?.id !== subcategory.id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <span className="text-truncate">{subcategory.name}</span>
                          <ChevronRight size={14} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2 - Brands (only show when subcategory is selected) */}
                  {activeSubcategory && uniqueBrands.length > 0 && (
                    <div
                      style={{
                        width: '180px',
                        flexShrink: 0,
                        borderRight: '1px solid #e9ecef',
                        paddingRight: '12px',
                      }}
                    >
                      <h6
                        className="fw-bold mb-2 text-uppercase"
                        style={{ fontSize: '0.75rem', color: '#6c757d' }}
                      >
                        Brands
                      </h6>
                      <div className="d-flex flex-column gap-1">
                        {uniqueBrands.map((brand, index) => (
                          <div
                            key={index}
                            onClick={() => setActiveBrand(brand)}
                            className={`px-2 py-2 rounded ${
                              activeBrand === brand ? 'bg-primary text-white' : 'text-dark'
                            }`}
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontSize: '0.85rem',
                              backgroundColor: activeBrand === brand ? '#0d6efd' : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (activeBrand !== brand) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeBrand !== brand) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <span className="text-truncate d-block">{brand}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Column 3 - Products */}
                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <h6
                      className="fw-bold mb-2 text-uppercase"
                      style={{ fontSize: '0.75rem', color: '#6c757d' }}
                    >
                      {activeBrand
                        ? `${activeBrand} Products`
                        : activeSubcategory
                          ? activeSubcategory.name
                          : 'Featured Products'}
                    </h6>
                    <div
                      className="d-flex flex-column gap-2 mega-menu-scroll"
                      style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}
                    >
                      {displayProducts.slice(0, 4).map((product) => (
                        <div
                          key={product.id}
                          className="d-flex align-items-center gap-2 p-2 rounded"
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid transparent',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#dee2e6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                          onClick={() => {
                            setHoveredCategory(null);
                            setActiveSubcategory(null);
                            setActiveBrand(null);
                          }}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{
                              width: '65px',
                              height: '65px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              flexShrink: 0,
                              backgroundColor: '#f8f9fa',
                            }}
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/65x65/f8f9fa/6c757d?text=No+Image';
                            }}
                          />
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                              {product.brand}
                            </div>
                            <div
                              className="fw-medium text-dark mb-1 text-truncate"
                              style={{ fontSize: '0.9rem' }}
                              title={product.name}
                            >
                              {product.name}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {product.originalPrice && (
                                <span
                                  className="text-muted text-decoration-line-through"
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  {product.originalPrice.toLocaleString('vi-VN')}₫
                                </span>
                              )}
                              <span
                                className="text-primary fw-bold"
                                style={{ fontSize: '0.95rem' }}
                              >
                                {product.price.toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4 - Discount Product */}
                  <div
                    style={{
                      width: '280px',
                      flexShrink: 0,
                      marginLeft: 'auto',
                    }}
                  >
                    <div
                      className="rounded p-3 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%)',
                        minHeight: '380px',
                        maxHeight: '420px',
                      }}
                    >
                      {/* Decorative circle */}
                      <div
                        className="position-absolute rounded-circle"
                        style={{
                          width: '180px',
                          height: '180px',
                          background: 'rgba(255, 138, 0, 0.1)',
                          top: '-60px',
                          right: '-60px',
                          zIndex: 0,
                        }}
                      />

                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div
                          className="badge bg-danger text-white px-2 py-1 mb-2"
                          style={{
                            fontSize: '0.7rem',
                            animation: 'pulse 2s ease-in-out infinite',
                          }}
                        >
                          HOT DEAL
                        </div>
                        <h3
                          className="fw-bold mb-2"
                          style={{
                            fontSize: '2.5rem',
                            color: '#FF8A00',
                            lineHeight: '1',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {currentCategoryData.discountProduct.discount}% OFF
                        </h3>
                        <p
                          className="text-dark mb-2"
                          style={{ fontSize: '0.85rem', lineHeight: '1.4' }}
                        >
                          {currentCategoryData.discountProduct.description}
                        </p>
                        <div className="mb-3">
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                            Starting from
                          </span>
                          <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>
                            {currentCategoryData.discountProduct.price.toLocaleString('vi-VN')}₫
                          </div>
                        </div>
                      </div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <img
                          src={currentCategoryData.discountProduct.image}
                          alt={currentCategoryData.discountProduct.name}
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                          className="mb-2"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/280x150/FFF4E6/FF8A00?text=Special+Offer';
                          }}
                        />
                        <button
                          className="btn btn-warning w-100 fw-bold text-white py-2 discount-btn-hover"
                          style={{
                            backgroundColor: '#FF8A00',
                            border: 'none',
                            fontSize: '0.9rem',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(255, 138, 0, 0.3)',
                            transition: 'all 0.3s ease',
                          }}
                          onClick={() => {
                            setHoveredCategory(null);
                            setActiveSubcategory(null);
                            setActiveBrand(null);
                          }}
                        >
                          SHOP NOW →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>

      {/* Login Required Modal */}
      {showLoginModal && (
        <>
          {/* Backdrop */}
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 9998 }}
            onClick={handleLoginModalCancel}
          />

          {/* Modal */}
          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow-lg"
            style={{
              zIndex: 9999,
              maxWidth: '450px',
              width: '90%',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            <div className="p-4">
              {/* Icon */}
              <div className="text-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#FFF4E6',
                  }}
                >
                  {loginModalType === 'wishlist' ? (
                    <Heart size={30} className="text-warning" />
                  ) : (
                    <ShoppingCart size={30} className="text-warning" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h5 className="text-center fw-bold mb-2">
                {t('header.login_required_title') || 'Login Required'}
              </h5>

              {/* Message */}
              <p className="text-center text-muted mb-4">
                {loginModalType === 'wishlist'
                  ? t('header.login_required_wishlist_msg') ||
                    'Please login to access your wishlist and save your favorite items.'
                  : t('header.login_required_cart_msg') ||
                    'Please login to access your cart and continue shopping.'}
              </p>

              {/* Buttons */}
              <div className="d-flex gap-3">
                <button
                  onClick={handleLoginModalCancel}
                  className="btn btn-outline-secondary flex-grow-1 py-2"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500',
                  }}
                >
                  {t('header.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleLoginModalConfirm}
                  className="btn btn-warning flex-grow-1 py-2 text-white"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500',
                    backgroundColor: '#FF8A00',
                    border: 'none',
                  }}
                >
                  {t('header.go_to_login') || 'Go to Login'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
