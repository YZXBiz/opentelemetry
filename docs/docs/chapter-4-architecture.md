---
sidebar_position: 5
title: "Chapter 4: The OpenTelemetry Architecture"
description: "Understanding the API, SDK, Collector architecture and hands-on demo exploration"
---

# 🏗️ Chapter 4: The OpenTelemetry Architecture

> **"I have always found that plans are useless, but planning is indispensable."**
>
> — President Dwight D. Eisenhower

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [Application Telemetry](#2-application-telemetry)
   - 2.1. [Library Instrumentation](#21-library-instrumentation)
   - 2.2. [The OpenTelemetry API](#22-the-opentelemetry-api)
   - 2.3. [The OpenTelemetry SDK](#23-the-opentelemetry-sdk)
3. [Infrastructure Telemetry](#3-infrastructure-telemetry)
4. [Telemetry Pipelines](#4-telemetry-pipelines)
5. [The Collector](#5-the-collector)
   - 5.1. [Receivers](#51-receivers)
   - 5.2. [Processors](#52-processors)
   - 5.3. [Exporters](#53-exporters)
6. [Putting It All Together](#6-putting-it-all-together)
7. [Summary](#7-summary)

---

## 1. Introduction

**In plain English:** OpenTelemetry has a modular architecture—like LEGO blocks that snap together. You can use just the pieces you need, and swap out components without rebuilding everything.

**In technical terms:** OpenTelemetry separates concerns into distinct components (API, SDK, Collector) that communicate through well-defined interfaces.

**Why it matters:** Understanding the architecture helps you make better decisions about instrumentation, deployment, and troubleshooting.

---

## 2. Application Telemetry

Application telemetry comes from code running in your services. Here's how the pieces fit together:

```
Application Telemetry Architecture
──────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                     Your Application                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Instrumented Libraries                      │   │
│  │  (HTTP client, database driver, framework, etc.)        │   │
│  │              Uses ↓ API ↓ calls                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              OpenTelemetry API                           │   │
│  │  • Tracer, Meter, Logger interfaces                     │   │
│  │  • Zero dependencies, minimal overhead                  │   │
│  │              Backed by ↓ SDK ↓                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              OpenTelemetry SDK                           │   │
│  │  • TracerProvider, MeterProvider, LoggerProvider        │   │
│  │  • Samplers, Processors, Exporters                      │   │
│  │              Exports to ↓ Collector ↓                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ OTLP
                               ▼
                    ┌─────────────────────┐
                    │     Collector       │
                    └─────────────────────┘
```

### 2.1. Library Instrumentation

**In plain English:** Instead of manually adding logging to every HTTP call, instrumentation libraries do it automatically.

**In technical terms:** Instrumentation libraries wrap or hook into existing libraries to automatically emit telemetry.

```
Types of Instrumentation
────────────────────────

┌─────────────────────────────────────────────────────────────┐
│ Native Instrumentation                                      │
│ • Built into the library itself                            │
│ • Best performance and accuracy                            │
│ • Example: A database driver with built-in tracing         │
├─────────────────────────────────────────────────────────────┤
│ Instrumentation Libraries                                   │
│ • Wraps existing libraries                                 │
│ • Added separately from the library                        │
│ • Example: opentelemetry-instrumentation-http              │
├─────────────────────────────────────────────────────────────┤
│ Auto-Instrumentation (Agents)                              │
│ • Automatically instruments many libraries at once         │
│ • Language-specific (Java agent, Python auto-instrumentation)│
│ • Quickest to set up, less customization                   │
└─────────────────────────────────────────────────────────────┘
```

> **💡 Insight**
>
> Start with auto-instrumentation to get quick visibility, then add custom instrumentation for your business logic. You don't have to choose one or the other.

### 2.2. The OpenTelemetry API

**In plain English:** The API is the vocabulary—the standard way to say "start a trace" or "record a metric" that works everywhere.

**In technical terms:** The API provides interfaces for creating telemetry, with no actual implementation. It's safe to depend on from libraries.

```
API Characteristics
───────────────────

┌─────────────────────────────────────────────────────────────┐
│ API Package                                                 │
│                                                             │
│ • Defines interfaces only (Tracer, Meter, Logger)          │
│ • Zero or minimal dependencies                             │
│ • No-op by default (does nothing until SDK is registered)  │
│ • Safe for library authors to depend on                    │
│ • Stable: backward-compatible forever                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ // Example API usage                                 │   │
│ │ tracer = getTracer("my-service")                    │   │
│ │ span = tracer.startSpan("process-order")            │   │
│ │ span.setAttribute("order.id", orderId)              │   │
│ │ span.end()                                           │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Why separate API from SDK?**

| Concern | API | SDK |
|---------|-----|-----|
| Who uses it? | Library authors | Application developers |
| Dependencies | None/minimal | Many (exporters, processors) |
| Stability | Never changes | Can evolve |
| Default behavior | No-op | Active telemetry |

### 2.3. The OpenTelemetry SDK

**In plain English:** The SDK is the actual engine—it processes, batches, and sends your telemetry data.

**In technical terms:** The SDK implements the API interfaces and provides the machinery for collecting and exporting telemetry.

```
SDK Components
──────────────

┌─────────────────────────────────────────────────────────────┐
│                         SDK                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Providers (TracerProvider, MeterProvider, etc.)     │   │
│  │ • Create and manage Tracers/Meters/Loggers          │   │
│  │ • Hold configuration and state                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Resource                                             │   │
│  │ • Describes the entity producing telemetry          │   │
│  │ • service.name, host.name, k8s.pod.name, etc.      │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Samplers                                             │   │
│  │ • Decide which traces to record                     │   │
│  │ • AlwaysOn, AlwaysOff, TraceIdRatioBased, etc.     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Processors                                           │   │
│  │ • Process data before export                        │   │
│  │ • BatchProcessor (batches for efficiency)           │   │
│  │ • SimpleProcessor (immediate export)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Exporters                                            │   │
│  │ • Send data to backends                             │   │
│  │ • OTLP, Jaeger, Prometheus, Console, etc.          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Infrastructure Telemetry

Not all telemetry comes from application code. Infrastructure telemetry captures:

```
Infrastructure Telemetry Sources
────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│ Host Metrics                                                │
│ • CPU, memory, disk, network                               │
│ • Collected by Collector's hostmetrics receiver            │
├─────────────────────────────────────────────────────────────┤
│ Container Metrics                                          │
│ • Docker/containerd stats                                  │
│ • Resource limits and usage                                │
├─────────────────────────────────────────────────────────────┤
│ Kubernetes Metrics                                         │
│ • Pod, node, cluster metrics                              │
│ • Events and object states                                 │
├─────────────────────────────────────────────────────────────┤
│ Cloud Provider Metrics                                     │
│ • AWS CloudWatch, Azure Monitor, GCP Cloud Monitoring     │
│ • Managed service metrics                                  │
└─────────────────────────────────────────────────────────────┘
```

> **💡 Insight**
>
> Application telemetry tells you WHAT happened. Infrastructure telemetry tells you WHERE it happened and with what resources. You need both for complete observability.

---

## 4. Telemetry Pipelines

A telemetry pipeline connects sources to destinations:

```
Telemetry Pipeline Stages
─────────────────────────

Source → Collection → Processing → Export → Storage → Analysis

┌────────┐   ┌────────────┐   ┌────────────┐   ┌─────────┐
│ App 1  │──▶│            │   │            │   │         │
├────────┤   │            │   │            │   │ Backend │
│ App 2  │──▶│ Collection │──▶│ Processing │──▶│   or    │
├────────┤   │            │   │            │   │ Storage │
│ Infra  │──▶│            │   │            │   │         │
└────────┘   └────────────┘   └────────────┘   └─────────┘

                  │                  │
                  ▼                  ▼
            • Receive data     • Transform
            • Parse formats    • Filter
            • Validate         • Sample
                               • Enrich
```

---

## 5. The Collector

**In plain English:** The Collector is like a post office—it receives packages (telemetry) from many sources, sorts and processes them, then delivers to the right destinations.

**In technical terms:** The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data.

```
Collector Architecture
──────────────────────

           ┌───────────────────────────────────────────────────┐
           │                    Collector                       │
           │                                                    │
Incoming   │   ┌───────────┐   ┌───────────┐   ┌───────────┐   │   Outgoing
─────────▶ │   │ Receivers │──▶│Processors │──▶│ Exporters │   │ ─────────▶
   Data    │   └───────────┘   └───────────┘   └───────────┘   │   Data
           │                                                    │
           │   OTLP, Jaeger,    Batch, Filter,  OTLP, Jaeger,  │
           │   Prometheus,      Transform,      Prometheus,    │
           │   Zipkin, etc.     Sample, etc.    Logging, etc.  │
           │                                                    │
           └───────────────────────────────────────────────────┘
```

### 5.1. Receivers

**Receivers** accept telemetry data from various sources:

| Receiver | Purpose |
|----------|---------|
| **otlp** | Native OpenTelemetry protocol |
| **jaeger** | Jaeger traces |
| **prometheus** | Prometheus metrics |
| **hostmetrics** | System metrics (CPU, memory, etc.) |
| **filelog** | Parse log files |
| **kafka** | Consume from Kafka |

### 5.2. Processors

**Processors** transform data in the pipeline:

| Processor | Purpose |
|-----------|---------|
| **batch** | Group data for efficient export |
| **filter** | Drop unwanted telemetry |
| **transform** | Modify attributes using OTTL |
| **attributes** | Add/remove/modify attributes |
| **tail_sampling** | Sample based on complete traces |
| **k8sattributes** | Add Kubernetes metadata |

### 5.3. Exporters

**Exporters** send data to backends:

| Exporter | Destination |
|----------|-------------|
| **otlp** | Any OTLP-compatible backend |
| **prometheus** | Prometheus server |
| **jaeger** | Jaeger backend |
| **elasticsearch** | Elasticsearch |
| **debug** | Console output for debugging |

```yaml
# Example Collector Configuration
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  otlp:
    endpoint: "backend.example.com:4317"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp]
```

> **💡 Insight**
>
> The Collector is optional—you can export directly from SDKs to backends. But using a Collector provides benefits: it offloads processing from your app, allows configuration changes without redeployment, and provides a buffer against backend unavailability.

---

## 6. Putting It All Together

Here's how all components interact in a typical deployment:

```
Complete OpenTelemetry Deployment
─────────────────────────────────

┌───────────────────────────────────────────────────────────────┐
│                          Pod 1                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Your Service                                             │  │
│  │ ┌─────────────────┐  ┌─────────────────┐                │  │
│  │ │   Your Code     │  │ Auto-Instrument │                │  │
│  │ │  + Manual Spans │  │  (HTTP, DB...)  │                │  │
│  │ └────────┬────────┘  └────────┬────────┘                │  │
│  │          └───────────┬────────┘                          │  │
│  │                      ▼                                    │  │
│  │              ┌───────────────┐                           │  │
│  │              │ OTel SDK      │                           │  │
│  │              │ (in-process)  │                           │  │
│  │              └───────┬───────┘                           │  │
│  └──────────────────────┼──────────────────────────────────┘  │
│                         │ OTLP (localhost)                     │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │ Collector Sidecar                                        │  │
│  │ • Receives from service                                  │  │
│  │ • Adds k8s attributes                                   │  │
│  │ • Batches and forwards                                  │  │
│  └──────────────────────┬──────────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────────┘
                          │ OTLP
                          ▼
              ┌───────────────────────┐
              │  Collector Gateway    │
              │  (shared pool)        │
              │  • Sampling           │
              │  • Filtering          │
              │  • Routing            │
              └───────────┬───────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     ┌─────────┐    ┌─────────┐    ┌─────────┐
     │ Jaeger  │    │Prometheus│   │ Logging │
     │(Traces) │    │(Metrics) │   │ Backend │
     └─────────┘    └─────────┘    └─────────┘
```

---

## 7. Summary

### 🎓 Key Takeaways

1. **Separation of concerns** — API for interfaces, SDK for implementation, Collector for pipeline

2. **API is safe for libraries** — Zero dependencies, no-op by default, stable forever

3. **SDK is for applications** — Configuration, sampling, processing, exporting

4. **Collector is flexible** — Receive any format, process as needed, export anywhere

5. **Pipelines are configurable** — Receivers → Processors → Exporters

6. **Multiple deployment options** — Sidecar, gateway, or both

### ✅ What's Next

Now you understand the architecture. The next chapter gets practical—showing you exactly how to instrument your applications with OpenTelemetry.

---

**Previous:** [Chapter 3: OpenTelemetry Overview](./chapter-3-opentelemetry-overview) | **Next:** [Chapter 5: Instrumenting Applications](./chapter-5-instrumenting-applications)
