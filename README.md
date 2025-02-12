# Stencil Art Generator

A Progressive Web App for creating stunning stencil art effects from images. Works offline, supports multiple effects, and provides a responsive design across all devices.

## Features

- 🎨 Multiple stencil art effects
- 📱 Fully responsive PWA
- 🔄 Real-time preview
- 💾 Offline support
- 🌍 Multi-language support
- 🔄 Effect combinations
- 📤 Export options
- 🎯 Touch-friendly controls

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stencil-art.git

# Navigate to project directory
cd stencil-art

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check code formatting
npm run format

# Lint code
npm run lint
```

### Building for Production

```bash
# Build optimized production version
npm run build

# Preview production build
npm start
```

### Deployment

```bash
# Deploy to Firebase hosting
npm run deploy
```

## Project Structure

```
stencil-art/
├── src/
│   ├── index.html          # Main HTML file
│   ├── style.css          # Global styles
│   ├── script.js          # Main application logic
│   └── effects/           # Effect implementations
├── public/
│   ├── icons/            # App icons
│   └── locales/          # Translation files
├── dist/                 # Production build
├── test/                # Test files
└── .github/             # GitHub Actions workflows
```

## PWA Features

- 📥 Installable on devices
- 🔄 Background sync
- 📶 Offline functionality
- 🔔 Push notifications
- 📱 Responsive design
- 🚀 Fast loading

## Performance Optimization

- ⚡️ Code splitting
- 🗜️ Image optimization
- 💾 Efficient caching
- 🔄 Background processing
- 📦 Asset minification
- 🎯 Lazy loading

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- iOS Safari
- Chrome for Android

## Development Tools

- Workbox for service workers
- ESLint for code linting
- Prettier for code formatting
- Jest for testing
- GitHub Actions for CI/CD
- Firebase for hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please ensure your PR:
- Passes all tests
- Maintains code style
- Updates documentation
- Includes test coverage

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm test` - Run tests
- `npm run lint` - Check code style
- `npm run format` - Format code
- `npm run analyze` - Analyze bundle size
- `npm run lighthouse` - Run Lighthouse audit
- `npm run deploy` - Deploy to production

## Environment Variables

Create a `.env` file with:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_TOKEN=your-deploy-token
```

## Security

- HTTPS enforced
- CSP implemented
- Headers optimized
- Permissions controlled
- Resources integrity checked

## Monitoring

- Performance tracking
- Error reporting
- Usage analytics
- PWA metrics
- Build statistics

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Icons from [Material Icons](https://material.io/icons/)
- Fonts from [Google Fonts](https://fonts.google.com/)
- Image processing algorithms adapted from various open-source projects

## Support

For support, please:
1. Check the [documentation](docs/)
2. Search [existing issues](issues/)
3. Create a new issue if needed

## Team

- Lead Developer - [Your Name](https://github.com/yourusername)
- UX Designer - [Designer Name](https://github.com/designerusername)
- Project Manager - [PM Name](https://github.com/pmusername)
