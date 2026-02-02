# Quick Start: Sync Tally Master API

## 🚀 Quick Setup

### 1. Get Your JWT Token

Your JWT token should contain:
- `org_id`: Your organization ID
- `exp`: Expiration timestamp
- Other standard JWT claims

### 2. Make Your First Request

```bash
curl -X GET "http://localhost:3001/api/v1/sync-tally-master?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 3. Handle Pagination

```javascript
// Simple pagination example
let cursor = null;
let allData = [];

do {
  const url = cursor 
    ? `/api/v1/sync-tally-master?cursor=${cursor}&limit=50`
    : `/api/v1/sync-tally-master?limit=50`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  allData.push(...data.data);
  
  cursor = data.pagination.next_cursor;
} while (cursor);
```

## 📋 Response Structure

```json
{
  "success": true,
  "data": [
    {
      "category": "Assets",
      "groups": [
        {
          "group_id": 1,
          "group_name": "Current Assets",
          "parent_group_id": null,
          "child_groups": [],      // Always array
          "ledgers": []            // Always array
        }
      ]
    }
  ],
  "pagination": {
    "next_cursor": "base64_string_or_null",
    "has_more": true
  }
}
```

## ⚡ Common Patterns

### Pattern 1: Fetch All Data
```javascript
async function fetchAllMasters(token) {
  const results = [];
  let cursor = null;
  
  do {
    const res = await fetch(
      `/api/v1/sync-tally-master?${cursor ? `cursor=${cursor}&` : ''}limit=100`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await res.json();
    results.push(...data.data);
    cursor = data.pagination.next_cursor;
  } while (cursor);
  
  return results;
}
```

### Pattern 2: Process in Batches
```javascript
async function processBatches(token, processor) {
  let cursor = null;
  let page = 0;
  
  do {
    const res = await fetch(
      `/api/v1/sync-tally-master?${cursor ? `cursor=${cursor}&` : ''}limit=50`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await res.json();
    
    // Process this batch
    await processor(data.data, page++);
    
    cursor = data.pagination.next_cursor;
  } while (cursor);
}
```

## 🔍 Testing

### Test Token Validity
```bash
# Should return 401 if token is invalid
curl -X GET "http://localhost:3001/api/v1/sync-tally-master" \
  -H "Authorization: Bearer invalid_token"
```

### Test First Page
```bash
curl -X GET "http://localhost:3001/api/v1/sync-tally-master?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.data[0]'
```

### Test Pagination
```bash
# Get first page
RESPONSE=$(curl -s -X GET "http://localhost:3001/api/v1/sync-tally-master?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN")

# Extract cursor
CURSOR=$(echo $RESPONSE | jq -r '.pagination.next_cursor')

# Get next page
curl -X GET "http://localhost:3001/api/v1/sync-tally-master?cursor=$CURSOR&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

## ⚠️ Important Notes

1. **Always check `has_more`** before making next request
2. **Never modify the cursor** - use it as-is
3. **Arrays are never null** - `child_groups` and `ledgers` are always arrays
4. **Max limit is 100** - requests with higher limits are capped
5. **Token must include `org_id`** - otherwise you'll get 400 error

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check token validity and expiration |
| 400 Invalid Cursor | Don't modify cursor, use as returned |
| Empty data | Verify data exists for your org_id |
| Missing ledgers | Check ledger.group_id links |

## 📚 Full Documentation

See `API_SYNC_TALLY_MASTER.md` for complete documentation.

