# Production Deployment Guide - FCM Token Fix

## 🎯 Overview
This guide outlines the steps needed to safely deploy the FCM token management fixes to production.

## ⚠️ **CRITICAL: Pre-Deployment Steps**

### 1. Database Backup
```bash
# Create a full database backup before deployment
pg_dump -h your-db-host -U your-db-user -d neighbours > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Check for Duplicate FCM Tokens
```sql
-- Run this query to identify duplicate FCM tokens in production
SELECT fcmToken, COUNT(*) as count 
FROM users 
WHERE fcmToken IS NOT NULL 
GROUP BY fcmToken 
HAVING COUNT(*) > 1;
```

If duplicates exist, you need to clean them BEFORE applying the unique constraint.

## 🔧 **Deployment Steps**

### Step 1: Deploy Code Changes
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Build the application
npm run build

# 4. Generate Prisma client with new schema
npx prisma generate
```

### Step 2: Handle Existing Duplicate Tokens

**Option A: If you have duplicates (safer approach)**
```sql
-- Clean up duplicates by keeping only the most recent user for each token
WITH ranked_tokens AS (
  SELECT id, fcmToken, 
         ROW_NUMBER() OVER (PARTITION BY fcmToken ORDER BY lastAccess DESC NULLS LAST, id DESC) as rn
  FROM users 
  WHERE fcmToken IS NOT NULL
)
UPDATE users 
SET fcmToken = NULL 
WHERE id IN (
  SELECT id FROM ranked_tokens WHERE rn > 1
);
```

**Option B: If no duplicates exist**
Skip this step and proceed to database migration.

### Step 3: Apply Database Migration
```bash
# Apply the unique constraint migration
npx prisma migrate deploy
```

### Step 4: Restart Application
```bash
# Restart your application (method depends on your deployment)
pm2 restart neighbours_back
# OR
docker-compose restart
# OR
systemctl restart neighbours_back
```

## 🔍 **Post-Deployment Verification**

### 1. Verify Unique Constraint
```sql
-- This should return the constraint
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_type = 'UNIQUE';
```

### 2. Test FCM Token Assignment
```bash
# Test the new endpoints
curl -X PATCH "https://your-api.com/users/fcm-token" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "test-token-123", "pushNotificationsEnabled": true}'

# Test logout endpoint
curl -X POST "https://your-api.com/auth/logout" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Monitor Application Logs
```bash
# Check for any errors related to FCM tokens
tail -f /path/to/your/logs/application.log | grep -i fcm

# Look for successful token assignments and cleanups
```

## 📊 **Monitoring Queries**

### Check Token Distribution
```sql
-- See how many users have FCM tokens
SELECT 
  COUNT(*) as total_users,
  COUNT(fcmToken) as users_with_tokens,
  COUNT(DISTINCT fcmToken) as unique_tokens
FROM users;
```

### Monitor Token Conflicts (should be 0 after fix)
```sql
-- This should return no results
SELECT fcmToken, COUNT(*) as count 
FROM users 
WHERE fcmToken IS NOT NULL 
GROUP BY fcmToken 
HAVING COUNT(*) > 1;
```

### Check Invalid Token Cleanup
```sql
-- Monitor users with null FCM tokens (cleaned up invalid ones)
SELECT COUNT(*) as users_with_null_tokens
FROM users 
WHERE fcmToken IS NULL AND pushNotificationsEnabled = true;
```

## 🚨 **Rollback Plan (If Needed)**

### If Issues Occur:

1. **Rollback Code:**
```bash
git checkout previous-stable-commit
npm run build
pm2 restart neighbours_back
```

2. **Rollback Database (if constraint causes issues):**
```sql
-- Remove unique constraint if needed
DROP INDEX IF EXISTS users_fcmToken_key;
```

3. **Restore from Backup:**
```bash
# If major issues occur
psql -h your-db-host -U your-db-user -d neighbours < backup_file.sql
```

## 📝 **Expected Behavior After Deployment**

1. **No More Duplicate Tokens**: Each FCM token can only belong to one user
2. **Automatic Conflict Resolution**: When users login with same token, it gets reassigned automatically
3. **Clean Logout**: Users logging out will have their FCM tokens cleared
4. **Invalid Token Cleanup**: Bad tokens are automatically removed when Firebase reports errors
5. **Better Notifications**: Push notifications will only go to the intended users

## 🔧 **Configuration Notes**

- No environment variables need to be changed
- No additional services need to be started
- The changes are backward compatible with existing API calls
- New logout endpoint is available but optional to use

## 📞 **Support & Monitoring**

### Key Metrics to Monitor:
- FCM token assignment success rate
- Push notification delivery rate
- Number of invalid token cleanups
- User logout frequency

### Log Patterns to Watch:
- `"FCM токен уже используется пользователем"` - Token conflicts (should auto-resolve)
- `"Недействительный FCM токен"` - Invalid token cleanups
- `"FCM токен успешно обновлен"` - Successful token assignments
- `"Выход пользователя"` - User logouts

## ✅ **Success Criteria**

Deployment is successful when:
- [ ] Unique constraint is active on fcmToken field
- [ ] No duplicate FCM tokens exist in database
- [ ] New logout endpoint works correctly
- [ ] FCM token conflicts are automatically resolved
- [ ] Push notifications are delivered to correct users only
- [ ] Application logs show successful token management operations
