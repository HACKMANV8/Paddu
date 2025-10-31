# 📚 Backend API Guide for Frontend Developers

## 🚀 Base Configuration

- **Base URL**: `http://localhost:8080` (default Gin port)
- **API Prefix**: `/api` for all chat/quiz/schedule endpoints
- **Content-Type**: `application/json` for all POST requests
- **CORS**: Enabled for `localhost:3000`, `localhost:3001`

---

## 💬 Chat System Overview

The chat system is **topic-based**. Each chat is tied to a specific topic (e.g., "algebra", "physics"). Users can:
1. Start a new chat for a topic
2. Send messages (with AI bot replies via Gemini)
3. View chat history
4. Schedule quiz reminders
5. Take quizzes within the chat

**Important**: Each chat is topic-specific. Users cannot send off-topic messages in an existing chat - they must start a new chat for a different topic.

---

## 📡 API Endpoints

### 1. Start a New Chat

**Endpoint**: `POST /api/chat/start`

**Request Body**:
```json
{
  "user_id": 1,
  "topic": "algebra"
}
```

**Success Response** (200):
```json
{
  "chat_id": "uuid-string-here"
}
```

**Error Responses**:
- `400` - Invalid request (missing fields)
- `409` - Chat for this topic already exists for this user
- `500` - Server error

**Frontend Notes**:
- Save the `chat_id` - you'll need it for all subsequent requests
- One chat per topic per user (backend prevents duplicates)

---

### 2. Send a Message

**Endpoint**: `POST /api/chat/send`

**Request Body**:
```json
{
  "user_id": 1,
  "chat_id": "uuid-string-here",
  "message": "What is 2x + 5 = 11?"
}
```

**Success Response** (200):
```json
{
  "reply": "To solve 2x + 5 = 11, subtract 5 from both sides..."
}
```

**Error Responses**:
- `400` - Invalid request
- `404` - Chat not found or unauthorized
- `409` - Message is off-topic (see below)
- `500` - Server error or Gemini API error

**Off-Topic Error** (409):
```json
{
  "error": "Message is off-topic. This chat is for 'algebra'. Start a new chat for a different topic.",
  "required_topic": "algebra"
}
```

**Frontend Notes**:
- The backend automatically saves both user message and bot reply to the database
- Bot replies are generated using Google's Gemini AI
- If user sends off-topic message, show the error and suggest starting a new chat
- Backend validates that message mentions the chat topic (with smart matching for related terms)

---

### 3. Get Chat History

**Endpoint**: `GET /api/chat/:id`

**Example**: `GET /api/chat/abc-123-uuid`

**Success Response** (200):
```json
[
  {
    "id": "msg-uuid-1",
    "chat_id": "abc-123-uuid",
    "role": "user",
    "content": "What is 2x + 5 = 11?",
    "created_at": "2025-01-15T10:30:00Z"
  },
  {
    "id": "msg-uuid-2",
    "chat_id": "abc-123-uuid",
    "role": "bot",
    "content": "To solve 2x + 5 = 11...",
    "created_at": "2025-01-15T10:30:05Z"
  }
]
```

**Error Responses**:
- `500` - Server error

**Frontend Notes**:
- Messages are returned in chronological order (oldest first)
- Use `role` field to determine if it's a user message (`"user"`) or bot message (`"bot"`)
- Perfect for displaying chat history when user opens a chat

---

## 🎯 Quiz System

Quizzes happen **within a chat**. The bot can send quiz reminders, and users can take quizzes related to the chat topic.

### 4. Start a Quiz

**Endpoint**: `POST /api/quiz/start`

**Request Body**:
```json
{
  "user_id": 1,
  "chat_id": "abc-123-uuid",
  "topic": "algebra"
}
```

**Success Response** (200):
```json
{
  "message": "Quiz started",
  "quiz_id": 1,
  "question": "What is 2x + 5 = 11? Find x.",
  "question_num": 1,
  "total": 3
}
```

**Error Responses**:
- `400` - Invalid request
- `404` - Chat not found
- `409` - Quiz already in progress
- `500` - Server error

**Frontend Notes**:
- Creates 3 questions automatically based on topic
- First question is automatically sent to the chat as a bot message
- Only one quiz can be active per chat at a time

---

### 5. Submit Quiz Answer

**Endpoint**: `POST /api/quiz/answer`

**Request Body**:
```json
{
  "user_id": 1,
  "chat_id": "abc-123-uuid",
  "answer": "3"
}
```

**Success Response** (200):
```json
{
  "correct": true,
  "score": 1,
  "response": "✅ Correct! \n📝 Question 2/3:\nWhat is the formula for a quadratic equation?",
  "completed": false
}
```

**When Quiz is Complete**:
```json
{
  "correct": true,
  "score": 3,
  "response": "✅ Correct! \n🎉 Quiz completed! Your score: 3/3",
  "completed": true
}
```

**Error Responses**:
- `400` - Invalid request
- `404` - No active quiz found or all questions answered
- `500` - Server error

**Frontend Notes**:
- Check `completed` field to know when quiz is done
- The `response` field contains the bot's feedback and next question (if any)
- The bot response is automatically saved to the chat history
- Answer checking is simple string matching (can be enhanced later)

---

### 6. Trigger Quiz Reminder (For Scheduled Quizzes)

**Endpoint**: `POST /api/quiz/reminder`

**Request Body**:
```json
{
  "schedule_id": 1
}
```

**Success Response** (200):
```json
{
  "message": "Quiz reminder sent successfully",
  "chat_id": "abc-123-uuid",
  "topic": "algebra"
}
```

**Frontend Notes**:
- This is typically called by backend automation (n8n/cron)
- Sends a reminder message to the chat asking user to take quiz
- Frontend usually doesn't need to call this directly

---

## 📅 Schedule System

Users can schedule quiz reminders for later. The schedule is tied to a chat.

### 7. Create Schedule

**Endpoint**: `POST /api/schedule`

**Request Body**:
```json
{
  "user_id": 1,
  "chat_id": "abc-123-uuid",
  "scheduled_time": "2025-01-15T14:30:00Z"
}
```

**Success Response** (201):
```json
{
  "message": "Schedule created successfully",
  "schedule_id": 1,
  "topic": "algebra",
  "scheduled_time": "2025-01-15T14:30:00Z"
}
```

**Error Responses**:
- `400` - Invalid request or time format, or time is in the past
- `404` - Chat not found or unauthorized
- `500` - Server error

**Frontend Notes**:
- `scheduled_time` must be in ISO 8601 format (e.g., `2025-01-15T14:30:00Z`)
- Topic is automatically retrieved from the chat
- Time must be in the future
- Backend will send a quiz reminder at the scheduled time (via automation)

---

### 8. Get User's Schedules

**Endpoint**: `GET /api/schedule/:user_id`

**Example**: `GET /api/schedule/1`

**Success Response** (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "chat_id": "abc-123-uuid",
    "topic": "algebra",
    "scheduled_time": "2025-01-15T14:30:00Z",
    "active": true,
    "created_at": "2025-01-10T10:00:00Z"
  }
]
```

**Frontend Notes**:
- Returns only active schedules
- Ordered by scheduled time (earliest first)
- Use to show user their upcoming quiz reminders

---

### 9. Cancel Schedule

**Endpoint**: `DELETE /api/schedule/:id?user_id=1`

**Example**: `DELETE /api/schedule/1?user_id=1`

**Success Response** (200):
```json
{
  "message": "Schedule cancelled successfully"
}
```

**Error Responses**:
- `404` - Schedule not found
- `403` - Unauthorized (if user_id doesn't match)
- `500` - Server error

**Frontend Notes**:
- Optional `user_id` query parameter for ownership verification
- Sets `active` to false (soft delete)

---

### 10. Get Due Schedules (Internal Use)

**Endpoint**: `GET /api/schedule/due`

**Success Response** (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "chat_id": "abc-123-uuid",
    "topic": "algebra",
    "scheduled_time": "2025-01-15T14:30:00Z",
    "active": true,
    "created_at": "2025-01-10T10:00:00Z"
  }
]
```

**Frontend Notes**:
- Returns schedules that are due (time has passed, but within last hour)
- Used by backend automation (n8n/cron) to check what reminders to send
- Frontend typically doesn't need this

---

## 📦 Data Models (TypeScript-like)

### Message
```typescript
interface Message {
  id: string;              // UUID
  chat_id: string;         // UUID - references Chat
  role: "user" | "bot";    // Message sender
  content: string;         // Message text
  created_at: string;      // ISO 8601 timestamp
}
```

### Chat
```typescript
interface Chat {
  id: string;              // UUID
  user_id: number;
  topic: string;           // e.g., "algebra", "physics"
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}
```

### Quiz
```typescript
interface Quiz {
  id: number;
  user_id: number;
  chat_id: string;         // UUID
  topic: string;
  status: "pending" | "in_progress" | "completed";
  score: number;           // Number of correct answers
  total_questions: number; // Usually 3
  created_at: string;
  completed_at?: string;   // Only when status is "completed"
}
```

### Schedule
```typescript
interface Schedule {
  id: number;
  user_id: number;
  chat_id: string;         // UUID
  topic: string;           // Auto-filled from chat
  scheduled_time: string;  // ISO 8601 timestamp
  active: boolean;         // false when cancelled
  created_at: string;
}
```

---

## 🔄 Typical User Flow

1. **User starts learning about "algebra"**
   - Frontend calls `POST /api/chat/start` with `topic: "algebra"`
   - Backend returns `chat_id`

2. **User sends messages**
   - Frontend calls `POST /api/chat/send` with message
   - Backend returns bot reply
   - Frontend displays both messages

3. **User wants quiz reminder**
   - Frontend calls `POST /api/schedule` with future time
   - Backend creates schedule

4. **At scheduled time** (automated by backend)
   - Backend calls `POST /api/quiz/reminder`
   - Bot message appears in chat asking user to take quiz

5. **User starts quiz**
   - Frontend calls `POST /api/quiz/start`
   - Backend returns first question
   - Bot message with question appears in chat

6. **User answers questions**
   - Frontend calls `POST /api/quiz/answer` for each answer
   - Backend returns feedback and next question (or completion)

7. **User views chat history**
   - Frontend calls `GET /api/chat/:id`
   - Displays all messages (user + bot + quiz questions/answers)

---

## ⚠️ Important Notes for Frontend

1. **Topic Enforcement**: 
   - Each chat is locked to one topic
   - Off-topic messages return 409 error
   - Suggest user start a new chat for different topics

2. **Chat IDs**:
   - Chat IDs are UUIDs (strings)
   - Save them in your state/localStorage
   - Needed for all chat-related operations

3. **Message Timing**:
   - Messages are saved immediately when sent
   - Bot replies may take 1-3 seconds (Gemini API)
   - Show loading state while waiting for bot reply

4. **Quiz Flow**:
   - Only one active quiz per chat
   - Questions are auto-generated (3 questions)
   - Answers are simple string matching (case-insensitive, partial)

5. **Schedule Time**:
   - Must be in ISO 8601 format with timezone
   - Must be in the future
   - Example: `"2025-01-15T14:30:00Z"`

6. **Error Handling**:
   - All errors return JSON with `error` field
   - Handle 409 (conflict) specially - might need user action
   - Handle 404 (not found) - chat/schedule doesn't exist

7. **CORS**:
   - Already configured for common frontend ports
   - No need for proxy in development

---

## 🧪 Quick Test Examples

**Test if server is running**:
```bash
GET http://localhost:8080/ping
# Returns: {"message": "hello guys"}
```

**Start a chat**:
```bash
POST http://localhost:8080/api/chat/start
Body: {"user_id": 1, "topic": "algebra"}
```

**Send a message**:
```bash
POST http://localhost:8080/api/chat/send
Body: {"user_id": 1, "chat_id": "<from-start-chat>", "message": "Hello"}
```

---

## 📞 Support

For backend questions, check:
- `KHOJ-backend/TESTING_GUIDE.md` - Detailed endpoint testing
- `KHOJ-backend/golang-service/handlers/` - Handler implementations
- `KHOJ-backend/golang-service/models/` - Data structures

