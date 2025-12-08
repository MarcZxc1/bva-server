import { useState, useEffect, useMemo } from 'react';
import SellerLayout from './SellerLayout';
import Breadcrumb from './Breadcrumb';
import { useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../services/api';
import { useRealtimeIncome } from '../../../hooks/useRealtimeIncome';
import './MyIncome.css';

interface IncomeData {
  pending: {
    total: number;
    orders: number;
  };
  released: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    orders: number;
  };
  orders: Array<{
    id: string;
    orderId: string;
    payoutReleasedOn: string | null;
    status: string;
    paymentMethod: string;
    releasedAmount: number;
    createdAt: string;
  }>;
}

const MyIncome = () => {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id;
  
  const [activeTab, setActiveTab] = useState<'pending' | 'released'>('released');
  const [dateRange, setDateRange] = useState('thisweek');
  const [searchOrder, setSearchOrder] = useState('');
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Calculate date ranges dynamically
  const dateRanges = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    return [
      { 
        id: 'thisweek', 
        label: `This Week: ${formatDateDisplay(weekStart)} - ${formatDateDisplay(weekEnd)}`,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      },
      { 
        id: 'lastweek', 
        label: `Last Week: ${formatDateDisplay(lastWeekStart)} - ${formatDateDisplay(lastWeekEnd)}`,
        startDate: lastWeekStart.toISOString().split('T')[0],
        endDate: lastWeekEnd.toISOString().split('T')[0]
      },
      { 
        id: 'thismonth', 
        label: `This Month: ${formatDateDisplay(monthStart)} - ${formatDateDisplay(now)}`,
        startDate: monthStart.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
    ];
  }, []);

  // Fetch income data
  const fetchIncomeData = async () => {
    if (!shopId) return;

    try {
      setIsLoading(true);
      setError(null);

      const selectedRange = dateRanges.find(r => r.id === dateRange);
      const filters: any = {
        status: activeTab,
      };

      if (selectedRange && activeTab === 'released') {
        filters.startDate = selectedRange.startDate;
        filters.endDate = selectedRange.endDate;
      }

      const response = await apiClient.getSellerIncome(shopId, filters);
      
      // Handle wrapped response format { success: true, data: ... }
      if (response && typeof response === 'object') {
        if ('data' in response && response.data) {
          setIncomeData(response.data as IncomeData);
        } else if ('pending' in response || 'released' in response) {
          // Direct response format
          setIncomeData(response as IncomeData);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('No data received');
      }
    } catch (err: any) {
      console.error('Error fetching income data:', err);
      setError(err.message || 'Failed to fetch income data');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time income updates
  useRealtimeIncome({
    shopId,
    enabled: !!shopId,
    onIncomeUpdate: () => {
      console.log('💰 Refreshing income data due to real-time update');
      fetchIncomeData();
    },
  });

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchIncomeData();
  }, [shopId, activeTab, dateRange]);

  // Filter orders by search term
  const filteredOrders = useMemo(() => {
    if (!incomeData?.orders) return [];
    
    if (!searchOrder.trim()) return incomeData.orders;
    
    const searchLower = searchOrder.toLowerCase();
    return incomeData.orders.filter(order => 
      order.orderId.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)
    );
  }, [incomeData?.orders, searchOrder]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date for table display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
              {isLoading ? (
                <div className="income-amount">Loading...</div>
              ) : error ? (
                <div className="income-amount" style={{ color: '#ff4d4f', fontSize: '14px' }}>{error}</div>
              ) : (
                <>
                  <div className="income-amount">
                    {formatCurrency(incomeData?.pending?.total || 0)}
                  </div>
                  <div className="income-label">Total ({incomeData?.pending?.orders || 0} orders)</div>
                  <div className="bank-account">My Bank Account: **** 8697</div>
                </>
              )}
            </div>

            <div className="income-card released-card">
              <h3 className="card-title">Released</h3>
              {isLoading ? (
                <div className="income-amount">Loading...</div>
              ) : error ? (
                <div className="income-amount" style={{ color: '#ff4d4f', fontSize: '14px' }}>{error}</div>
              ) : (
                <>
                  <div className="released-amounts">
                    <div className="amount-item">
                      <div className="income-amount">
                        {formatCurrency(incomeData?.released?.thisWeek || 0)}
                      </div>
                      <div className="income-label">This Week</div>
                    </div>
                    <div className="amount-item">
                      <div className="income-amount">
                        {formatCurrency(incomeData?.released?.thisMonth || 0)}
                      </div>
                      <div className="income-label">This Month</div>
                    </div>
                    <div className="amount-item">
                      <div className="income-amount">
                        {formatCurrency(incomeData?.released?.total || 0)}
                      </div>
                      <div className="income-label">Total ({incomeData?.released?.orders || 0} orders)</div>
                    </div>
                  </div>
                  <a href="#" className="my-balance-link">My Balance &gt;</a>
                </>
              )}
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

              {isLoading ? (
                <div className="empty-state">
                  <div className="empty-text">Loading...</div>
                </div>
              ) : error ? (
                <div className="empty-state">
                  <div className="empty-text" style={{ color: '#ff4d4f' }}>{error}</div>
                </div>
              ) : filteredOrders.length === 0 ? (
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
              ) : (
                <div className="income-table-body">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="income-table-row">
                      <div className="table-cell">#{order.orderId}</div>
                      <div className="table-cell">
                        {formatDate(order.payoutReleasedOn)}
                      </div>
                      <div className="table-cell">
                        <span className={`status-badge ${order.status === 'completed' ? 'completed' : 'pending'}`}>
                          {order.status === 'completed' ? 'Released' : 'Pending'}
                        </span>
                      </div>
                      <div className="table-cell">{order.paymentMethod}</div>
                      <div className="table-cell amount-cell">
                        {order.status === 'completed' ? formatCurrency(order.releasedAmount) : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

