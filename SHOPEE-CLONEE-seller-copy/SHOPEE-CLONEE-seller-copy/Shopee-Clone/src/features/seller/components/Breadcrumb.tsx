import { useLocation, Link } from 'react-router-dom';
import './Breadcrumb.css';

const Breadcrumb = () => {
  const location = useLocation();

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items = [{ label: 'Home', path: '/dashboard' }];

    if (path === '/orders') {
      items.push({ label: 'My Orders', path: '/orders' });
    } else if (path === '/income') {
      items.push({ label: 'My Income', path: '/income' });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div className="breadcrumb">
      <div className="breadcrumb-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="28" height="28" rx="6" fill="#ee4d2d"/>
          <path d="M14 8C11.5 8 9.5 9.5 9.5 11.5C9.5 13.5 11 15 13.5 15C15 15 16.2 14.3 16.8 13.2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M14 20C16.5 20 18.5 18.5 18.5 16.5C18.5 14.5 17 13 14.5 13C13 13 11.8 13.7 11.2 14.8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
      {breadcrumbItems.map((item, index) => (
        <div key={item.path} className="breadcrumb-item">
          {index > 0 && <span className="breadcrumb-separator">&gt;</span>}
          {index === breadcrumbItems.length - 1 ? (
            <span className="breadcrumb-current">{item.label}</span>
          ) : (
            <Link to={item.path} className="breadcrumb-link">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;

