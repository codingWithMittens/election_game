# Testing Guide

This document explains how to run and write tests for the Electoral Strategy game.

## Test Framework Overview

### Backend Testing
- **Framework**: Jest + ts-jest
- **API Testing**: Supertest
- **Location**: `backend/tests/`

### Frontend Testing
- **Framework**: Vitest
- **Component Testing**: React Testing Library
- **Location**: `frontend/tests/`

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI (interactive)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Backend Tests

```
backend/tests/
├── setup.ts                    # Test configuration
├── unit/                       # Unit tests
│   ├── gameLogic.test.ts      # Game logic functions
│   └── gameCode.test.ts       # Utility functions
└── integration/                # Integration tests
    └── games.api.test.ts      # API endpoint tests
```

### Frontend Tests

```
frontend/tests/
├── setup.ts                    # Test configuration
└── components/                 # Component tests
    ├── CardHand.test.tsx      # CardHand component
    └── ElectoralVoteBar.test.tsx
```

## Writing New Tests

### Backend Unit Test Example

```typescript
import { describe, it, expect } from '@jest/globals';
import { yourFunction } from '../../src/lib/yourModule';

describe('Your Module', () => {
  it('should do something', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Backend API Test Example

```typescript
import request from 'supertest';
import express from 'express';
import yourRouter from '../../src/routes/yourRouter';

describe('Your API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', yourRouter);
  });

  it('should return 200 for valid request', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

### Frontend Component Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '../../src/components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const handleClick = vi.fn();
    render(<YourComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Test Coverage

### Viewing Coverage Reports

After running tests with coverage:

**Backend:**
```bash
cd backend
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

**Frontend:**
```bash
cd frontend
npm run test:coverage
# Open coverage/index.html in browser
```

### Current Coverage Areas

**Backend:**
- ✅ Game logic (electoral vote calculation, state control)
- ✅ Utility functions (game code generation)
- ✅ API routes (game creation, joining)

**Frontend:**
- ✅ UI components (CardHand, ElectoralVoteBar)
- ⚠️ Integration tests (to be expanded)
- ⚠️ Socket communication (to be added)

## Best Practices

### General
1. Write tests before fixing bugs (TDD approach)
2. Keep tests simple and focused
3. Use descriptive test names
4. Test edge cases and error conditions
5. Mock external dependencies

### Backend
1. Mock database calls in unit tests
2. Use actual database in integration tests (optional)
3. Test both success and failure paths
4. Verify error messages and status codes

### Frontend
1. Test user interactions, not implementation
2. Query by accessible roles when possible
3. Use user-event for realistic interactions
4. Test loading states and error boundaries

## Continuous Integration

Tests should pass before:
- Committing to main branch
- Creating pull requests
- Deploying to production

## Troubleshooting

### Backend Tests Failing

**Database connection issues:**
```bash
# Ensure test database URL is set
export TEST_DATABASE_URL="postgresql://localhost/test_db"
```

**Module not found:**
```bash
# Rebuild TypeScript
npm run build
```

### Frontend Tests Failing

**Component not rendering:**
- Check that all required props are provided
- Verify mock data structure matches types

**Test timing out:**
- Increase timeout in test file: `vi.setTimeout(10000)`

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
