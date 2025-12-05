import './SellerDashboard.css';

const SellerMissionsCard = () => {
  return (
    <div className="dashboard-card missions-card">
      <div className="card-header">
        <h3 className="card-title">Seller Missions</h3>
        <a href="#" className="more-link">More &gt;</a>
      </div>
      <div className="card-content">
        <div className="missions-content">
          <div className="trophy-container">
            <span className="trophy-icon">🏆</span>
            <span className="stars">⭐⭐</span>
          </div>
          <p>Great job! You've completed all Missions! Watch this space for new additions.</p>
        </div>
      </div>
    </div>
  );
};

export default SellerMissionsCard;

