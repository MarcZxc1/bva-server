import './SellerDashboard.css';

const FulfilledByShopeeCard = () => {
  return (
    <div className="dashboard-card fulfilled-card">
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-title">Fulfilled by Shopee</h3>
          <span className="new-badge">New</span>
        </div>
        <a href="#" className="more-link">More &gt;</a>
      </div>
      <div className="card-content">
        <div className="fulfilled-illustration">
          <p className="fulfilled-text">Enjoy hassle-free operations and focus on growing your business</p>
          <button className="learn-more-btn">Learn More &gt;</button>
        </div>
      </div>
    </div>
  );
};

export default FulfilledByShopeeCard;

