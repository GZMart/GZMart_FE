# GZMart Frontend

A comprehensive B2C E-commerce platform with integrated Mini-ERP system for fashion retail cross-border e-commerce.

## 🚀 Tech Stack

- **Framework:** React 18.3
- **Build Tool:** Vite
- **UI Library:** React Bootstrap 5
- **State Management:** Redux Toolkit
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios
- **Real-time:** Socket.io
- **Form Management:** Formik + Yup
- **Charts:** Recharts

## 📁 Project Structure

```
GZMart_FE/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, icons
│   ├── components/        # Reusable components
│   │   ├── common/       # Shared components
│   │   ├── buyer/        # Buyer-specific components
│   │   ├── seller/       # Seller/ERP components
│   │   └── admin/        # Admin components
│   ├── layouts/          # Layout wrappers
│   │   ├── MainLayout.jsx      # Buyer layout
│   │   ├── ERPLayout.jsx       # Seller layout
│   │   └── AdminLayout.jsx     # Admin layout
│   ├── pages/            # Page components
│   │   ├── buyer/        # E-commerce pages
│   │   ├── seller/       # ERP pages
│   │   └── admin/        # Admin pages
│   ├── services/         # API & external services
│   │   ├── api/          # API endpoints
│   │   ├── ai/           # AI integrations
│   │   └── socket/       # WebSocket handlers
│   ├── store/            # Redux store
│   │   ├── slices/       # Redux slices
│   │   └── store.js      # Store configuration
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React contexts
│   ├── utils/            # Utility functions
│   ├── constants/        # Constants & configs
│   ├── routes/           # Route definitions
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── .env.example          # Environment variables template
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd GZMart_FE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

   Then update `.env` with your actual API keys and configuration.

4. **Run development server**
   ```bash
   npm run dev
   ```
   Application will open at `http://localhost:3000`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 🏗️ Architecture Overview

### User Roles & Access

- **Guest/Buyer** - Browse products, cart, checkout
- **Seller** - ERP dashboard, PO management, inventory, landed-cost calculation
- **Admin** - User management, system configuration

### Key Features

- Role-based authentication & authorization
- Real-time notifications via WebSocket
- AI-powered search and chatbot
- Complex landed-cost calculation
- Purchase order workflow
- Inventory tracking

## 👥 Team Collaboration Guidelines

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/<feature-name>` - Feature branches
- `bugfix/<bug-name>` - Bug fix branches

### Code Quality

- Always run `npm run lint` before committing
- Use `npm run format` to maintain consistent code style
- Write meaningful commit messages
- Create PRs for review before merging to develop

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Use PropTypes for type checking
- Follow the folder structure strictly

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

## 📚 Documentation

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Bootstrap](https://react-bootstrap.github.io/)

## 📄 License

Private - GZMart Capstone Project

---

**Maintained by:** GZMart Development Team
