# Contributing to AquaShield 🤝

Thank you for your interest in contributing to **AquaShield - Smart Community Health Surveillance System**! We're excited to welcome contributors who share our mission of improving healthcare access and outcomes in rural Northeast India through technology innovation.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Commit Message Guidelines](#-commit-message-guidelines)
- [Code Style Guidelines](#-code-style-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Testing Guidelines](#-testing-guidelines)
- [Documentation Guidelines](#-documentation-guidelines)
- [Issue Reporting](#-issue-reporting)
- [Feature Requests](#-feature-requests)
- [Areas for Contribution](#-areas-for-contribution)
- [Review Process](#-review-process)
- [Recognition](#-recognition)

## 🤝 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background, experience level, gender, nationality, race, religion, or sexual orientation.

### Expected Behavior
- **Be Respectful**: Treat all community members with respect and kindness
- **Be Collaborative**: Work together constructively and share knowledge
- **Be Inclusive**: Welcome newcomers and help them get started
- **Be Professional**: Maintain professionalism in all interactions
- **Be Patient**: Remember that everyone is learning and growing

### Unacceptable Behavior
- Harassment, discrimination, or hate speech
- Personal attacks or inflammatory language
- Trolling, spamming, or disruptive behavior
- Sharing private information without consent
- Any behavior that creates a hostile environment

### Enforcement
Instances of unacceptable behavior should be reported to the project maintainers. All reports will be reviewed confidentially and appropriate action will be taken.

## 🚀 Getting Started

### Prerequisites
Before you start contributing, make sure you have:
- **Node.js 18.x or higher** installed
- **MongoDB 5.0 or higher** (local or Atlas account)
- **Python 3.8 or higher** for ML service
- **Git** for version control
- **Code editor** (VS Code recommended)
- Basic understanding of JavaScript, React, Node.js, and Python

### Fork and Clone
1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/aquashield.git
   cd aquashield
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-repo/aquashield.git
   ```

### Set Up Development Environment
1. **Install Backend Dependencies**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Configure your .env file
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

3. **Set Up ML Service**:
   ```bash
   cd ../microservice/main
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   # venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```

4. **Start All Services**:
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev

   # Terminal 2: Frontend
   cd client && npm run dev

   # Terminal 3: ML Service
   cd microservice/main && python main.py
   ```

5. **Verify Setup**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - ML Service: http://localhost:8000

## 🔄 Development Workflow

### Branch Strategy
We use a **feature branch workflow**:
- `main`: Production-ready code
- `develop`: Integration branch for features (if applicable)
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes
- `docs/*`: Documentation updates

### Branch Naming Conventions
```bash
feature/user-authentication
feature/water-quality-prediction
bugfix/cors-issue-fix
hotfix/security-vulnerability
docs/api-documentation-update
```

### Development Process
1. **Create Feature Branch**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**:
   - Write clean, readable code
   - Follow established patterns
   - Add appropriate comments
   - Update tests if needed

3. **Test Your Changes**:
   ```bash
   # Run linting
   npm run lint

   # Run tests
   npm test

   # Manual testing
   # Test the feature end-to-end
   ```

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat(auth): add password reset functionality"
   ```

5. **Push and Create PR**:
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

## 📝 Commit Message Guidelines

We follow the **Conventional Commits** specification for clear, consistent commit messages.

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `perf`: Performance improvements
- `ci`: CI/CD configuration changes

### Scopes (Optional)
- `auth`: Authentication and authorization
- `api`: Backend API changes
- `ui`: User interface changes
- `db`: Database-related changes
- `ml`: Machine learning service
- `config`: Configuration changes

### Examples
```bash
feat(auth): add JWT refresh token mechanism
fix(api): resolve CORS issue for production deployment
docs(readme): update installation instructions
style(components): format header component with prettier
refactor(utils): extract common validation functions
test(auth): add unit tests for login functionality
chore(deps): update dependencies to latest versions
```

### Guidelines
- Use **present tense** ("add" not "added")
- Use **imperative mood** ("move cursor to..." not "moves cursor to...")
- **Limit first line** to 72 characters or less
- **Reference issues** and pull requests when applicable
- **Include body** for complex changes explaining what and why

## 🎨 Code Style Guidelines

### JavaScript/React Standards
We use **ESLint** and **Prettier** for consistent code formatting:

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

#### Code Style Rules
- Use **functional components** with hooks
- Use **arrow functions** for inline functions
- Use **const** by default, **let** when reassignment needed
- Use **destructuring** for objects and arrays
- Use **template literals** for string interpolation
- Add **PropTypes** or **TypeScript** for component props

#### File Naming
- **Components**: PascalCase (`UserProfile.jsx`)
- **Utilities**: camelCase (`apiHelpers.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.js`)
- **Directories**: kebab-case (`user-management/`)

#### Component Structure
```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2 }) => {
  // State declarations
  const [state, setState] = useState('');
  
  // Effect hooks
  useEffect(() => {
    // Effect logic
  }, []);

  // Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // Render
  return (
    <div className="component-container">
      {/* JSX content */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.required,
  prop2: PropTypes.number
};

export default ComponentName;
```

#### Import Order
1. **External libraries** (React, axios, etc.)
2. **Internal modules** (utils, config, etc.)
3. **Relative imports** (./Component, ../utils)

```jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

import { apiClient } from '../config/api';
import { validateInput } from '../utils/validation';

import Header from './Header';
import './ComponentName.css';
```

### Python Standards
For the ML microservice, we follow **PEP 8** guidelines:

```python
# Use snake_case for variables and functions
user_data = get_user_data()

# Use PascalCase for classes
class WaterQualityPredictor:
    pass

# Add type hints
def predict_water_quality(data: dict) -> dict:
    return prediction_result

# Use docstrings for functions
def calculate_score(parameters):
    """
    Calculate water quality score based on input parameters.
    
    Args:
        parameters (dict): Water quality parameters
        
    Returns:
        dict: Score and classification result
    """
    pass
```

### CSS/Styling Guidelines
We use **TailwindCSS** for styling:
- Use **utility classes** instead of custom CSS
- Group related classes together
- Use **responsive modifiers** (sm:, md:, lg:)
- Use **component extraction** for repeated patterns

```jsx
// Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
    Action
  </button>
</div>
```

## 🔍 Pull Request Process

### Before Creating a PR
1. **Test your changes** thoroughly
2. **Run linting** and fix any issues
3. **Update documentation** if needed
4. **Add or update tests** for new functionality
5. **Rebase on latest main** if needed

### PR Title and Description
- **Clear, descriptive title** following commit message format
- **Detailed description** explaining what and why
- **Screenshots** for UI changes
- **Link related issues** using keywords (Fixes #123, Closes #456)
- **Checklist** of completed items

### PR Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Screenshots (if applicable)
Add screenshots for UI changes.

## Testing
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Criteria
Your PR will be reviewed for:
- **Code quality** and adherence to style guidelines
- **Functionality** and correctness
- **Test coverage** and quality
- **Documentation** completeness
- **Performance** impact
- **Security** considerations

## 🧪 Testing Guidelines

### Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **Manual Testing**: Test user workflows and edge cases
- **Performance Testing**: Ensure acceptable response times

### Frontend Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

#### Writing Tests
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfile from './UserProfile';

describe('UserProfile', () => {
  test('renders user information correctly', () => {
    const mockUser = { name: 'John Doe', email: 'john@example.com' };
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('handles edit button click', () => {
    const mockOnEdit = jest.fn();
    render(<UserProfile user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalled();
  });
});
```

### Backend Testing
```bash
# Run API tests
npm run test:api

# Run with verbose output
npm run test:verbose
```

### Manual Testing Checklist
- [ ] Authentication flows (signup, login, logout)
- [ ] Role-based access control
- [ ] CRUD operations for all entities
- [ ] Error handling and validation
- [ ] Responsive design on different devices
- [ ] Cross-browser compatibility
- [ ] API error responses
- [ ] File upload functionality

## 📚 Documentation Guidelines

### Code Documentation
- **JSDoc comments** for functions and classes
- **Inline comments** for complex logic
- **README updates** for new features
- **API documentation** for new endpoints

#### JSDoc Examples
```javascript
/**
 * Calculates the water quality score based on test parameters
 * @param {Object} testData - The water test data
 * @param {number} testData.ph - pH level (0-14)
 * @param {number} testData.turbidity - Turbidity level in NTU
 * @param {number} testData.dissolvedOxygen - Dissolved oxygen in mg/L
 * @returns {Object} Score object with value and classification
 * @example
 * const score = calculateWaterQualityScore({
 *   ph: 7.2,
 *   turbidity: 1.5,
 *   dissolvedOxygen: 8.2
 * });
 */
function calculateWaterQualityScore(testData) {
  // Implementation
}
```

### API Documentation
- Update **API_DOCUMENTATION.md** for new endpoints
- Include **request/response examples**
- Document **error codes** and messages
- Add **authentication requirements**

### README Updates
- Add **new features** to feature list
- Update **installation instructions** if needed
- Include **configuration options**
- Add **troubleshooting** for common issues

## 🐛 Issue Reporting

### Before Reporting
1. **Search existing issues** to avoid duplicates
2. **Check documentation** and troubleshooting guides
3. **Update to latest version** if possible
4. **Reproduce the issue** consistently

### Issue Template
When reporting bugs, include:

```markdown
## Bug Description
Clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
Add screenshots if applicable.

## Environment
- OS: [e.g. Windows 10, macOS 12]
- Browser: [e.g. Chrome 96, Firefox 94]
- Node.js version: [e.g. 18.17.0]
- Application version: [e.g. 1.0.0]

## Additional Context
Any other context about the problem.
```

### Issue Labels
We use labels to categorize issues:
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority: high`: High priority issue
- `status: in progress`: Currently being worked on

## 💡 Feature Requests

### Before Requesting
- **Check existing issues** for similar requests
- **Consider the scope** and impact
- **Think about implementation** complexity
- **Align with project goals**

### Feature Request Template
```markdown
## Feature Description
Clear description of the feature you'd like to see.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How do you envision this feature working?

## Use Cases
Specific scenarios where this feature would be useful.

## Alternatives Considered
Other solutions you've considered.

## Implementation Ideas
Technical suggestions for implementation (optional).

## Priority
How important is this feature to you?
- [ ] Nice to have
- [ ] Important
- [ ] Critical
```

## 🎯 Areas for Contribution

### 🐛 Bug Fixes
- Performance issues and optimization
- UI/UX improvements and accessibility
- API reliability and error handling
- Security vulnerabilities and improvements
- Cross-browser compatibility issues
- Mobile responsiveness problems

### 🆕 New Features
- **Real-time Notifications**: WebSocket implementation for live updates
- **Advanced Analytics**: Data visualization and reporting dashboards
- **Mobile App**: React Native or PWA implementation
- **Offline Support**: Service worker and local data management
- **Internationalization**: Multi-language support for local languages
- **Integration APIs**: Third-party service integrations
- **IoT Support**: Sensor data integration and monitoring
- **Telemedicine**: Video consultation capabilities

### 📚 Documentation
- API documentation improvements
- Tutorial and guide creation
- Code examples and demos
- Translation to local languages
- Video tutorials and walkthroughs
- Architecture and design documentation
- Deployment and DevOps guides

### 🧪 Testing & Quality
- Unit test coverage improvement
- Integration test development
- End-to-end test automation
- Performance benchmarking
- Security testing and auditing
- Load testing and scalability
- Cross-browser testing automation

### 🎨 Design & UX
- User interface improvements
- Accessibility enhancements
- Mobile-first design optimization
- User experience research and testing
- Design system development
- Animation and micro-interactions
- Print-friendly layouts

### 🔧 Infrastructure & DevOps
- CI/CD pipeline improvements
- Docker containerization
- Kubernetes deployment
- Monitoring and logging setup
- Database optimization
- Caching strategies
- Security hardening

### 🌐 Localization & Accessibility
- Translation to Northeast Indian languages
- Right-to-left language support
- Screen reader compatibility
- Keyboard navigation improvements
- Color contrast and visual accessibility
- Voice interface enhancements
- Offline documentation

## 📋 Review Process

### Timeline Expectations
- **Initial Response**: Within 2-3 business days
- **Code Review**: Within 1 week for most PRs
- **Complex Features**: May take 2-3 weeks for thorough review
- **Hot Fixes**: Expedited review within 24-48 hours

### Review Criteria
Reviewers will check for:
1. **Functionality**: Does the code work as intended?
2. **Code Quality**: Is the code clean, readable, and maintainable?
3. **Testing**: Are there adequate tests and do they pass?
4. **Documentation**: Is the code properly documented?
5. **Performance**: Does it meet performance requirements?
6. **Security**: Are there any security concerns?
7. **Standards**: Does it follow project conventions?

### Feedback Incorporation
- **Address all feedback** before requesting re-review
- **Ask questions** if feedback is unclear
- **Push additional commits** to address issues
- **Update tests and documentation** as needed
- **Be responsive** to reviewer comments

### Approval Process
- **1 Approval**: Required for most changes
- **2 Approvals**: Required for significant features or breaking changes
- **Maintainer Approval**: Required for releases and critical changes

## 🏆 Recognition

### Contributor Recognition
We value all contributions and recognize contributors through:

#### GitHub Recognition
- **Contributors Section**: Listed in README.md
- **Release Notes**: Mentioned in version release notes
- **GitHub Stars**: Highlighting exceptional contributions

#### Community Recognition
- **Monthly Highlights**: Featured in project updates
- **Social Media**: Recognition on project social channels
- **Conference Talks**: Opportunities to present work
- **Mentorship**: Helping other contributors

#### Special Contributions
- **First-Time Contributors**: Special welcome and support
- **Long-Term Contributors**: Invitation to maintainer team
- **Security Researchers**: Recognition for security improvements
- **Documentation Writers**: Highlighted for helping others

### Hall of Fame
Outstanding contributors will be featured in our:
- Project website
- Conference presentations
- Case studies and success stories
- Academic publications and research

---

## 🤔 Questions?

If you have any questions about contributing, please:
- 📧 **Email**: [maintainers@aquashield.org]
- 💬 **Discussions**: Use GitHub Discussions
- 📱 **Community**: Join our community chat
- 📖 **Documentation**: Check existing documentation

Thank you for contributing to AquaShield! Together, we can build a healthier future for rural communities in Northeast India. 🙏

---

<div align="center">

**Happy Contributing!** 🎉

*Every contribution, no matter how small, makes a difference in improving healthcare for rural communities.*

</div>