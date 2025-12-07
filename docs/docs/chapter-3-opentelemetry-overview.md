---
sidebar_position: 4
title: "Chapter 3: OpenTelemetry Overview"
description: "Understanding the three primary signals (traces, metrics, logs), context propagation, and semantic conventions"
---

import { CardGrid, TreeDiagram, Row, Box, Arrow, Column, Group, DiagramContainer, ProcessFlow, StackDiagram, colors } from '@site/src/components/diagrams';

# 🔍 Chapter 3: OpenTelemetry Overview

> **"You can't communicate complexity, only an awareness of it."**
>
> — Alan Perlis

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [Primary Observability Signals](#2-primary-observability-signals)
   - 2.1. [Traces](#21-traces)
   - 2.2. [Metrics](#22-metrics)
   - 2.3. [Logs](#23-logs)
3. [Observability Context](#3-observability-context)
   - 3.1. [The Context Layer](#31-the-context-layer)
   - 3.2. [Attributes and Resources](#32-attributes-and-resources)
4. [Semantic Conventions](#4-semantic-conventions)
5. [OpenTelemetry Protocol (OTLP)](#5-opentelemetry-protocol-otlp)
6. [Compatibility and Future-Proofing](#6-compatibility-and-future-proofing)
7. [Summary](#7-summary)

---

## 1. Introduction

**In plain English:** OpenTelemetry provides three types of "sensors" for your application—each capturing different information. Combined with a universal translator (context), they give you complete visibility.

**In technical terms:** OpenTelemetry defines three signals (traces, metrics, logs), a context propagation mechanism, and semantic conventions that together form a complete observability framework.

**Why it matters:** Understanding these components is essential for effective instrumentation and for getting the most out of your observability data.

---

## 2. Primary Observability Signals

OpenTelemetry supports three primary signals, each optimized for different use cases:

<DiagramContainer>
  <Row gap="md" align="stretch">
    <Box color={colors.blue} variant="filled" size="lg">
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: '2em', marginBottom: '0.5em'}}>📊</div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em'}}>Metrics</div>
        <div style={{fontSize: '0.9em'}}>How much?</div>
        <div style={{fontSize: '0.85em', marginTop: '0.3em'}}>Aggregated measurements</div>
        <div style={{fontSize: '0.85em'}}>over time</div>
      </div>
    </Box>
    <Box color={colors.purple} variant="filled" size="lg">
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: '2em', marginBottom: '0.5em'}}>📍</div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em'}}>Traces</div>
        <div style={{fontSize: '0.9em'}}>Where?</div>
        <div style={{fontSize: '0.85em', marginTop: '0.3em'}}>Request flow</div>
        <div style={{fontSize: '0.85em'}}>across services</div>
      </div>
    </Box>
    <Box color={colors.green} variant="filled" size="lg">
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: '2em', marginBottom: '0.5em'}}>📝</div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em'}}>Logs</div>
        <div style={{fontSize: '0.9em'}}>What happened?</div>
        <div style={{fontSize: '0.85em', marginTop: '0.3em'}}>Discrete events</div>
        <div style={{fontSize: '0.85em'}}>with detailed information</div>
      </div>
    </Box>
  </Row>
</DiagramContainer>

### 2.1. Traces

**In plain English:** A trace is like a detailed receipt showing every step of a request as it travels through your system.

**In technical terms:** A trace represents a single request's journey through a distributed system, consisting of spans that capture individual operations.

<DiagramContainer>
  <TreeDiagram
    root={{
      label: (
        <div style={{textAlign: 'center'}}>
          <div style={{fontWeight: 'bold'}}>HTTP GET /checkout</div>
          <div style={{fontSize: '0.85em'}}>Duration: 450ms</div>
          <div style={{fontSize: '0.85em'}}>Service: api-gateway</div>
          <div style={{fontSize: '0.85em'}}>Trace ID: abc123</div>
        </div>
      ),
      color: colors.blue,
      children: [
        {
          label: (
            <div style={{textAlign: 'center'}}>
              <div style={{fontWeight: 'bold'}}>AuthService.validate</div>
              <div style={{fontSize: '0.85em'}}>Duration: 50ms</div>
              <div style={{fontSize: '0.85em'}}>Service: auth-service</div>
            </div>
          ),
          color: colors.purple
        },
        {
          label: (
            <div style={{textAlign: 'center'}}>
              <div style={{fontWeight: 'bold'}}>CartService.getItems</div>
              <div style={{fontSize: '0.85em'}}>Duration: 120ms</div>
              <div style={{fontSize: '0.85em'}}>Service: cart-service</div>
            </div>
          ),
          color: colors.purple,
          children: [
            {
              label: (
                <div style={{textAlign: 'center'}}>
                  <div style={{fontWeight: 'bold'}}>PostgreSQL SELECT</div>
                  <div style={{fontSize: '0.85em'}}>Duration: 45ms</div>
                </div>
              ),
              color: colors.green
            }
          ]
        },
        {
          label: (
            <div style={{textAlign: 'center'}}>
              <div style={{fontWeight: 'bold'}}>PaymentService.charge</div>
              <div style={{fontSize: '0.85em'}}>Duration: 200ms</div>
            </div>
          ),
          color: colors.purple
        }
      ]
    }}
  />
</DiagramContainer>

**Key trace concepts:**

| Concept | Description |
|---------|-------------|
| **Trace** | The complete journey of a request |
| **Span** | A single operation within a trace |
| **Span Context** | Trace ID + Span ID that links spans |
| **Parent/Child** | Relationship between spans |
| **Events** | Timestamped messages within a span |
| **Attributes** | Key-value metadata on spans |

> **💡 Insight**
>
> Traces are the backbone of distributed debugging. They answer the question "what happened to this specific request?" in a way that logs and metrics cannot.

### 2.2. Metrics

**In plain English:** Metrics are like a car's dashboard gauges—they show you aggregated measurements that help you understand overall system health.

**In technical terms:** Metrics are numerical measurements collected at regular intervals, optimized for aggregation and alerting.

<DiagramContainer>
  <Column gap="md">
    <Box color={colors.blue} variant="filled" size="lg">
      <div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em', fontSize: '1.1em'}}>Counter</div>
        <div style={{fontSize: '0.9em'}}>• Always increases or resets</div>
        <div style={{fontSize: '0.9em'}}>• Example: http_requests_total = 15,234</div>
        <div style={{fontSize: '0.9em'}}>• Use for: Counting events, calculating rates</div>
      </div>
    </Box>
    <Box color={colors.purple} variant="filled" size="lg">
      <div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em', fontSize: '1.1em'}}>Gauge</div>
        <div style={{fontSize: '0.9em'}}>• Can go up or down</div>
        <div style={{fontSize: '0.9em'}}>• Example: current_temperature = 72.5</div>
        <div style={{fontSize: '0.9em'}}>• Use for: Current values that fluctuate</div>
      </div>
    </Box>
    <Box color={colors.green} variant="filled" size="lg">
      <div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em', fontSize: '1.1em'}}>Histogram</div>
        <div style={{fontSize: '0.9em'}}>• Samples observations into buckets</div>
        <div style={{fontSize: '0.9em'}}>• Example: request_duration_seconds</div>
        <div style={{fontSize: '0.9em'}}>• Use for: Latency distributions, percentiles</div>
      </div>
    </Box>
  </Column>
</DiagramContainer>

**Metrics vs. Traces:**

| Aspect | Metrics | Traces |
|--------|---------|--------|
| **Data volume** | Low (aggregated) | High (per-request) |
| **Query speed** | Fast | Slower |
| **Best for** | Alerting, dashboards | Debugging specific issues |
| **Cardinality** | Must be controlled | Can have high cardinality |

> **⚠️ Warning**
>
> High-cardinality metrics (too many unique label combinations) can explode your metrics storage costs. Be thoughtful about which attributes you add to metrics.

### 2.3. Logs

**In plain English:** Logs are the detailed journal entries your application writes—capturing specific events with all their details.

**In technical terms:** Logs are timestamped, structured records of discrete events that occur during system operation.

<DiagramContainer>
  <ProcessFlow
    steps={[
      {
        title: "Traditional Log",
        description: (
          <div>
            <div style={{fontSize: '0.85em', fontWeight: 'bold', marginBottom: '0.3em'}}>Unstructured</div>
            <div style={{fontSize: '0.8em', fontStyle: 'italic'}}>2024-01-15 14:32:05 ERROR Failed to connect to database</div>
          </div>
        ),
        color: colors.red
      },
      {
        title: "Structured Log",
        description: (
          <div>
            <div style={{fontSize: '0.85em', fontWeight: 'bold', marginBottom: '0.3em'}}>Better</div>
            <div style={{fontSize: '0.85em'}}>timestamp, level, message, service</div>
          </div>
        ),
        color: colors.orange
      },
      {
        title: "OpenTelemetry Log",
        description: (
          <div>
            <div style={{fontSize: '0.85em', fontWeight: 'bold', marginBottom: '0.3em'}}>Best</div>
            <div style={{fontSize: '0.85em'}}>timestamp, severity, body</div>
            <div style={{fontSize: '0.85em'}}>+ trace_id, span_id</div>
            <div style={{fontSize: '0.85em'}}>+ semantic attributes</div>
          </div>
        ),
        color: colors.green
      }
    ]}
    direction="horizontal"
  />
</DiagramContainer>

> **💡 Insight**
>
> The magic of OpenTelemetry logs is the trace_id and span_id fields. These let you jump directly from a log message to the complete request context—something that was impossible before correlated telemetry.

---

## 3. Observability Context

### 3.1. The Context Layer

**In plain English:** Context is like a package tracking number that follows your request everywhere it goes, ensuring all related data can be connected.

**In technical terms:** Context is metadata that propagates through your system, linking telemetry data across service boundaries.

<DiagramContainer>
  <ProcessFlow
    steps={[
      {
        title: "Service A",
        description: (
          <div>
            <div style={{fontSize: '0.85em', fontWeight: 'bold', marginBottom: '0.3em'}}>Create Trace Context</div>
            <div style={{fontSize: '0.8em'}}>Span A</div>
            <div style={{fontSize: '0.8em'}}>trace_id: abc</div>
            <div style={{fontSize: '0.8em'}}>span_id: 001</div>
            <div style={{fontSize: '0.8em'}}>parent: null</div>
          </div>
        ),
        icon: "🌐",
        color: colors.blue
      },
      {
        title: "Service B",
        description: (
          <div>
            <div style={{fontSize: '0.85em', fontWeight: 'bold', marginBottom: '0.3em'}}>Extract & Continue</div>
            <div style={{fontSize: '0.8em'}}>Span B</div>
            <div style={{fontSize: '0.8em'}}>trace_id: abc</div>
            <div style={{fontSize: '0.8em'}}>span_id: 002</div>
            <div style={{fontSize: '0.8em'}}>parent: 001</div>
          </div>
        ),
        icon: "🔄",
        color: colors.purple
      },
      {
        title: "Service C",
        description: (
          <div>
            <div style={{fontSize: '0.85em', fontWeight: 'bold', marginBottom: '0.3em'}}>Extract & Continue</div>
            <div style={{fontSize: '0.8em'}}>Span C</div>
            <div style={{fontSize: '0.8em'}}>trace_id: abc</div>
            <div style={{fontSize: '0.8em'}}>span_id: 003</div>
            <div style={{fontSize: '0.8em'}}>parent: 002</div>
          </div>
        ),
        icon: "✅",
        color: colors.green
      }
    ]}
    direction="horizontal"
  />
  <div style={{textAlign: 'center', marginTop: '1em', fontSize: '0.9em', color: '#64748b'}}>
    <div>HTTP Headers / gRPC Metadata: traceparent, tracestate</div>
  </div>
</DiagramContainer>

**What propagates:**

| Field | Purpose |
|-------|---------|
| **Trace ID** | Unique identifier for the entire request |
| **Span ID** | Identifier for the current operation |
| **Trace Flags** | Sampling decisions, debug flags |
| **Trace State** | Vendor-specific information |
| **Baggage** | User-defined key-value pairs |

### 3.2. Attributes and Resources

**Attributes** describe individual operations:
```yaml
# Span attributes
http.request.method: "POST"
http.route: "/api/users"
http.response.status_code: 201
user.id: "user_12345"
```

**Resources** describe where telemetry comes from:
```yaml
# Resource attributes
service.name: "user-service"
service.version: "1.2.3"
deployment.environment: "production"
host.name: "prod-server-01"
cloud.provider: "aws"
cloud.region: "us-east-1"
```

> **💡 Insight**
>
> Resources are set once at startup and attached to all telemetry. Attributes are set per-span/metric/log. This distinction helps keep telemetry efficient.

---

## 4. Semantic Conventions

**In plain English:** Everyone agrees to call the same things by the same names—like how all countries use the same road signs.

**In technical terms:** Semantic conventions are standardized attribute names and values defined by OpenTelemetry.

<DiagramContainer>
  <CardGrid
    columns={3}
    cards={[
      {
        title: "HTTP Requests",
        icon: "🌐",
        color: colors.blue,
        items: [
          "http.request.method → GET, POST",
          "http.response.status_code → 200, 404, 500",
          "url.path → /api/users"
        ]
      },
      {
        title: "Database Operations",
        icon: "💾",
        color: colors.purple,
        items: [
          "db.system → postgresql, mysql",
          "db.name → users_db",
          "db.operation → SELECT, INSERT"
        ]
      },
      {
        title: "Messaging",
        icon: "📨",
        color: colors.green,
        items: [
          "messaging.system → kafka, rabbitmq",
          "messaging.destination.name → orders-queue",
          "messaging.operation → publish, receive"
        ]
      }
    ]}
  />
</DiagramContainer>

**Why conventions matter:**

| Without Conventions | With Conventions |
|--------------------|------------------|
| "method", "http_method", "request_method" | "http.request.method" |
| Every team invents their own names | Everyone uses the same names |
| Can't correlate across services | Easy correlation everywhere |
| Tools can't provide smart features | Tools understand your data |

> **💡 Insight**
>
> Semantic conventions enable the ecosystem. APM tools can automatically build dependency maps because they know `db.system` always means the database type. Dashboards work across any service because everyone uses the same attribute names.

---

## 5. OpenTelemetry Protocol (OTLP)

**In plain English:** OTLP is the universal language that all OpenTelemetry components speak.

**In technical terms:** OTLP is the native protocol for transmitting telemetry data, supporting gRPC and HTTP transports.

<DiagramContainer>
  <ProcessFlow
    steps={[
      {
        title: "Your App",
        description: (
          <div>
            <div style={{fontSize: '0.85em', marginBottom: '0.3em'}}>SDK</div>
            <div style={{fontSize: '0.85em'}}>• Traces</div>
            <div style={{fontSize: '0.85em'}}>• Metrics</div>
            <div style={{fontSize: '0.85em'}}>• Logs</div>
          </div>
        ),
        icon: "📱",
        color: colors.blue
      },
      {
        title: "Collector",
        description: (
          <div>
            <div style={{fontSize: '0.85em'}}>Receiver</div>
            <div style={{fontSize: '0.85em', textAlign: 'center'}}>↓</div>
            <div style={{fontSize: '0.85em'}}>Process</div>
            <div style={{fontSize: '0.85em', textAlign: 'center'}}>↓</div>
            <div style={{fontSize: '0.85em'}}>Exporter</div>
          </div>
        ),
        icon: "🔄",
        color: colors.purple
      },
      {
        title: "Backend",
        description: (
          <div>
            <div style={{fontSize: '0.85em'}}>Any OTLP</div>
            <div style={{fontSize: '0.85em'}}>Backend</div>
          </div>
        ),
        icon: "💾",
        color: colors.green
      }
    ]}
    direction="horizontal"
  />
  <div style={{textAlign: 'center', marginTop: '1em', fontSize: '0.9em', color: '#64748b'}}>
    <div>OTLP (gRPC or HTTP)</div>
  </div>
</DiagramContainer>

**OTLP characteristics:**

| Feature | Benefit |
|---------|---------|
| **Single protocol** | One way to send all signal types |
| **Efficient** | Binary encoding, compression support |
| **Flexible transport** | gRPC (fast) or HTTP (firewall-friendly) |
| **Widely supported** | 40+ vendors accept OTLP directly |

---

## 6. Compatibility and Future-Proofing

OpenTelemetry is designed for long-term stability:

<DiagramContainer>
  <Column gap="md">
    <Box color={colors.green} variant="filled" size="lg">
      <div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em', fontSize: '1.1em'}}>✅ Stable APIs v1.0+</div>
        <div style={{fontSize: '0.9em'}}>• Never break backward compatibility</div>
        <div style={{fontSize: '0.9em'}}>• Safe to use in production</div>
        <div style={{fontSize: '0.9em'}}>• Any changes are purely additive</div>
      </div>
    </Box>
    <Box color={colors.orange} variant="filled" size="lg">
      <div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em', fontSize: '1.1em'}}>🧪 Experimental Features</div>
        <div style={{fontSize: '0.9em'}}>• May change based on feedback</div>
        <div style={{fontSize: '0.9em'}}>• Clearly marked in documentation</div>
        <div style={{fontSize: '0.9em'}}>• Move to stable after proven</div>
      </div>
    </Box>
    <Box color={colors.red} variant="filled" size="lg">
      <div>
        <div style={{fontWeight: 'bold', marginBottom: '0.5em', fontSize: '1.1em'}}>⚠️ Deprecated Features</div>
        <div style={{fontSize: '0.9em'}}>• Will work for at least 1 year</div>
        <div style={{fontSize: '0.9em'}}>• Clear migration path provided</div>
        <div style={{fontSize: '0.9em'}}>• Warnings in documentation</div>
      </div>
    </Box>
  </Column>
</DiagramContainer>

> **💡 Insight**
>
> Instrument once, use forever. OpenTelemetry's stability guarantees mean you won't have to rewrite instrumentation every time you update. This is why it's safe to invest heavily in OpenTelemetry.

---

## 7. Summary

### 🎓 Key Takeaways

1. **Three signals, one framework** — Traces, metrics, and logs each serve different purposes but share context

2. **Traces are the backbone** — They show the complete journey of requests and link all other data

3. **Context makes it work** — Propagated context (trace IDs) is what enables correlation

4. **Semantic conventions are essential** — Standard names enable tooling and cross-service analysis

5. **OTLP is the universal protocol** — One protocol for all signals, supported everywhere

6. **Stability is guaranteed** — Safe to invest in OpenTelemetry long-term

### ✅ What's Next

Now you understand what OpenTelemetry provides. The next chapter dives into the architecture—how the API, SDK, and Collector work together to make observability happen.

---

**Previous:** [Chapter 2: Why Use OpenTelemetry?](./chapter-2-why-opentelemetry) | **Next:** [Chapter 4: The OpenTelemetry Architecture](./chapter-4-architecture)
