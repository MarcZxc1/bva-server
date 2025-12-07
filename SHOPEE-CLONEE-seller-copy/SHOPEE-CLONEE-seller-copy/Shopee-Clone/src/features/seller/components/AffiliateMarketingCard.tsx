import './SellerDashboard.css';

const AffiliateMarketingCard = () => {
  return (
    <div className="dashboard-card affiliate-marketing-card">
      <div className="card-header">
        <h3 className="card-title">Affiliate Marketing Solution</h3>
        <a href="#" className="more-link">More &gt;</a>
      </div>
      <div className="card-content">
        <div className="affiliate-banner">
          <div className="affiliate-banner-icon">💰</div>
          <p className="affiliate-banner-text">Only pay for successful orders brought by affiliates!</p>
        </div>
        <div className="affiliate-section">
          <h4>Set Commissions to Promote Your Shop</h4>
          <p className="affiliate-info">9,000+ shops in same category have increased sales through affiliates.</p>
          <div className="commission-input-group">
            <input type="number" className="commission-input" defaultValue="8" />
            <span className="percent-sign">%</span>
            <button className="check-btn">✓</button>
          </div>
          <p className="suggested-text">Suggested: 8% - 13% (?)</p>
          <div className="potential-sales">
            <span className="sales-text">Potential Sales: +23%</span>
            <span className="arrow-up">↑</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateMarketingCard;

