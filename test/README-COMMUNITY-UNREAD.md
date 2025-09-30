# Community Unread Messages - Integration Tests

Comprehensive E2E tests for the Community unread messages feature with both REST API and WebSocket support.

## 🎯 Quick Start

### Run Tests (Recommended)
```bash
# Run only community unread tests
npm run test:e2e:community-unread

# Or run all E2E tests
npm run test:e2e
```

### Using Shell Script
```bash
# Basic run
./test/run-community-unread-tests.sh

# Watch mode (auto-rerun on changes)
./test/run-community-unread-tests.sh --watch

# With coverage report
./test/run-community-unread-tests.sh --coverage

# Run specific test
./test/run-community-unread-tests.sh --test "REST API"

# Show help
./test/run-community-unread-tests.sh --help
```

## 📋 Test Coverage

### REST API Tests (7 test cases)
✅ **GET /api/communities/unread**
- Correct unread counts for different users
- Zero counts when all messages are read
- Excludes deleted messages (`isDeleted = true`)
- Excludes unmoderated messages (`isModerated = false`)
- Only shows communities where user is member
- Returns 401 without authentication

### WebSocket Tests (3 test cases)
✅ **Event: `community:unread`**
- Request unread counts via WebSocket
- Auto-broadcast on new message
- Handle empty payload

## 🔧 Test Structure

```
test/
├── community-unread.e2e-spec.ts          # Main test file
├── COMMUNITY_UNREAD_TESTS.md             # Detailed documentation
├── run-community-unread-tests.sh         # Test runner script
└── README-COMMUNITY-UNREAD.md            # This file
```

## 🗂️ Test Data Setup

Each test run creates:
- **2 users:** `user1`, `user2`
- **2 communities:** `community1`, `community2`
- **Memberships:** Both users in both communities
- **JWT tokens:** For authentication

All data is automatically cleaned up after tests complete.

## 📊 Test Scenarios

### Scenario 1: Basic Unread Count
```
Given:
  - 3 messages in community1 from user2
  - 5 messages in community2 from user1
  - user1's last read in community1 was before all messages

When: user1 requests unread counts

Then:
  - community1: 3 unread
  - community2: 5 unread
```

### Scenario 2: All Messages Read
```
Given:
  - 2 messages in community1
  - user1's last read timestamp is after all messages

When: user1 requests unread counts

Then:
  - community1: 0 unread
```

### Scenario 3: WebSocket Auto-Broadcast
```
Given:
  - user1 connected and joined community1
  - user1 listening for community:unread events

When: user2 sends a message to community1

Then:
  - Server automatically emits community:unread to user1
  - user1 receives updated unread counts
```

## 🛠️ Prerequisites

### Required Environment Variables
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/test_db
JWT_SECRET=your-test-secret
```

### Database Setup
```bash
# Apply migrations
npm run prisma:migrate

# Or push schema
npm run prisma:sync
```

### Dependencies
All required packages are already in `package.json`:
- `@nestjs/testing`
- `supertest`
- `socket.io-client`
- `jest`

## 🚀 Running Tests

### NPM Scripts
```bash
# Run community unread tests only
npm run test:e2e:community-unread

# Run all E2E tests
npm run test:e2e

# Run with coverage
npm run test:e2e -- --coverage

# Run in watch mode
npm run test:e2e -- --watch community-unread.e2e-spec.ts

# Run specific test by name
npm run test:e2e:community-unread -- -t "должен вернуть правильные счётчики"
```

### Shell Script Options
```bash
# Standard run
./test/run-community-unread-tests.sh

# Watch mode for development
./test/run-community-unread-tests.sh --watch

# Generate coverage report
./test/run-community-unread-tests.sh --coverage

# Verbose output
./test/run-community-unread-tests.sh --verbose

# Run specific test
./test/run-community-unread-tests.sh --test "REST API"
```

## 📝 Test Output Examples

### Successful Run
```
🚀 Community Unread Messages E2E Tests
========================================

▶️  Running tests...

 PASS  test/community-unread.e2e-spec.ts
  Community Unread Messages E2E Tests
    REST API: GET /api/communities/unread
      ✓ должен вернуть правильные счётчики непрочитанных для user1 (245 ms)
      ✓ должен вернуть правильные счётчики для user2 (189 ms)
      ✓ должен вернуть 0 непрочитанных, если все сообщения прочитаны (156 ms)
      ✓ не должен считать удалённые сообщения (167 ms)
      ✓ не должен считать немодерированные сообщения (158 ms)
      ✓ не должен возвращать сообщества, в которых пользователь не является членом (178 ms)
      ✓ должен вернуть 401 без токена аутентификации (34 ms)
    WebSocket: community:unread
      ✓ должен вернуть счётчики непрочитанных через WebSocket (892 ms)
      ✓ должен автоматически обновлять счётчики при получении нового сообщения (1234 ms)
      ✓ должен обрабатывать пустой payload (456 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Time:        8.234 s

✅ All tests passed!
```

### Failed Test Example
```
 FAIL  test/community-unread.e2e-spec.ts
  ● REST API › должен вернуть правильные счётчики

    expect(received).toBe(expected)

    Expected: 3
    Received: 0

      225 |       expect(c1Unread).toBeDefined();
      226 |       expect(c1Unread.unreadCount).toBe(3);
      227 |                                     ^
```

## 🐛 Debugging

### Check Database State
```sql
-- Check test users
SELECT * FROM users WHERE phone LIKE '+7900%';

-- Check communities
SELECT * FROM communities WHERE name LIKE 'Test Community%';

-- Check messages
SELECT cm.*, u.firstName 
FROM community_messages cm
JOIN users u ON cm.userId = u.id
WHERE cm.communityId IN (
  SELECT id FROM communities WHERE name LIKE 'Test Community%'
)
ORDER BY cm.createdAt;

-- Check read status
SELECT cr.*, c.name, u.firstName
FROM community_reads cr
JOIN communities c ON cr.communityId = c.id
JOIN users u ON cr.userId = u.id;
```

### Enable Debug Logging
Add to test file:
```typescript
beforeAll(async () => {
  process.env.LOG_LEVEL = 'debug';
  // ... rest of setup
});
```

### Run Single Test
```bash
npm run test:e2e:community-unread -- -t "правильные счётчики для user1"
```

## 🔍 Test Implementation Details

### REST API Testing
- Uses `supertest` for HTTP requests
- JWT tokens from `JwtService`
- Verifies response structure and data
- Tests error cases (401, etc.)

### WebSocket Testing
- Uses `socket.io-client` for connections
- Tests real-time event flow
- Verifies acknowledgment callbacks
- Tests multi-user scenarios

### Data Isolation
- Each test has `beforeEach` cleanup
- Tests don't interfere with each other
- All data removed after test suite

## 📈 Performance

- **Average test suite time:** 8-12 seconds
- **Individual test time:** 150-1200 ms
- **WebSocket tests:** Slightly longer (auto-broadcast scenarios)
- **Database operations:** Real queries (not mocked)

## 🎓 Key Learnings

### Important Patterns
1. **JWT Token Generation:** Use `JwtService.sign()` with proper payload
2. **WebSocket Testing:** Use callbacks with `done()` for async tests
3. **Data Cleanup:** Critical for test isolation
4. **Timeouts:** WebSocket tests need longer timeouts

### Common Pitfalls
- ❌ Forgetting to disconnect WebSocket clients
- ❌ Not cleaning up test data between tests
- ❌ Hardcoding IDs instead of using created test data
- ❌ Missing `done()` callback in async WebSocket tests

## 📚 Related Documentation

- [COMMUNITY_UNREAD_TESTS.md](./COMMUNITY_UNREAD_TESTS.md) - Detailed test documentation
- [UNREAD_MESSAGES.md](../src/modules/community-chat/UNREAD_MESSAGES.md) - Feature documentation
- [README-WEBSOCKET-TESTS.md](./README-WEBSOCKET-TESTS.md) - WebSocket testing guide

## 🤝 Contributing

When adding new tests:
1. Follow existing test structure
2. Clean up test data properly
3. Use descriptive test names (in Russian per project standards)
4. Add comments for complex scenarios
5. Update documentation

## 📧 Support

For issues or questions:
1. Check test output and error messages
2. Review debug SQL queries
3. Verify database state
4. Check environment variables
5. Consult documentation files

## ✅ Checklist for Running Tests

- [ ] Database is running
- [ ] Migrations are applied (`npm run prisma:migrate`)
- [ ] Environment variables are set (`.env` file)
- [ ] Dependencies are installed (`npm install`)
- [ ] No other test processes running
- [ ] Database has proper permissions

## 🎉 Success Criteria

Tests are considered successful when:
- ✅ All 10 test cases pass
- ✅ No linter errors
- ✅ All data properly cleaned up
- ✅ No hanging connections
- ✅ Expected counts match actual counts

---

**Last Updated:** September 30, 2025  
**Test File:** `test/community-unread.e2e-spec.ts`  
**Version:** 1.0.0

