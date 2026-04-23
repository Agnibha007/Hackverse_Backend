# Backend API Documentation

## Overview

The Phi backend is a RESTful API built with Express.js and PostgreSQL. All responses follow a consistent format with `success`, `data`, and `error` fields.

## Response Format

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "error": null
}
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained from login/signup endpoints and are valid for 7 days.

## Endpoints

### Authentication (`/api/auth`)

#### Signup

- **Method**: POST
- **Endpoint**: `/signup`
- **Public**: Yes
- **Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "agent_name"
}
```

- **Response**: User object and JWT token

#### Login

- **Method**: POST
- **Endpoint**: `/login`
- **Public**: Yes
- **Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

- **Response**: User object and JWT token

#### Get Profile

- **Method**: GET
- **Endpoint**: `/profile`
- **Protected**: Yes
- **Response**: User object with stats

#### Update Profile

- **Method**: PATCH
- **Endpoint**: `/profile`
- **Protected**: Yes
- **Body**:

```json
{
  "username": "new_username",
  "profileImageUrl": "https://example.com/image.jpg"
}
```

### Missions (`/api/missions`)

#### List Missions

- **Method**: GET
- **Endpoint**: `/`
- **Protected**: Yes
- **Query Parameters**:
  - `status`: Filter by status (pending, active, completed, cancelled)
  - `priority`: Filter by priority (low, medium, high, critical)
- **Response**: Array of missions

#### Create Mission

- **Method**: POST
- **Endpoint**: `/`
- **Protected**: Yes
- **Body**:

```json
{
  "title": "Study Chapter 5",
  "description": "Review quantum mechanics",
  "priority": "high",
  "deadline": "2024-12-25T10:00:00Z",
  "xp_reward": 100
}
```

#### Get Mission

- **Method**: GET
- **Endpoint**: `/:id`
- **Protected**: Yes
- **Response**: Single mission object

#### Update Mission

- **Method**: PATCH
- **Endpoint**: `/:id`
- **Protected**: Yes
- **Body**: Any of the mission fields to update
- **Note**: Updating status to "completed" automatically awards XP

#### Delete Mission

- **Method**: DELETE
- **Endpoint**: `/:id`
- **Protected**: Yes
- **Response**: Success confirmation

#### Get Overview

- **Method**: GET
- **Endpoint**: `/overview`
- **Protected**: Yes
- **Response**: Summary statistics

### Focus Sessions (`/api/focus`)

#### Record Session

- **Method**: POST
- **Endpoint**: `/session`
- **Protected**: Yes
- **Body**:

```json
{
  "duration_minutes": 45,
  "mission_id": 1,
  "focus_quality": "deep",
  "notes": "Completed 3 problems"
}
```

#### Get History

- **Method**: GET
- **Endpoint**: `/history`
- **Protected**: Yes
- **Query Parameters**:
  - `days`: Number of days to retrieve (default: 7)
- **Response**: Array of focus sessions

#### Get Daily Metrics

- **Method**: GET
- **Endpoint**: `/daily`
- **Protected**: Yes
- **Query Parameters**:
  - `date`: Date in YYYY-MM-DD format (required)
- **Response**: Daily statistics

#### Get Weekly Metrics

- **Method**: GET
- **Endpoint**: `/weekly`
- **Protected**: Yes
- **Response**: Weekly breakdown by day

#### Get Streak

- **Method**: GET
- **Endpoint**: `/streak`
- **Protected**: Yes
- **Response**: Current streak count

### Analytics (`/api/analytics`)

#### Dashboard Stats

- **Method**: GET
- **Endpoint**: `/dashboard`
- **Protected**: Yes
- **Response**: Comprehensive dashboard statistics

#### Productivity Trend

- **Method**: GET
- **Endpoint**: `/trend`
- **Protected**: Yes
- **Query Parameters**:
  - `monthsBack`: Number of months to analyze (default: 1)
- **Response**: Weekly productivity trend data

#### Detailed Analytics

- **Method**: GET
- **Endpoint**: `/detailed`
- **Protected**: Yes
- **Query Parameters**:
  - `dateFrom`: Start date (YYYY-MM-DD)
  - `dateTo`: End date (YYYY-MM-DD)
- **Response**: Detailed analytics records

#### System Stats

- **Method**: GET
- **Endpoint**: `/system`
- **Protected**: Yes
- **Response**: Gamified system statistics

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not found
- `409`: Conflict (e.g., email already exists)
- `429`: Too many requests (rate limited)
- `500`: Internal server error

Error responses include a message explaining the issue.

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes

## Validation Rules

### Mission Creation

- Title: 3-255 characters (required)
- Description: max 1000 characters
- Priority: low, medium, high, critical
- XP Reward: 10-500 points
- Deadline: ISO 8601 format

### Focus Session

- Duration: 1-480 minutes
- Focus Quality: distracted, normal, focused, deep
- Notes: max 500 characters

### User Profile

- Username: 3-50 characters
- Email: valid email format
- Password: minimum 8 characters

## Database Schema

### Users Table

- id (primary key)
- email (unique)
- password_hash
- username
- profile_image_url
- focus_streak
- total_focus_minutes
- xp_points
- level
- created_at, updated_at, deleted_at

### Missions Table

- id (primary key)
- user_id (foreign key)
- title, description
- priority, status
- deadline, completed_at
- xp_reward
- created_at, updated_at

### Focus Sessions Table

- id (primary key)
- user_id, mission_id (foreign keys)
- duration_minutes
- session_date
- started_at, ended_at
- focus_quality, notes
- created_at

### Analytics Table

- id (primary key)
- user_id (foreign key)
- date
- missions_completed
- total_focus_minutes
- avg_session_length
- productivity_score
- streak_count
- created_at

## Examples

### Login and Get Dashboard Stats

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response includes token: { "token": "eyJhbGc..." }

# 2. Get dashboard stats
curl -X GET http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer eyJhbGc..."
```

### Create and Complete a Mission

```bash
# 1. Create mission
curl -X POST http://localhost:5000/api/missions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Study Physics",
    "priority": "high",
    "deadline": "2024-12-31T23:59:59Z"
  }'

# 2. Complete mission (marks as completed and awards XP)
curl -X PATCH http://localhost:5000/api/missions/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

---

For more information, see the main README.md
