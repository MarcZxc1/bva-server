import './SellerDashboard.css';

const CampaignCard = () => {
  return (
    <div className="dashboard-card campaign-card">
      <div className="card-header">
        <h3 className="card-title">Campaign</h3>
        <a href="#" className="more-link">More &gt;</a>
      </div>
      <div className="card-content">
        <div className="campaign-scroll">
          <div className="campaign-item payday-sale">
            <div className="campaign-banner">
              <span className="campaign-logo-text">Shopee</span>
            </div>
            <div className="campaign-details">
              <h4>12.15 Payday Sale</h4>
              <p>13 Dec 2025 - 17 Dec 2025</p>
              <div className="campaign-buttons">
                <button className="campaign-type-btn">Product Campaign</button>
                <button className="join-btn">Join</button>
              </div>
            </div>
          </div>
          <div className="campaign-item mega-discount">
            <div className="campaign-banner">
              <span className="campaign-banner-text">—MEGA— DISCOUNT VOUCHERS</span>
            </div>
            <div className="campaign-details">
              <h4>Mega Discount Voucher</h4>
              <p>Valid for Long Term</p>
              <div className="campaign-buttons">
                <button className="campaign-type-btn">Mega Discount Vouche</button>
                <button className="join-btn">Join</button>
              </div>
            </div>
          </div>
          <div className="campaign-item live-xtra">
            <div className="campaign-banner">
              <span className="campaign-banner-text">LIVE XTRA</span>
              <span className="campaign-subtext">BOOST YOUR SALES PERFORMANCE</span>
            </div>
            <div className="campaign-details">
              <h4>Live XTRA</h4>
              <p>Valid for Long Term</p>
              <div className="campaign-buttons">
                <button className="campaign-type-btn">Live XTRA</button>
                <button className="join-btn">Join</button>
              </div>
            </div>
          </div>
          <div className="campaign-item shipping-support">
            <div className="campaign-banner">
              <span className="campaign-banner-text">RR SHIPPING SUPPORT PROG</span>
              <span className="campaign-subtext">SAVE 100% OF YOUR SHIPPIN</span>
            </div>
            <div className="campaign-details">
              <h4>RR Shipping Fee Sur &gt;</h4>
              <p>1 Jan 2026 - 31 Jan 2026</p>
              <div className="campaign-buttons">
                <button className="campaign-type-btn">RR Shipping Fee Suppo</button>
                <button className="join-btn">Join</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;

