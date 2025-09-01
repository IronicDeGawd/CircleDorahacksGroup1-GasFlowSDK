# GasFlow SDK Documentation

## Project Overview

This is the official documentation website for GasFlow SDK - the ultimate toolkit for cross-chain gas management and transaction optimization across blockchain networks.

## Features

- **Landing Page**: Showcasing GasFlow SDK features and benefits
- **Interactive Documentation**: API reference with draggable documentation windows
- **Sample Projects**: Gallery of real-world blockchain applications built with GasFlow SDK
- **Warm Color Theme**: Beautiful cream/beige design matching the GitIngest aesthetic

## Technology Stack

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library with hooks and components
- **React Router** - Client-side routing
- **shadcn/ui** - Modern UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful SVG icons

## Development Setup

### Prerequisites

### Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd Circle-Project/gasflow-sdk-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to view the documentation.

## 📁 Project Structure

```
gasflow-sdk-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn/ui components
│   │   ├── CodeBlock.tsx   # Syntax-highlighted code
│   │   └── Navigation.tsx  # Site navigation
│   ├── pages/              # Documentation pages
│   │   ├── Documentation.tsx  # Main SDK docs
│   │   ├── Examples.tsx       # Integration examples
│   │   └── GettingStarted.tsx # Setup guide
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── App.tsx             # Main application
├── public/                 # Static assets
├── package.json
└── README.md              # This file
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Deployment
npm run deploy       # Deploy to hosting service
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```bash
# Circle API Configuration
VITE_CIRCLE_API_KEY=your_circle_api_key

# Optional: Custom branding
VITE_APP_NAME="Your App Name"
VITE_APP_DESCRIPTION="Your app description"

# Analytics (optional)
VITE_ANALYTICS_ID=your_analytics_id
```

### Customization Options

#### 🎨 **Styling & Theming**
- Modify `tailwind.config.js` for custom colors and themes
- Update component styles in `src/components/`
- Customize layouts in `src/pages/`

#### 📝 **Content Management**
- Edit documentation content in `src/pages/Documentation.tsx`
- Add new examples in `src/pages/Examples.tsx`
- Update getting started guide in `src/pages/GettingStarted.tsx`

#### 🔗 **Navigation & Routing**
- Configure routes in `src/App.tsx`
- Update navigation in `src/components/Navigation.tsx`

## 🏗️ Technologies Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Shadcn/ui** | UI Components | Latest |
| **React Router** | Navigation | 6.x |
| **Prism.js** | Code Highlighting | Latest |

## 📖 Documentation Sections

### 1. **Getting Started**
- SDK installation guide
- Environment setup
- Basic configuration
- First integration example

### 2. **Core Features**
- CCTP V2 integration
- Multi-chain balance checking
- Cross-chain transfers
- Route optimization

### 3. **Advanced Usage**
- Custom configurations
- Error handling
- Performance optimization
- Security best practices

### 4. **API Reference**
- Complete method documentation
- Parameter descriptions
- Return value specifications
- Code examples

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options

#### **Netlify** (Recommended)
```bash
# Build command: npm run build
# Publish directory: dist
```

#### **Vercel**
```bash
# Framework preset: Vite
# Build command: npm run build
# Output directory: dist
```

#### **GitHub Pages**
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

## 🤝 Contributing

### Adding New Documentation

1. Create new page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/Navigation.tsx`
4. Follow existing documentation patterns

### Code Style Guidelines

- Use TypeScript for all components
- Follow existing component structure
- Add proper JSDoc comments
- Ensure responsive design
- Test on multiple devices

## 🔗 Related Projects

- **[Main Project](../README.md)**: Overall project documentation
- **[SDK Package](../sdk-npm/)**: Core GasFlow SDK
- **[Demo Hub](../gasflow-demo-hub/)**: Live demo application

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Part of the Circle Developer Bounty 2024 submission** 🏆

*Making multichain USDC integration accessible to all developers*