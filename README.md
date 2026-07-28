# 🚀 AI Software Engineering Team

> An autonomous AI-powered software engineering platform that reviews GitHub repositories using **5 specialized AI agents**, **persistent RAG memory**, and **background job processing**.

![React](https://img.shields.io/badge/React-19-blue)
![Node](https://img.shields.io/badge/Node.js-Express-green)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-black)
![BullMQ](https://img.shields.io/badge/BullMQ-Queue-red)
![Redis](https://img.shields.io/badge/Redis-Cache-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-blue)
![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-purple)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

---

# 🌐 Live Demo

### Frontend

https://ai-software-engineering-team.vercel.app

### Backend API

https://ai-software-engineering-api.onrender.com/api/health

---

# 📌 Overview

AI Software Engineering Team automatically reviews GitHub repositories using multiple AI agents that work in parallel.

Instead of sending the entire repository to a single LLM prompt, the platform simulates a real software engineering team where each AI agent specializes in a different responsibility.

The system also includes **persistent Retrieval-Augmented Generation (RAG)** using **ChromaDB**, allowing previous findings to improve future repository reviews.

---

# ✨ Features

- 🔍 GitHub Repository Analysis
- 🤖 5 Parallel AI Agents
- 🧠 Persistent RAG Memory (ChromaDB)
- ⚡ BullMQ Background Processing
- 🔴 Redis Caching
- 📡 Real-Time Progress Updates
- 📊 Executive Summary Generation
- 📄 PDF Report Export
- 🗄 PostgreSQL + Prisma Storage
- 🔐 Authentication Ready
- 📈 Scan History Dashboard
- 🌍 Production Deployment

---

## Backend Engineering Highlights

- Modular Node.js + Express architecture
- Background job processing using BullMQ + Redis
- Queue retry strategy and worker isolation
- PostgreSQL with Prisma ORM
- WebSocket communication using Socket.IO
- JWT Authentication
- RESTful API design
- Persistent vector storage with ChromaDB
- Event-driven architecture
- Production deployment across Render, Railway and Vercel

# 🧠 AI Agent System

The platform uses five specialized AI agents running simultaneously.

| Agent | Responsibility |
|--------|---------------|
| 🏗 Architecture Agent | Software architecture review |
| 🔒 Security Agent | Security vulnerability detection |
| 💻 Code Review Agent | Code quality analysis |
| 📦 Dependency Agent | Dependency inspection |
| ⚡ Performance Agent | Performance bottleneck detection |

After all agents complete their analysis, an **AI Orchestrator** combines their findings into a single engineering report.

---

# 🧠 Retrieval-Augmented Generation (RAG)

Unlike traditional AI code reviewers, this platform continuously learns from previous repository scans.

## Workflow

```
Repository Scan
        │
        ▼
Generate Embeddings
        │
        ▼
Store Findings in ChromaDB
        │
        ▼
Future Repository Scan
        │
        ▼
Retrieve Similar Historical Findings
        │
        ▼
Provide Context to AI Agents
        │
        ▼
Generate Better Recommendations
```

Each successful scan expands the project's engineering knowledge base.

---

# 🏗 System Architecture

```
                        GitHub Repository
                               │
                               ▼
                   Repository Intelligence Engine
                               │
                               ▼
                      BullMQ Background Queue
                               │
                               ▼
                 ┌────────────────────────────┐
                 │ Parallel AI Agent System   │
                 └────────────────────────────┘
                     │    │    │    │    │
                     ▼    ▼    ▼    ▼    ▼
               Architecture Security Code Review
                 Performance Dependency
                     │
                     ▼
                AI Orchestrator
                     │
                     ▼
            Retrieval-Augmented Generation
                  (ChromaDB Memory)
                     │
                     ▼
             PostgreSQL + Prisma
                     │
                     ▼
          Socket.IO Real-Time Updates
                     │
                     ▼
               React Dashboard
```

---

# ⚙ Production Deployment

| Service | Platform |
|----------|----------|
| Frontend | Vercel |
| Backend API | Render |
| AI Worker | Railway |
| Vector Database | Render (ChromaDB) |
| PostgreSQL | Prisma Postgres |
| Queue | BullMQ |
| Cache | Redis |

---

# 🚀 Engineering Workflow

```
User submits GitHub URL
            │
            ▼
Repository Extraction
            │
            ▼
BullMQ Queue
            │
            ▼
5 Parallel AI Agents
            │
            ▼
RAG Context Retrieval
            │
            ▼
AI Orchestrator
            │
            ▼
Save Report
            │
            ▼
Update RAG Memory
            │
            ▼
Dashboard
```

---

# 💻 Tech Stack

## Frontend

- React
- React Router
- Zustand
- Axios
- Vite

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- BullMQ
- Redis
- Socket.IO

## AI Layer

- GPT-4o
- Multi-Agent Architecture
- Repository Intelligence Engine
- ChromaDB
- Transformers.js Embeddings
- Retrieval-Augmented Generation (RAG)

---

# 📂 Project Structure

```
AI-Software-Engineering-Team

backend
│
├── api
├── worker
├── agents
├── orchestrator
├── rag
├── queue
├── prisma
├── github
├── reports

frontend
│
├── components
├── pages
├── hooks
├── api
├── store
├── utils
```

---

# 📈 Current Capabilities

✅ Repository Intelligence

✅ Multi-Agent Analysis

✅ Historical AI Memory

✅ Semantic Search

✅ Parallel Processing

✅ Background Jobs

✅ Executive Reports

✅ Real-Time Dashboard

✅ Persistent Scan History

---

# 🔮 Roadmap

- Pull Request Reviews
- CI/CD Integration
- Team Collaboration
- Multi-Language Analysis
- Custom Rule Engine
- Repository Comparison
- AI Fix Suggestions
- GitHub App Integration
- Automated Code Refactoring

---

# ⚙ Environment Variables

```
DATABASE_URL=

GITHUB_TOKEN=

OPENAI_API_KEY=

REDIS_HOST=

REDIS_PORT=

REDIS_USERNAME=

REDIS_PASSWORD=

UPSTASH_REDIS_URL=

UPSTASH_REDIS_TOKEN=

CHROMA_URL=
```

---

# 🚀 Installation

## Backend

```bash
cd backend

npm install

npm run dev
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 📹 Demo

https://www.loom.com/share/fa38986215b84c61a82d1f7e66a601b5

---

# 👨‍💻 Author

**Ankit Tripathi**

Full Stack Developer | AI Engineer

GitHub

https://github.com/ankittrip

LinkedIn

https://linkedin.com/in/ankittripathi-dev

---

# ⭐ Support

If you found this project helpful, please consider giving it a ⭐ on GitHub.

It motivates further development and helps others discover the project.
