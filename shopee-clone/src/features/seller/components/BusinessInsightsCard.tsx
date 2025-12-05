import './SellerDashboard.css';

const BusinessInsightsCard = () => {
  return (
    <div className="dashboard-card insights-card">
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-title">Business Insights</h3>
        </div>
        <a href="#" className="more-link">More &gt;</a>
      </div>
      <div className="card-content">
        <p className="insights-subtitle">
          Real-time data until GMT+8 22:00 (Data changes is compared to yesterday)
        </p>
        <div className="insights-metrics">
          <div className="metric-item">
            <div className="metric-label">
              Sales
              <span className="info-icon-small">?</span>
            </div>
            <div className="metric-value">₱0</div>
            <div className="metric-change negative">- 0.00%</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">
              Visitors
              <span className="info-icon-small">?</span>
            </div>
            <div className="metric-value">0</div>
            <div className="metric-change negative">- 0.00%</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">
              Product Clicks
              <span className="info-icon-small">?</span>
            </div>
            <div className="metric-value">0</div>
            <div className="metric-change negative">- 0.00%</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">
              Orders
              <span className="info-icon-small">?</span>
            </div>
            <div className="metric-value">0</div>
            <div className="metric-change negative">- 0.00%</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">
              Order Conversion Rate
              <span className="info-icon-small">?</span>
            </div>
            <div className="metric-value">0.00%</div>
            <div className="metric-change negative">- 0.00%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessInsightsCard;

