---
sidebar_position: 8
title: "Chapter 7: Observing Infrastructure"
description: "Cloud providers, Kubernetes, serverless, and async workflows - infrastructure observability with OpenTelemetry"
---

# 🖥️ Chapter 7: Observing Infrastructure

> **"We build our computer systems the way we build our cities: over time, without a plan, on top of ruins."**
>
> — Ellen Ullman

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [What Is Infrastructure Observability?](#2-what-is-infrastructure-observability)
3. [Observing Cloud Providers](#3-observing-cloud-providers)
   - 3.1. [Collecting Cloud Metrics and Logs](#31-collecting-cloud-metrics-and-logs)
   - 3.2. [Push vs. Pull](#32-push-vs-pull)
4. [Observing Platforms](#4-observing-platforms)
   - 4.1. [Kubernetes Platforms](#41-kubernetes-platforms)
   - 4.2. [Serverless Platforms](#42-serverless-platforms)
   - 4.3. [Queues and Async Workflows](#43-queues-and-async-workflows)
5. [Summary](#5-summary)

---

## 1. Introduction

**In plain English:** Your application doesn't run in a vacuum—it runs on servers, containers, and cloud services. Understanding that infrastructure is essential for complete observability.

**In technical terms:** Infrastructure observability captures telemetry from the systems that host and support your applications, including cloud providers, container orchestrators, and serverless platforms.

**Why it matters:** Application telemetry tells you WHAT happened. Infrastructure telemetry tells you WHERE it happened and with what resources. You need both.

---

## 2. What Is Infrastructure Observability?

Infrastructure observability differs from application observability in an important way: **context**.

```
Application Observability              Infrastructure Observability
───────────────────────────           ───────────────────────────────

"Request X took 500ms"                "CPU was at 95% when request X
                                       ran on pod Y in node Z"

High correlation with                 Often shared resources
specific requests                     (many requests, same infra)
```

**Two key questions to ask:**

| Question | If Yes | If No |
|----------|--------|-------|
| Can you establish context between infrastructure and application signals? | Worth integrating | Keep separate |
| Does understanding this help achieve business/technical goals? | Worth integrating | May still need monitoring, just not in observability stack |

### The Infrastructure Taxonomy

```
Infrastructure Types
────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ Providers (source of infrastructure)                            │
│                                                                 │
│ • Datacenters                                                  │
│ • Cloud Providers (AWS, GCP, Azure)                            │
│ • Colocation facilities                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Platforms (abstractions over providers)                         │
│                                                                 │
│ • Container orchestration (Kubernetes)                         │
│ • Serverless (Lambda, Cloud Functions)                         │
│ • CI/CD (Jenkins, GitHub Actions)                              │
│ • Managed services (RDS, Cloud SQL)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Observing Cloud Providers

### 3.1. Collecting Cloud Metrics and Logs

Cloud providers offer a firehose of telemetry. Your job is to collect what's relevant:

```
The Cloud Telemetry Iceberg
───────────────────────────

        ┌───────────────────────┐
        │  What you usually     │  ← Dashboards, alerts
        │  look at              │     (5% of data)
        └───────────┬───────────┘
                    │
    ~~~~~~~~~~~~~~~~│~~~~~~~~~~~~~~~~  ← Surface
                    │
        ┌───────────▼───────────┐
        │  What's available     │  ← API calls, detailed
        │  but rarely used      │     metrics, audit logs
        │                       │     (95% of data)
        │                       │
        │                       │
        │                       │
        └───────────────────────┘
```

**Categories of cloud services:**

| Category | Examples | Telemetry Type |
|----------|----------|----------------|
| **Bare infrastructure** | VMs, blob storage, VPCs | System metrics, access logs |
| **Managed services** | RDS, Cloud SQL, ElastiCache | Service metrics, slow query logs |
| **Serverless** | Lambda, Cloud Functions | Invocation metrics, execution logs |

> **⚠️ Warning**
>
> Cloud telemetry costs can surprise you! We've seen developers spend $150+ on logging for compute jobs that cost $10. Be purposeful about what you collect.

### Best Practices for Cloud Telemetry

```
Practical Guidelines
────────────────────

1. Use semantic conventions for soft context
   • Ensure service code and infrastructure use same attribute names
   • Enables correlation across signals

2. Leverage existing integrations
   • OpenTelemetry Collector has receivers for most sources
   • CloudWatch, Azure Monitor, GCP integrations exist

3. Be purposeful with data
   • Define what you actually need
   • Set retention policies
   • Filter early in the pipeline
```

### 3.2. Push vs. Pull

```
Push vs. Pull Metrics Collection
────────────────────────────────

Push Model (OTLP default)
─────────────────────────
┌─────────┐        ┌───────────┐
│ Service │──push─▶│ Collector │──▶ Backend
└─────────┘        └───────────┘

• Service initiates connection
• Works through firewalls
• OTLP uses push


Pull Model (Prometheus style)
─────────────────────────────
                   ┌───────────┐
┌─────────┐◀─pull──│ Collector │──▶ Backend
│ Service │        └───────────┘
│ /metrics│
└─────────┘

• Collector initiates connection
• Service must be reachable
• Prometheus uses pull
```

**OpenTelemetry Collector can do both:**

```yaml
# Collector config: Pull from Prometheus, Push via OTLP
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: 'my-service'
          static_configs:
            - targets: ['service:9090']

exporters:
  otlp:
    endpoint: backend:4317

service:
  pipelines:
    metrics:
      receivers: [prometheus]
      exporters: [otlp]
```

---

## 4. Observing Platforms

### 4.1. Kubernetes Platforms

Kubernetes is complex enough to deserve special attention.

```
Kubernetes Telemetry Sources
────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ Cluster Level                                                    │
│ • kube-state-metrics (object states)                            │
│ • API server metrics (request rates, latencies)                 │
│ • etcd metrics (cluster health)                                 │
├─────────────────────────────────────────────────────────────────┤
│ Node Level                                                       │
│ • kubelet metrics (pod lifecycle)                               │
│ • node-exporter (host metrics)                                  │
│ • Container runtime metrics                                     │
├─────────────────────────────────────────────────────────────────┤
│ Pod Level                                                        │
│ • Application telemetry                                         │
│ • Sidecar container telemetry                                   │
│ • Resource usage (CPU, memory)                                  │
└─────────────────────────────────────────────────────────────────┘
```

**OpenTelemetry Operator for Kubernetes:**

```
Operator Capabilities
─────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ Collector Management                                             │
│                                                                 │
│ • DaemonSet: Collector on every node                           │
│ • Sidecar: Collector in every pod                              │
│ • Deployment: Collector pool                                    │
│ • StatefulSet: Stateful collector pool                         │
├─────────────────────────────────────────────────────────────────┤
│ Auto-Instrumentation Injection                                  │
│                                                                 │
│ • Java, Python, Node.js, .NET, Go                              │
│ • Injects via pod annotation                                   │
│ • No code changes required                                     │
├─────────────────────────────────────────────────────────────────┤
│ Target Allocator                                                │
│                                                                 │
│ • Discovers Prometheus endpoints                               │
│ • Distributes scrape jobs across collectors                    │
│ • Enables horizontal scaling                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Example: Auto-instrumentation injection**

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    # This annotation triggers auto-instrumentation!
    instrumentation.opentelemetry.io/inject-python: "true"
spec:
  containers:
    - name: my-app
      image: my-python-app:latest
```

**Production tips for Kubernetes:**

| Tip | Benefit |
|-----|---------|
| Use sidecar Collectors | Reduces memory pressure on app, cleaner shutdowns |
| Split by signal type | Traces, metrics, logs can scale independently |
| Separate config from code | Easier to adjust without redeploying |

### 4.2. Serverless Platforms

Serverless introduces unique challenges:

```
Serverless Observability Challenges
───────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ Challenge: Ephemeral execution                                   │
│                                                                 │
│ Function starts → Runs → Dies                                   │
│ Must export telemetry before death!                            │
├─────────────────────────────────────────────────────────────────┤
│ Challenge: Cold starts                                          │
│                                                                 │
│ First invocation may be slow                                   │
│ Need to track cold vs. warm performance separately             │
├─────────────────────────────────────────────────────────────────┤
│ Challenge: No persistent collector                              │
│                                                                 │
│ Can't run sidecar that outlives function                       │
│ Must push directly or use extension                            │
└─────────────────────────────────────────────────────────────────┘
```

**Metrics to track for serverless:**

| Metric | Why It Matters |
|--------|---------------|
| **Invocation time** | How long does the function run? |
| **Resource usage** | Memory and compute consumption |
| **Cold start time** | First-invocation latency |
| **Error rate** | Function failures |

**OpenTelemetry Lambda Layer:**

```
Lambda with OTel Layer
──────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ AWS Lambda                                                       │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ OpenTelemetry Lambda Layer                                │   │
│ │ • Auto-instruments common libraries                       │   │
│ │ • Manages span lifecycle                                  │   │
│ │ • Flushes on invocation end                              │   │
│ └───────────────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Your Function Code                                        │   │
│ │ • Runs with tracing enabled                              │   │
│ │ • No code changes needed for basic telemetry             │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ OTLP
                              ▼
                     ┌───────────────────┐
                     │    Collector      │
                     │ (dedicated pool)  │
                     └───────────────────┘
```

### 4.3. Queues and Async Workflows

Event-driven architectures present unique challenges:

```
The Async Observability Problem
───────────────────────────────

Traditional Request/Response:
User → Service A → Service B → Service C → Response
     └──────────── One trace, clear parent-child ────────────┘

Async/Event-Driven:
User → Service A → Queue → Service B
                       ↓
                    Service C
                       ↓
                    Service D → Queue → Service E

Questions:
• When does the "transaction" end?
• How do you trace across queues?
• What if processing takes hours?
```

**Solution: Span Links**

```
Using Span Links for Async
──────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ Producer (Trace 1)                                              │
│                                                                 │
│ Span: "publish-message"                                         │
│ trace_id: abc123                                                │
│ span_id: 001                                                    │
│                                                                 │
│ Attaches span context to message headers                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ message
                            ▼
                    ┌───────────────┐
                    │     Queue     │
                    └───────┬───────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Consumer (Trace 2 - NEW trace!)                                 │
│                                                                 │
│ Span: "process-message"                                         │
│ trace_id: xyz789  ← Different trace!                           │
│ span_id: 001                                                    │
│ links: [{trace_id: abc123, span_id: 001}]  ← Link to producer  │
└─────────────────────────────────────────────────────────────────┘
```

**Why separate traces?**

| Reason | Explanation |
|--------|-------------|
| **Independent failure** | Consumer can retry without affecting producer trace |
| **Time gaps** | Message might sit in queue for hours |
| **Multiple consumers** | One message might be processed by many services |
| **Clear boundaries** | Each "unit of work" is a distinct trace |

> **💡 Insight**
>
> Use span links for async workflows, not parent-child relationships. This lets you correlate work without artificially extending trace duration or creating confusing hierarchies.

---

## 5. Summary

### 🎓 Key Takeaways

1. **Infrastructure provides context** — WHERE things happen, not just WHAT happened

2. **Be purposeful with collection** — Cloud telemetry can be expensive; collect what matters

3. **Kubernetes needs the Operator** — Manages Collectors and auto-instrumentation

4. **Serverless needs special handling** — Ephemeral execution requires careful telemetry flushing

5. **Use span links for async** — Don't force parent-child relationships across queues

6. **Start from your goals** — Define what you need to observe before collecting everything

### ✅ What's Next

Now you understand how to observe both applications and infrastructure. The next chapter covers designing telemetry pipelines—how to process, filter, sample, and route all this data efficiently.

---

**Previous:** [Chapter 6: Instrumenting Libraries](./chapter-6-instrumenting-libraries) | **Next:** [Chapter 8: Designing Telemetry Pipelines](./chapter-8-designing-pipelines)
