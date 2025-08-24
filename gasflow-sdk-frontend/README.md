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

- Node.js & npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Getting Started

```sh
# Step 1: Navigate to the project directory
cd gasflow-sdk-frontend

# Step 2: Install dependencies
npm install

# Step 3: Start development server
npm run dev

# Step 4: Open your browser
# Visit http://localhost:8080
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx      # Navigation header
│   └── DraggableWindow.tsx # Documentation windows
├── pages/              # Main application pages
│   ├── Landing.tsx     # Home page
│   ├── Documentation.tsx # API documentation
│   └── SampleProjects.tsx # Project showcase
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

## Customization

The application uses a warm color theme with CSS custom properties defined in `src/index.css`. You can customize:

- **Colors**: Modify HSL values in the `:root` selector
- **Components**: Update React components in `src/components/`
- **Content**: Edit page content in `src/pages/`
- **Styling**: Adjust Tailwind classes and custom CSS

## Deployment

Build the project for production:

```sh
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary to the GasFlow SDK team.