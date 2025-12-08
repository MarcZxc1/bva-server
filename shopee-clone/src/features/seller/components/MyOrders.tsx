import { useState, useRef, useEffect, useCallback } from 'react';
import SellerLayout from './SellerLayout';
import Breadcrumb from './Breadcrumb';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';
import { useRealtimeOrders } from '../../../hooks/useRealtimeOrders';
import { Wifi } from 'lucide-react';
import './MyOrders.css';

interface Order {
  id: string;
  shopId: string;
  shopName: string;
  items: Array<{
    productId: string;
    productName?: string;
    quantity: number;
    price: number;
    imageUrl?: string | null;
  }>;
  total: number;
  revenue?: number;
  profit?: number;
  status: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  platform?: string;
}

const MyOrders = () => {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState('toprocess');
  const [activePriorityTab, setActivePriorityTab] = useState('all');
  const [activeCompletedTab, setActiveCompletedTab] = useState('all');
  const [sortBy, setSortBy] = useState('confirmed_date_desc');
  const [searchType, setSearchType] = useState('orderid');
  const [orderId, setOrderId] = useState('');
  const [shippingChannel, setShippingChannel] = useState('all');
  const [shippingChannelInput, setShippingChannelInput] = useState('All Channels');
  const [shippingMethod, setShippingMethod] = useState('all');
  const [shippingMethodInput, setShippingMethodInput] = useState('All Orders');
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);

  const allShippingChannels = [
    { id: 'all', label: 'All Channels' },
    { id: 'flash', label: 'Flash Express' },
    { id: 'jt', label: 'J&T Express' },
    { id: 'spx', label: 'SPX Express' },
    { id: 'pickup', label: 'Shopee Self Pick-up' },
    { id: 'others', label: 'Others' },
  ];

  const limitedShippingChannels = [
    { id: 'all', label: 'All Channels' },
    { id: 'pickup', label: 'Shopee Self Pick-up' },
    { id: 'standard', label: 'Standard Local' },
    { id: 'others', label: 'Others' },
  ];

  const getShippingChannels = () => {
    if (activeTab === 'toship') {
      return allShippingChannels;
    }
    return limitedShippingChannels;
  };

  const shippingChannels = getShippingChannels();
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target as Node)) {
        setShowChannelDropdown(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setShowMethodDropdown(false);
      }
    };

    if (showChannelDropdown || showSearchDropdown || showMethodDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChannelDropdown, showSearchDropdown, showMethodDropdown]);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'unpaid', label: 'Unpaid' },
    { id: 'toship', label: 'To Ship' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'completed', label: 'Completed' },
    { id: 'return', label: 'Return/Refund/Cancel' },
  ];

  const subTabs = [
    { id: 'all', label: 'All' },
    { id: 'toprocess', label: 'To Process' },
    { id: 'processed', label: 'Processed' },
  ];

  const priorityTabs = [
    { id: 'all', label: 'All' },
    { id: 'overdue', label: 'Overdue (0)' },
    { id: 'today', label: 'Ship By Today (0)' },
    { id: 'tomorrow', label: 'Ship By Tomorrow (0)' },
  ];

  const completedTabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending Invoice (0)' },
    { id: 'uploaded', label: 'Uploaded Invoice (0)' },
  ];

  const allSearchTypes = [
    { id: 'orderid', label: 'Order ID' },
    { id: 'buyername', label: 'Buyer Name' },
    { id: 'product', label: 'Product' },
    { id: 'tracking', label: 'Tracking Number' },
    { id: 'returnrequest', label: 'Return Request ID' },
    { id: 'returntracking', label: 'Return Tracking No.' },
  ];

  const getSearchTypes = () => {
    if (activeTab === 'unpaid' || activeTab === 'toship') {
      return allSearchTypes.filter(type => 
        ['orderid', 'buyername', 'product', 'tracking'].includes(type.id)
      );
    }
    return allSearchTypes;
  };

  const searchTypes = getSearchTypes();

  // Reset search type if current type is not available in the active tab
  useEffect(() => {
    if (!searchTypes.find(st => st.id === searchType)) {
      setSearchType('orderid');
    }
  }, [activeTab, searchTypes, searchType]);

  // Reset shipping channel if current channel is not available in the active tab
  useEffect(() => {
    if (!shippingChannels.find(ch => ch.id === shippingChannel)) {
      setShippingChannel('all');
      setShippingChannelInput('All Channels');
    }
  }, [activeTab, shippingChannels, shippingChannel]);

  const handleApply = () => {
    // Handle filter application
    console.log('Apply filters', { searchType, orderId, shippingChannel });
  };

  const fetchOrders = useCallback(async () => {
    if (!shopId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Map tab to status filter
      let statusFilter: string | undefined;
      switch (activeTab) {
        case 'unpaid':
          statusFilter = 'pending';
          break;
        case 'toship':
          statusFilter = 'pending';
          break;
        case 'shipping':
          statusFilter = 'shipping';
          break;
        case 'completed':
          statusFilter = 'completed';
          break;
        case 'return':
          statusFilter = 'return-refund';
          break;
        default:
          statusFilter = undefined;
      }
      
      const data = await apiClient.getSellerOrders(shopId, { status: statusFilter });
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [shopId, activeTab]);

  useEffect(() => {
    if (shopId) {
      fetchOrders();
    }
  }, [shopId, activeTab, fetchOrders]);

  // Real-time updates
  const { isConnected } = useRealtimeOrders({
    shopId: shopId || undefined,
    enabled: !!shopId,
    onOrderUpdate: fetchOrders,
  });

  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);

  const handleShipNow = async (orderId: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, 'to-receive');
      // Send webhook to BVA server
      const { webhookService } = await import('../../../services/webhook.service');
      await webhookService.sendOrderStatusChanged(orderId, 'to-receive');
      fetchOrders(); // Refresh orders
      alert('Order shipped! The buyer will be notified.');
    } catch (err: any) {
      alert(err.message || 'Failed to ship order');
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setConfirmingDelivery(orderId);
    
    // Simulate 3-second loading
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Update order status in shopee-clone
      await apiClient.updateOrderStatus(orderId, 'completed');
      
      // Send webhook to BVA server to update income
      const { webhookService } = await import('../../../services/webhook.service');
      try {
        await webhookService.sendOrderStatusChanged(orderId, 'completed');
        console.log('✅ Webhook sent: Order status changed to completed');
      } catch (webhookError) {
        console.error('⚠️  Webhook failed, but order status updated locally:', webhookError);
        // Don't fail the whole operation if webhook fails
      }
      
      fetchOrders(); // Refresh orders
      alert('Delivery confirmed! Order marked as completed. Income has been updated.');
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      alert(err.message || 'Failed to confirm delivery');
    } finally {
      setConfirmingDelivery(null);
    }
  };

  const handleReset = () => {
    setSearchType('orderid');
    setOrderId('');
    setShippingChannel('all');
    setShippingChannelInput('All Channels');
    setShippingMethod('all');
    setShippingMethodInput('All Orders');
  };

  const filteredOrders = orders.filter(order => {
    if (orderId) {
      const searchLower = orderId.toLowerCase();
      switch (searchType) {
        case 'orderid':
          return order.id.toLowerCase().includes(searchLower);
        case 'buyername':
          return order.customerName?.toLowerCase().includes(searchLower) ||
                 order.customerEmail?.toLowerCase().includes(searchLower);
        case 'product':
          const items = Array.isArray(order.items) ? order.items : [];
          return items.some(item => 
            item.productName?.toLowerCase().includes(searchLower)
          );
        default:
          return true;
      }
    }
    return true;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'to-pay':
        return 'To Pay';
      case 'to-ship':
        return 'To Ship';
      case 'to-receive':
        return 'To Receive';
      case 'shipping':
        return 'Shipping';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'return-refund':
        return 'Return/Refund';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to-pay':
        return '#ff9800';
      case 'to-ship':
        return '#ff9800';
      case 'to-receive':
        return '#9c27b0';
      case 'shipping':
        return '#2196f3';
      case 'completed':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      case 'return-refund':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  return (
    <SellerLayout>
      <div className="my-orders-page">
        <Breadcrumb />
        <div className="orders-header">
        <div className="flex items-center gap-3">
          <h1 className="orders-title">My Orders</h1>
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Wifi size={16} />
              <span>Live</span>
            </div>
          )}
        </div>
        <div className="orders-actions">
          <button className="export-btn">Export</button>
          <button className="export-btn">Export History</button>
        </div>
      </div>

      <div className="orders-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`order-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'toship' && (
        <>
          <div className="order-status-section">
            <span className="filter-label">Order Status:</span>
            <div className="orders-sub-tabs">
              {subTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`order-sub-tab ${activeSubTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveSubTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeSubTab !== 'processed' && (
            <div className="shipping-priority-section">
              <span className="filter-label">Shipping Priority:</span>
              <div className="priority-tabs">
                {priorityTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`priority-tab ${activePriorityTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActivePriorityTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'completed' && (
        <div className="order-status-section">
          <span className="filter-label">Order Status:</span>
          <div className="orders-sub-tabs">
            {completedTabs.map(tab => (
              <button
                key={tab.id}
                className={`order-sub-tab ${activeCompletedTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveCompletedTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="search-filter-section">
        {(activeTab === 'completed' && (activeCompletedTab === 'pending' || activeCompletedTab === 'uploaded')) ? (
          <>
            <div className="search-group">
              <div className="search-type-dropdown" ref={channelDropdownRef}>
                <button
                  className="search-type-btn"
                  onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                >
                  Shipping Channel
                  <span className={`dropdown-arrow-small ${showChannelDropdown ? 'up' : ''}`}>
                    {showChannelDropdown ? '▲' : '▼'}
                  </span>
                </button>
                {showChannelDropdown && (
                  <div className="search-type-menu">
                    {shippingChannels.map(channel => (
                      <div
                        key={channel.id}
                        className={`search-type-item ${shippingChannel === channel.id ? 'active' : ''}`}
                        onClick={() => {
                          setShippingChannel(channel.id);
                          setShippingChannelInput(channel.label);
                          setShowChannelDropdown(false);
                        }}
                      >
                        {channel.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="All Channels"
                value={shippingChannelInput}
                readOnly
              />
            </div>
            <div className="filter-actions">
              <button className="apply-btn" onClick={handleApply}>Apply</button>
              <button className="reset-btn" onClick={handleReset}>Reset</button>
            </div>
          </>
        ) : (
          <>
            <div className="search-group">
              <div className="search-type-dropdown" ref={searchDropdownRef}>
                <button
                  className="search-type-btn"
                  onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                >
                  {searchTypes.find(st => st.id === searchType)?.label}
                  <span className={`dropdown-arrow-small ${showSearchDropdown ? 'up' : ''}`}>
                    {showSearchDropdown ? '▲' : '▼'}
                  </span>
                </button>
                {showSearchDropdown && (
                  <div className="search-type-menu">
                    {searchTypes.map(type => (
                      <div
                        key={type.id}
                        className="search-type-item"
                        onClick={() => {
                          setSearchType(type.id);
                          setShowSearchDropdown(false);
                        }}
                      >
                        {type.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                className="search-input"
                placeholder={`Input ${searchTypes.find(st => st.id === searchType)?.label.toLowerCase()}`}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>

            {!(activeTab === 'completed' && (activeCompletedTab === 'pending' || activeCompletedTab === 'uploaded')) && (
              <div className="search-group">
            <div className="search-type-dropdown" ref={channelDropdownRef}>
              <button
                className="search-type-btn"
                onClick={() => setShowChannelDropdown(!showChannelDropdown)}
              >
                Shipping Channel
                <span className={`dropdown-arrow-small ${showChannelDropdown ? 'up' : ''}`}>
                  {showChannelDropdown ? '▲' : '▼'}
                </span>
              </button>
              {showChannelDropdown && (
                <div className="search-type-menu">
                  {shippingChannels.map(channel => (
                    <div
                      key={channel.id}
                      className={`search-type-item ${shippingChannel === channel.id ? 'active' : ''}`}
                      onClick={() => {
                        setShippingChannel(channel.id);
                        setShippingChannelInput(channel.label);
                        setShowChannelDropdown(false);
                      }}
                    >
                      {channel.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="All Channels"
              value={shippingChannelInput}
              readOnly
            />
              </div>
            )}

            {activeTab === 'toship' && activeSubTab === 'processed' && (
          <div className="search-group">
            <div className="search-type-dropdown" ref={methodDropdownRef}>
              <button
                className="search-type-btn"
                onClick={() => setShowMethodDropdown(!showMethodDropdown)}
              >
                Shipping Method
                <span className={`dropdown-arrow-small ${showMethodDropdown ? 'up' : ''}`}>
                  {showMethodDropdown ? '▲' : '▼'}
                </span>
              </button>
              {showMethodDropdown && (
                <div className="search-type-menu">
                  <div
                    className={`search-type-item ${shippingMethod === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setShippingMethod('all');
                      setShippingMethodInput('All Orders');
                      setShowMethodDropdown(false);
                    }}
                  >
                    All Orders
                  </div>
                  <div
                    className={`search-type-item ${shippingMethod === 'dropoff' ? 'active' : ''}`}
                    onClick={() => {
                      setShippingMethod('dropoff');
                      setShippingMethodInput('Drop-off');
                      setShowMethodDropdown(false);
                    }}
                  >
                    Drop-off
                  </div>
                </div>
              )}
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="All Orders"
              value={shippingMethodInput}
              readOnly
            />
              </div>
            )}

            <div className="filter-actions">
          <button className="apply-btn" onClick={handleApply}>Apply</button>
          <button className="reset-btn" onClick={handleReset}>Reset</button>
        </div>
          </>
        )}
      </div>

      <div className="order-list-controls">
        <div className="order-count">
          <span className="order-count-text">
            {activeTab === 'completed' && (activeCompletedTab === 'pending' || activeCompletedTab === 'uploaded') 
              ? `${filteredOrders.length} Orders` 
              : `${filteredOrders.length} Parcels`}
          </span>
        </div>
        <div className="order-controls-right">
          <div className="sort-section">
            <span className="sort-label">Sort by:</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="confirmed_date_desc">Confirmed Date (Newest First)</option>
              <option value="confirmed_date_asc">Confirmed Date (Oldest First)</option>
            </select>
            <svg className="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M7 12h10M11 18h2" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {activeTab === 'toship' && activeSubTab === 'processed' ? (
            <button className="handover-centre-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Handover Centre
            </button>
          ) : (
            <button className="mass-ship-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="5.5" cy="18.5" r="2.5" fill="white"/>
                <circle cx="18.5" cy="18.5" r="2.5" fill="white"/>
              </svg>
              Mass Ship
            </button>
          )}
        </div>
      </div>

      <div className="orders-table-header">
        <div className="table-header-cell">Product(s)</div>
        <div className="table-header-cell">
          {activeTab === 'completed' && (activeCompletedTab === 'pending' || activeCompletedTab === 'uploaded') ? 'Order Total' : 'Total Price'}
        </div>
        <div className="table-header-cell">Status</div>
        <div className="table-header-cell">
          Countdown
          <span className="info-icon">?</span>
        </div>
        <div className="table-header-cell">Shipping Channel</div>
        <div className="table-header-cell">Actions</div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchOrders} className="btn-retry">Retry</button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="10 9 9 9 8 9" stroke="#d9d9d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="empty-text">
            {activeTab === 'completed' && (activeCompletedTab === 'pending' || activeCompletedTab === 'uploaded')
              ? 'No orders after 12/05/2023 (Tue). Use Export in the top-right to find older orders.'
              : 'No Orders Found'}
          </div>
          {!(activeTab === 'completed' && (activeCompletedTab === 'pending' || activeCompletedTab === 'uploaded')) && (
            <button onClick={fetchOrders} className="reload-link">Reload</button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => {
            // Ensure items is always an array
            const items = Array.isArray(order.items) ? order.items : [];
            
            return (
              <div key={order.id} className="order-item">
                <div className="order-products">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <div key={idx} className="product-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Product Image */}
                        <div className="product-image-container" style={{ 
                          width: '60px', 
                          height: '60px', 
                          flexShrink: 0,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e0e0e0'
                        }}>
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName || `Product ${idx + 1}`}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }}
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = '<span style="font-size: 24px;">📦</span>';
                                }
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '24px' }}>📦</span>
                          )}
                        </div>
                        {/* Product Info */}
                        <div className="product-info" style={{ flex: 1, minWidth: 0 }}>
                          <span className="product-name" style={{ display: 'block', marginBottom: '4px' }}>
                            {item.productName || `Product ${item.productId || idx + 1}`}
                          </span>
                          <span className="product-quantity" style={{ fontSize: '14px', color: '#666' }}>
                            x{item.quantity || 1}
                          </span>
                        </div>
                        <span className="product-price" style={{ fontWeight: '600', color: '#ee4d2d' }}>
                          ₱{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="product-item">
                      <div className="product-info">
                        <span className="product-name">No items</span>
                      </div>
                    </div>
                  )}
                </div>
              <div className="order-total">
                <span className="total-label">Total:</span>
                <span className="total-amount">₱{order.total.toLocaleString()}</span>
              </div>
              <div className="order-status">
                <span 
                  className="status-badge"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="order-countdown">
                {order.status === 'to-ship' && (
                  <span className="countdown-text">Ship within 3 days</span>
                )}
                {order.status === 'to-receive' && (
                  <span className="countdown-text">Out for delivery</span>
                )}
              </div>
              <div className="order-channel">
                <span>{order.platform || 'Shopee'}</span>
              </div>
              <div className="order-actions">
                {order.status === 'to-ship' && (
                  <button
                    onClick={() => handleShipNow(order.id)}
                    className="btn-ship"
                  >
                    Ship Now
                  </button>
                )}
                {order.status === 'to-receive' && (
                  <button
                    onClick={() => handleConfirmDelivery(order.id)}
                    disabled={confirmingDelivery === order.id}
                    className={`btn-complete ${confirmingDelivery === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {confirmingDelivery === order.id ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Confirming...
                      </span>
                    ) : (
                      'Confirm Delivery'
                    )}
                  </button>
                )}
                <button
                  onClick={() => window.open(`/orders/${order.id}`, '_blank')}
                  className="btn-view"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}
      </div>
    </SellerLayout>
  );
};

export default MyOrders;

