# Experience Summary (Anonymized)

## Machine Learning Software Engineer Intern  
**Financial AI Research Lab (Major Bank)** · Toronto, Canada · Dec 2025 – Apr 2026  

- Executed zero-downtime migration of live/batch credit capacity inferencing models to an NVIDIA DGX A100 cluster, reconfiguring Triton inference endpoints, Kubernetes deployments, and CI/CD pipelines to maintain 99.95% uptime.  
- Reduced P95 inference latency by 25% and doubled throughput by optimizing GPU-based model serving (dynamic batching, quantization, container tuning) and running comprehensive load/performance tests before production.  
- Accelerated deployment velocity by 60% by automating model build, validation, and OpenShift rollout workflows with GitHub Actions and migrating legacy batch schedules to modern YAML-based Airflow configurations.  

---

## Site Reliability Engineer Intern  
**Insurance Technology Platform** · Toronto, Canada · Sept 2025 – Dec 2025  

- Architected scalable Infrastructure-as-code (IaC) libraries using Terraform modules for 190+ AWS accounts, reducing manual infrastructure provisioning time by 65%.  
- Engineered high-throughput ETL pipelines ingesting infrastructure telemetry and system logs into a cloud data platform, automating cloud cost optimization and achieving 95% compliance coverage via AI-driven anomaly detection.  
- Orchestrated automated vulnerability management across 50+ Kubernetes/OpenShift clusters using DaemonSet-based agents, cutting security audit latency by 75% with anomaly-detection models.  

---

## Quantitative Software / AI Engineer Intern  
**Capital Markets Research Group (Major Bank)** · Toronto, Canada · May 2025 – Aug 2025  

- Architected and shipped a multi-agent research platform over FastAPI microservices, processing 10,000+ daily queries and improving internal research efficiency by 60% through RESTful APIs over a data warehouse.  
- Developed real-time Kafka-based data pipelines to ingest 50,000+ daily articles with automated performance monitoring, maintaining sub‑second latency for 18,000+ users and feeding downstream ML ranking models in a distributed environment.  
- Scaled feature rollout velocity by containerizing services with multi-stage Docker builds and CI pipelines, reducing deployment time by 50% across 8 production Kubernetes clusters.  

---

## Full-Stack Software Engineer Intern (Client Services)  
**Capital Markets Client Platform (Major Bank)** · Toronto, Canada · May 2024 – Aug 2024  

- Architected a client-facing RAG chatbot using an internal LLM gateway and vector search database (semantic embeddings), reducing investor support tickets by 22% via automated query resolution.  
- Engineered a semantic search engine for investor portal documentation using vector embeddings over a datastore with ~300,000 rows, enabling high-precision contextual retrieval for complex trading platform queries.  
- Built performance profiling for a React-based trading platform serving ~4,500 daily active users, using Lighthouse CI across 12+ configurations to catch performance regressions before release.  

---

## Full-Stack Software Engineer Intern (Global Equities)  
**Global Equities Technology (Major Bank)** · Toronto, Canada · May 2023 – Aug 2023  

- Engineered an internal CVE triage platform with a React frontend and Flask REST API backend, ingesting P1 CVE data from multiple sources via scheduled jobs, reducing production errors by 30% and cutting developer triage time by ~40%.  
- Designed a priority-based caching and routing layer to stream mission-critical alerts to on-call engineers, reducing Mean Time to Acknowledge (MTTA) by 30% and achieving 99.8% SLA compliance across several regional trading desks.  
- Implemented idempotent processing and de‑duplication logic in the routing service, eliminating duplicate P1 notifications and reducing noisy alerts by 35% for global on‑call teams.  

---

# Selected Projects

## Cost Intelligence for Agentic AI Workflows  
**Tech:** Next.js, React 19, FastAPI, Python, React Flow, tiktoken, supabase  

- Architected an open-source visual engine to design and estimate multi‑agent AI workflows, achieving sub‑10ms estimation latency using pure-math simulations instead of external API calls.  
- Implemented graph algorithms (Tarjan’s SCC, topological sort) for cycle detection and critical path analysis to estimate P95 latency of complex LLM chains.  

---

## Alert Triage & Incident Response Agent  
**Tech:** LangChain, LangGraph, LangFuse, cloud-hosted LLMs, Kafka, Postgres  

- Built a multi-agent LLM triage system (LangGraph + RAG + GPU-backed inference) for large compute clusters, integrating Kafka-based real-time ingestion for alert classification and root cause analysis.  
- Designed the workflow to target a 70–80% reduction in mean time to recovery (MTTR) by automating triage steps and escalation logic.  

---

## AI Restaurant Discovery Platform  
**Tech:** Python, Flask, FastAPI, React Native, Redis, GCP, ML ranking  

- Built a full-stack restaurant discovery platform for ~1,500 users with Flask/FastAPI microservices, ML-based ranking, and React Native clients.  
- Owned REST API design, data models, and integration end-to-end, including ranking models and caching.  

---

# Skills (Summarized, No PII)

## Languages & Technical Skills

- **Languages:** Python, C++, Java, JavaScript/TypeScript, SQL, Bash, Swift, Rust  
- **Web / Backend:** FastAPI, Flask, Node.js, REST APIs  
- **Data / Streaming:** Kafka, Snowflake, SQL, real-time streaming pipelines  
- **ML / Cloud:** Machine learning, forecasting models (e.g., Prophet, XGBoost), PyTorch  
- **Infra & DevOps:** Linux/Unix, Kubernetes, OpenShift, Docker, Terraform, CI/CD (Jenkins, Tekton, GitHub Actions), AWS, GCP, Azure, Ansible  

