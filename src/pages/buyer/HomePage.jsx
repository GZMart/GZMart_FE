import React from 'react';
import HeroBanner from '../../components/homepage/HeroBanner.jsx';
import FeatureBar from '../../components/homepage/FeatureBar.jsx';
import ShopByBrands from '../../components/homepage/ShopByBrands.jsx';
import DealsOfTheDay from '../../components/homepage/DealsOfTheDay.jsx';
import TopCategories from '../../components/homepage/TopCategories.jsx';
import TopClothingBrand from '../../components/homepage/TopClothingBrand.jsx';
import FrequentlyBoughtTogether from '../../components/homepage/FrequentlyBoughtTogether.jsx';

const HomePage = () => {
  return (
    <>
      <HeroBanner />
      <FeatureBar />
      {/* <ShopByBrands /> */}
      <DealsOfTheDay />
      <TopCategories />
      <TopClothingBrand />
      <FrequentlyBoughtTogether />
    </>
  );
};

export default HomePage;
