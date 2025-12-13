# Lazada Seller Center Clone

A comprehensive e-commerce seller dashboard built with Next.js 14, TypeScript, and Tailwind CSS, replicating the Lazada Seller Center experience.

## 🚀 Features

### Fully Functional Pages
- **Add Product Page**: Complete form with validation, category selector, and content scoring
- **Order Management**: Advanced filtering, search, pagination, and bulk operations
- **Dashboard**: Welcome interface with setup steps and notifications

### Coming Soon Pages
Professional placeholder pages for all other seller center features including:
- Product Management Tools
- Marketing Center
- Analytics & Reporting
- Financial Management
- Customer Support
- And more...

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **State Management**: React Hooks
- **Form Handling**: Custom validation with real-time feedback

## 📱 Key Features

### Add Product Page
- Dynamic category selection with Miller Columns interface
- Category-based specification fields (Swimwear, Electronics, Home Appliances)
- Image upload with preview and removal functionality
- Real-time form validation with visual feedback
- Content Score sidebar with progress tracking
- Keyboard shortcuts (Ctrl+S for draft, Ctrl+Enter for submit)
- Form submission with success/error handling

### Order Management
- Date filtering (Today, Yesterday, Last 7 days, Last 30 days, Custom)
- Order type filtering (Normal, Pre-Sale, COD, etc.)
- Search by order number and tracking number
- Advanced collapsible filters
- Sortable data table with pagination
- Bulk selection and export functionality
- Status-based action buttons

### Design & UX
- Professional Lazada-inspired UI/UX
- Responsive design for all screen sizes
- Smooth animations and transitions
- Interactive elements with hover effects
- Consistent color scheme and typography
- Loading states and progress indicators

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/mndzjls21/lazada-clone.git
cd lazada-clone
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
src/
├── app/
│   └── (seller)/
│       └── seller-dashboard/
│           ├── add-product/          # Fully functional add product page
│           ├── orders/               # Fully functional order management
│           ├── manage-products/      # Coming soon page
│           └── [other-pages]/        # Coming soon pages
├── components/
│   └── seller/
│       ├── CategorySelector.tsx     # Miller columns category picker
│       ├── ComingSoon.tsx          # Reusable coming soon component
│       └── seller-dashboard-navbar.tsx  # Main navigation
└── lib/                            # Utility functions
```

## 🎯 Navigation

- **Main Dashboard**: `/seller-dashboard`
- **Add Product**: `/seller-dashboard/add-product` (Fully Functional)
- **Order Management**: `/seller-dashboard/orders` (Fully Functional)
- **All Other Pages**: Professional "Coming Soon" interfaces

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

- **CategorySelector**: Miller Columns interface for product categorization
- **ComingSoon**: Professional placeholder component for features under development
- **Form Validation**: Real-time validation with visual feedback
- **Content Scoring**: Dynamic progress tracking for form completion

## 📊 Features in Detail

### Form Validation
- Real-time field validation with visual indicators
- Required field highlighting with red borders
- Character/word counters for text fields
- Image upload validation (minimum 3 images required)
- Category-specific specification validation

### User Experience
- Keyboard shortcuts for power users
- Auto-save draft functionality
- Progress indicators and loading states
- Responsive design for mobile and desktop
- Smooth scrolling and animations

## 🎨 Design System

- **Colors**: Blue primary (#2563eb), with semantic colors for status
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent 8px grid system
- **Components**: Reusable, accessible UI components
- **Icons**: React Icons for consistent iconography

## 🚀 Deployment

The project is ready for deployment on platforms like:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Any Node.js hosting platform

## 📝 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.
