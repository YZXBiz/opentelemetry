---
sidebar_position: 5
title: "Chapter 4: The OpenTelemetry Architecture"
description: "Understanding the API, SDK, Collector architecture and hands-on demo exploration"
---

import { CardGrid, TreeDiagram, Row, Box, Arrow, Column, Group, DiagramContainer, ProcessFlow, StackDiagram, colors } from '@site/src/components/diagrams';

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

<DiagramContainer>
  <Group title="Your Application" color={colors.blue}>
    <Column gap="md">
      <Box color={colors.blue} variant="filled">
        Instrumented Libraries<br/>
        (HTTP client, database driver, framework, etc.)<br/>
        Uses API calls
      </Box>
      <Arrow direction="down" label="API calls" />
      <Box color={colors.purple} variant="filled">
        OpenTelemetry API<br/>
        • Tracer, Meter, Logger interfaces<br/>
        • Zero dependencies, minimal overhead
      </Box>
      <Arrow direction="down" label="Backed by SDK" />
      <Box color={colors.green} variant="filled">
        OpenTelemetry SDK<br/>
        • TracerProvider, MeterProvider, LoggerProvider<br/>
        • Samplers, Processors, Exporters
      </Box>
    </Column>
  </Group>
  <Arrow direction="down" label="OTLP" />
  <Box color={colors.orange} variant="filled">Collector</Box>
</DiagramContainer>

### 2.1. Library Instrumentation

**In plain English:** Instead of manually adding logging to every HTTP call, instrumentation libraries do it automatically.

**In technical terms:** Instrumentation libraries wrap or hook into existing libraries to automatically emit telemetry.

<DiagramContainer>
  <Column gap="lg">
    <Box color={colors.green} variant="filled" size="lg">
      Native Instrumentation<br/>
      • Built into the library itself<br/>
      • Best performance and accuracy<br/>
      • Example: A database driver with built-in tracing
    </Box>
    <Box color={colors.blue} variant="filled" size="lg">
      Instrumentation Libraries<br/>
      • Wraps existing libraries<br/>
      • Added separately from the library<br/>
      • Example: opentelemetry-instrumentation-http
    </Box>
    <Box color={colors.purple} variant="filled" size="lg">
      Auto-Instrumentation (Agents)<br/>
      • Automatically instruments many libraries at once<br/>
      • Language-specific (Java agent, Python auto-instrumentation)<br/>
      • Quickest to set up, less customization
    </Box>
  </Column>
</DiagramContainer>

> **💡 Insight**
>
> Start with auto-instrumentation to get quick visibility, then add custom instrumentation for your business logic. You don't have to choose one or the other.

### 2.2. The OpenTelemetry API

**In plain English:** The API is the vocabulary—the standard way to say "start a trace" or "record a metric" that works everywhere.

**In technical terms:** The API provides interfaces for creating telemetry, with no actual implementation. It's safe to depend on from libraries.

<DiagramContainer>
  <Group title="API Package" color={colors.purple}>
    <Column gap="md">
      <Box color={colors.blue} variant="filled" size="lg">
        Defines interfaces only (Tracer, Meter, Logger)<br/>
        • Zero or minimal dependencies<br/>
        • No-op by default (does nothing until SDK is registered)<br/>
        • Safe for library authors to depend on<br/>
        • Stable: backward-compatible forever
      </Box>
      <Arrow direction="down" />
      <Box color={colors.green} variant="filled" size="lg">
        Example API usage:<br/>
        tracer = getTracer('my-service')<br/>
        span = tracer.startSpan('process-order')<br/>
        span.setAttribute('order.id', orderId)<br/>
        span.end()
      </Box>
    </Column>
  </Group>
</DiagramContainer>

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

<DiagramContainer>
  <Group title="SDK" color={colors.blue}>
    <Column gap="md">
      <Box color={colors.purple} variant="filled" size="lg">
        Providers (TracerProvider, MeterProvider, etc.)<br/>
        • Create and manage Tracers/Meters/Loggers<br/>
        • Hold configuration and state
      </Box>
      <Arrow direction="down" />
      <Box color={colors.green} variant="filled" size="lg">
        Resource<br/>
        • Describes the entity producing telemetry<br/>
        • service.name, host.name, k8s.pod.name, etc.
      </Box>
      <Arrow direction="down" />
      <Box color={colors.orange} variant="filled" size="lg">
        Samplers<br/>
        • Decide which traces to record<br/>
        • AlwaysOn, AlwaysOff, TraceIdRatioBased, etc.
      </Box>
      <Arrow direction="down" />
      <Box color={colors.blue} variant="filled" size="lg">
        Processors<br/>
        • Process data before export<br/>
        • BatchProcessor (batches for efficiency)<br/>
        • SimpleProcessor (immediate export)
      </Box>
      <Arrow direction="down" />
      <Box color={colors.green} variant="filled" size="lg">
        Exporters<br/>
        • Send data to backends<br/>
        • OTLP, Jaeger, Prometheus, Console, etc.
      </Box>
    </Column>
  </Group>
</DiagramContainer>

---

## 3. Infrastructure Telemetry

Not all telemetry comes from application code. Infrastructure telemetry captures:

<CardGrid columns={2} cards={[
  {
    title: "Host Metrics",
    color: colors.blue,
    description: "• CPU, memory, disk, network\n• Collected by Collector's hostmetrics receiver"
  },
  {
    title: "Container Metrics",
    color: colors.purple,
    description: "• Docker/containerd stats\n• Resource limits and usage"
  },
  {
    title: "Kubernetes Metrics",
    color: colors.green,
    description: "• Pod, node, cluster metrics\n• Events and object states"
  },
  {
    title: "Cloud Provider Metrics",
    color: colors.orange,
    description: "• AWS CloudWatch, Azure Monitor, GCP Cloud Monitoring\n• Managed service metrics"
  }
]} />

> **💡 Insight**
>
> Application telemetry tells you WHAT happened. Infrastructure telemetry tells you WHERE it happened and with what resources. You need both for complete observability.

---

## 4. Telemetry Pipelines

A telemetry pipeline connects sources to destinations:

<DiagramContainer>
  <Column gap="md">
    <Row gap="lg">
      <Box color={colors.blue} variant="filled">App 1</Box>
      <Box color={colors.blue} variant="filled">App 2</Box>
      <Box color={colors.purple} variant="filled">Infra</Box>
    </Row>
    <Row gap="md" align="center">
      <Arrow direction="down" />
      <Arrow direction="down" />
      <Arrow direction="down" />
    </Row>
    <Box color={colors.green} variant="filled" size="lg">
      Collection<br/>
      • Receive data<br/>
      • Parse formats<br/>
      • Validate
    </Box>
    <Arrow direction="down" />
    <Box color={colors.orange} variant="filled" size="lg">
      Processing<br/>
      • Transform<br/>
      • Filter<br/>
      • Sample<br/>
      • Enrich
    </Box>
    <Arrow direction="down" />
    <Box color={colors.blue} variant="filled" size="lg">
      Backend<br/>
      or<br/>
      Storage
    </Box>
  </Column>
</DiagramContainer>

---

## 5. The Collector

**In plain English:** The Collector is like a post office—it receives packages (telemetry) from many sources, sorts and processes them, then delivers to the right destinations.

**In technical terms:** The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data.

<DiagramContainer>
  <Row gap="lg" align="center">
    <Box color={colors.blue} variant="filled">Incoming<br/>Data</Box>
    <Arrow direction="right" />
    <Group title="Collector" color={colors.slate}>
      <Row gap="md">
        <Box color={colors.green} variant="filled">
          Receivers<br/>
          OTLP, Jaeger,<br/>
          Prometheus,<br/>
          Zipkin, etc.
        </Box>
        <Arrow direction="right" />
        <Box color={colors.orange} variant="filled">
          Processors<br/>
          Batch, Filter,<br/>
          Transform,<br/>
          Sample, etc.
        </Box>
        <Arrow direction="right" />
        <Box color={colors.purple} variant="filled">
          Exporters<br/>
          OTLP, Jaeger,<br/>
          Prometheus,<br/>
          Logging, etc.
        </Box>
      </Row>
    </Group>
    <Arrow direction="right" />
    <Box color={colors.blue} variant="filled">Outgoing<br/>Data</Box>
  </Row>
</DiagramContainer>

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

<DiagramContainer>
  <Column gap="lg">
    <Group title="Pod 1" color={colors.blue}>
      <Column gap="md">
        <Group title="Your Service" color={colors.purple}>
          <Column gap="sm">
            <Box color={colors.green} variant="filled">Your Code<br/>+ Manual Spans</Box>
            <Box color={colors.green} variant="filled">Auto-Instrument<br/>(HTTP, DB...)</Box>
            <Arrow direction="down" />
            <Box color={colors.orange} variant="filled">OTel SDK<br/>(in-process)</Box>
          </Column>
        </Group>
        <Arrow direction="down" label="OTLP localhost" />
        <Box color={colors.blue} variant="filled">
          Collector Sidecar<br/>
          • Receives from service<br/>
          • Adds k8s attributes<br/>
          • Batches and forwards
        </Box>
      </Column>
    </Group>
    <Arrow direction="down" label="OTLP" />
    <Box color={colors.purple} variant="filled" size="lg">
      Collector Gateway<br/>
      (shared pool)<br/>
      • Sampling<br/>
      • Filtering<br/>
      • Routing
    </Box>
    <Row gap="lg">
      <Arrow direction="down" />
      <Arrow direction="down" />
      <Arrow direction="down" />
    </Row>
    <Row gap="lg">
      <Box color={colors.green} variant="filled">Jaeger<br/>(Traces)</Box>
      <Box color={colors.green} variant="filled">Prometheus<br/>(Metrics)</Box>
      <Box color={colors.green} variant="filled">Logging<br/>Backend</Box>
    </Row>
  </Column>
</DiagramContainer>

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
