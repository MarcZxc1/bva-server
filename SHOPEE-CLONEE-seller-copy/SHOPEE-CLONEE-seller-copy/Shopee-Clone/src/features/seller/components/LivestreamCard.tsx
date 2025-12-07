import './SellerDashboard.css';

const LivestreamCard = () => {
  return (
    <div className="dashboard-card livestream-card">
      <div className="card-header">
        <h3 className="card-title">Livestream</h3>
        <a href="#" className="more-link">More &gt;</a>
      </div>
      <div className="card-content">
        <div className="livestream-illustration">
          <div className="livestream-text">
            <p>Start streaming now! Increase your conversion up to <strong>2x!</strong></p>
            <button className="create-stream-btn">Create Stream &gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivestreamCard;

