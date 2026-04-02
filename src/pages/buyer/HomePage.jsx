import HeroBanner from '../../components/common/homepage/HeroBanner.jsx';
import FeatureBar from '../../components/common/homepage/FeatureBar.jsx';
import ShopByBrands from '../../components/common/homepage/ShopByBrands.jsx';
import DealsOfTheDay from '../../components/common/homepage/DealsOfTheDay.jsx';
import TopCategories from '../../components/common/homepage/TopCategories.jsx';
import TopClothingBrand from '../../components/common/homepage/TopClothingBrand.jsx';
import TodayRecommendations from '../../components/common/homepage/TodayRecommendations.jsx';

const HomePage = () => (
  <>
    <HeroBanner />
    <FeatureBar />
    <ShopByBrands />
    <DealsOfTheDay />
    <TopCategories />
    <TopClothingBrand />
    <TodayRecommendations />
  </>
);

export default HomePage;
