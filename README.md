# VenusRMI - Remote System Monitor

A modern, cross-platform web application for monitoring system resources of remote Linux and Windows machines via SSH. Built with React, TypeScript, and Material-UI.

## Features

- 🔒 Secure SSH connections with password or private key authentication
- 💻 Support for both Linux and Windows systems
- 📊 Real-time monitoring of:
  - System information (hostname, OS, uptime)
  - CPU usage and temperature
  - Memory usage (physical and swap)
  - Storage usage for all drives
  - GPU information (if available)
- 🎨 Modern, responsive UI with dark theme
- 🔄 Automatic data updates every 5 seconds
- 🚀 Built with Vite for fast development and optimal performance

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A remote system with SSH access (Linux or Windows)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/VenusRMI.git
cd VenusRMI
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. Launch the application
2. Enter the connection details:
   - Host: IP address or hostname of the remote system
   - Port: SSH port (default: 22)
   - Username: SSH username
   - Password: SSH password
   - OS: Select the operating system (Linux/Windows)
3. Click "Connect" to establish the connection
4. Monitor the system resources in real-time
5. Click "Disconnect" when done

## System Requirements

### Remote System (Linux)
- SSH server installed and running
- Basic system utilities (top, free, df, etc.)
- For GPU monitoring: NVIDIA drivers and nvidia-smi utility

### Remote System (Windows)
- SSH server installed and running (e.g., OpenSSH)
- WMI enabled
- For GPU monitoring: NVIDIA drivers (optional)

## Development

### Project Structure

```
src/
├── components/         # React components
├── services/          # Business logic and services
├── types/            # TypeScript type definitions
└── App.tsx           # Main application component
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Testing

Run tests:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. The pipeline includes:

### Continuous Integration
- Runs on every push to main and pull requests
- Executes tests and linting
- Ensures code quality before merging

### Continuous Deployment
- Automatically creates releases when tags are pushed to main
- Builds and packages the application for:
  - Windows (.exe)
  - macOS (.dmg)
  - Linux (.AppImage, .deb, .rpm)

### Release Process

1. Create a new tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. The release workflow will automatically:
   - Build the application for all platforms
   - Create a GitHub release
   - Upload the built packages

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
   - Use the provided pull request template
   - Fill in all relevant sections
   - Ensure all tests pass
   - Add screenshots if applicable
   - Request review from maintainers

### Pull Request Guidelines
- Keep pull requests focused and small
- Include tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all CI checks pass
- Respond to review comments promptly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Material-UI](https://mui.com/) for the beautiful UI components
- [node-ssh](https://github.com/steelbrain/node-ssh) for SSH functionality
- [Vite](https://vitejs.dev/) for the build tooling
