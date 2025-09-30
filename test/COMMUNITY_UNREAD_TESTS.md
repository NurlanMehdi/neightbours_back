# Community Unread Messages - Integration Tests

## Overview
Comprehensive E2E (End-to-End) tests for the Community unread messages feature covering both REST API and WebSocket functionality.

## Test File
`test/community-unread.e2e-spec.ts`

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Only Community Unread Tests
```bash
npm run test:e2e -- community-unread.e2e-spec.ts
```

### Run with Coverage
```bash
npm run test:e2e -- --coverage
```

### Run in Watch Mode (for development)
```bash
npm run test:e2e -- --watch community-unread.e2e-spec.ts
```

## Test Structure

### Setup
- **Before All Tests:**
  - Creates NestJS application with full AppModule
  - Initializes Prisma service
  - Creates 2 test users (`user1`, `user2`)
  - Creates 2 test communities (`community1`, `community2`)
  - Adds both users as members to both communities
  - Generates JWT tokens for authentication

- **After All Tests:**
  - Cleans up all test data from database
  - Closes application

### Test Suites

#### 1. REST API Tests (`GET /api/communities/unread`)

**Test Cases:**

1. **Правильные счётчики для user1**
   - Setup: 3 messages in c1 from user2, 5 messages in c2 from user1
   - CommunityRead for user1 in c1 with `readAt` before all messages
   - Expected: c1 → 3 unread, c2 → 5 unread

2. **Правильные счётчики для user2**
   - Setup: 3 messages in c1 from user2 (self), 5 messages in c2 from user1
   - Expected: c1 → 3 unread, c2 → 5 unread
   - Note: Messages from self are still counted as unread until marked as read

3. **Все сообщения прочитаны**
   - Setup: 2 messages, CommunityRead with `readAt` after all messages
   - Expected: 0 unread

4. **Удалённые сообщения не считаются**
   - Setup: 1 active message, 1 deleted message (`isDeleted = true`)
   - Expected: Only 1 unread (active message)

5. **Немодерированные сообщения не считаются**
   - Setup: 1 moderated message, 1 unmoderated (`isModerated = false`)
   - Expected: Only 1 unread (moderated message)

6. **Сообщества без членства не возвращаются**
   - Setup: Remove user1 from community1
   - Expected: community1 not in response

7. **401 без токена аутентификации**
   - Expected: Unauthorized status

#### 2. WebSocket Tests (`community:unread` event)

**Test Cases:**

1. **Получение счётчиков через WebSocket**
   - Connect as user1
   - Emit `community:unread`
   - Expected: `{ status: "ok", data: [...] }` with correct counts

2. **Автоматическое обновление при новом сообщении**
   - user1 joins community1 and listens for `community:unread`
   - user2 joins and sends message
   - Expected: user1 receives automatic `community:unread` event with updated count

3. **Обработка пустого payload**
   - Emit `community:unread` with `undefined` or empty object
   - Expected: Should work correctly and return all unread counts

## Key Features Tested

### Edge Cases
- ✅ Messages marked as deleted (`isDeleted = true`) are excluded
- ✅ Messages marked as unmoderated (`isModerated = false`) are excluded
- ✅ Users only see communities they are members of
- ✅ `readAt` timestamp comparison works correctly
- ✅ Zero unread counts when all messages are read

### Authentication
- ✅ JWT token validation
- ✅ User identification via `sub` claim
- ✅ Unauthorized access prevention

### WebSocket Features
- ✅ Real-time connection establishment
- ✅ Event acknowledgment callbacks
- ✅ Automatic broadcast to all community members
- ✅ Multiple socket connections (multi-user scenarios)

## Test Data Flow

### Initial State
```
Users: user1, user2
Communities: community1, community2
Memberships:
  - user1 → [community1, community2]
  - user2 → [community1, community2]
```

### Typical Test Flow
```
1. Create messages with specific timestamps
2. Optionally create CommunityRead records
3. Execute API call or WebSocket event
4. Assert response structure and values
5. Cleanup (automatic via beforeEach/afterEach)
```

## Database Cleanup

Each test suite has cleanup logic:
- **beforeEach (REST):** Cleans messages and reads before each test
- **afterEach (WebSocket):** Disconnects sockets after each test
- **afterAll:** Removes all test users, communities, and related data

## Assertions

Tests verify:
- HTTP status codes (200, 401, etc.)
- Response structure (arrays, objects)
- Exact unread counts per community
- WebSocket event payloads
- Real-time broadcast behavior

## Debugging Failed Tests

### Check Database State
```bash
# Connect to your test database
psql -U postgres -d neighbours_test

# Check test data
SELECT * FROM users WHERE phone LIKE '+7900%';
SELECT * FROM communities WHERE name LIKE 'Test Community%';
SELECT * FROM community_messages;
SELECT * FROM community_reads;
```

### Enable Debug Logging
In test file, add:
```typescript
// Before test
process.env.LOG_LEVEL = 'debug';
```

### Run Single Test
```bash
npm run test:e2e -- community-unread.e2e-spec.ts -t "должен вернуть правильные счётчики"
```

## Performance Considerations

- Tests use real database (not mocked)
- Each test suite runs in sequence
- WebSocket tests have 10s timeout
- Cleanup ensures no data leakage between tests

## Requirements

### Dependencies
- `@nestjs/testing` - NestJS testing utilities
- `supertest` - HTTP assertions
- `socket.io-client` - WebSocket client
- `jest` - Test runner

### Database
- PostgreSQL (or compatible database)
- Prisma migrations applied
- Test database should be separate from development

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    DATABASE_URL: postgresql://postgres:password@localhost:5432/test_db
    JWT_SECRET: test-secret
```

## Troubleshooting

### "Port already in use"
- Tests use random port (`.listen(0)`)
- Ensure previous test process is terminated

### "Connection refused"
- Check if database is running
- Verify DATABASE_URL in environment

### "Timeout exceeded"
- WebSocket tests have 10s timeout
- Increase timeout if network is slow:
  ```typescript
  it('should work', (done) => {
    // test code
  }, 15000); // 15 seconds
  ```

### "JWT token expired"
- Tokens are generated fresh for each test run
- Check system time if issues persist

## Coverage Goals

Target coverage for unread messages feature:
- **Repository:** 100% (all methods tested)
- **Service:** 100% (business logic verified)
- **Controller:** 100% (endpoints covered)
- **Gateway:** 95%+ (WebSocket events tested)

## Future Enhancements

Potential additional tests:
- Load testing (many communities, many messages)
- Concurrent user scenarios
- Network failure recovery
- Performance benchmarks
- Stress testing (thousands of unread messages)

