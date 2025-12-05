import SellerLayout from './SellerLayout';
import Breadcrumb from './Breadcrumb';
import ToDoListCard from './ToDoListCard';
import BusinessInsightsCard from './BusinessInsightsCard';
import ShopPerformanceCard from './ShopPerformanceCard';
import AnnouncementsCard from './AnnouncementsCard';
import ShopeeAdsCard from './ShopeeAdsCard';
import AffiliateMarketingCard from './AffiliateMarketingCard';
import LivestreamCard from './LivestreamCard';
import CampaignCard from './CampaignCard';
import './SellerDashboard.css';

const SellerDashboard = () => {
  return (
    <SellerLayout>
      <Breadcrumb />
      <div className="dashboard-grid">
        <div className="dashboard-left-column">
          <ToDoListCard />
          <BusinessInsightsCard />
          <ShopeeAdsCard />
        </div>

        <div className="dashboard-right-column">
          <ShopPerformanceCard />
          <AnnouncementsCard />
        </div>
      </div>

      <div className="marketing-section">
        <div className="marketing-middle-row">
          <AffiliateMarketingCard />
          <LivestreamCard />
        </div>
        <div className="marketing-bottom-row">
          <CampaignCard />
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerDashboard;
