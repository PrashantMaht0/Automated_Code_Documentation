# AI Dev Logger
## An Automated Code Documentation Platform.

An enterprise-grade, full-stack Automated Code Documentation platform. Automated Code Logger intercepts GitHub webhooks, semantically analyzes code diffs using a hybrid Cloud/Local AI architecture, and provides a Retrieval-Augmented Generation (RAG) chat interface for generating technical documentation.

**Developed by:** Prashant Mahto   

---

## Core Features

#### Hybrid AI Architecture (Cloud + Local)
* **Cloud LLM (Gemini 2.5 Flash):** Handles heavy natural language processing, generating human-readable commit summaries, and powering the RAG chat engine.
* **Local Embeddings (Ollama + `nomic-embed-text`):** Processes vector embeddings locally, saving cloud quotas and running at zero cost, perfectly mapping code diffs to a 768-dimensional space.

#### Semantic "Smart" Search
* Move beyond keyword matching. Powered by `pgvector` in PostgreSQL, the platform allows you to search your codebase using intent and meaning (e.g., *"fixing database connection errors"* will find commits touching `application.properties` even if the words don't match).

#### RAG-Powered AI Assistant
* **Context-Aware Chat:** A slide-out Gemini assistant that reads your project's recent commit history to answer specific questions about your codebase.
* **1-Click Documentation Generation:** Ask the AI to write a weekly summary or explain a feature, and instantly export the response as a formatted Markdown (`.md`) or paginated PDF (`.pdf`) file.

#### Automated GitHub Integration
* Secure webhook listener that instantly captures `push` events, extracting the author, timestamp, commit message, and raw syntax-highlighted code diffs.

#### Enterprise-Grade Security
* **Stateless Asymmetric Authentication:** Secures backend API routes using modern Elliptic Curve (ES256) JWTs validated via Supabase's JWKS (JSON Web Key Set) public endpoints.
* **Strict CORS Boundary:** Backend enforces strict Origin policies, rejecting unauthorized domain requests.
* **HMAC Signature Verification:** Cryptographically verifies incoming GitHub webhooks using a user-defined secret to prevent payload spoofing.
* **Input Sanitization:** Utilizes Jakarta Validation to restrict payload sizes and prevent buffer/injection attacks.

---

### Technical Stack

#### Frontend
* **Framework:** React (Vite)
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Document Export:** `jspdf` (PDF generation), standard Blob API (Markdown)

#### Backend
* **Framework:** Java (Spring Boot 3.5.x)
* **AI Integration:** Spring AI (`spring-ai-openai` shim for Gemini, `spring-ai-ollama`)
* **Security:** Spring Security (OAuth2 Resource Server)
* **Database ORM:** Hibernate Core (with `hibernate-vector` extension)

#### Database & DevOps
* **Database:** Supabase (PostgreSQL with `pgvector` extension)
* **Containerization:** Docker & Docker Compose (Multi-stage builds)
* **Local AI Server:** Ollama

---

### Local Development Setup

#### 1. Prerequisites
* Node.js & npm
* Java 21+ & Maven
* Docker Desktop (for running the local database/Ollama container)
* Supabase Account
* Google Gemini API Key

#### 2. Environment Variables
Create a `.env` file in your **backend** directory:
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_DB_PASSWORD=your_supabase_db_password
```

Create a `.env` file in your **frontend** directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
#### 3. Database Initialization 
Run the following SQL commands in your Supabase SQL Editor
```
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create core tables
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    repo_name VARCHAR NOT NULL,
    github_installation_id VARCHAR,
    webhook_secret VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    commit_hash VARCHAR NOT NULL,
    author VARCHAR NOT NULL,
    message TEXT NOT NULL,
    raw_diff TEXT,
    ai_summary TEXT,
    embedding vector(768),
    commit_timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
#### 4. Running the Application
Ensure Ollama is running locally and the model is downloaded (ollama pull nomic-embed-text).

Start the backend: ```mvn spring-boot:run```

Start the frontend: ```npm run dev```
