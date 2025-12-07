import React, { useState, useEffect } from 'react';
import SellerLayout from './SellerLayout';
import Breadcrumb from './Breadcrumb';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';
import { RotateCw, XCircle, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import './ReturnRefundCancel.css';

interface ReturnRequest {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  reason: string;
  type: 'return' | 'refund' | 'cancel';
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  requestedBy: string;
  requestedAt: string;
  amount: number;
  quantity: number;
}

const ReturnRefundCancel: React.FC = () => {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id;
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'return' | 'refund' | 'cancel'>('all');

  useEffect(() => {
    if (shopId) {
      fetchRequests();
    }
  }, [shopId]);

  const fetchRequests = async () => {
    if (!shopId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      // Fetch orders with return/refund/cancel status
      const orders = await apiClient.getSellerOrders(shopId, { status: 'return-refund' });
      
      // Transform orders to return requests
      const returnRequests: ReturnRequest[] = [];
      orders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item.returnRequest || item.refundRequest || item.cancelRequest) {
              returnRequests.push({
                id: `${order.id}-${item.productId}`,
                orderId: order.id,
                productId: item.productId,
                productName: item.productName || 'Unknown Product',
                reason: item.returnReason || item.refundReason || item.cancelReason || 'Not specified',
                type: item.returnRequest ? 'return' : item.refundRequest ? 'refund' : 'cancel',
                status: item.requestStatus || 'pending',
                requestedBy: order.customerEmail || 'Unknown',
                requestedAt: order.createdAt || new Date().toISOString(),
                amount: item.price * item.quantity,
                quantity: item.quantity,
              });
            }
          });
        }
      });
      
      setRequests(returnRequests);
    } catch (err: any) {
      console.error('Error fetching return requests:', err);
      setError(err.message || 'Failed to load return requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update order status
      await apiClient.updateOrderStatus(request.orderId, 'processing');
      
      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'processing' } : r
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update order status
      await apiClient.updateOrderStatus(request.orderId, 'completed');
      
      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' } : r
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const handleComplete = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update order status
      await apiClient.updateOrderStatus(request.orderId, 'completed');
      
      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'completed' } : r
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to complete request');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'return':
        return <RotateCw size={20} />;
      case 'refund':
        return <CheckCircle size={20} />;
      case 'cancel':
        return <XCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'approved':
      case 'processing':
        return '#2196f3';
      case 'completed':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    const matchesType = filterType === 'all' || request.type === filterType;
    const matchesSearch = 
      request.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesType && matchesSearch;
  });

  return (
    <SellerLayout>
      <Breadcrumb />
      <div className="return-refund-cancel-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Return/Refund/Cancel</h1>
            <p className="page-subtitle">Manage customer return, refund, and cancellation requests</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="request-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({requests.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'processing' ? 'active' : ''}`}
            onClick={() => setActiveTab('processing')}
          >
            Processing ({requests.filter(r => r.status === 'processing').length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({requests.filter(r => r.status === 'completed').length})
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="return">Return</option>
              <option value="refund">Refund</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>
          <div className="search-group">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by Order ID, Product, or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchRequests} className="btn-retry">Retry</button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <p>No requests found</p>
          </div>
        ) : (
          <div className="requests-list">
            {filteredRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-type">
                    {getTypeIcon(request.type)}
                    <span className="type-label">{request.type.toUpperCase()}</span>
                  </div>
                  <div
                    className="request-status"
                    style={{ color: getStatusColor(request.status) }}
                  >
                    {request.status.toUpperCase()}
                  </div>
                </div>
                <div className="request-body">
                  <div className="request-info">
                    <div className="info-row">
                      <span className="info-label">Order ID:</span>
                      <span className="info-value">{request.orderId}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Product:</span>
                      <span className="info-value">{request.productName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Quantity:</span>
                      <span className="info-value">{request.quantity}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Amount:</span>
                      <span className="info-value amount">₱{request.amount.toLocaleString()}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Reason:</span>
                      <span className="info-value">{request.reason}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Requested By:</span>
                      <span className="info-value">{request.requestedBy}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Requested At:</span>
                      <span className="info-value">
                        {new Date(request.requestedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="request-actions">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="btn-approve"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="btn-reject"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {request.status === 'processing' && (
                    <div className="request-actions">
                      <button
                        onClick={() => handleComplete(request.id)}
                        className="btn-complete"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
};

export default ReturnRefundCancel;

