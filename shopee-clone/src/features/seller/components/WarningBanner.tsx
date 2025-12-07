                                                                                                                                              import './SellerDashboard.css';

const WarningBanner = () => {
  return (
    <div className="warning-banner">
      <span className="warning-icon">⚠️</span>
      <span className="warning-text">
        Your shop and products are currently hidden from public view due to incomplete business information. 
        Kindly update your business information <a href="#" className="warning-link">here</a>. 
        To learn more, <a href="#" className="warning-link">click here</a>.
      </span>
    </div>
  );
};

export default WarningBanner;

