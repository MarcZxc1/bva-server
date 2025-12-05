import './SellerDashboard.css';

const ShopPerformanceCard = () => {
  return (
    <div className="dashboard-card performance-card">
      <div className="card-header">
        <h3 className="card-title">Shop Performance</h3>
      </div>
      <div className="card-content">
        <div className="performance-content">
          <div className="performance-rating blue">Excellent</div>
          <p className="performance-text">All metrics are meeting the targets.</p>
          <span className="performance-arrow">→</span>
        </div>
      </div>
    </div>
  );
};

export default ShopPerformanceCard;

