# AI Business Operating System (AI BOS)

Enterprise-grade AI document intelligence platform built with **FastAPI**, **Next.js 14**, **PostgreSQL**, **Qdrant Vector Database**, and **Google Gemini 1.5**. 

Upload business documents (PDF, DOCX, CSV, Excel, TXT), index them through an automated semantic chunking and embedding pipeline, and query them with conversational AI powered by Retrieval-Augmented Generation (RAG) with precise source citations.

---

## 🚀 Status: Version 1 (MVP) — 100% Complete

| Milestone | Feature Area | Backend | Frontend | Status |
|---|---|---|---|---|
| **Day 1** | Foundation & Project Setup | ✅ FastAPI + Clean Architecture | ✅ Next.js 14 + Design System | Complete |
| **Day 2-4** | Authentication & User Management | ✅ JWT + Passlib + Alembic | ✅ AuthContext + Route Guards | Complete |
| **Day 5-6** | App Shell & Navigation | ✅ User Profile (`/auth/me`) | ✅ Protected Layout & Topbar | Complete |
| **Day 7-8** | Document Management | ✅ Multi-format Upload API | ✅ Drag & Drop UI + Live List | Complete |
| **Day 9** | Text Extraction Pipeline | ✅ PyMuPDF, python-docx, pandas | — | Complete |
| **Day 10** | Semantic Chunking & Vector Store | ✅ SentenceTransformers + Qdrant | — | Complete |
| **Day 11-12** | RAG Engine & Conversational AI | ✅ LangChain + Gemini + Citations | ✅ Interactive Chat Interface | Complete |
| **Day 13** | Analytics & Intelligence Engine | ✅ Time-series Aggregation APIs | ✅ Dynamic Dashboard & Metrics | Complete |
| **Day 14** | Deployment Polish & Healthchecks | ✅ Deep System Health + Logging | ✅ Docker Compose Production Ready | Complete |

---

## 🛠️ Architecture & Tech Stack

```
[ Next.js 14 App Router (Tailwind + CSS Tokens) ]
                     │  (Bearer JWT + JSON / FormData)
                     ▼
[ FastAPI Backend Gateway (Clean Architecture) ]
  ├── /api/v1/auth        → AuthService & User Repository
  ├── /api/v1/documents   → Storage & Processing Pipeline
  ├── /api/v1/chat        → RAG Service (Gemini 1.5 + Citations)
  ├── /api/v1/analytics   → Analytics Repository (Time-series Aggregations)
  └── /api/v1/health      → Deep Dependency Ping (DB & Vector Store)
         │                         │
         ▼                         ▼
 [ PostgreSQL 16 ]         [ Qdrant Vector Store ]
  (Relational Data)         (Embeddings: all-MiniLM-L6-v2)
```

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts, Custom Theme Engine.
- **Backend**: FastAPI, SQLAlchemy 2.0 (Mapped Columns), Alembic, Pydantic v2.
- **Vector Database**: Qdrant Vector Database.
- **Embedding & LLM**: Sentence-Transformers (`all-MiniLM-L6-v2`), Google Gemini 1.5 Flash.
- **Document Extractors**: PyMuPDF (`fitz`), `python-docx`, `pandas`, `openpyxl`.
- **Infrastructure**: Docker & Docker Compose with automated health checks.

---

## ⚡ Quick Start

### 1. Prerequisites
- Docker & Docker Compose (or Python 3.11+ and Node.js 18+ for local run)
- Google Gemini API Key

### 2. Environment Configuration
Create the backend and frontend `.env` files from their templates:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Configure your keys in backend/.env:
# SECRET_KEY=<random-secret-key>
# GEMINI_API_KEY=<your-google-gemini-api-key>

# Frontend environment
cp frontend/.env.example frontend/.env
```

### 3. Launch with Docker Compose
```bash
docker compose up --build -d
```

Service endpoints:
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **System Healthcheck**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Qdrant Vector Dashboard**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

## 💻 Standalone Development (Without Docker)

### Backend:
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/signup` | Register new user account | ❌ |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT | ❌ |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | ✅ |
| `POST` | `/api/v1/documents/upload` | Upload PDF, DOCX, CSV, XLSX, TXT | ✅ |
| `GET` | `/api/v1/documents` | List user's uploaded documents | ✅ |
| `DELETE` | `/api/v1/documents/{id}` | Delete document and vector embeddings | ✅ |
| `POST` | `/api/v1/chat/ask` | Query documents via RAG with citations | ✅ |
| `GET` | `/api/v1/analytics/stats` | KPI summary metrics & storage usage | ✅ |
| `GET` | `/api/v1/analytics/file-types` | Distribution of uploaded document types | ✅ |
| `GET` | `/api/v1/analytics/activity` | Daily activity trend over N days | ✅ |
| `GET` | `/api/v1/analytics/recent-uploads` | Latest documents formatted for dashboard | ✅ |
| `GET` | `/api/v1/health` | Deep health check (DB + Qdrant) | ❌ |

---

## 🔒 Security & Architecture Standards

1. **Clean Architecture**: Strict one-way dependency flow: `Router → Service → Repository → Model`. Routers handle HTTP concerns, Services encapsulate business logic, and Repositories manage database interactions.
2. **Data Isolation**: Multi-tenant document scoping where all document queries, embeddings, and analytics are strictly isolated by `user_id`.
3. **Robust Health Checks**: Proactive dependencies monitoring for automated container orchestration and self-healing.
