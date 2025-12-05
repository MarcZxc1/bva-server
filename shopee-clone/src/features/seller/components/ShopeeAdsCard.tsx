import './SellerDashboard.css';

const ShopeeAdsCard = () => {
  return (
    <div className="dashboard-card shopee-ads-card">
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-title">Shopee Ads</h3>
          <span className="info-icon">?</span>
        </div>
        <a href="#" className="more-link">More &gt;</a>
      </div>
      <div className="card-content">
        <div className="ads-card-white">
          <div className="ads-content">
            <svg className="ads-icon-blue" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#1890ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#1890ff" fillOpacity="0.1"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#1890ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="8" r="2" fill="#1890ff"/>
            </svg>
            <div className="ads-text">
              <h4>Maximise your sales with Shopee Ads!</h4>
              <p>Learn more about Shopee Ads. Find the right way to advertise and make your Ads affordable.</p>
            </div>
          </div>
          <div className="ads-button-container">
            <button className="learn-more-btn ads-btn">Learn More</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopeeAdsCard;

