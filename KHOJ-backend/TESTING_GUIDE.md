# Testing Guide - Quiz Schedule & n8n Workflow

## 📋 Current Endpoints Summary

### Schedule Endpoints
- `POST /api/schedule` - Create schedule (auto-gets topic from chat)
- `GET /api/schedule/:user_id` - Get user's schedules
- `GET /api/schedule/due` - Get due schedules (for n8n/cron) ⭐ NEW
- `DELETE /api/schedule/:id` - Cancel schedule

### Quiz Endpoints
- `POST /api/quiz/reminder` - Trigger quiz reminder (for n8n)
- `POST /api/quiz/start` - Start quiz in chat
- `POST /api/quiz/answer` - Submit quiz answer

---

## 🧪 Step-by-Step Testing in Postman

### 1. Create a Schedule

```
POST http://localhost:8080/api/schedule
Content-Type: application/json

{
  "user_id": 1,
  "chat_id": "your-chat-id-here",
  "scheduled_time": "2025-11-01T14:30:00Z"
}
```

**Response:**
```json
{
  "message": "Schedule created successfully",
  "schedule_id": 1,
  "topic": "algebra",
  "scheduled_time": "2025-11-01T14:30:00Z"
}
```

**Note:** Save the `schedule_id` for testing!

---

### 2. Check Due Schedules (What n8n Will Check)

```
GET http://localhost:8080/api/schedule/due
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "chat_id": "abc-123",
    "topic": "algebra",
    "scheduled_time": "2025-11-01T14:30:00Z",
    "active": true,
    "created_at": "2025-10-31T10:00:00Z"
  }
]
```

---

### 3. Trigger Quiz Reminder (What n8n Will Do)

```
POST http://localhost:8080/api/quiz/reminder
Content-Type: application/json

{
  "schedule_id": 1
}
```

**Response:**
```json
{
  "message": "Quiz reminder sent successfully",
  "chat_id": "abc-123",
  "topic": "algebra"
}
```

**What happens:** Bot message appears in chat asking user to take quiz.

---

### 4. Start Quiz

```
POST http://localhost:8080/api/quiz/start
Content-Type: application/json

{
  "user_id": 1,
  "chat_id": "abc-123",
  "topic": "algebra"
}
```

**Response:**
```json
{
  "message": "Quiz started",
  "quiz_id": 1,
  "question": "What is 2x + 5 = 11? Find x.",
  "question_num": 1,
  "total": 3
}
```

---

### 5. Submit Answers

```
POST http://localhost:8080/api/quiz/answer
Content-Type: application/json

{
  "user_id": 1,
  "chat_id": "abc-123",
  "answer": "3"
}
```

**Response:**
```json
{
  "correct": true,
  "score": 1,
  "response": "✅ Correct! \n📝 Question 2/3:\nWhat is the formula for a quadratic equation?",
  "completed": false
}
```

Repeat until `"completed": true`.

---

## 📱 n8n Workflow Setup

### Workflow Overview

1. **Cron Trigger** - Runs every hour
2. **HTTP Request** - GET due schedules from your API
3. **Split In Batches** - Process each schedule
4. **HTTP Request** - Trigger quiz reminder
5. **Twilio SMS** (Optional) - Send SMS notification
6. **Update Schedule** (Optional) - Mark as processed

### Import the n8n Workflow JSON

See `n8n_workflow.json` file below.

---

## 🔧 Testing Schedule for Quick Results

To test quickly, set a schedule 1-2 minutes in the future:

```json
{
  "user_id": 1,
  "chat_id": "your-chat-id",
  "scheduled_time": "2025-10-31T20:05:00Z"  // 2 minutes from now
}
```

Then wait 2 minutes and call:
```
GET /api/schedule/due
```

You should see your schedule in the response.


