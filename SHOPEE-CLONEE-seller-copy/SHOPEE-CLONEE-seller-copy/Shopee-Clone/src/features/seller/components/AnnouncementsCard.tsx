import './SellerDashboard.css';

const AnnouncementsCard = () => {
  return (
    <div className="dashboard-card announcements-card">
      <div className="card-header">
        <h3 className="card-title">Announcements</h3>
        <a href="#" className="more-link">More &gt;</a>
      </div>
      <div className="card-content">
        <div className="announcements-list">
          <div className="announcement-item featured">
            <div className="announcement-banner">
              <div className="banner-logo-container">
                <span className="banner-logo">🛒</span>
              </div>
              <div className="banner-text">ADVISORY: DTI TRUSTMARK</div>
            </div>
            <div className="banner-content-wrapper">
              <p className="announcement-content-banner">
                In compliance with DTI DAO No. 25-12, online sellers must obtain the DTI Trustmark. 
                Place your application reference or security number in your Shop Description by Dec 31 
                to avoid shop restrictions.
              </p>
              <div className="banner-button-wrapper">
                <button className="announcement-btn-banner">LEARN MORE &gt;</button>
              </div>
            </div>
          </div>
          <div className="announcement-item">
            <div className="announcement-header">
              <span className="announcement-icon">🔥</span>
              <span className="announcement-title">Shopee Templates on Canva</span>
            </div>
            <p className="announcement-content-small">
              Boost your product listings with Shopee templates on Canva. Quick to edit, easy to use, 
              and perfect for highlighting your best deals. Try them now!
            </p>
            <span className="announcement-time">Today 18:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsCard;

