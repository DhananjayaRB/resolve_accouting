# Sync Tally Master API Documentation

## Overview

The Sync Tally Master API provides a JWT-secured endpoint to retrieve Tally master data in a hierarchical structure with cursor-based pagination. This API is designed for syncing accounting data from Tally Prime to external systems.

**Endpoint:** `GET /api/v1/sync-tally-master`

**Authentication:** JWT Bearer Token (Required)

---

## 🔐 Authentication

### Header Format
```
Authorization: Bearer <your_jwt_token>
```

### Token Requirements
- Token must be valid and not expired
- Token must contain `org_id` claim
- Token format: Standard JWT (header.payload.signature)

### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---

## 📡 API Endpoint

### Request

**URL:** `/api/v1/sync-tally-master`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `cursor` | string | No | null | Base64-encoded JSON cursor for pagination |
| `limit` | integer | No | 50 | Number of entities per page (max: 100) |

### Example Request

```bash
# First request (no cursor)
curl -X GET "http://localhost:3001/api/v1/sync-tally-master?limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Subsequent request (with cursor)
curl -X GET "http://localhost:3001/api/v1/sync-tally-master?cursor=eyJjYXRlZ29yeSI6IkFzc2V0cyIsImdyb3VwX2lkIjo1LCJjaGlsZF9ncm91cF9pZCI6bnVsbCwibGVkZ2VyX2lkIjoyMDF9&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📦 Response Format

### Success Response (200 OK)

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
          "child_groups": [],
          "ledgers": [
            {
              "ledger_id": 201,
              "ledger_name": "Cash"
            },
            {
              "ledger_id": 202,
              "ledger_name": "Bank Account"
            }
          ]
        },
        {
          "group_id": 5,
          "group_name": "Cash-in-Hand",
          "parent_group_id": 1,
          "child_groups": [
            {
              "group_id": 6,
              "group_name": "Petty Cash",
              "parent_group_id": 5,
              "child_groups": [],
              "ledgers": [
                {
                  "ledger_id": 203,
                  "ledger_name": "Office Petty Cash"
                }
              ]
            }
          ],
          "ledgers": []
        }
      ]
    },
    {
      "category": "Liabilities",
      "groups": [
        {
          "group_id": 10,
          "group_name": "Current Liabilities",
          "parent_group_id": null,
          "child_groups": [],
          "ledgers": []
        }
      ]
    }
  ],
  "pagination": {
    "next_cursor": "eyJjYXRlZ29yeSI6IkxpYWJpbGl0aWVzIiwiZ3JvdXBfaWQiOjEwLCJjaGlsZF9ncm91cF9pZCI6bnVsbCwibGVkZ2VyX2lkIjpudWxsfQ==",
    "has_more": true
  },
  "meta": {
    "synced_at": "2026-02-02T10:36:00.000Z",
    "source": "Tally Prime"
  }
}
```

### Response Fields

#### `data` (array)
Array of category objects, each containing:

- **`category`** (string): Account category (e.g., "Assets", "Liabilities", "Income", "Expense")
- **`groups`** (array): Array of group objects

#### Group Object
- **`group_id`** (integer): Unique group identifier
- **`group_name`** (string): Name of the group
- **`parent_group_id`** (integer | null): Parent group ID (null for root groups)
- **`child_groups`** (array): Array of child group objects (always present, may be empty)
- **`ledgers`** (array): Array of ledger objects (always present, may be empty)

#### Ledger Object
- **`ledger_id`** (integer): Unique ledger identifier
- **`ledger_name`** (string): Name of the ledger

#### `pagination` (object)
- **`next_cursor`** (string | null): Base64-encoded cursor for next page (null if no more data)
- **`has_more`** (boolean): Indicates if more data is available

#### `meta` (object)
- **`synced_at`** (string): ISO 8601 timestamp of sync
- **`source`** (string): Source system identifier ("Tally Prime")

---

## 🧠 Cursor-Based Pagination

### Cursor Structure

The cursor is a Base64-encoded JSON object that tracks the last processed entity:

```json
{
  "category": "Assets",
  "group_id": 5,
  "child_group_id": null,
  "ledger_id": 201
}
```

### Cursor Rules

1. **Processing Order:**
   - Category → Group → Child Group → Ledger

2. **Cursor Fields:**
   - `category`: Last processed category name
   - `group_id`: Last processed group ID
   - `child_group_id`: Last processed child group ID (null if none)
   - `ledger_id`: Last processed ledger ID (null if none)

3. **Resume Logic:**
   - API resumes fetching from the position after the cursor
   - Cursor must be valid and properly formatted

### Example: Using Cursor

```javascript
// First request
const response1 = await fetch('/api/v1/sync-tally-master?limit=50', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data1 = await response1.json();

// Second request (if has_more is true)
if (data1.pagination.has_more) {
  const cursor = data1.pagination.next_cursor;
  const response2 = await fetch(`/api/v1/sync-tally-master?cursor=${cursor}&limit=50`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data2 = await response2.json();
}
```

---

## ⚠️ Error Responses

### 401 Unauthorized

**Invalid Token:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Missing Token:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization header is required"
  }
}
```

### 400 Bad Request

**Invalid Cursor:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CURSOR",
    "message": "Malformed cursor"
  }
}
```

**Missing Organization ID:**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Organization ID not found in token"
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while fetching Tally master data",
    "details": "Error details (only in development mode)"
  }
}
```

---

## 🔄 Edge Cases

### 1. Group Without Sub-Groups
Ledgers are attached directly to the group:
```json
{
  "group_id": 1,
  "group_name": "Current Assets",
  "parent_group_id": null,
  "child_groups": [],
  "ledgers": [
    { "ledger_id": 201, "ledger_name": "Cash" }
  ]
}
```

### 2. Group Without Ledgers
Returns empty ledgers array:
```json
{
  "group_id": 10,
  "group_name": "Current Liabilities",
  "parent_group_id": null,
  "child_groups": [],
  "ledgers": []
}
```

### 3. Category With No Groups
Category is skipped (not included in response)

### 4. Multi-Level Hierarchy
Child groups can have their own child groups:
```json
{
  "group_id": 5,
  "group_name": "Cash-in-Hand",
  "parent_group_id": 1,
  "child_groups": [
    {
      "group_id": 6,
      "group_name": "Petty Cash",
      "parent_group_id": 5,
      "child_groups": [],
      "ledgers": [...]
    }
  ],
  "ledgers": []
}
```

---

## 💻 Usage Examples

### JavaScript/TypeScript

```typescript
async function syncTallyMasters(token: string) {
  const allData: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? `/api/v1/sync-tally-master?cursor=${cursor}&limit=50`
      : `/api/v1/sync-tally-master?limit=50`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error.message}`);
    }

    const data = await response.json();
    allData.push(...data.data);

    hasMore = data.pagination.has_more;
    cursor = data.pagination.next_cursor;
  }

  return allData;
}

// Usage
const token = 'your_jwt_token_here';
const masters = await syncTallyMasters(token);
console.log('Synced', masters.length, 'categories');
```

### Python

```python
import requests
import base64
import json

def sync_tally_masters(token, base_url='http://localhost:3001'):
    all_data = []
    cursor = None
    has_more = True
    
    while has_more:
        url = f"{base_url}/api/v1/sync-tally-master"
        params = {'limit': 50}
        if cursor:
            params['cursor'] = cursor
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        all_data.extend(data['data'])
        
        has_more = data['pagination']['has_more']
        cursor = data['pagination']['next_cursor']
    
    return all_data

# Usage
token = 'your_jwt_token_here'
masters = sync_tally_masters(token)
print(f"Synced {len(masters)} categories")
```

### cURL

```bash
#!/bin/bash

TOKEN="your_jwt_token_here"
BASE_URL="http://localhost:3001"
CURSOR=""
HAS_MORE=true

while [ "$HAS_MORE" = true ]; do
  URL="${BASE_URL}/api/v1/sync-tally-master?limit=50"
  if [ -n "$CURSOR" ]; then
    URL="${URL}&cursor=${CURSOR}"
  fi
  
  RESPONSE=$(curl -s -X GET "$URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  echo "$RESPONSE" | jq '.data[] | .category'
  
  HAS_MORE=$(echo "$RESPONSE" | jq -r '.pagination.has_more')
  CURSOR=$(echo "$RESPONSE" | jq -r '.pagination.next_cursor // empty')
  
  if [ "$CURSOR" = "null" ] || [ -z "$CURSOR" ]; then
    HAS_MORE=false
  fi
done
```

---

## 🔥 Optional Enhancement: Sync Mode Header

For future delta syncs, you can include an optional header:

```
X-Sync-Mode: FULL | INCREMENTAL
```

**Note:** This feature is reserved for future implementation. Currently, the API always performs a FULL sync.

---

## ✅ Testing

### Test with Postman

1. **Create Request:**
   - Method: `GET`
   - URL: `http://localhost:3001/api/v1/sync-tally-master?limit=50`

2. **Add Headers:**
   - `Authorization`: `Bearer <your_token>`
   - `Content-Type`: `application/json`

3. **Test Pagination:**
   - Copy `next_cursor` from response
   - Add as query parameter: `?cursor=<next_cursor>&limit=50`

### Test with cURL

```bash
# Test authentication
curl -X GET "http://localhost:3001/api/v1/sync-tally-master" \
  -H "Authorization: Bearer invalid_token"

# Test valid request
curl -X GET "http://localhost:3001/api/v1/sync-tally-master?limit=10" \
  -H "Authorization: Bearer valid_token" \
  | jq

# Test pagination
curl -X GET "http://localhost:3001/api/v1/sync-tally-master?cursor=eyJjYXRlZ29yeSI6IkFzc2V0cyJ9&limit=10" \
  -H "Authorization: Bearer valid_token" \
  | jq
```

---

## 📝 Notes

1. **Always Present Arrays:** `child_groups` and `ledgers` are always arrays (never null)

2. **Cursor Stability:** Cursors are idempotent - same cursor always returns same results

3. **No Duplicates:** Each ledger appears only once in the response

4. **Sorting:** Data is sorted by:
   - Category (ASC)
   - Group ID (ASC)
   - Child Group ID (ASC)
   - Ledger ID (ASC)

5. **Limit:** Maximum `limit` value is 100. Values above 100 are automatically capped.

6. **Backward Compatibility:** API works with both old schema (`parent_group`) and new schema (`parent_group_id`)

---

## 🐛 Troubleshooting

### Issue: "Invalid or expired token"
- **Solution:** Verify your JWT token is valid and not expired
- Check token expiration: Decode JWT and check `exp` claim

### Issue: "Malformed cursor"
- **Solution:** Ensure cursor is properly Base64-encoded
- Don't modify the cursor string manually

### Issue: Empty response
- **Solution:** Verify data exists in database for the organization
- Check that `org_id` in token matches data in database

### Issue: Missing ledgers
- **Solution:** Ensure ledgers are properly linked to groups via `group_id`
- Verify `ledger.org_id` matches `tally_groups.org_id`

---

## 📞 Support

For issues or questions, please contact the development team or refer to the main API documentation.

---

**Last Updated:** 2026-02-02  
**API Version:** v1  
**Status:** Production Ready

