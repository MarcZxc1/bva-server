import { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import './SellerDashboard.css';

interface SellerLayoutProps {
  children: ReactNode;
}

const SellerLayout = ({ children }: SellerLayoutProps) => {
  return (
    <div className="seller-dashboard">
      <DashboardHeader />

      <div className="dashboard-content">
        <Sidebar />

        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;

