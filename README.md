# Intelligent Multi-Tenant Load Balancer System

## Overview

This project is a **scalable, intelligent, multi-tenant load balancing system** designed to distribute traffic across multiple backend servers dynamically. It includes **real-time health monitoring, failover mechanisms, spike detection, request queuing, and retry logic**, making it suitable for production-grade environments.

Built with a modern stack, this system is ideal for:

* SaaS platforms
* API gateways
* High-availability systems
* Multi-tenant architectures

---

## Core Features

### 1. Smart Load Balancing

* Dynamically routes requests to the healthiest available server
* Supports multiple servers per organization (tenant)
* Prioritizes low-latency and active servers

### 2. Health Monitoring

* Periodic health checks on all registered servers
* Automatically marks servers as **UP** or **DOWN**
* Prevents routing traffic to unhealthy nodes

### 3. Failover & Retry Mechanism

* Automatically retries failed requests
* Switches to alternative servers if primary fails
* Configurable retry limits

### 4. Spike Detection

* Detects sudden traffic bursts within a defined time window
* Helps prevent system overload
* Can trigger queueing or throttling logic

### 5. Request Queueing

* Queues requests when all servers are busy or unavailable
* Processes pending jobs asynchronously
* Prevents request loss under high load

### 6. Multi-Tenant Architecture

* Each organization has isolated server pools
* Custom routing per tenant
* Scalable for multiple clients

### 7. Admin Controls

* Add/remove servers dynamically
* Register organizations
* Monitor system metrics

---

## System Architecture

```
                ┌──────────────┐
                │   Client     │
                └──────┬───────┘
                       │
                       ▼
            ┌─────────────────────┐
            │  Load Balancer API  │
            └─────────┬───────────┘
                      │
      ┌───────────────┼───────────────┐
      ▼               ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Server A │   │ Server B │   │ Server C │
└──────────┘   └──────────┘   └──────────┘

           ▲
           │
   ┌───────────────┐
   │ Request Queue │
   └───────────────┘
```

---

## Tech Stack

### Backend

* Node.js
* Express / Fastify
* MongoDB (Mongoose)
* Axios (request forwarding)
* Socket.IO (real-time updates)

### Frontend

* React
* Axios

---

## 📂 Project Structure

```
backend/
│── routes/
│   ├── gateway.routes.js
│   ├── admin.routes.js
│
│── services/
│   ├── health.service.js
│   ├── scaler.service.js
│
│── models/
│   ├── org.model.js
│   ├── requestQueue.model.js
│
│── utils/
│   ├── metrics.js
│
│── index.js

frontend/
│── src/
│   ├── services/
│   ├── components/
│   ├── pages/
```

---

## Request Flow

1. Client sends request to Load Balancer
2. System identifies the organization
3. Filters healthy servers
4. Applies routing logic (least load / active server)
5. Returns the active server

---

## Health Check Logic

* Runs every **60 seconds** (configurable)
* Calls:

  ```
  GET /
  → { status: "ok" }
  ```
* Updates server status in database

---

## Metrics & Monitoring

Tracks:

* Request count
* Failed requests
* Active servers
* Response times

Can be extended to:

* Prometheus
* Grafana dashboards

---

## Environment Variables

Create a `.env` file in the backend:

```
PORT
MONGO_URI=your_mongodb_uri
HEALTH_INTERVAL=60000
SPIKE_WINDOW=10000
SPIKE_THRESHOLD=10
MAX_RETRIES=2
```

---

## Getting Started

### 1. Clone the Repository

```
git clone <your-repo-url>
cd project-folder
```

### 2. Install Dependencies

```
cd backend
npm install

cd ../frontend
npm install
```

### 3. Run the System

```
# Backend
npm run dev

# Frontend
npm run dev
```

## ⚠️ Failure Handling Strategy

| Scenario         | Action               |
| ---------------- | -------------------- |
| Server Down      | Skip server          |
| Request Failure  | Retry another server |
| All Servers Down | Queue request        |
| Traffic Spike    | Trigger queueing     |

---

## 🔮 Future Improvements

* AI-based traffic prediction
* Auto-scaling (spin up/down servers)
* Rate limiting per tenant
* Circuit breaker pattern
* Distributed queue (Redis / Kafka)

---

## 🧑‍💻 Author

**Kinyi**
Software Engineering Student & System Builder

---

## 📜 License

MIT License

---

## 💡 Final Notes

This system is designed with **real-world scalability in mind**. While already powerful, its architecture allows you to extend into:

* Full API Gateway
* SaaS Infrastructure Layer
* Cloud-native traffic manager

---

🔥 *If you're building something serious, this is not just a project — it's infrastructure.*
