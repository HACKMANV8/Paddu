# 🔧 n8n Automation Troubleshooting Guide

## ✅ Fixed Issues

I've fixed the workflow JSON files. The main issue was **incorrect expression syntax** in the JSON body. All workflows are now updated and ready to import.

---

## 📋 Step-by-Step Setup (Fresh Start)

### 1. **Install/Start n8n**

**Option A: Using npm (Recommended)**
```bash
npm install n8n -g
n8n start
```

**Option B: Using Docker**
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

**Option C: Using npx (Quick Test)**
```bash
npx n8n
```

n8n will be available at: `http://localhost:5678`

### 2. **Import the Workflow**

1. Open n8n in your browser: `http://localhost:5678`
2. Click **"Workflows"** in the left sidebar
3. Click **"Import from File"** button (or press `Ctrl+O`)
4. Select `n8n_workflow_simple.json` (start with this one - it's easier)
5. Click **"Import"**

### 3. **Configure the Workflow**

After importing, click on the workflow to open it. You'll see these nodes:

#### 🔧 Node 1: "Every Hour" (Cron Trigger)
- **Default**: Runs every hour
- **For Testing**: Change to run every minute:
  - Click the node
  - Change **"Cron Expression"** to: `* * * * *` (every minute)
  - Or use UI: **"Every Minute"**

#### 🔧 Node 2: "Get Due Schedules" (HTTP Request)
- **Check the URL**: Should be `http://localhost:8080/api/schedule/due`
- **If your Go server is on different port/IP**: Update the URL
  - For remote server: `http://YOUR_IP:8080/api/schedule/due`
  - Make sure your Go backend is running!

#### 🔧 Node 3: "Split In Batches"
- No configuration needed (processes one schedule at a time)

#### 🔧 Node 4: "Trigger Quiz Reminder" (HTTP Request)
- **Check the URL**: Should be `http://localhost:8080/api/quiz/reminder`
- **Check the JSON Body**: Should be:
  ```json
  {{ { "schedule_id": $json.id } }}
  ```
- **If this is wrong**, click the node and fix:
  - Method: `POST`
  - Specify Body: `JSON`
  - JSON Body: `={{ { "schedule_id": $json.id } }}`

### 4. **Activate the Workflow**

1. Toggle the **"Active"** switch in the top-right corner (it should be green/ON)
2. The workflow will now run automatically based on the cron schedule

---

## 🧪 Testing the Workflow

### Quick Test (1-2 Minutes)

1. **Make sure your Go backend is running** on port 8080

2. **Create a test schedule** that's due soon:
   ```bash
   POST http://localhost:8080/api/schedule
   Content-Type: application/json
   
   {
     "user_id": 1,
     "chat_id": "your-existing-chat-id",
     "scheduled_time": "2025-01-15T14:30:00Z"  # Set this to 1-2 min from now
   }
   ```

3. **In n8n**, click **"Execute Workflow"** button (play icon) to test manually

4. **Check the execution**:
   - Click on **"Executions"** in left sidebar
   - Click on the latest execution
   - Check each node - they should all be green ✅

5. **Verify the reminder was sent**:
   ```bash
   GET http://localhost:8080/api/chat/your-chat-id
   ```
   You should see a bot message asking user to take quiz!

---

## ❌ Common Issues & Fixes

### Issue 1: "Workflow not triggering"

**Symptoms**: Cron doesn't run automatically

**Fixes**:
- ✅ Make sure workflow is **Active** (toggle switch is ON)
- ✅ Check cron schedule - use `* * * * *` for every minute (testing)
- ✅ In n8n Settings → **"Executions"**, check "Save Execution Progress" is enabled
- ✅ Restart n8n if needed

---

### Issue 2: "Cannot connect to localhost:8080"

**Symptoms**: Error in "Get Due Schedules" node

**Fixes**:
- ✅ Make sure your **Go backend is running**
- ✅ Test the endpoint manually:
  ```bash
  curl http://localhost:8080/api/schedule/due
  ```
- ✅ If backend is on different machine, use IP instead of `localhost`
- ✅ Check firewall settings
- ✅ For Docker n8n, use `host.docker.internal` instead of `localhost`:
  - `http://host.docker.internal:8080/api/schedule/due`

---

### Issue 3: "JSON body syntax error"

**Symptoms**: Error in "Trigger Quiz Reminder" node

**Fixes**:
- ✅ Make sure JSON Body is: `={{ { "schedule_id": $json.id } }}`
- ✅ The `={{ }}` wrapper is required for n8n expressions
- ✅ Don't use `{{ }}` alone - that's wrong syntax

---

### Issue 4: "No schedules found"

**Symptoms**: "Get Due Schedules" returns empty array `[]`

**Fixes**:
- ✅ Create a schedule with time in the **past** (but within last hour)
- ✅ Check schedule is `active=true`
- ✅ Test endpoint manually:
  ```bash
  GET http://localhost:8080/api/schedule/due
  ```
- ✅ The endpoint returns schedules where:
  - `scheduled_time <= NOW()`
  - `scheduled_time >= NOW() - 1 hour`
  - `active = true`

---

### Issue 5: "Split In Batches not working"

**Symptoms**: No data flows through

**Fixes**:
- ✅ Make sure "Get Due Schedules" returns an **array** (even if empty)
- ✅ Check the response format - should be `[{...}, {...}]`
- ✅ "Split In Batches" expects array input

---

### Issue 6: "404 Chat not found" in reminder

**Symptoms**: "Trigger Quiz Reminder" returns 404

**Fixes**:
- ✅ Make sure the `schedule_id` exists
- ✅ Check that the schedule has a valid `chat_id`
- ✅ Verify chat exists in database

---

### Issue 7: "n8n workflow JSON import error"

**Symptoms**: Can't import the workflow file

**Fixes**:
- ✅ Make sure you're using the **latest version** of n8n
- ✅ Try importing `n8n_workflow_simple.json` first (simpler version)
- ✅ Check JSON file is valid (no syntax errors)
- ✅ If still failing, manually create the workflow (see below)

---

## 🛠️ Manual Workflow Creation (If Import Fails)

If importing doesn't work, create the workflow manually:

1. **Create New Workflow** in n8n

2. **Add Cron Trigger**:
   - Search for "Cron" node
   - Add it
   - Set to run every hour (or every minute for testing)

3. **Add HTTP Request - Get Due Schedules**:
   - Search for "HTTP Request" node
   - Method: `GET`
   - URL: `http://localhost:8080/api/schedule/due`
   - Connect it after Cron node

4. **Add Split In Batches**:
   - Search for "Split In Batches" node
   - Batch Size: `1`
   - Connect it after HTTP Request node

5. **Add HTTP Request - Trigger Reminder**:
   - Search for "HTTP Request" node
   - Method: `POST`
   - URL: `http://localhost:8080/api/quiz/reminder`
   - Specify Body: `JSON`
   - JSON Body: `={{ { "schedule_id": $json.id } }}`
   - Connect it after Split In Batches node

6. **Activate** the workflow!

---

## 📊 Understanding the Workflow Flow

```
1. Cron Trigger (Every Hour)
   ↓
2. Get Due Schedules (GET /api/schedule/due)
   → Returns: [{id: 1, user_id: 1, chat_id: "...", ...}, ...]
   ↓
3. Split In Batches (Process one at a time)
   → Processes each schedule separately
   ↓
4. Trigger Quiz Reminder (POST /api/quiz/reminder)
   → Sends: {schedule_id: 1}
   → Backend sends bot message to chat
```

---

## 🔍 Debugging Tips

1. **Check Execution Logs**:
   - Click on "Executions" in n8n
   - Click on any execution to see detailed logs
   - Each node shows input/output data

2. **Test Each Node Individually**:
   - Click on a node
   - Click "Test step" button
   - See what data it receives/sends

3. **Check Backend Logs**:
   - Look at your Go server console
   - Should show incoming requests

4. **Use Postman First**:
   - Test `GET /api/schedule/due` manually
   - Test `POST /api/quiz/reminder` manually
   - Then test in n8n

---

## 📝 Checklist Before Going Live

- [ ] Go backend is running and accessible
- [ ] Workflow imported successfully
- [ ] All URLs updated (if using remote server)
- [ ] Workflow is **Active** (green toggle)
- [ ] Cron schedule is correct (hourly for production)
- [ ] Test execution worked successfully
- [ ] Reminder message appears in chat
- [ ] Backend logs show requests from n8n

---

## 🚀 Production Tips

1. **Cron Schedule for Production**:
   - Every hour: `0 * * * *` (runs at :00 of every hour)
   - Every 15 minutes: `*/15 * * * *`
   - Daily at 9 AM: `0 9 * * *`

2. **Server Configuration**:
   - If n8n is on different server, update URLs to use IP or domain
   - Consider using environment variables in n8n for URLs

3. **Monitoring**:
   - Check n8n executions regularly
   - Set up alerts for failed executions (n8n pro feature)

4. **Backup**:
   - Export workflows regularly
   - Keep backup of JSON files

---

## 💡 Quick Reference

**Test Schedule Creation**:
```json
POST http://localhost:8080/api/schedule
{
  "user_id": 1,
  "chat_id": "your-chat-id",
  "scheduled_time": "2025-01-15T14:35:00Z"  // 2 min from now
}
```

**Test Due Schedules Endpoint**:
```bash
GET http://localhost:8080/api/schedule/due
```

**Test Manual Reminder**:
```json
POST http://localhost:8080/api/quiz/reminder
{
  "schedule_id": 1
}
```

**Check Chat History**:
```bash
GET http://localhost:8080/api/chat/your-chat-id
```

---

## 🆘 Still Having Issues?

1. **Check n8n version**: `n8n --version` (should be 0.200+)
2. **Check Go backend logs** for errors
3. **Verify database** has schedules with `active=true`
4. **Test endpoints manually** in Postman/curl first
5. **Share execution logs** from n8n for debugging

If you're still stuck, provide:
- n8n version
- Error messages from execution logs
- Backend response when testing endpoints manually
- Your cron schedule setting

