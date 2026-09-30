# AI Business Operating System (AI BOS)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-dc2626?style=flat&logo=qdrant&logoColor=white)](https://qdrant.tech)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)

**AI Business Operating System (AI BOS)** is an enterprise-grade document intelligence and retrieval-augmented generation (RAG) platform. It empowers business teams to upload diverse enterprise files (PDF, DOCX, CSV, Excel, TXT), index them through automated text extraction, chunking, and embedding into Qdrant, and interact with their data using conversational AI backed by Google Gemini with pinpoint source citations.

---

## 🚀 Key Capabilities

- **Multi-Format Ingestion**: Automated text extraction and validation for PDF (PyMuPDF), Word (`python-docx`), Excel/CSV (`pandas`/`openpyxl`), and plain text.
- **Semantic Vector Storage**: High-performance chunking and embedding pipeline utilizing SentenceTransformers (`all-MiniLM-L6-v2`) and Qdrant Vector Search.
- **Conversational RAG Chat**: Multi-turn contextual chat powered by Google Gemini with document-specific filtering, real-time citation tracking, and dynamic document-tailored suggested queries.
- **Document Management**: Complete document lifecycle management with text preview modal, direct original file download, and metadata tracking.
- **Real-Time Analytics**: Visual business intelligence dashboard with document counts, chunk metrics, storage utilization, file distribution charts, and upload activity timelines.
- **Containerized Infrastructure**: Fully orchestrated multi-service environment via Docker Compose with automated health checks and persistent storage volumes.

---

## 🏗️ System Architecture

```
                       [ Next.js 14 Web Frontend ]
                      (App Router, Tailwind CSS, Lucide)
                                    │
                                    │ HTTP / Bearer JWT
                                    ▼
                     [ FastAPI Application Gateway ]
                     (Clean Architecture / Pydantic v2)
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
[ PostgreSQL 16 ]        [ Qdrant Vector DB ]        [ Google Gemini API ]
(Users, Documents,       (Semantic Embeddings,      (Conversational RAG,
 Conversations, Chats)    Similarity Search)         Contextual Answering)
```

---

## 📁 Repository Structure

```
AI_BOS/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI (lint, compile, test, compose check)
├── ai-bos/
│   ├── backend/                 # FastAPI backend application
│   │   ├── app/
│   │   │   ├── api/v1/          # Modular API route controllers
│   │   │   ├── core/            # Config, security, database session
│   │   │   ├── models/          # SQLAlchemy ORM models
│   │   │   ├── repositories/    # Clean architecture data access layer
│   │   │   ├── schemas/         # Pydantic request/response schemas
│   │   │   └── services/        # Business logic (RAG, auth, documents)
│   │   ├── alembic/             # Database schema migrations
│   │   └── tests/               # Backend automated pytest suite
│   ├── frontend/                # Next.js 14 frontend application
│   │   ├── app/                 # App Router pages and layouts
│   │   ├── components/          # Reusable UI component library
│   │   ├── context/             # Global AuthContext & state providers
│   │   └── lib/                 # API client utilities and types
│   ├── docker-compose.yml       # Production/development container orchestration
│   └── README.md                # Subproject specific documentation
└── README.md                    # Root repository documentation
```

---

## ⚡ Quick Start with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with WSL2 backend or Docker Engine 24+
- Google Gemini API Key

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JayeshMagdum/AI_BOS.git
   cd AI_BOS/ai-bos
   ```

2. **Configure environment variables**:
   ```bash
   # Backend configuration
   cp backend/.env.example backend/.env

   # Set your Gemini API key and secret key in backend/.env:
   # GEMINI_API_KEY=your_gemini_api_key_here
   # SECRET_KEY=your_generated_secret_key_here

   # Frontend configuration
   cp frontend/.env.example frontend/.env
   ```

3. **Start services**:
   ```bash
   docker compose up --build -d
   ```

4. **Access the application**:
   - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **System Healthcheck**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - **Qdrant Vector Dashboard**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

## 🧪 Testing

The backend includes a comprehensive automated test suite covering security, authentication, analytics, conversations, and RAG pipelines:

```bash
cd ai-bos/backend
pytest -v
```

All test suites and docker compose syntax are automatically validated in GitHub Actions on every push to `main`.

---

## 📄 License

This project is licensed under the MIT License.
