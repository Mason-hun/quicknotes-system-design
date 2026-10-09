# QuickNotes API Design

## 1. Overview

The QuickNotes API provides endpoints for users to authenticate and manage their notes. It follows REST principles, uses HTTP methods to represent operations, and exchanges data in JSON format.

**Base URL:** `/api/v1`

**Data format:** JSON (`application/json`)

**Authentication:** Bearer tokens are required for protected endpoints.

## 2. API Endpoints

| Method | Endpoint | Description | Success Status |
|---|---|---|---|
| POST | `/auth/login` | Authenticate a user and obtain an access token | 200 OK |
| GET | `/notes` | Retrieve the authenticated user's notes | 200 OK |
| POST | `/notes` | Create a new note | 201 Created |
| GET | `/notes/{noteId}` | Retrieve a specific note | 200 OK |
| PATCH | `/notes/{noteId}` | Update selected fields of a note | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note | 204 No Content |
| GET | `/tags` | Retrieve available tags | 200 OK |

The `{noteId}` path parameter identifies a specific note. The API uses `GET` for retrieval, `POST` for creation, `PATCH` for partial updates, and `DELETE` for removal.

## 3. Authentication

Protected endpoints require an access token in the HTTP request header:

```http
Authorization: Bearer <access_token>
```

A user must be authenticated before accessing their notes. The API must also verify that the authenticated user owns each note they attempt to view, update, or delete.

### Login request

`POST /api/v1/auth/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "example-password"
}
```

Successful response — `200 OK`:

```json
{
  "accessToken": "<access_token>",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

The API must never return a user's password in a response.

## 4. Create a Note

`POST /api/v1/notes`

Creates a note for the authenticated user.

### Request body

```json
{
  "title": "Study API design",
  "body": "Review REST endpoints and HTTP status codes",
  "tags": ["study", "programming"]
}
```

The `title` field is required and must contain no more than 100 characters. The `body` and `tags` fields are optional.

### Successful response — `201 Created`

```json
{
  "id": 101,
  "title": "Study API design",
  "body": "Review REST endpoints and HTTP status codes",
  "tags": ["study", "programming"],
  "createdAt": "2026-10-09T15:30:00Z",
  "updatedAt": "2026-10-09T15:30:00Z"
}
```

The server generates the note ID and timestamps. The authenticated user's identity determines the note's owner.

## 5. List Notes

`GET /api/v1/notes`

Returns notes belonging to the authenticated user.

Optional query parameters:

- `page`: page number, starting at 1.
- `limit`: number of notes per page, with a maximum of 100.

Example request:

```http
GET /api/v1/notes?page=1&limit=10
```

Successful response — `200 OK`:

```json
{
  "data": [
    {
      "id": 101,
      "title": "Study API design",
      "body": "Review REST endpoints and HTTP status codes",
      "tags": ["study", "programming"],
      "createdAt": "2026-10-09T15:30:00Z",
      "updatedAt": "2026-10-09T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

The `data` array contains the notes returned for the requested page. An empty array indicates that no notes match the request.

## 6. HTTP Status Codes and Error Handling

The API uses standard HTTP status codes to communicate the outcome of a request.

| Status | Meaning | Example |
|---|---|---|
| 200 OK | Request completed successfully | Notes retrieved |
| 201 Created | A resource was created | Note created |
| 204 No Content | Request succeeded without a response body | Note deleted |
| 400 Bad Request | Input is invalid | Missing title |
| 401 Unauthorized | Authentication is missing or invalid | Expired access token |
| 403 Forbidden | User lacks permission for an operation | Attempt to access a resource the user is not allowed to access |
| 404 Not Found | Resource does not exist or is not accessible to the user | Note not found |
| 500 Internal Server Error | Unexpected server failure | Database operation fails unexpectedly |

### Example error response

A request with an invalid note title might return `400 Bad Request`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title is required and must not exceed 100 characters."
  }
}
```

Errors should use a consistent JSON structure so the frontend can display useful messages. Responses must not expose passwords, access tokens, database credentials, stack traces, or other sensitive internal details.

For privacy, an API may return `404 Not Found` instead of `403 Forbidden` when a note belongs to another user, avoiding disclosure of whether that note exists.

## 7. Design Considerations

- **Resource-oriented URLs:** Endpoints represent resources such as notes and tags.
- **HTTP semantics:** Each method has a defined purpose, and status codes communicate outcomes.
- **Authentication and authorization:** Protected resources require authentication and ownership checks.
- **Input validation:** The backend validates all incoming data rather than relying only on frontend validation.
- **Consistent errors:** Standard error structures simplify frontend error handling.
- **Pagination:** Limits the amount of data returned in a single request.
- **Versioning:** The `/api/v1` prefix provides a path for introducing future API versions.

## 8. Summary

The QuickNotes API contract defines how a frontend and backend communicate to authenticate users and manage notes. Clear endpoint definitions, consistent JSON structures, appropriate HTTP methods, validation, and authorization make the API easier to implement, test, maintain, and extend.