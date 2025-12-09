import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import './App.css'

type DashboardProfile = {
  name: string
  email: string
  region: string
}

type SignupMode = 'phone' | 'email'
type LoginMode = 'phone' | 'email'
type View = 'signup' | 'login' | 'dashboard'

const featureList = [
  'Get more sales with LIVE streams and short videos',
  'No minimum followers required',
]

const sampleCredentials = {
  email: 'demo@tiktokshop.com',
  password: 'Demo123!',
}

const missionItems = [
  { 
    icon: '📦',
    title: 'More products, more customers', 
    subtitle: 'Criterion! Upload 50 products and pass QC',
    reward: 'Free Shipping Reward',
    button: 'Add Product'
  },
  { 
    icon: '▶️',
    title: 'Post a video', 
    subtitle: 'Criterion! Publish an e-commerce video that lasts 15+ seconds',
    reward: 'Free Shipping Reward',
    button: 'Post Video'
  },
  { 
    icon: '▶️',
    title: 'Go live for the first time', 
    subtitle: 'Criterion! Livestream for at least 1 hour and adds 10+ products',
    reward: 'Free Shipping Reward',
    button: 'Go Live'
  },
]

const actionStats = [
  { label: 'Pending Orders', value: '122', link: true },
  { label: 'Pending Return', value: '354', link: true },
  { label: 'Out of Stock SKUs', value: '6789', link: true },
  { label: 'Quality Check Failed Pro...', value: '8732', link: true },
]

const dataCompassStats = {
  todayRevenue: 'Rp2,345,678',
  selfPromotion: 'Rp1,456,789',
  affiliate: 'Rp567,890',
  percentages: { live: '55.3%', video: '25.3%', cart: '19.4%' }
}

const liveRankingData = [
  { rank: 1, name: 'Live room name Live roo...', revenue: 'Rp99.9K', pv: '239,506', status: 'Live Stream' },
  { rank: 2, name: 'Live room name Live roo...', revenue: 'Rp99.9K', pv: '239,506', status: 'Live Stream' },
  { rank: 3, name: 'Live room name Live roo...', revenue: 'Rp99.9K', pv: '239,506', status: 'Live Stream' },
]

const announcements = [
  { title: 'Seller Promotion Product Discount Update', time: '14/07/2022 17:10' },
  { title: '"Invite Only" product categories will now be visible', time: '22/06/2022 10:52' },
]

const paymentHistory = [
  { date: '16/08/2023', type: 'Policy violation penalty', amount: 8, status: 'Deducted', reference: '3458790633336651058' },
  { date: '10/08/2023', type: 'Policy violation penalty', amount: 8, status: 'Deducted', reference: '3457990640453446657' },
  { date: '28/02/2023', type: 'Payments', amount: 88, status: 'Transferred', reference: '#gnkbxu0VsXmXgnCLMeLbLK' },
  { date: '16/02/2023', type: 'Order settlement', amount: 88.56, status: 'Settled', reference: '3458794237038383630' },
]

function BatchShipping({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('Arrange Shipping')
  const [deliveryOption, setDeliveryOption] = useState('Standard shipping')
  const [collectionMethod, setCollectionMethod] = useState('Pick-up')
  const [packageType, setPackageType] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="batch-shipping-page">
      <div className="batch-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h1 className="batch-title">Batch shipping</h1>
        <p className="batch-description">Generate shipping documents or arrange shipping in bulk for packages that are ready to ship.</p>
      </div>

      <div className="batch-tabs">
        <button
          className={`batch-tab ${activeTab === 'Arrange Shipping' ? 'active' : ''}`}
          onClick={() => setActiveTab('Arrange Shipping')}
        >
          Arrange Shipping
        </button>
        <button
          className={`batch-tab ${activeTab === 'Generate Documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('Generate Documents')}
        >
          Generate Documents
        </button>
      </div>

      <div className="batch-content">
        <div className="batch-left">
          <h2 className="step-title">Step 1: Select packages</h2>

          <div className="batch-filters">
            <div className="filter-row">
              <span className="filter-label">Delivery Option</span>
              <button
                className={`filter-chip ${deliveryOption === 'Standard shipping' ? 'active' : ''}`}
                onClick={() => setDeliveryOption('Standard shipping')}
              >
                Standard shipping
              </button>
              <button
                className={`filter-chip ${deliveryOption === 'Shipped from seller' ? 'active' : ''}`}
                onClick={() => setDeliveryOption('Shipped from seller')}
              >
                Shipped from seller
              </button>
            </div>

            <div className="filter-row">
              <span className="filter-label">Shipping provider</span>
              <button className="provider-chip">TT Virtual Evri</button>
            </div>

            <div className="filter-row">
              <span className="filter-label">Collection Method</span>
              <button
                className={`filter-chip ${collectionMethod === 'Pick-up' ? 'active' : ''}`}
                onClick={() => setCollectionMethod('Pick-up')}
              >
                Pick-up
              </button>
              <button
                className={`filter-chip ${collectionMethod === 'Drop-off' ? 'active' : ''}`}
                onClick={() => setCollectionMethod('Drop-off')}
              >
                Drop-off
              </button>
            </div>

            <div className="filter-row">
              <span className="filter-label">Urgency</span>
              <button className="filter-chip">Ship within 24 hours</button>
              <button className="filter-chip">Shipment overdue yet to ship</button>
            </div>

            <div className="filter-row">
              <span className="filter-label">Package type</span>
              <button
                className={`filter-chip ${packageType === 'All' ? 'active' : ''}`}
                onClick={() => setPackageType('All')}
              >
                All
              </button>
              <button
                className={`filter-chip ${packageType === 'Combined package' ? 'active' : ''}`}
                onClick={() => setPackageType('Combined package')}
              >
                Combined package
              </button>
              <button
                className={`filter-chip ${packageType === 'Single order package' ? 'active' : ''}`}
                onClick={() => setPackageType('Single order package')}
              >
                Single order package
              </button>
              <button
                className={`filter-chip ${packageType === 'Split order package' ? 'active' : ''}`}
                onClick={() => setPackageType('Split order package')}
              >
                Split order package
              </button>
            </div>

            <div className="filter-row search-row">
              <select className="product-select">
                <option>Product Name</option>
              </select>
              <input
                type="text"
                placeholder="Search Product Name"
                className="product-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-icon-btn">🔍</button>

              <div className="time-paid-filter">
                <span className="filter-label">Time paid</span>
                <input type="text" placeholder="Start date" className="date-input-sm" />
                <span>-</span>
                <input type="text" placeholder="End date" className="date-input-sm" />
                <button className="calendar-btn-sm">📅</button>
              </div>
            </div>

            <div className="filter-row">
              <button className="more-filters">More filters ▼</button>
              <button className="reset-btn">Reset</button>
            </div>
          </div>

          <div className="package-summary">
            <div className="package-count">
              <input type="checkbox" />
              <span>Package: 0</span>
            </div>
            <select className="sort-dropdown">
              <option>Time Paid (newest first)</option>
            </select>
          </div>

          <div className="empty-packages">
            <p>No packages available</p>
          </div>
        </div>

        <div className="batch-right">
          <h2 className="step-title">Step 2: Batch shipping</h2>
          <p className="step-description">
            If you click to arrange shipment, the logistics providers will be told to collect the goods from you. 
            Please confirm that all packages have been picked and packed. If the collection of a confirmed package fails, 
            the performance score of the shop will be affected.
          </p>

          <div className="selected-info">
            <span>Selected: 0 package</span>
          </div>

          <button className="arrange-selected-btn">Arrange for selected packages</button>

          <div className="filtered-info">
            <span>Filtered: 0 package</span>
          </div>

          <button className="arrange-filtered-btn">
            <span className="checkbox-icon">☑</span>
            Arrange for filtered package
          </button>

          <p className="arrange-note">
            You can arrange shipment for up to 200 packages at a time.
          </p>

          <button className="chat-btn-batch">💬 Chat</button>
        </div>
      </div>
    </div>
  )
}

function ManageOrders() {
  const [activeTab, setActiveTab] = useState('All')
  const [orderStatus, setOrderStatus] = useState('Awaiting Shipment')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBatchShipping, setShowBatchShipping] = useState(false)

  const tabs = ['All', 'Unpaid', 'To Ship', 'Shipped', 'Completed', 'Cancelled']
  const statusFilters = ['All', 'Awaiting Shipment', 'Awaiting Collection']
  const urgencyFilters = [
    'Ship within 24 hours',
    'Cancelling within 24 hours',
    'Shipment overdue yet to ship'
  ]

  if (showBatchShipping) {
    return <BatchShipping onBack={() => setShowBatchShipping(false)} />
  }

  return (
    <div className="manage-orders-page">
      <div className="orders-header">
        <h1 className="orders-title">Manage Orders</h1>
        <div className="orders-actions">
          <button className="export-link">Export Orders</button>
          <button className="export-link">Export History</button>
          <button className="bulk-btn">Bulk Print</button>
          <button className="batch-btn" onClick={() => setShowBatchShipping(true)}>📦 Batch shipping</button>
        </div>
      </div>

      <div className="orders-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`orders-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="orders-filters">
        <div className="filter-section">
          <span className="filter-label">Order Status</span>
          {statusFilters.map((status) => (
            <button
              key={status}
              className={`filter-chip ${orderStatus === status ? 'active' : ''}`}
              onClick={() => setOrderStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="filter-section">
          <span className="filter-label">Urgency</span>
          {urgencyFilters.map((urgency) => (
            <button key={urgency} className="filter-chip">
              {urgency}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-search">
        <div className="search-group">
          <select className="search-select">
            <option>Order ID</option>
            <option>Customer Name</option>
          </select>
          <input
            type="text"
            placeholder="Search order ID"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">🔍</button>
        </div>

        <div className="date-filters">
          <span className="filter-label">Time paid</span>
          <input type="text" placeholder="From" className="date-input" />
          <span>-</span>
          <input type="text" placeholder="To" className="date-input" />
          <button className="calendar-btn">📅</button>
        </div>

        <button className="tag-btn">🏷 Tag</button>
        <button className="filter-btn">🔽</button>
        <select className="sort-select">
          <option>Time paid (newest)</option>
          <option>Time paid (oldest)</option>
        </select>
      </div>

      <div className="orders-table">
        <div className="orders-table-header">
          <div className="th-col">Order ID</div>
          <div className="th-col">Order Status</div>
          <div className="th-col">Payment</div>
          <div className="th-col">Delivery</div>
          <div className="th-col">Action</div>
        </div>
        <div className="orders-table-body">
          <div className="empty-state">
            <p>No orders found</p>
          </div>
        </div>
      </div>

      <button className="chat-btn">💬 Chat</button>
    </div>
  )
}

function Withdrawals() {
  const [activeTab, setActiveTab] = useState('All')
  const [showDatePicker, setShowDatePicker] = useState(false)

  return (
    <div className="finance-page">
      <h1 className="finance-title">Payments</h1>

      <div className="finance-grid">
        <div className="live-data-card">
          <div className="live-header">
            <span className="live-label">Live Data</span>
            <span className="live-update">(data updated on Oct 3, 2023 11:00 AM GMT+08:00)</span>
          </div>
          <div className="live-amount-section">
            <div className="amount-label">To be paid next week</div>
            <div className="amount-value">S$ 38.35</div>
          </div>
        </div>

        <div className="bank-account-card">
          <div className="bank-header">Primary bank account</div>
          <div className="bank-details">
            <div className="bank-icon" aria-hidden />
            <div className="bank-info">
              <div className="bank-label">Bank account number</div>
              <div className="bank-number">
                <span>*******1636</span>
                <span className="badge">Valid</span>
              </div>
            </div>
            <button className="manage-link">Manage bank account</button>
          </div>
        </div>
      </div>

      <div className="history-section">
        <h2 className="history-title">History</h2>
        <div className="history-filters">
          <button className="date-filter" onClick={() => setShowDatePicker(!showDatePicker)}>
            Select settlement dates
            <span className="calendar-icon" aria-hidden>📅</span>
          </button>
        </div>

        <div className="history-tabs">
          {['All', 'Payments', 'Earnings', 'Policy violation deduction'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <div className="tab-actions">
            <button className="export-btn">+ Export</button>
            <button className="export-btn">Export History</button>
          </div>
        </div>

        <div className="history-table">
          <div className="table-header">
            <div className="th time">Time</div>
            <div className="th type">Type</div>
            <div className="th amount">Amount</div>
            <div className="th status">Status</div>
            <div className="th reference">Reference No.</div>
            <div className="th action">Action</div>
          </div>
          <div className="table-body">
            {paymentHistory.map((item, idx) => (
              <div key={idx} className="table-row">
                <div className="td time">{item.date}</div>
                <div className="td type">{item.type}</div>
                <div className="td amount">S$ {item.amount.toFixed(2)}</div>
                <div className="td status">
                  <span className={`status-badge ${item.status.toLowerCase()}`}>
                    <span className="status-dot" />
                    {item.status}
                  </span>
                </div>
                <div className="td reference">{item.reference}</div>
                <div className="td action">
                  <button className="view-link">View details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="table-pagination">
          <span className="page-info">[1]</span>
          <span className="page-size">10 /Page</span>
        </div>
      </div>
    </div>
  )
}

const transactionData = [
  { id: '57e2745649584520023', date: '15/07/2023', settlementDate: '14/07/2023', amount: 'Rp20.918', revenue: 'Rp22,000', status: 'Order', type: 'Order' },
  { id: '57e2725856d79853019', date: '26/06/2023', settlementDate: '/', amount: 'Rp15.563', revenue: 'Rp16.900', status: 'Order', type: 'Order' },
  { id: '57e2745649649643507', date: '26/06/2023', settlementDate: '/', amount: 'Rp15.563', revenue: 'Rp16.900', status: 'Order', type: 'Order' },
  { id: '79460853485369769453', date: '09/06/2023', settlementDate: '/', amount: 'Rp200.000', revenue: '/', status: 'Adjustment', type: 'Adjustment' },
  { id: '79460853485369769453', date: '09/06/2023', settlementDate: '/', amount: 'Rp200.000', revenue: '/', status: 'Adjustment', note: 'Shipping fee rebate' },
  { id: '72456879476625401', date: '13/06/2023', settlementDate: '/', amount: 'Rp100', revenue: '/', status: 'Adjustment', type: 'Adjustment', note: 'Shipping fee rebate' },
]

function Transactions() {
  const [activeTab, setActiveTab] = useState('Settled')

  return (
    <div className="transactions-page">
      <h1 className="finance-title">Transactions</h1>

      <div className="transactions-tabs">
        <button
          className={`trans-tab ${activeTab === 'Settled' ? 'active' : ''}`}
          onClick={() => setActiveTab('Settled')}
        >
          Settled
        </button>
        <button
          className={`trans-tab ${activeTab === 'To Settle' ? 'active' : ''}`}
          onClick={() => setActiveTab('To Settle')}
        >
          To Settle
        </button>
      </div>

      <div className="transactions-stats">
        <div className="stat-card">
          <div className="stat-label">Total Settlement Amount</div>
          <div className="stat-value">
            <span>Last week</span>
            <button className="info-icon">ⓘ</button>
          </div>
          <div className="stat-number">-</div>
          <button className="stat-more">More ›</button>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">
            <span>Last week</span>
            <button className="info-icon">ⓘ</button>
          </div>
          <div className="stat-number">-</div>
          <button className="stat-more">More ›</button>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Fees</div>
          <div className="stat-value">
            <span>Last month</span>
            <button className="info-icon">ⓘ</button>
          </div>
          <div className="stat-number">-</div>
          <button className="stat-more">More ›</button>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Adjustments</div>
          <div className="stat-value">
            <span>Last week</span>
            <button className="info-icon">ⓘ</button>
          </div>
          <div className="stat-number">-</div>
          <button className="stat-more">More ›</button>
        </div>
      </div>

      <div className="transactions-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Select order create date"
            className="filter-input"
          />
          <button className="search-icon">🔍</button>
        </div>
        <input type="text" placeholder="Search unfollow/amount" className="filter-input" />
        <input type="text" placeholder="Select settlement date" className="filter-input" />
        <input type="text" placeholder="Select Type" className="filter-input" />
        <div className="filter-actions">
          <button className="export-link">⬇ Export</button>
          <button className="export-link">Export History</button>
        </div>
      </div>

      <div className="transactions-table">
        <div className="trans-table-header">
          <div className="th">Order ID/Adjustment ID</div>
          <div className="th">Order Create Date</div>
          <div className="th">Settlement date</div>
          <div className="th">Settlement amount</div>
          <div className="th">Revenue</div>
          <div className="th">Action</div>
        </div>
        <div className="trans-table-body">
          {transactionData.map((item, idx) => (
            <div key={idx} className="trans-row">
              <div className="td">
                <div className="order-id">{item.id}</div>
                <span className={`order-badge ${item.status.toLowerCase()}`}>{item.status}</span>
                {item.note && <div className="order-note">{item.note}</div>}
              </div>
              <div className="td">{item.date}</div>
              <div className="td">{item.settlementDate}</div>
              <div className="td">{item.amount}</div>
              <div className="td">{item.revenue}</div>
              <div className="td">
                <button className="view-detail-btn">View Detail</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="trans-pagination">
        <span className="page-current">1</span>
        <span className="page-num">2</span>
        <span className="page-next">›</span>
      </div>
    </div>
  )
}

function SellerProfile() {
  const [activeTab, setActiveTab] = useState('Account information')
  const [textMessageEnabled, setTextMessageEnabled] = useState(false)

  const tabs = [
    'Account information',
    'Seller information',
    'Business information',
    'Brands',
    'Warehouse/Pickup ad...',
    'Holiday mode',
    'Payments',
    'Messag...'
  ]

  const pickupWarehouses = [
    { name: '████████', code: '████████', address: '████████', contact: '████████', region: 'United Kingdom', status: 'Open' }
  ]

  const returnWarehouses = [
    { name: '████████', code: '████████', address: '████████', contact: '████████', region: 'United Kingdom', status: 'Open' }
  ]

  return (
    <div className="seller-profile-page">
      <h1 className="profile-title">Seller Profile</h1>

      <div className="profile-tabs">
        <button className="tab-nav-arrow left">‹</button>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <button className="tab-nav-arrow right">›</button>
      </div>

      <div className="profile-content">
        {activeTab === 'Account information' && (
          <>
            <h2 className="section-title">Account information</h2>

            <div className="info-grid">
              <div className="info-field">
                <label className="field-label">Email Address</label>
                <div className="field-value">
                  <span className="masked-text">████████</span>
                  <button className="change-link">Change</button>
                </div>
              </div>

              <div className="info-field">
                <label className="field-label">Phone Number</label>
                <div className="field-value">
                  <span className="masked-text">████████</span>
                </div>
              </div>

              <div className="info-field">
                <label className="field-label">Password</label>
                <div className="field-value">
                  <span className="masked-text">••••••••••</span>
                  <button className="change-link">Change</button>
                </div>
              </div>

              <div className="info-field">
                <label className="field-label">
                  Login Accounts <span className="info-icon">ⓘ</span>
                </label>
                <div className="field-value">
                  <span className="masked-text">████████</span>
                  <button className="change-link">Link</button>
                </div>
              </div>
            </div>

            <h2 className="section-title">Account security</h2>

            <div className="security-section">
              <div className="security-header">
                <h3 className="security-title">
                  Two-step verification <span className="info-icon">ⓘ</span>
                </h3>
              </div>

              <div className="verification-option">
                <div className="verification-info">
                  <div className="verification-label">Text message</div>
                  <div className="verification-desc">Receive a verification code through your phone</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={textMessageEnabled}
                    onChange={(e) => setTextMessageEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Warehouse/Pickup ad...' && (
          <>
            <h2 className="section-title">Pickup Warehouse</h2>

            <div className="warehouse-table">
              <div className="warehouse-header">
                <div className="wh-col">Warehouse name/code</div>
                <div className="wh-col">Address</div>
                <div className="wh-col">Contact</div>
                <div className="wh-col">Region</div>
                <div className="wh-col">Status</div>
                <div className="wh-col">Action</div>
              </div>
              <div className="warehouse-body">
                {pickupWarehouses.map((wh, idx) => (
                  <div key={idx} className="warehouse-row">
                    <div className="wh-col">
                      <div className="wh-name">{wh.name}</div>
                      <div className="wh-code">{wh.code}</div>
                    </div>
                    <div className="wh-col">{wh.address}</div>
                    <div className="wh-col">{wh.contact}</div>
                    <div className="wh-col">{wh.region}</div>
                    <div className="wh-col">
                      <span className="status-badge open">{wh.status}</span>
                    </div>
                    <div className="wh-col">
                      <button className="edit-link">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="section-title" style={{ marginTop: '40px' }}>Return Warehouse</h2>

            <div className="warehouse-table">
              <div className="warehouse-header">
                <div className="wh-col">Warehouse name/code</div>
                <div className="wh-col">Address</div>
                <div className="wh-col">Contact</div>
                <div className="wh-col">Region</div>
                <div className="wh-col">Status</div>
                <div className="wh-col">Action</div>
              </div>
              <div className="warehouse-body">
                {returnWarehouses.map((wh, idx) => (
                  <div key={idx} className="warehouse-row">
                    <div className="wh-col">
                      <div className="wh-name">{wh.name}</div>
                      <div className="wh-code">{wh.code}</div>
                    </div>
                    <div className="wh-col">{wh.address}</div>
                    <div className="wh-col">{wh.contact}</div>
                    <div className="wh-col">{wh.region}</div>
                    <div className="wh-col">
                      <span className="status-badge open">{wh.status}</span>
                    </div>
                    <div className="wh-col">
                      <button className="edit-link">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InvoiceCenter() {
  return (
    <div className="finance-page">
      <h1 className="finance-title">Invoice Center</h1>
      <div className="placeholder-content">
        <p>Invoice Center content coming soon...</p>
      </div>
    </div>
  )
}

function ShippingOptions() {
  const [standardShippingEnabled, setStandardShippingEnabled] = useState(true)
  const [shippedFromSellerEnabled, setShippedFromSellerEnabled] = useState(false)
  const [invoiceMethod, setInvoiceMethod] = useState('package-id')

  return (
    <div className="shipping-options-page">
      <div className="info-banner">
        <span className="info-icon">ℹ️</span>
        <span>You can now select the delivery option for your shop and products. <a href="#" className="learn-more-link">Learn more</a></span>
        <button className="close-banner">×</button>
      </div>

      <h1 className="page-title">Shipping Options</h1>
      <p className="page-description">Manage shipping providers, delivery options and the invoice generation method.</p>

      <div className="shipping-section">
        <h2 className="section-heading">Shipped via platform</h2>
        <p className="section-description">
          Fulfil your orders using TikTok Shop's selected provider. Orders will be automatically given tracking numbers when shipment is arranged.
          <a href="#" className="about-link">About shipping fees</a>
        </p>

        <div className="shipping-option-card">
          <div className="option-header">
            <span className="option-label">Standard shipping</span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={standardShippingEnabled}
                onChange={(e) => setStandardShippingEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <button className="dropdown-arrow">▼</button>
          </div>
        </div>
      </div>

      <div className="shipping-section">
        <h2 className="section-heading">Shipped by seller</h2>
        <p className="section-description">
          Find your own carriers and enter the tracking numbers in the system.
        </p>

        <div className="shipping-option-card">
          <div className="option-header">
            <span className="option-label">Shipped from seller</span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={shippedFromSellerEnabled}
                onChange={(e) => setShippedFromSellerEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <button className="dropdown-arrow">▼</button>
          </div>
        </div>
      </div>

      <div className="invoice-section">
        <h2 className="section-heading">Invoice Generation Method</h2>
        
        <div className="invoice-options">
          <label className="radio-option">
            <input 
              type="radio" 
              name="invoice" 
              value="auto-increment"
              checked={invoiceMethod === 'auto-increment'}
              onChange={(e) => setInvoiceMethod(e.target.value)}
            />
            <span>Use Auto-increment Number</span>
          </label>

          <label className="radio-option">
            <input 
              type="radio" 
              name="invoice" 
              value="package-id"
              checked={invoiceMethod === 'package-id'}
              onChange={(e) => setInvoiceMethod(e.target.value)}
            />
            <span>Use Package ID</span>
          </label>

          <label className="radio-option">
            <input 
              type="radio" 
              name="invoice" 
              value="manual"
              checked={invoiceMethod === 'manual'}
              onChange={(e) => setInvoiceMethod(e.target.value)}
            />
            <span>Manually Provide Number</span>
          </label>
        </div>
      </div>

      <button className="chat-btn">💬 Chat</button>
    </div>
  )
}

function AddNewProduct({ onBack, onSubmit }: { onBack: () => void; onSubmit: (product: any) => void }) {
  const [productName, setProductName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [activeFormSection, setActiveFormSection] = useState('basic')
  const [activePreviewTab, setActivePreviewTab] = useState('details')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [sku, setSku] = useState('')
  const [weight, setWeight] = useState('')
  const [packageLength, setPackageLength] = useState('')
  const [packageWidth, setPackageWidth] = useState('')
  const [packageHeight, setPackageHeight] = useState('')
  const fileInputRefs = Array(9).fill(null).map(() => ({ current: null as HTMLInputElement | null }))

  const scrollToSection = (sectionId: string) => {
    setActiveFormSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const recentCategories = [
    'Home Supplies > Home Organizers > Storage Bottles & Jars',
    'Home Supplies > Home Organizers > Storage Bags',
    'Sports & Outdoor > Sports & Outdoor Accessories > Sports Water Bottles',
  ]

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        alert('Please upload only JPG, JPEG, or PNG images')
        return
      }
      
      // Validate file size (10 MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must not exceed 10 MB')
        return
      }

      // Read file and create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImages = [...uploadedImages]
        newImages[index] = e.target?.result as string
        setUploadedImages(newImages)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = (index: number) => {
    fileInputRefs[index].current?.click()
  }

  const handleSaveDraft = () => {
    if (!productName.trim()) {
      alert('Please enter a product name')
      return
    }

    const product = {
      id: Date.now(),
      name: productName,
      sku: '--',
      productId: `ID:${Date.now()}`,
      quantity: 0,
      price: '฿0.00',
      sales: 0,
      updated: new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      status: 'Draft',
      category: selectedCategory,
      images: uploadedImages.filter(img => img)
    }

    onSubmit(product)
    onBack()
  }

  const handleSubmitReview = () => {
    if (!productName.trim()) {
      alert('Please enter a product name')
      return
    }

    if (!selectedCategory) {
      alert('Please select a category')
      return
    }

    if (uploadedImages.filter(img => img).length === 0) {
      alert('Please upload at least one image')
      return
    }

    const product = {
      id: Date.now(),
      name: productName,
      sku: 'Variants',
      productId: `ID:${Date.now()}`,
      quantity: 100,
      price: '฿99.00',
      sales: 0,
      updated: new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      status: 'Reviewing',
      category: selectedCategory,
      images: uploadedImages.filter(img => img)
    }

    onSubmit(product)
    onBack()
  }

  return (
    <div className="add-product-page">
      <div className="add-product-header">
        <button className="back-btn" onClick={onBack}>← Add new product</button>
        <div className="header-right">
          <button className="help-btn">ⓘ</button>
          <button className="draft-btn" onClick={handleSaveDraft}>Save as a draft</button>
          <button className="submit-btn" onClick={handleSubmitReview}>✓ Submit for review</button>
        </div>
      </div>

      <div className="probation-notice">
        <span className="notice-icon">ⓘ</span>
        <span>You're currently in the Shop Probation Period. During this stage, you can publish up to 300 products each day.</span>
        <a href="#" className="notice-link">View Details</a>
        <button className="close-notice">×</button>
      </div>

      <div className="add-product-content">
        <div className="left-sidebar">
          <div className="suggestions-section">
            <h3 className="sidebar-title">💡 Suggestions</h3>
            <p className="sidebar-text">Complete product information can help increase your product exposure.</p>
          </div>

          <nav className="form-nav">
            <button 
              className={`nav-link ${activeFormSection === 'basic' ? 'active' : ''}`}
              onClick={() => scrollToSection('basic')}
            >
              Basic information
            </button>
            <button 
              className={`nav-link ${activeFormSection === 'details' ? 'active' : ''}`}
              onClick={() => scrollToSection('details')}
            >
              Product details
            </button>
            <button 
              className={`nav-link ${activeFormSection === 'sales' ? 'active' : ''}`}
              onClick={() => scrollToSection('sales')}
            >
              Sales information
            </button>
            <button 
              className={`nav-link ${activeFormSection === 'shipping' ? 'active' : ''}`}
              onClick={() => scrollToSection('shipping')}
            >
              Shipping
            </button>
          </nav>

          <div className="preview-section">
            <h3 className="sidebar-title">Preview ⓘ</h3>
            <div className="preview-tabs">
              <button 
                className={`preview-tab ${activePreviewTab === 'details' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('details')}
              >
                Product details
              </button>
              <button 
                className={`preview-tab ${activePreviewTab === 'shop' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('shop')}
              >
                🛍
              </button>
              <button 
                className={`preview-tab ${activePreviewTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('edit')}
              >
                🖊
              </button>
              <button 
                className={`preview-tab ${activePreviewTab === 'gallery' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('gallery')}
              >
                🖼
              </button>
            </div>
            <div className="preview-box">
              {activePreviewTab === 'details' && (
                <div className="preview-content">
                  {uploadedImages[0] ? (
                    <img src={uploadedImages[0]} alt="Preview" className="preview-image" />
                  ) : (
                    <div className="preview-placeholder">
                      <span className="placeholder-icon">🖼</span>
                      <span className="placeholder-text">Add images</span>
                    </div>
                  )}
                  {productName && <div className="preview-name">{productName}</div>}
                  {price && <div className="preview-price">฿{price}</div>}
                </div>
              )}
              {activePreviewTab === 'shop' && (
                <div className="preview-content">
                  <div className="preview-shop-card">
                    {uploadedImages[0] && <img src={uploadedImages[0]} alt="Shop" className="preview-image" />}
                    <div className="shop-info">
                      <div className="shop-name">{productName || 'Product Name'}</div>
                      <div className="shop-price">฿{price || '0.00'}</div>
                    </div>
                  </div>
                </div>
              )}
              {activePreviewTab === 'edit' && (
                <div className="preview-content">
                  <div className="preview-edit-info">
                    <div>Name: {productName || 'Not set'}</div>
                    <div>Price: ฿{price || '0.00'}</div>
                    <div>Stock: {stock || '0'}</div>
                    <div>Category: {selectedCategory || 'Not selected'}</div>
                  </div>
                </div>
              )}
              {activePreviewTab === 'gallery' && (
                <div className="preview-content">
                  <div className="preview-gallery">
                    {uploadedImages.filter(img => img).map((img, idx) => (
                      <img key={idx} src={img} alt={`Gallery ${idx}`} className="gallery-thumb" />
                    ))}
                    {uploadedImages.filter(img => img).length === 0 && (
                      <div className="preview-placeholder">
                        <span className="placeholder-icon">🖼</span>
                        <span className="placeholder-text">No images</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-content">
          <h2 id="basic" className="section-heading">Basic information</h2>

          <div className="form-field">
            <label className="field-label">
              <span className="required">*</span> Images <span className="info-icon">ⓘ</span>
            </label>
            <div className="ai-optimize">
              <button className="optimize-btn">✨ AI optimize</button>
            </div>
            <p className="field-hint">Dimensions: 600 × 600 px. Maximum file size: 10 MB (Up to 9 files). Format: JPG, JPEG, PNG</p>
            
            <div className="image-upload-grid">
              <div className="upload-box main" onClick={() => triggerFileInput(0)}>
                {uploadedImages[0] ? (
                  <img src={uploadedImages[0]} alt="Main product" className="uploaded-image-preview" />
                ) : (
                  <>
                    <div className="upload-icon">↑</div>
                    <div className="upload-text">Upload main image</div>
                  </>
                )}
                <input
                  ref={fileInputRefs[0]}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleImageUpload(0, e)}
                  style={{ display: 'none' }}
                />
              </div>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                <div 
                  key={idx} 
                  className="upload-placeholder"
                  onClick={() => triggerFileInput(idx)}
                >
                  {uploadedImages[idx] ? (
                    <img src={uploadedImages[idx]} alt={`Product ${idx}`} className="uploaded-thumb-preview" />
                  ) : (
                    '📦'
                  )}
                  <input
                    ref={fileInputRefs[idx]}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => handleImageUpload(idx, e)}
                    style={{ display: 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              <span className="required">*</span> Product name <span className="info-icon">ⓘ</span>
            </label>
            <input
              type="text"
              className="text-input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              maxLength={255}
            />
            <div className="char-count">{productName.length}/255</div>
          </div>

          <div className="form-field">
            <label className="field-label">
              <span className="required">*</span> Category <span className="info-icon">ⓘ</span>
            </label>
            <div className="category-badge">
              <span className="badge-icon">🔄</span>
              <span>Recently used categories</span>
            </div>
            <div className="category-list">
              {recentCategories.map((cat, idx) => (
                <button
                  key={idx}
                  className={`category-item ${selectedCategory === cat ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button className="select-category-btn">
              Select category ▼
            </button>
          </div>

          <h2 id="details" className="section-heading" style={{ marginTop: '40px' }}>Product details</h2>

          <div className="form-field">
            <label className="field-label">
              Product description <span className="info-icon">ⓘ</span>
            </label>
            <textarea
              className="textarea-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product in detail..."
              rows={6}
              maxLength={5000}
            />
            <div className="char-count">{description.length}/5000</div>
          </div>

          <div className="form-field">
            <label className="field-label">
              Product highlights
            </label>
            <div className="highlights-list">
              <input type="text" className="text-input" placeholder="Highlight 1" />
              <input type="text" className="text-input" placeholder="Highlight 2" />
              <input type="text" className="text-input" placeholder="Highlight 3" />
            </div>
            <button className="add-highlight-btn">+ Add highlight</button>
          </div>

          <h2 id="sales" className="section-heading" style={{ marginTop: '40px' }}>Sales information</h2>

          <div className="form-row">
            <div className="form-field">
              <label className="field-label">
                <span className="required">*</span> Price <span className="info-icon">ⓘ</span>
              </label>
              <div className="input-with-currency">
                <span className="currency-symbol">฿</span>
                <input
                  type="number"
                  className="text-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">
                <span className="required">*</span> Stock <span className="info-icon">ⓘ</span>
              </label>
              <input
                type="number"
                className="text-input"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              SKU (Stock Keeping Unit)
            </label>
            <input
              type="text"
              className="text-input"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Enter SKU"
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              <input type="checkbox" /> Enable variants (size, color, etc.)
            </label>
          </div>

          <h2 id="shipping" className="section-heading" style={{ marginTop: '40px' }}>Shipping</h2>

          <div className="form-field">
            <label className="field-label">
              <span className="required">*</span> Package weight (kg) <span className="info-icon">ⓘ</span>
            </label>
            <input
              type="number"
              className="text-input"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              Package dimensions (cm) <span className="info-icon">ⓘ</span>
            </label>
            <div className="dimensions-row">
              <input
                type="number"
                className="text-input"
                value={packageLength}
                onChange={(e) => setPackageLength(e.target.value)}
                placeholder="Length"
                min="0"
              />
              <span className="dimension-separator">×</span>
              <input
                type="number"
                className="text-input"
                value={packageWidth}
                onChange={(e) => setPackageWidth(e.target.value)}
                placeholder="Width"
                min="0"
              />
              <span className="dimension-separator">×</span>
              <input
                type="number"
                className="text-input"
                value={packageHeight}
                onChange={(e) => setPackageHeight(e.target.value)}
                placeholder="Height"
                min="0"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              Shipping template <span className="info-icon">ⓘ</span>
            </label>
            <select className="select-input">
              <option>Standard Shipping</option>
              <option>Express Shipping</option>
              <option>Free Shipping</option>
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">
              <input type="checkbox" /> Dangerous goods
            </label>
            <p className="field-hint">Check if this product contains hazardous materials</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ManageProducts() {
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [priceFilter, setPriceFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Wireless Bluetooth Headphones',
      sku: 'Variants',
      productId: 'ID:1732185887765792379',
      quantity: 297,
      price: '฿30.00',
      sales: 1,
      updated: '09/03/2025 11:29 AM',
      status: 'Live',
      hasVariants: true,
      skus: 3,
      image: 'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
    {
      id: 2,
      name: 'Premium Ceramic Coffee Mug',
      sku: 'blue',
      color: 'color:000 0000000 01',
      productId: 'ID:1732077141040794235',
      quantity: 1,
      price: '฿111.00',
      sales: 0,
      updated: '09/03/2025 10:52 AM',
      status: 'Live',
      priceWarning: true,
      image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
    {
      id: 3,
      name: 'Glass Storage Bottles & Jars Set',
      sku: '--',
      productId: '',
      quantity: 11,
      price: '฿1,111.00',
      sales: 0,
      updated: '09/02/2025 11:43 PM',
      status: 'Suspended',
      statusReason: 'Failed',
      image: 'https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
    {
      id: 4,
      name: 'Stainless Steel Water Bottle',
      sku: 'Steel-500ml',
      productId: 'ID:1732185887765792380',
      quantity: 145,
      price: '฿45.50',
      sales: 23,
      updated: '09/03/2025 02:15 PM',
      status: 'Live',
      image: 'https://images.pexels.com/photos/3625517/pexels-photo-3625517.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
    {
      id: 5,
      name: 'Portable Phone Charger 20000mAh',
      sku: 'PowerBank-20K',
      productId: 'ID:1732185887765792381',
      quantity: 89,
      price: '฿78.99',
      sales: 45,
      updated: '09/03/2025 03:45 PM',
      status: 'Live',
      image: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
    {
      id: 6,
      name: 'LED Desk Lamp with USB',
      sku: 'Lamp-USB-LED',
      productId: 'ID:1732185887765792382',
      quantity: 156,
      price: '฿35.00',
      sales: 12,
      updated: '09/02/2025 08:30 PM',
      status: 'Live',
      image: 'https://images.pexels.com/photos/3929857/pexels-photo-3929857.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
    {
      id: 7,
      name: 'Wireless Charging Pad',
      sku: 'Charger-Wireless',
      productId: 'ID:1732185887765792383',
      quantity: 0,
      price: '฿52.00',
      sales: 67,
      updated: '09/01/2025 04:20 PM',
      status: 'Out of Stock',
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
    {
      id: 8,
      name: 'Premium Yoga Mat',
      sku: 'Yoga-Mat-5mm',
      productId: 'ID:1732185887765792384',
      quantity: 234,
      price: '฿89.99',
      sales: 88,
      updated: '09/03/2025 09:10 AM',
      status: 'Live',
      image: 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
    {
      id: 9,
      name: 'Vintage Ceramic Vase',
      sku: 'Vase-Ceramic',
      productId: 'ID:1732185887765792385',
      quantity: 42,
      price: '฿125.00',
      sales: 5,
      updated: '08/30/2025 11:50 PM',
      status: 'Live',
      image: 'https://images.pexels.com/photos/2434268/pexels-photo-2434268.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
    },
  ])

  const handleAddProduct = (newProduct: any) => {
    setProducts([newProduct, ...products])
  }

  const handleDeleteProducts = () => {
    if (selectedProducts.length === 0) return
    if (confirm(`Delete ${selectedProducts.length} product(s)?`)) {
      setProducts(products.filter(p => !selectedProducts.includes(p.id)))
      setSelectedProducts([])
    }
  }

  const handleActivateProducts = () => {
    if (selectedProducts.length === 0) return
    setProducts(products.map(p => 
      selectedProducts.includes(p.id) ? { ...p, status: 'Live' } : p
    ))
    setSelectedProducts([])
  }

  const handleDeactivateProducts = () => {
    if (selectedProducts.length === 0) return
    setProducts(products.map(p => 
      selectedProducts.includes(p.id) ? { ...p, status: 'Deactivated' } : p
    ))
    setSelectedProducts([])
  }

  const handleToggleSelect = (id: number) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleDuplicateProduct = (product: any) => {
    const duplicated = {
      ...product,
      id: Date.now(),
      name: product.name + ' (Copy)',
      productId: `ID:${Date.now()}`,
      updated: new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }
    setProducts([duplicated, ...products])
  }

  const filteredProducts = products.filter(product => {
    // Tab filter
    if (activeTab !== 'All' && product.status !== activeTab) return false
    
    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.productId?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  })

  const getTabCount = (status: string) => {
    if (status === 'All') return products.length
    return products.filter(p => p.status === status).length
  }

  if (showAddProduct) {
    return <AddNewProduct onBack={() => setShowAddProduct(false)} onSubmit={handleAddProduct} />
  }

  const tabs = [
    { label: `All ${getTabCount('All')}`, value: 'All' },
    { label: `Live ${getTabCount('Live')}`, value: 'Live' },
    { label: `Deactivated ${getTabCount('Deactivated')}`, value: 'Deactivated' },
    { label: `Reviewing ${getTabCount('Reviewing')}`, value: 'Reviewing' },
    { label: `Suspended ${getTabCount('Suspended')}`, value: 'Suspended' },
    { label: `Draft ${getTabCount('Draft')}`, value: 'Draft' },
    { label: `Deleted ${getTabCount('Deleted')}`, value: 'Deleted' },
  ]

  return (
    <div className="manage-products-page">
      <div className="products-header">
        <div className="header-top">
          <h1 className="page-title">Manage Products</h1>
          <div className="header-actions">
            <button className="secondary-btn">Product Bundles</button>
            <button className="secondary-btn">Bulk action ▼</button>
            <button className="add-product-btn" onClick={() => setShowAddProduct(true)}>Add new product ▼</button>
          </div>
        </div>

        <div className="action-cards-section">
          <div className="section-header">
            <span className="lightbulb-icon">💡</span>
            <span className="section-title">Take action to drive more sales</span>
          </div>
          <div className="action-cards-grid">
            <div className="action-card">
              <div className="card-content">
                <h3 className="card-title">test_soc_upload_new_product_reforth</h3>
                <div className="card-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '49%' }}></div>
                  </div>
                  <span className="progress-text">49/100</span>
                </div>
              </div>
              <button className="card-action">Go ›</button>
            </div>
            <div className="action-card">
              <div className="card-content">
                <h3 className="card-title">Advertise your shop</h3>
                <p className="card-description">Increase your sales with GMV Max</p>
                <div className="card-images">
                  <img src="https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1" alt="clothing" className="product-thumb" style={{borderRadius: '4px'}} />
                  <img src="https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1" alt="fashion" className="product-thumb" style={{borderRadius: '4px'}} />
                  <span className="product-count">99+</span>
                </div>
              </div>
              <button className="card-action">Go ›</button>
            </div>
            <div className="action-card">
              <div className="card-content">
                <h3 className="card-title">Reprice to gain benefits</h3>
                <p className="card-description">Get up to 100% bonus traffic and fea tured recommendations.</p>
                <div className="card-images">
                  <img src="https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1" alt="product" className="product-thumb" style={{borderRadius: '4px'}} />
                  <img src="https://images.pexels.com/photos/3625517/pexels-photo-3625517.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1" alt="merchandise" className="product-thumb" style={{borderRadius: '4px'}} />
                  <span className="product-count">99+</span>
                </div>
              </div>
              <button className="card-action">Go ›</button>
            </div>
            <div className="action-card">
              <div className="card-content">
                <h3 className="card-title">Restock SKUs to avoid missin...</h3>
                <p className="card-description">124 products - Low or out of stock</p>
                <div className="card-images">
                  <img src="https://images.pexels.com/photos/3929857/pexels-photo-3929857.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1" alt="inventory" className="product-thumb" style={{borderRadius: '4px'}} />
                  <img src="https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1" alt="stock" className="product-thumb" style={{borderRadius: '4px'}} />
                  <span className="product-count">99+</span>
                </div>
              </div>
              <button className="card-action">Go ›</button>
            </div>
          </div>
        </div>
      </div>

      <div className="products-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`product-tab ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="products-filters">
        <div className="search-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search a product name, ID, or seller SKU"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>
          <select className="filter-select" value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
            <option value="all">Price</option>
            <option value="low">Low to High</option>
            <option value="high">High to Low</option>
          </select>
          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Category</option>
            <option value="home">Home Supplies</option>
            <option value="sports">Sports & Outdoor</option>
          </select>
          <button className="filter-btn">⚙ Filter ▼</button>
          <button className="reset-link" onClick={() => { setSearchQuery(''); setPriceFilter('all'); setCategoryFilter('all'); }}>Reset</button>
        </div>
      </div>

      <div className="products-actions">
        <div className="selected-info">Selected: {selectedProducts.length}</div>
        <div className="action-buttons">
          <button className="action-btn" disabled={selectedProducts.length === 0} onClick={handleActivateProducts}>Activate</button>
          <button className="action-btn" disabled={selectedProducts.length === 0} onClick={handleDeactivateProducts}>Deactivate</button>
          <button className="action-btn" disabled={selectedProducts.length === 0} onClick={handleDeleteProducts}>Delete</button>
          <button className="action-btn" disabled={selectedProducts.length === 0}>Set discount</button>
          <button className="action-btn" disabled={selectedProducts.length === 0}>Set alert</button>
        </div>
      </div>

      <div className="products-table">
        <div className="table-header">
          <div className="th-checkbox">
            <input 
              type="checkbox" 
              checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
              onChange={handleSelectAll}
            />
          </div>
          <div className="th-product">Product</div>
          <div className="th-sku">SKU</div>
          <div className="th-quantity">Quantity</div>
          <div className="th-price">Retail price ⓘ</div>
          <div className="th-sales">Sales ⓘ</div>
          <div className="th-updated">Updated on</div>
          <div className="th-status">Status</div>
          <div className="th-actions"></div>
        </div>

        {filteredProducts.map((product) => (
          <div key={product.id} className="table-row">
            <div className="td-checkbox">
              <input 
                type="checkbox" 
                checked={selectedProducts.includes(product.id)}
                onChange={() => handleToggleSelect(product.id)}
              />
            </div>
            <div className="td-product">
              <div className="product-image">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  '📦'
                )}
              </div>
              <div className="product-info">
                <div className="product-name">
                  <button className="eye-icon">👁</button>
                  {product.name}
                </div>
                {product.productId && <div className="product-id">{product.productId} 📋</div>}
              </div>
            </div>
            <div className="td-sku">
              {product.sku}
              {product.color && <div className="sku-color">{product.color}</div>}
            </div>
            <div className="td-quantity">
              {product.quantity} {product.quantity > 1 && '📝'}
            </div>
            <div className="td-price">
              {product.price} {product.priceWarning && '⚠️'}
            </div>
            <div className="td-sales">{product.sales}</div>
            <div className="td-updated">{product.updated}</div>
            <div className="td-status">
              <span className={`status-badge ${product.status.toLowerCase()}`}>
                {product.status}
              </span>
              {product.statusReason && (
                <div className="status-reason">● {product.statusReason}</div>
              )}
            </div>
            <div className="td-actions">
              <div className="actions-dropdown">
                <button className="action-link">Edit</button>
                <button className="action-link" onClick={() => handleDuplicateProduct(product)}>Duplicate</button>
                <button className="action-link">Create ad</button>
                <button className="more-btn">More ▼</button>
              </div>
            </div>
            {product.hasVariants && (
              <div className="variants-row">
                <div className="variants-header">
                  <span>{product.skus} SKUs</span>
                  <button className="expand-btn">Expand ▼</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="chat-btn">💬 Chat</button>
    </div>
  )
}

function Dashboard({ profile }: { profile: DashboardProfile }) {
  const [activeSection, setActiveSection] = useState('homepage')
  const [productsExpanded, setProductsExpanded] = useState(false)
  const [ordersExpanded, setOrdersExpanded] = useState(false)
  const [shippingExpanded, setShippingExpanded] = useState(false)
  const [promotionsExpanded, setPromotionsExpanded] = useState(false)
  const [financeExpanded, setFinanceExpanded] = useState(false)
  const [dataExpanded, setDataExpanded] = useState(false)
  const [growthExpanded, setGrowthExpanded] = useState(false)
  const [accountExpanded, setAccountExpanded] = useState(false)
  const [activeProductsTab, setActiveProductsTab] = useState('manage-products')
  const [activeOrdersTab, setActiveOrdersTab] = useState('manage-orders')
  const [activeShippingTab, setActiveShippingTab] = useState('batch-shipping')
  const [activeFinanceTab, setActiveFinanceTab] = useState('withdrawals')
  const [activeAccountTab, setActiveAccountTab] = useState('seller-profile')
  
  const sidebarItems = [
    { label: 'Homepage', id: 'homepage', icon: '🏠' },
    { label: 'Products', id: 'products', icon: '📦', hasSubmenu: true, expanded: productsExpanded, setExpanded: setProductsExpanded },
    { label: 'Orders', id: 'orders', icon: '📋', hasSubmenu: true, expanded: ordersExpanded, setExpanded: setOrdersExpanded },
    { label: 'Shipping', id: 'shipping', icon: '🚚', hasSubmenu: true, expanded: shippingExpanded, setExpanded: setShippingExpanded },
    { label: 'Promotions', id: 'promotions', icon: '📢', hasSubmenu: true, expanded: promotionsExpanded, setExpanded: setPromotionsExpanded },
    { label: 'Store Design', id: 'store-design', icon: '🏪' },
    { label: 'Finance', id: 'finance', icon: '💰', hasSubmenu: true, expanded: financeExpanded, setExpanded: setFinanceExpanded },
    { label: 'Data Compass', id: 'data', icon: '📊', hasSubmenu: true, expanded: dataExpanded, setExpanded: setDataExpanded },
    { label: 'Growth Center', id: 'growth', icon: '🚀', hasSubmenu: true, expanded: growthExpanded, setExpanded: setGrowthExpanded },
    { label: 'Help Center', id: 'help-center', icon: '❓' },
  ]

  const productsSubItems = [
    { label: 'Manage products', id: 'manage-products' },
    { label: 'Sales accelerator', id: 'sales-accelerator' },
    { label: 'Product ratings', id: 'product-ratings' },
    { label: 'Price bidding', id: 'price-bidding' },
    { label: 'Product opportunities', id: 'product-opportunities' },
    { label: 'Price diagnosis', id: 'price-diagnosis' },
  ]

  const ordersSubItems = [
    { label: 'Manage Orders', id: 'manage-orders' },
    { label: 'Manage Cancellations', id: 'manage-cancellations' },
    { label: 'Manage Returns', id: 'manage-returns' },
  ]

  const shippingSubItems = [
    { label: 'Batch shipping', id: 'batch-shipping' },
    { label: 'Shipping Options', id: 'shipping-options' },
    { label: 'Shipping Template', id: 'shipping-template' },
  ]

  const financeSubItems = [
    { label: 'Withdrawals', id: 'withdrawals' },
    { label: 'Transactions', id: 'transactions' },
    { label: 'Invoice Center', id: 'invoice-center' },
  ]

  const accountSubItems = [
    { label: 'Seller Profile', id: 'seller-profile' },
    { label: 'User Management', id: 'user-management' },
    { label: 'Partner Management', id: 'partner-management' },
    { label: 'Linked TikTok Accu...', id: 'linked-accounts' },
  ]

  return (
    <div className="dashboard-shell">
      <header className="dash-nav">
        <div className="dash-brand">TikTok Shop Seller Center</div>
        <div className="dash-nav-links">
          <a href="#" className="active">Affiliate Marketing</a>
          <a href="#">Live Manager</a>
          <a href="#">Academy</a>
        </div>
        <div className="dash-nav-right">
          <span className="notif" role="img" aria-label="notifications">🔔</span>
          <span className="avatar">{profile.name}</span>
          <span className="lang">English ▾</span>
        </div>
      </header>

      <div className="dashboard">
        <aside className="sidebar">
          <div className="sidebar-logo">TikTok Shop Seller Center</div>
          <nav className="sidebar-nav">
            {sidebarItems.map((item) => (
              <div key={item.label}>
                <button
                  className={`nav-item ${activeSection === item.id ? 'active' : ''} ${item.hasSubmenu ? 'has-submenu' : ''}`}
                  onClick={() => {
                    if (item.hasSubmenu) {
                      item.setExpanded(!item.expanded)
                      if (item.id === 'orders' || item.id === 'finance') {
                        setActiveSection(item.id)
                      }
                    } else {
                      setActiveSection(item.id)
                      setProductsExpanded(false)
                      setOrdersExpanded(false)
                      setShippingExpanded(false)
                      setPromotionsExpanded(false)
                      setFinanceExpanded(false)
                      setDataExpanded(false)
                      setGrowthExpanded(false)
                    }
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.hasSubmenu && <span className={`submenu-arrow ${item.expanded ? 'expanded' : ''}`}>▼</span>}
                </button>
                {item.hasSubmenu && item.id === 'products' && item.expanded && (
                  <div className="submenu">
                    {productsSubItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        className={`nav-item sub ${activeProductsTab === subItem.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveProductsTab(subItem.id)
                          setActiveSection('products')
                        }}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
                {item.hasSubmenu && item.id === 'orders' && item.expanded && (
                  <div className="submenu">
                    {ordersSubItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        className={`nav-item sub ${activeOrdersTab === subItem.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveOrdersTab(subItem.id)
                          setActiveSection('orders')
                        }}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
                {item.hasSubmenu && item.id === 'shipping' && item.expanded && (
                  <div className="submenu">
                    {shippingSubItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        className={`nav-item sub ${activeShippingTab === subItem.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveShippingTab(subItem.id)
                          setActiveSection('shipping')
                        }}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
                {item.hasSubmenu && item.id === 'finance' && item.expanded && (
                  <div className="submenu">
                    {financeSubItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        className={`nav-item sub ${activeFinanceTab === subItem.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveFinanceTab(subItem.id)
                          setActiveSection('finance')
                        }}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="nav-group">
              <button
                className={`nav-item has-submenu account-btn ${accountExpanded ? 'active' : ''}`}
                onClick={() => setAccountExpanded(!accountExpanded)}
              >
                <span className="nav-icon">👤</span>
                <span className="nav-label">My Account</span>
                <span className={`submenu-arrow ${accountExpanded ? 'expanded' : ''}`}>▼</span>
              </button>
              {accountExpanded && (
                <div className="submenu">
                  {accountSubItems.map((item) => (
                    <button 
                      key={item.id} 
                      className={`nav-item sub ${activeAccountTab === item.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveAccountTab(item.id)
                        setActiveSection('account')
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </aside>

        <div className="dash-main">
          {activeSection === 'products' ? (
            activeProductsTab === 'manage-products' ? <ManageProducts /> :
            <div className="placeholder-content">Products content coming soon...</div>
          ) : activeSection === 'orders' ? (
            activeOrdersTab === 'manage-orders' ? <ManageOrders /> :
            <div className="placeholder-content">Orders content coming soon...</div>
          ) : activeSection === 'shipping' ? (
            activeShippingTab === 'shipping-options' ? <ShippingOptions /> :
            <div className="placeholder-content">Shipping content coming soon...</div>
          ) : activeSection === 'finance' ? (
            activeFinanceTab === 'withdrawals' ? <Withdrawals /> :
            activeFinanceTab === 'transactions' ? <Transactions /> :
            <InvoiceCenter />
          ) : activeSection === 'account' ? (
            activeAccountTab === 'seller-profile' ? <SellerProfile /> :
            <div className="placeholder-content">Account content coming soon...</div>
          ) : (
          <div className="homepage-container">
            <div className="homepage-main">
              <section className="hero-banner">
                <div className="banner-content">
                  <h2 className="banner-heading">Banner</h2>
                  <p className="banner-text">
                    You can start to add what you want to sell on TikTok now, like clothes, distrib, kitchenware...
                  </p>
                </div>
                <div className="banner-illustration">
                  <div className="illustration-placeholder">📦 🎨 👕</div>
                </div>
              </section>

              <section className="action-needed-section">
                <h3 className="section-title">Action Needed</h3>
                <div className="action-cards">
                  {actionStats.map((item) => (
                    <div key={item.label} className="action-stat-card">
                      <div className="stat-label">{item.label} ›</div>
                      <div className="stat-value">{item.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="missions-section">
                <div className="missions-header">
                  <h3 className="section-title">Complete Missions to Kick-Start your Business and Win Rewards!</h3>
                  <a href="#" className="view-all-link">View all ›</a>
                </div>
                <div className="missions-list">
                  {missionItems.map((mission, idx) => (
                    <div key={idx} className="mission-item">
                      <div className="mission-icon">📦</div>
                      <div className="mission-details">
                        <div className="mission-main-title">{mission.title} <a href="#" className="learn-link">Learn more</a></div>
                        <div className="mission-criterion">
                          <span className="criterion-badge">Criterion!</span>
                          <span className="criterion-text">{mission.subtitle}</span>
                        </div>
                      </div>
                      <button 
                        className="mission-action-btn"
                        onClick={() => {
                          if (idx === 0) {
                            setActiveSection('products')
                            setActiveProductsTab('manage-products')
                          }
                        }}
                      >
                        {idx === 0 ? 'Add Product' : idx === 1 ? 'Post Video' : 'Go Live'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="view-all-footer">
                  <button className="view-all-btn">View all ›</button>
                </div>
              </section>

              <section className="data-compass-section">
                <div className="compass-header">
                  <h3 className="section-title">Data Compass</h3>
                  <a href="#" className="more-link">More ›</a>
                </div>
                <p className="compass-date">Data updated on May 5, 2021 12:23PM (GMT+07:00)</p>
                
                <div className="compass-stats">
                  <div className="stat-box">
                    <div className="stat-row">
                      <span className="stat-label">Today's Revenue ⓘ</span>
                      <span className="stat-compare">= Self-promotion ⓘ</span>
                    </div>
                    <div className="stat-amount">{dataCompassStats.todayRevenue}</div>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">+ Affiliate ⓘ</span>
                    <div className="stat-amount">{dataCompassStats.affiliate}</div>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">+ 20%</span>
                    <div className="stat-amount">{dataCompassStats.selfPromotion}</div>
                  </div>
                </div>

                <div className="compass-chart">
                  <div className="donut-chart">
                    <svg viewBox="0 0 200 200" className="chart-svg">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" strokeWidth="40" strokeDasharray="280 314" transform="rotate(-90 100 100)" />
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#6366f1" strokeWidth="40" strokeDasharray="158 436" strokeDashoffset="-280" transform="rotate(-90 100 100)" />
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#f59e0b" strokeWidth="40" strokeDasharray="158 436" strokeDashoffset="-438" transform="rotate(-90 100 100)" />
                    </svg>
                    <div className="chart-center">
                      <div className="chart-label">Self-promotion</div>
                      <div className="chart-value">{dataCompassStats.selfPromotion}</div>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-dot live"></span>
                      <span className="legend-label">Live</span>
                      <span className="legend-percent">{dataCompassStats.percentages.live}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot video"></span>
                      <span className="legend-label">Video</span>
                      <span className="legend-percent">{dataCompassStats.percentages.video}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot cart"></span>
                      <span className="legend-label">Cart</span>
                      <span className="legend-percent">{dataCompassStats.percentages.cart}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="live-ranking-section">
                <div className="ranking-header">
                  <h3 className="section-title">LIVE Ranking Top</h3>
                  <a href="#" className="more-link">More LIVEs ›</a>
                </div>
                <div className="ranking-table">
                  {liveRankingData.map((item) => (
                    <div key={item.rank} className="ranking-row">
                      <div className="ranking-left">
                        <div className="rank-avatar">👤</div>
                        <div className="rank-info">
                          <div className="rank-name">{item.name}</div>
                          <div className="rank-meta">
                            <span>Revenue ⓘ {item.revenue}</span>
                            <span className="separator">•</span>
                            <span>PV ⓘ {item.pv}</span>
                          </div>
                        </div>
                      </div>
                      <button className="live-stream-btn">{item.status}</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="homepage-sidebar">
              <div className="shop-health-widget">
                <h3 className="widget-title">Shop Health</h3>
                <div className="health-status">
                  <div className="risk-badge medium">Medium risk</div>
                </div>
                <div className="health-metrics">
                  <div className="metric-row">
                    <span className="metric-label">Wallet risk rate</span>
                    <span className="metric-value red">100.00%</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Late Dispatch Rate</span>
                    <span className="metric-value">95.98%</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Seller Cancellation Rate</span>
                    <span className="metric-value">1.24%</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Defective Rate</span>
                    <span className="metric-value green">0%</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Defective Return Rate</span>
                    <span className="metric-value">100%</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Invalid Tracking Rate</span>
                    <span className="metric-value">99.96%</span>
                  </div>
                </div>
                <button className="learn-more-btn">Learn More ›</button>
              </div>

              <div className="new-seller-widget">
                <h3 className="widget-title">New Seller Constraints</h3>
                <div className="constraint-item">
                  <span className="constraint-label">Daily orders up to</span>
                  <span className="constraint-value">100</span>
                </div>
                <button className="learn-more-btn">Learn More ›</button>
              </div>

              <div className="announcements-widget">
                <h3 className="widget-title">Announcements</h3>
                <div className="announcements-list">
                  {announcements.map((item) => (
                    <div key={item.title} className="announcement-item">
                      <p className="announcement-title">{item.title}</p>
                      <p className="announcement-date">{item.time}</p>
                    </div>
                  ))}
                </div>
                <button className="learn-more-btn">Learn More ›</button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [view, setView] = useState<View>('signup')

  const [signupMode, setSignupMode] = useState<SignupMode>('phone')
  const [phoneCode, setPhoneCode] = useState('+63')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [signupMessage, setSignupMessage] = useState('')

  const [loginMode, setLoginMode] = useState<LoginMode>('phone')
  const [loginPhoneCode, setLoginPhoneCode] = useState('+63')
  const [loginPhoneNumber, setLoginPhoneNumber] = useState('')
  const [loginEmail, setLoginEmail] = useState(sampleCredentials.email)
  const [password, setPassword] = useState(sampleCredentials.password)
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [loginMessage, setLoginMessage] = useState('')

  const [profile, setProfile] = useState<DashboardProfile | null>(null)

  const isSignupPhone = useMemo(() => signupMode === 'phone', [signupMode])
  const isLoginPhone = useMemo(() => loginMode === 'phone', [loginMode])

  const onSignup = async (e: FormEvent) => {
    e.preventDefault()
    setSignupStatus('loading')
    setSignupMessage('')

    if (isSignupPhone && !phoneNumber.trim()) {
      setSignupStatus('error')
      setSignupMessage('Please enter your mobile number.')
      return
    }

    if (!isSignupPhone && !signupEmail.trim()) {
      setSignupStatus('error')
      setSignupMessage('Please enter your email address.')
      return
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: signupMode, phoneCode, phoneNumber, email: signupEmail }),
      })

      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'Unable to submit. Try again.')
      }

      setSignupStatus('success')
      setSignupMessage('Submitted! Check your messages to continue.')
      setPhoneNumber('')
      setSignupEmail('')
    } catch (err) {
      setSignupStatus('error')
      setSignupMessage(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const onLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoginStatus('loading')
    setLoginMessage('')

    if (isLoginPhone && !loginPhoneNumber.trim()) {
      setLoginStatus('error')
      setLoginMessage('Please enter your phone number.')
      return
    }

    try {
      const emailToSend = isLoginPhone ? sampleCredentials.email : loginEmail
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, password }),
      })

      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'Login failed')
      }

      setLoginStatus('success')
      setLoginMessage('Logged in! Redirecting to dashboard...')
      setProfile(data.profile)
      return
    } catch (err) {
      const isDemoCreds = (isLoginPhone || (!isLoginPhone && loginEmail === sampleCredentials.email)) && password === sampleCredentials.password
      if (isDemoCreds) {
        setLoginStatus('success')
        setLoginMessage('API unavailable, continuing with demo profile.')
        setProfile({ name: 'Demo Seller', email: sampleCredentials.email, region: 'Philippines' })
        return
      }
      setLoginStatus('error')
      setLoginMessage(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (profile) {
    return <Dashboard profile={profile} />
  }

  if (view === 'login') {
    return (
      <div className="login-page">
        <header className="login-topbar">
          <div className="login-brand">
            <span className="brand-logo" aria-hidden>
              <span className="logo-icon" />
              <span className="logo-text">TikTok Shop</span>
            </span>
            <div className="divider" />
            <nav className="nav">
              <a className="active" href="#">Seller Center</a>
              <a href="#">Academy</a>
            </nav>
          </div>
          <div className="nav-right">
            <a href="#">Contact us</a>
            <a href="#">US English ▾</a>
          </div>
        </header>

        <div className="login-shell">
          <div className="login-intro">
            <h1>Log in</h1>
            <div className="login-top-links">
              <span className="muted">Don&apos;t have an account yet?</span>
              <button className="link" onClick={() => setView('signup')}>Sign up</button>
            </div>
          </div>

          <main className="login-hero">
            <div className="login-illustration" aria-hidden>
              <div className="phone-card" />
              <div className="badge-icon" />
            </div>

            <div className="login-card">
              <div className="login-row-top">
                <span />
                <button className="link" onClick={() => setLoginMode(loginMode === 'phone' ? 'email' : 'phone')}>
                  {isLoginPhone ? 'Log in with email' : 'Log in with phone'}
                </button>
              </div>

              <form className="login-form" onSubmit={onLogin}>
                {isLoginPhone ? (
                  <div className="field">
                    <label>Phone number</label>
                    <div className="phone-row">
                      <select value={loginPhoneCode} onChange={(e) => setLoginPhoneCode(e.target.value)}>
                        <option value="+63">PH +63</option>
                        <option value="+60">MY +60</option>
                        <option value="+65">SG +65</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={loginPhoneNumber}
                      onChange={(e) => setLoginPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="field">
                <label>Password</label>
                <div className="password-row">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button className="link small" type="button">Forgot the password?</button>
                </div>
              </div>

              <button className="primary teal" type="submit" disabled={loginStatus === 'loading'}>
                {loginStatus === 'loading' ? 'Please wait...' : 'Log in'}
              </button>

              <div className="or-line">or</div>

              <button className="tiktok-btn" type="button">Log in with TikTok account</button>

              <div className="sample-note">
                Demo login: {sampleCredentials.email} / {sampleCredentials.password}
              </div>

                {loginMessage && (
                  <div className={`status ${loginStatus}`} role="status">{loginMessage}</div>
                )}
              </form>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-page">
      <header className="signup-topbar">
        <div className="signup-brand">
          <div className="signup-logo" aria-hidden>
            <span className="logo-icon" />
            <span className="logo-word">TikTok Shop</span>
          </div>
          <div className="divider" />
          <nav className="nav">
            <a className="active" href="#">Seller Center</a>
            <a href="#">Academy</a>
          </nav>
        </div>
        <div className="nav-right">
          <a href="#">Contact us</a>
          <a href="#">Philippine ▾</a>
          <a href="#">US English ▾</a>
          <button className="link" onClick={() => setView('login')}>Log in</button>
        </div>
      </header>

      <div className="signup-hero">
        <div className="signup-left">
          <div className="commission-pill">0% commission fee for 90 days*</div>
          <h1 className="signup-title">
            Reach <span className="accent">millions</span> of active
            <br /> shoppers on TikTok Shop
          </h1>
          <ul className="signup-bullets">
            {featureList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="fine-print">*Earn fee waivers after completing eligible missions in Growth Center. Terms &amp; Conditions apply.</p>
          <div className="signup-visual" aria-hidden />
        </div>

        <div className="signup-card">
          <div className="card-top">
            <h2>Sign up</h2>
            <div className="region-switch">
              <span className="region-dot" aria-hidden /> Philippine Merchant ▾
            </div>
          </div>
          <div className="mode-toggle-row">
            <button className="link" onClick={() => setSignupMode(signupMode === 'phone' ? 'email' : 'phone')}>
              {isSignupPhone ? 'Use email' : 'Use phone'}
            </button>
          </div>

          <form className="signup-form" onSubmit={onSignup}>
            {isSignupPhone ? (
              <div className="field">
                <label>Mobile Phone Number</label>
                <div className="phone-inline">
                  <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)}>
                    <option value="+63">PH +63</option>
                    <option value="+60">MY +60</option>
                    <option value="+65">SG +65</option>
                    <option value="+1">US +1</option>
                    <option value="+44">UK +44</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Please enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
            )}

            <button className="primary coral" type="submit" disabled={signupStatus === 'loading'}>
              {signupStatus === 'loading' ? 'Please wait...' : 'Continue'}
            </button>

            <div className="or-line">Or</div>

            <button className="tiktok-btn light" type="button">Sign up with TikTok account</button>

            <p className="muted small">
              Have a TikTok Shop or TikTok for Business account?{' '}
              <button className="link" onClick={() => setView('login')}>Log in</button>
            </p>

            {signupMessage && (
              <div className={`status ${signupStatus}`} role="status">{signupMessage}</div>
            )}

            <p className="terms">
              By continuing, you agree to the Merchant Terms of Service for TikTok Shop, TikTok Commercial Terms of Service
              and acknowledge our privacy policies. You can use these credentials across Business Center and Ads Manager.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
