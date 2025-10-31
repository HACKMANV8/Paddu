# n8n Workflow Setup Guide

## 📥 Import Workflows

### Option 1: Simple (No SMS) - Recommended for Testing
Import `n8n_workflow_simple.json`

### Option 2: With Twilio SMS
Import `n8n_workflow_twilio.json`

---

## 🔧 Setup Instructions

### 0. Install/Start n8n

**Quick start with npm:**
```bash
npm install n8n -g
n8n start
```

**Or with Docker:**
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

Then open: `http://localhost:5678`

### 1. Import the Workflow

1. Open n8n in browser (`http://localhost:5678`)
2. Click **Workflows** → **Import from File**
3. Select `n8n_workflow_simple.json` (or Twilio version)
4. Click **Import**

**✅ IMPORTANT**: The workflow JSON files have been fixed! The JSON body syntax error is now corrected.

### 2. Configure the HTTP Requests

**Update the base URL** if your Go server is not on `localhost:8080`:

- Open node **"Get Due Schedules"**
- Change URL to: `http://YOUR_SERVER_IP:8080/api/schedule/due`
- Make sure URL has `=` prefix: `=http://localhost:8080/api/schedule/due`

- Open node **"Trigger Quiz Reminder"**
- Change URL to: `http://YOUR_SERVER_IP:8080/api/quiz/reminder`
- Make sure URL has `=` prefix: `=http://localhost:8080/api/quiz/reminder`
- **JSON Body** should be: `={{ { "schedule_id": $json.id } }}`

### 3. Configure Cron Schedule (Optional)

- Open node **"Every Hour"**
- **For Testing**: Change to **"Every Minute"** in the UI (or use `* * * * *`)
- **For Production**: Keep as **"Every Hour"** or change to:
  - **Every 15 minutes**: `*/15 * * * *`
  - **Every hour**: `0 * * * *`
  - **Daily at 9 AM**: `0 9 * * *`

### 4. Activate the Workflow

- **IMPORTANT**: Toggle the **"Active"** switch in top-right to **ON** (green)
- Without this, the workflow won't run automatically!

### 5. For Twilio Version - Set Environment Variables

In n8n Settings → Environment Variables:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🧪 Testing the Workflow

### Manual Test

1. **Create a schedule** in Postman (set time 1-2 min from now)
2. **In n8n**, click **"Execute Workflow"** manually
3. **Check** if reminder was sent (check chat history)

### Automatic Test

1. **Create schedule** with time: `2025-10-31T20:05:00Z`
2. **Wait** for the cron to trigger (or change cron to run every minute for testing)
3. **Verify** reminder appears in chat

---

## 📱 Twilio Setup (Optional)

### Get Twilio Credentials

1. Sign up at https://www.twilio.com
2. Get **Account SID** and **Auth Token** from dashboard
3. Get a **Phone Number** (trial accounts work for testing)

### Update User Model (Future Enhancement)

To send SMS, you'll need to add `phone_number` to users table:

```sql
ALTER TABLE users ADD COLUMN phone_number TEXT;
```

Then update n8n workflow to fetch user phone from API.

---

---

## 📚 More Help

For detailed troubleshooting, see: **`N8N_TROUBLESHOOTING.md`**

---

## 🔍 Quick Troubleshooting

### Workflow Not Triggering

- Check cron schedule format
- Verify workflow is **Active** (toggle in n8n UI)

### No Schedules Found

- Check `GET /api/schedule/due` manually in Postman
- Verify schedule `scheduled_time` is in the past (within last hour)
- Check schedule is `active=true`

### Reminder Not Sent

- Check "Trigger Quiz Reminder" node for errors
- Verify `schedule_id` is correct
- Check Go server logs

### Twilio SMS Not Sending

- Verify credentials in environment variables
- Check Twilio account balance (trial accounts have limits)
- Verify phone number format: `+1234567890`


