# Network Access & CORS Configuration

## Overview

The application has been configured to work from any network without CORS restrictions. The API URL is now dynamically detected based on your current network.

## Changes Made

### 1. Dynamic API URL Detection
- The frontend now automatically detects the current hostname
- If accessing via IP address (e.g., `192.168.1.100:3000`), it will use that IP for API calls
- If accessing via `localhost`, it uses `localhost:3001`
- Supports environment variable `VITE_API_URL` for custom configuration

### 2. Server Network Binding
- Server now binds to `0.0.0.0` instead of just `localhost`
- This allows access from any network interface (LAN, WAN, etc.)
- Can be configured via `HOST` environment variable

### 3. CORS Configuration
- CORS is configured to allow **all origins** (`*`)
- No network restrictions - works from any IP address or domain
- All necessary headers are allowed
- Preflight OPTIONS requests are handled

## How It Works

### Local Development (Same Machine)
```
Frontend: http://localhost:3000
Backend:  http://localhost:3001
```
✅ Works automatically

### Local Network Access (Same Network)
```
Frontend: http://192.168.1.100:3000
Backend:  http://192.168.1.100:3001
```
✅ Automatically detected - no configuration needed

### Different Network Access
```
Frontend: http://your-public-ip:3000
Backend:  http://your-public-ip:3001
```
✅ Works if ports are accessible

## Configuration Options

### Environment Variables

#### Frontend (.env or .env.local)
```env
# Custom API URL (optional)
VITE_API_URL=http://192.168.1.100:3001/api

# Custom API Port (optional, defaults to 3001)
VITE_API_PORT=3001
```

#### Backend (.env)
```env
# Server host (optional, defaults to 0.0.0.0)
HOST=0.0.0.0

# Server port (optional, defaults to 3001)
PORT=3001
```

## Troubleshooting

### CORS Errors Still Occurring?

1. **Check Browser Console**
   - Look for the logged API URL
   - Verify it matches your current hostname

2. **Verify Server is Running**
   ```bash
   # Check if server is accessible
   curl http://your-ip:3001/health
   ```

3. **Check Firewall**
   - Ensure port 3001 is open
   - Check Windows Firewall / Linux iptables

4. **Verify Network Access**
   - Try accessing `http://your-ip:3001/health` from another device
   - Should return `{"status":"ok"}`

### API URL Not Detecting Correctly?

1. **Use Environment Variable**
   ```env
   VITE_API_URL=http://your-ip:3001/api
   ```

2. **Check Browser Console**
   - The API URL is logged on startup
   - Verify it's correct

3. **Manual Override**
   - Edit `src/context/AppContext.tsx`
   - Set `LOCAL_API_URL` directly if needed

## Security Notes

⚠️ **Important**: The current CORS configuration allows all origins (`*`). This is suitable for:
- Development environments
- Internal networks
- Testing environments

For production, consider:
- Restricting CORS to specific domains
- Using authentication tokens
- Implementing rate limiting

## Testing Network Access

1. **Find Your IP Address**
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   # or
   ip addr
   ```

2. **Start the Server**
   ```bash
   npm run dev
   ```

3. **Access from Another Device**
   - Open browser on another device/network
   - Navigate to `http://your-ip:3000`
   - Should work without CORS errors

4. **Check API Connection**
   - Open browser DevTools → Network tab
   - Verify API calls are going to correct URL
   - Check for CORS errors in Console

## Example Scenarios

### Scenario 1: Office Network
```
Your Machine IP: 192.168.1.50
Access from: http://192.168.1.50:3000
✅ Works automatically
```

### Scenario 2: Home Network
```
Your Machine IP: 192.168.0.100
Access from: http://192.168.0.100:3000
✅ Works automatically
```

### Scenario 3: Mobile Hotspot
```
Your Machine IP: 192.168.43.1
Access from: http://192.168.43.1:3000
✅ Works automatically
```

### Scenario 4: VPN
```
Your Machine IP: 10.0.0.50 (via VPN)
Access from: http://10.0.0.50:3000
✅ Works automatically
```

## Summary

✅ **No more CORS restrictions** - Works from any network
✅ **Automatic detection** - No manual configuration needed
✅ **Flexible configuration** - Environment variables supported
✅ **Network-friendly** - Server accessible from any interface

The application will now work seamlessly when you move to different networks!

