# Upload Error Debugging Guide

## As an experienced developer, follow this systematic debugging process:

### Step 1: Check Diagnostic Health Endpoint
```
GET http://localhost:3002/api/upload/health
```

**Expected Response:**
```json
{
  "timestamp": "2026-04-05T...",
  "supabase": {
    "url": "✓ configured",
    "key": "✓ configured"
  },
  "tests": {
    "supabaseConnection": { "status": "OK", "buckets": [...] },
    "manuscriptsBucket": { "status": "OK", "accessible": true },
    "publicUrlGeneration": { "status": "OK", "sampleUrl": "..." }
  }
}
```

**If FAILED:**
- Check Supabase credentials in `lib/supabaseClient.js`
- Verify bucket "manuscripts" exists in Supabase console
- Check RLS policies allow uploads

---

### Step 2: Browser Console Debugging

1. **Open Dev Tools** → F12 → Console tab
2. **Try uploading a file**
3. **Look for logs starting with:**
   - `[UPLOAD DEBUG]` - Shows what's happening
   - `[UPLOAD ERROR]` - Shows what failed
   - `[UPLOAD SUCCESS]` - Shows success with URL

**Example debug logs:**
```
[UPLOAD DEBUG] Starting upload for manuscriptUrl: {fileName: "paper.pdf", fileType: "application/pdf", fileSize: 2097152}
[UPLOAD DEBUG] XHR onload - Status: 500 {error: "Supabase upload failed: ..."}
```

---

### Step 3: Network Tab Inspection

1. Open Dev Tools → Network tab
2. Filter by "upload" (or just "api")
3. Click on the POST request to `/api/upload`
4. Check:
   - **Status Code**: Should be 200 (success) or show specific error
   - **Response** tab: See exact error from server
   - **Request** tab: Verify FormData contains the file

**Common Status Codes:**
- `200` ✓ - Success
- `400` - Bad request (no file or invalid format)
- `413` - File too large (>10MB)
- `500` - Server error (Supabase issue)

---

### Step 4: Check File Size
```javascript
// Run in console to check if your file is too large:
console.log('Max allowed:', 10 * 1024 * 1024, 'bytes (10MB)');
// When you select a file, check console logs for actual file size
```

---

### Step 5: Verify Supabase Configuration

Check `lib/supabaseClient.js`:
```javascript
// Should have valid URL and ANON key
const supabaseUrl = 'https://zipazritncllfjyjkxpv.supabase.co';
const supabaseKey = 'eyJhbGc...'; // Should NOT be empty
```

**If keys are wrong:**
1. Go to Supabase.com → Your Project
2. Settings → API → Copy "anon key"
3. Update in `lib/supabaseClient.js`

---

### Step 6: Supabase Bucket RLS Policies

The "manuscripts" bucket needs proper policies. Check Supabase Console:

1. Go to Storage → manuscripts bucket
2. Click "Policies" tab
3. Should have a policy allowing uploads (or be public)

**If RLS is blocking:**
```sql
-- Should allow authenticated users to upload
-- Common policy:
CREATE POLICY "Allow authenticated uploads" ON storage.objects
AS PERMISSIVE FOR INSERT
TO authenticated
USING (bucket_id = 'manuscripts');
```

---

### Step 7: Server-Side Verification

Run these curl commands to test upload endpoint:

```bash
# Test 1: Check health
curl http://localhost:3002/api/upload/health

# Test 2: Test upload with a real file
curl -X POST http://localhost:3002/api/upload \
  -F "file=@/path/to/test.pdf"
```

---

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Supabase upload failed" | Bucket permissions | Check RLS policies in Supabase |
| "File upload failed. Network error" | CORS or connection | Check browser console for details |
| "File too large" | File > 10MB | Select a smaller file |
| "No file provided" | File not attached properly | Check form validation |
| 500 error with no message | Supabase client error | Verify credentials in `supabaseClient.js` |
| Upload hangs forever | Timeout or connection issue | Check network tab, restart server |

---

### Step 8: Logs to Check

**Backend Logs** (where you run `npm run dev`):
```
[UPLOAD DEBUG] Starting upload for manuscriptUrl: {...}
[UPLOAD DEBUG] Uploading to Supabase: {filename: "...", size: ...}
[UPLOAD DEBUG] Upload successful: {...}
```

**If not seeing logs:**
- Server might not be running
- Restart with: `npm run dev`
- Check terminal where server started

---

### Immediate Actions

1. **Right now**: 
   - Open browser console (F12)
   - Try uploading a small PDF
   - Take screenshot of any error messages

2. **Check endpoint**: 
   - Visit `http://localhost:3002/api/upload/health`
   - Share the JSON response

3. **Share with logs**:
   - Browser console logs (with `[UPLOAD]` tags)
   - Server terminal output
   - Network request/response details

This will pinpoint the exact failure point.
