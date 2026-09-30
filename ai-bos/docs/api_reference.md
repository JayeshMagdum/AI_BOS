# AI BOS — REST API Specification & Reference

Welcome to the AI Business Operating System (AI BOS) REST API reference. This document specifies all available endpoints, request/response formats, authentication protocols, and error handling.

---

## 🔐 Authentication & Headers

All protected endpoints require a valid JWT Bearer token in the `Authorization` request header:

```http
Authorization: Bearer <jwt_access_token>
```

Tokens are obtained by authenticating against `/api/v1/auth/login` or registering via `/api/v1/auth/signup`. Default token lifetime is 10,080 minutes (7 days).

### Global Headers
- `Content-Type: application/json` (except for multipart file uploads)
- `Accept: application/json`

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/signup`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "analyst@company.com",
    "password": "SecurePassword123!",
    "full_name": "Jane Analyst"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer"
  }
  ```

### Login
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "analyst@company.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer"
  }
  ```

### Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/v1/auth/me`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  {
    "id": "12345678-abcd-1234-abcd-1234567890ab",
    "email": "analyst@company.com",
    "full_name": "Jane Analyst",
    "is_active": true,
    "created_at": "2026-09-30T10:00:00Z"
  }
  ```

---

## 2. Document Management (`/api/v1/documents`)

### Upload Document
- **Method**: `POST`
- **Path**: `/api/v1/documents/upload`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: binary file payload (Supported: `.pdf`, `.docx`, `.doc`, `.txt`, `.csv`, `.xlsx`, `.xls`)
- **Response**: `200 OK`
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "filename": "q3_financials.pdf",
    "file_type": "pdf",
    "file_size": 245890,
    "status": "completed",
    "chunk_count": 14,
    "created_at": "2026-09-30T10:15:00Z"
  }
  ```

### List Documents
- **Method**: `GET`
- **Path**: `/api/v1/documents`
- **Auth**: Required
- **Query Parameters**:
  - `skip` (optional, default: `0`): Pagination offset
  - `limit` (optional, default: `100`): Maximum results per page
- **Response**: `200 OK`
  ```json
  {
    "documents": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "filename": "q3_financials.pdf",
        "file_type": "pdf",
        "file_size": 245890,
        "status": "completed",
        "chunk_count": 14,
        "created_at": "2026-09-30T10:15:00Z"
      }
    ],
    "total": 1
  }
  ```

### Download Original Document
- **Method**: `GET`
- **Path**: `/api/v1/documents/{id}/download`
- **Auth**: Required
- **Response**: `200 OK` with raw file binary and `Content-Disposition: attachment; filename="q3_financials.pdf"`.

### Preview Document Text
- **Method**: `GET`
- **Path**: `/api/v1/documents/{id}/preview`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "filename": "q3_financials.pdf",
    "file_type": "pdf",
    "file_size": 245890,
    "status": "completed",
    "created_at": "2026-09-30T10:15:00Z",
    "vector_count": 14,
    "char_count": 8420,
    "word_count": 1350,
    "chunk_count": 14,
    "text_preview": "Consolidated Financial Statements for Q3...",
    "chunks_preview": [
      {
        "chunk_index": 0,
        "word_count": 105,
        "text": "Consolidated Financial Statements for Q3..."
      }
    ]
  }
  ```

### Delete Document
- **Method**: `DELETE`
- **Path**: `/api/v1/documents/{id}`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  {
    "detail": "Document successfully deleted."
  }
  ```

---

## 3. Conversational RAG & Chat (`/api/v1/chat`, `/api/v1/conversations`)

### Standalone Chat Query
- **Method**: `POST`
- **Path**: `/api/v1/chat/ask`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "question": "What was the total operating revenue?",
    "top_k": 5,
    "document_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "answer": "According to the Q3 Financial Statements, total operating revenue was $142.5M...",
    "sources": [
      {
        "document_name": "q3_financials.pdf",
        "chunk_id": "chunk_0",
        "similarity_score": 0.892,
        "preview": "Total operating revenue reached $142.5M, reflecting 12% YoY growth..."
      }
    ]
  }
  ```

### Dynamic Document Suggestions
- **Method**: `GET`
- **Path**: `/api/v1/chat/suggestions`
- **Auth**: Required
- **Query Parameters**:
  - `document_id` (optional): Filter suggestions tailored to a specific document
- **Response**: `200 OK`
  ```json
  {
    "suggestions": [
      "What are the main findings in q3_financials.pdf?",
      "Summarize the key financial takeaways.",
      "What were the total expenditures reported?"
    ]
  }
  ```

### List Conversations
- **Method**: `GET`
- **Path**: `/api/v1/conversations`
- **Auth**: Required
- **Response**: `200 OK` (Array of conversation sessions with message counts and timestamps)

### Send Message in Conversation
- **Method**: `POST`
- **Path**: `/api/v1/conversations/{id}/messages`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "question": "Can you elaborate on the second revenue driver?",
    "top_k": 5,
    "document_id": "optional-document-uuid"
  }
  ```

---

## 4. Business Analytics (`/api/v1/analytics`)

### Overview Statistics
- **Method**: `GET`
- **Path**: `/api/v1/analytics/stats`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  {
    "total_documents": 12,
    "total_chunks": 184,
    "total_size_bytes": 15728640,
    "total_size_formatted": "15.0 MB",
    "total_queries": 45
  }
  ```

### File Type Breakdown
- **Method**: `GET`
- **Path**: `/api/v1/analytics/file-types`
- **Auth**: Required
- **Response**: `200 OK` (Array of file types with counts, percentage shares, and total bytes)

### Activity Timeline
- **Method**: `GET`
- **Path**: `/api/v1/analytics/activity`
- **Auth**: Required
- **Response**: `200 OK` (Daily document upload and query frequency distribution)

---

## 5. System Health (`/api/v1/health`)

- **Method**: `GET`
- **Path**: `/api/v1/health`
- **Auth**: None
- **Response**: `200 OK`
  ```json
  {
    "status": "healthy",
    "app": "AI Business Operating System",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2026-09-30T10:20:00Z",
    "total_latency_ms": 1.25,
    "services": {
      "database": {
        "status": "healthy",
        "latency_ms": 0.75,
        "engine": "postgresql"
      },
      "vector_store": {
        "status": "healthy",
        "latency_ms": 0.50,
        "host": "qdrant",
        "port": 6333
      }
    }
  }
  ```
