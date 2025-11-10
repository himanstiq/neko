# Contributing to Neko WebRTC

Thank you for your interest in contributing to Neko! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/neko.git
cd neko
```

### 3. Set Up Development Environment

Follow the setup instructions in [SETUP.md](./SETUP.md).

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

## Development Guidelines

### Code Style

#### JavaScript/React

- Use ES6+ syntax
- Prefer functional components with hooks
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for complex functions

```javascript
/**
 * Creates a peer connection with ICE restart capability
 * @param {string} userId - Target user ID
 * @param {string} username - Target username
 * @returns {PeerConnection} Configured peer connection
 */
async function createPeerConnection(userId, username) {
  // Implementation
}
```

#### React Component Structure

```jsx
// 1. Imports
import { useState, useEffect } from "react";
import ComponentA from "./ComponentA";

// 2. Component definition
export default function MyComponent({ prop1, prop2 }) {
  // 3. Hooks
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // 4. Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // 5. Render
  return <div>{/* JSX */}</div>;
}
```

#### Tailwind CSS

- Use Tailwind v4 classes (not v3)
- Prefer utility classes over custom CSS
- Use semantic color names
- Follow mobile-first approach

```jsx
// Good
<div className="flex flex-col md:flex-row gap-4">

// Avoid (v3 syntax)
<div className="flex flex-col md:flex-row space-x-4">
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── Component.jsx   # Component file
│   └── README.md       # Component documentation
├── contexts/           # React contexts
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── services/          # Business logic & external services
├── utils/             # Utility functions
└── config/            # Configuration files
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.jsx`)
- **Files**: camelCase for JS, PascalCase for components
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PARTICIPANTS`)
- **CSS classes**: kebab-case (`user-profile`)

## Testing

### Running Tests

```bash
# Client tests
cd client
npm test

# Server tests
cd server
npm test
```

### Writing Tests

```javascript
// Component test example
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- Write tests for:
  - All new features
  - Bug fixes
  - Complex logic
  - Critical paths

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body

footer
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples

```bash
feat(chat): add typing indicators

Implemented real-time typing indicators in chat using
WebSocket events. Indicators auto-clear after 3 seconds.

Closes #123
```

```bash
fix(webrtc): resolve ICE restart failure

Fixed issue where ICE restart would fail on certain
network configurations by adding proper error handling.

Fixes #456
```

## Pull Request Process

### Before Submitting

1. **Update your fork**

```bash
git remote add upstream https://github.com/ORIGINAL/neko.git
git fetch upstream
git rebase upstream/main
```

2. **Run tests**

```bash
npm test
```

3. **Check linting**

```bash
npm run lint
```

4. **Build successfully**

```bash
npm run build
```

### Submitting a Pull Request

1. Push to your fork

```bash
git push origin feature/your-feature-name
```

2. Create PR on GitHub
   - Use a clear, descriptive title
   - Reference related issues
   - Describe changes in detail
   - Add screenshots for UI changes
   - List breaking changes (if any)

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe testing done

## Screenshots

(if applicable)

## Checklist

- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] Tested in multiple browsers
```

### Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address review comments
4. Keep PR updated with main branch
5. Squash commits if requested

## Feature Development

### Adding a New Feature

1. **Discuss first** - Open an issue to discuss the feature
2. **Plan** - Design the feature, consider edge cases
3. **Implement** - Follow coding guidelines
4. **Test** - Write comprehensive tests
5. **Document** - Update relevant docs
6. **Submit PR** - Follow PR process

### Feature Checklist

- [ ] Feature works as expected
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility considered
- [ ] Performance optimized
- [ ] Browser compatibility tested
- [ ] Documentation updated

## Bug Fixes

### Reporting Bugs

Create an issue with:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos
- Browser/OS information
- Console errors

### Fixing Bugs

1. Reproduce the bug locally
2. Write a failing test
3. Fix the bug
4. Verify test passes
5. Test edge cases
6. Submit PR with fix

## Documentation

### What to Document

- New features
- API changes
- Breaking changes
- Configuration options
- Complex algorithms
- Setup instructions
- Troubleshooting guides

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams for complex concepts
- Keep it up-to-date
- Cross-reference related docs

## WebRTC Specific Guidelines

### Adding WebRTC Features

When working with WebRTC:

- Always handle errors gracefully
- Implement proper cleanup
- Test with multiple browsers
- Consider network conditions
- Add fallbacks for unsupported features

### Testing WebRTC

- Test in Chrome, Firefox, Safari, Edge
- Test on different networks (WiFi, 4G, etc.)
- Test with firewall/NAT configurations
- Use multiple devices simultaneously
- Test connection recovery scenarios

## Performance Considerations

### Client Performance

- Minimize re-renders
- Use React.memo for expensive components
- Implement virtualization for long lists
- Optimize images and assets
- Lazy load components

### Server Performance

- Avoid blocking operations
- Use connection pooling
- Implement caching where appropriate
- Monitor memory usage
- Profile critical paths

## Security Considerations

### Security Checklist

- [ ] Input validation
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Proper authentication/authorization
- [ ] Secure data transmission
- [ ] No sensitive data in logs

## Release Process

1. Version bump in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Final testing
5. Merge to main
6. Tag release
7. Deploy to production

## Getting Help

- **Documentation**: Check README.md, SETUP.md, ARCHITECTURE.md
- **Issues**: Search existing issues
- **Discussions**: GitHub Discussions for questions
- **Discord**: [Community Discord link] (if available)

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Neko! 🎉
