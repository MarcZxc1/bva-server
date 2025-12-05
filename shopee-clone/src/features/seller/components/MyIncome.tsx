import { useState } from 'react';
import SellerLayout from './SellerLayout';
import Breadcrumb from './Breadcrumb';
import './MyIncome.css';

const MyIncome = () => {
  const [activeTab, setActiveTab] = useState('released');
  const [dateRange, setDateRange] = useState('thisweek');
  const [searchOrder, setSearchOrder] = useState('');

  const dateRanges = [
    { id: 'thisweek', label: 'This Week: 12/01/2025 (Mon) - 12/04/2025 (Thu)' },
    { id: 'lastweek', label: 'Last Week' },
    { id: 'thismonth', label: 'This Month' },
  ];

  return (
    <SellerLayout>
      <div className="my-income-page">
        <Breadcrumb />
        {/* Income Overview Section */}
        <div className="income-overview-section">
          <h2 className="section-title">Income Overview</h2>
          <div className="info-banner">
            No adjustments are factored in the amounts shown below. Please refer to the My Income Report / Income Statement to view adjustment-related details.
          </div>

          <div className="income-overview-grid">
            <div className="income-card pending-card">
              <h3 className="card-title">Pending</h3>
              <div className="income-amount">₱0.00</div>
              <div className="income-label">Total</div>
              <div className="bank-account">My Bank Account: **** 8697</div>
            </div>

            <div className="income-card released-card">
              <h3 className="card-title">Released</h3>
              <div className="released-amounts">
                <div className="amount-item">
                  <div className="income-amount">₱0.00</div>
                  <div className="income-label">This Week</div>
                </div>
                <div className="amount-item">
                  <div className="income-amount">₱0.00</div>
                  <div className="income-label">This Month</div>
                </div>
                <div className="amount-item">
                  <div className="income-amount">₱46,625.00</div>
                  <div className="income-label">Total</div>
                </div>
              </div>
              <a href="#" className="my-balance-link">My Balance &gt;</a>
            </div>
          </div>
        </div>

        <div className="income-main-content">
          {/* Income Details Section */}
          <div className="income-details-section">
            <h2 className="section-title">Income Details</h2>

            <div className="income-details-tabs">
              <button
                className={`detail-tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending
              </button>
              <button
                className={`detail-tab ${activeTab === 'released' ? 'active' : ''}`}
                onClick={() => setActiveTab('released')}
              >
                Released
              </button>
            </div>

            <div className="income-details-controls">
              {activeTab !== 'pending' && (
                <div className="date-range-selector">
                  <select
                    className="date-range-select"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    {dateRanges.map(range => (
                      <option key={range.id} value={range.id}>{range.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="search-export-controls">
                <div className="search-order-input">
                  <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="#999" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Order"
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    className="search-input-field"
                  />
                </div>
                {activeTab !== 'pending' && (
                  <>
                    <button className="export-btn">Export</button>
                    <button className="list-icon-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="income-table-container">
              <div className="income-table-header">
                <div className="table-header-cell">Order</div>
                <div className="table-header-cell">Payout Released on</div>
                <div className="table-header-cell">Status</div>
                <div className="table-header-cell">Payment Method</div>
                <div className="table-header-cell">Released Amount</div>
              </div>

              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14 2 14 8 20 8" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="empty-text">No Data</div>
              </div>
            </div>
          </div>

          {/* Right Side Panels */}
          <div className="income-side-panels">
            <div className="side-panel">
              <div className="panel-header">
                <h3 className="panel-title">Income Statements</h3>
                <a href="#" className="more-link">More &gt;</a>
              </div>
              <div className="statements-list">
                <div className="statement-item">
                  <span className="statement-date">24 Nov - 30 Nov 2025</span>
                  <svg className="download-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7 10 12 15 17 10" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="statement-item">
                  <span className="statement-date">17 Nov - 23 Nov 2025</span>
                  <svg className="download-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7 10 12 15 17 10" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="statement-item">
                  <span className="statement-date">10 Nov - 16 Nov 2025</span>
                  <svg className="download-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7 10 12 15 17 10" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="side-panel">
              <div className="panel-header">
                <h3 className="panel-title">My Tax Document</h3>
                <a href="#" className="more-link">More &gt;</a>
              </div>
              <div className="tax-document-empty">
                <div className="empty-icon-small">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14 2 14 8 20 8" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="empty-text-small">No Invoice</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default MyIncome;

