---
sidebar_position: 8
title: "Chapter 7: Observing Infrastructure"
description: "Cloud providers, Kubernetes, serverless, and async workflows - infrastructure observability with OpenTelemetry"
---

import { CardGrid, TreeDiagram, Row, Box, Arrow, Column, Group, DiagramContainer, ProcessFlow, StackDiagram, colors } from '@site/src/components/diagrams';

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

<DiagramContainer>
  <Row gap="lg" align="center">
    <Box color={colors.blue} variant="filled" size="lg">
      <strong>Application Observability</strong><br/>
      'Request X took 500ms'<br/><br/>
      High correlation with<br/>
      specific requests
    </Box>
    <Arrow direction="right" />
    <Box color={colors.purple} variant="filled" size="lg">
      <strong>Infrastructure Observability</strong><br/>
      'CPU was at 95% when request X<br/>
      ran on pod Y in node Z'<br/><br/>
      Often shared resources<br/>
      (many requests, same infra)
    </Box>
  </Row>
</DiagramContainer>

**Two key questions to ask:**

| Question | If Yes | If No |
|----------|--------|-------|
| Can you establish context between infrastructure and application signals? | Worth integrating | Keep separate |
| Does understanding this help achieve business/technical goals? | Worth integrating | May still need monitoring, just not in observability stack |

### The Infrastructure Taxonomy

<DiagramContainer>
  <Column gap="md" align="center">
    <Box color={colors.blue} variant="filled" size="lg">
      <strong>Providers</strong><br/>
      (source of infrastructure)<br/><br/>
      • Datacenters<br/>
      • Cloud Providers (AWS, GCP, Azure)<br/>
      • Colocation facilities
    </Box>
    <Arrow direction="down" />
    <Box color={colors.purple} variant="filled" size="lg">
      <strong>Platforms</strong><br/>
      (abstractions over providers)<br/><br/>
      • Container orchestration (Kubernetes)<br/>
      • Serverless (Lambda, Cloud Functions)<br/>
      • CI/CD (Jenkins, GitHub Actions)<br/>
      • Managed services (RDS, Cloud SQL)
    </Box>
  </Column>
</DiagramContainer>

---

## 3. Observing Cloud Providers

### 3.1. Collecting Cloud Metrics and Logs

Cloud providers offer a firehose of telemetry. Your job is to collect what's relevant:

<DiagramContainer>
  <Column gap="md" align="center">
    <Box color={colors.green} variant="filled" size="md">
      What you usually look at<br/>
      Dashboards, alerts<br/>
      (5% of data)
    </Box>
    <Arrow direction="down" />
    <Box color={colors.orange} variant="filled" size="md">
      Surface
    </Box>
    <Arrow direction="down" />
    <Box color={colors.blue} variant="filled" size="md">
      What's available but rarely used<br/>
      API calls, detailed metrics,<br/>
      audit logs<br/>
      (95% of data)
    </Box>
  </Column>
</DiagramContainer>

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

<DiagramContainer>
  <Column gap="lg">
    <Group title="Push Model (OTLP default)" color={colors.blue}>
      <Row gap="md" align="center">
        <Box color={colors.blue} variant="filled">Service</Box>
        <Arrow direction="right" label="push" />
        <Box color={colors.purple} variant="filled">Collector</Box>
        <Arrow direction="right" />
        <Box color={colors.green} variant="filled">Backend</Box>
      </Row>
    </Group>

    <Group title="Pull Model (Prometheus style)" color={colors.purple}>
      <Row gap="md" align="center">
        <Box color={colors.purple} variant="filled">Collector</Box>
        <Arrow direction="right" label="pull" />
        <Box color={colors.blue} variant="filled">Service<br/>/metrics</Box>
        <Arrow direction="right" />
        <Box color={colors.green} variant="filled">Backend</Box>
      </Row>
    </Group>
  </Column>
</DiagramContainer>

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

<DiagramContainer>
  <Column gap="md" align="center">
    <Box color={colors.blue} variant="filled" size="lg">
      <strong>Cluster Level</strong><br/><br/>
      • kube-state-metrics (object states)<br/>
      • API server metrics (request rates, latencies)<br/>
      • etcd metrics (cluster health)
    </Box>
    <Arrow direction="down" />
    <Box color={colors.purple} variant="filled" size="lg">
      <strong>Node Level</strong><br/><br/>
      • kubelet metrics (pod lifecycle)<br/>
      • node-exporter (host metrics)<br/>
      • Container runtime metrics
    </Box>
    <Arrow direction="down" />
    <Box color={colors.green} variant="filled" size="lg">
      <strong>Pod Level</strong><br/><br/>
      • Application telemetry<br/>
      • Sidecar container telemetry<br/>
      • Resource usage (CPU, memory)
    </Box>
  </Column>
</DiagramContainer>

**OpenTelemetry Operator for Kubernetes:**

<DiagramContainer>
  <Column gap="md" align="center">
    <Box color={colors.blue} variant="filled" size="lg">
      <strong>Collector Management</strong><br/><br/>
      • DaemonSet: Collector on every node<br/>
      • Sidecar: Collector in every pod<br/>
      • Deployment: Collector pool<br/>
      • StatefulSet: Stateful collector pool
    </Box>
    <Arrow direction="down" />
    <Box color={colors.purple} variant="filled" size="lg">
      <strong>Auto-Instrumentation Injection</strong><br/><br/>
      • Java, Python, Node.js, .NET, Go<br/>
      • Injects via pod annotation<br/>
      • No code changes required
    </Box>
    <Arrow direction="down" />
    <Box color={colors.green} variant="filled" size="lg">
      <strong>Target Allocator</strong><br/><br/>
      • Discovers Prometheus endpoints<br/>
      • Distributes scrape jobs across collectors<br/>
      • Enables horizontal scaling
    </Box>
  </Column>
</DiagramContainer>

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

<DiagramContainer>
  <Column gap="md" align="center">
    <Box color={colors.red} variant="filled" size="lg">
      <strong>Challenge: Ephemeral execution</strong><br/><br/>
      Function starts → Runs → Dies<br/>
      Must export telemetry before death!
    </Box>
    <Arrow direction="down" />
    <Box color={colors.orange} variant="filled" size="lg">
      <strong>Challenge: Cold starts</strong><br/><br/>
      First invocation may be slow<br/>
      Need to track cold vs. warm performance separately
    </Box>
    <Arrow direction="down" />
    <Box color={colors.purple} variant="filled" size="lg">
      <strong>Challenge: No persistent collector</strong><br/><br/>
      Can't run sidecar that outlives function<br/>
      Must push directly or use extension
    </Box>
  </Column>
</DiagramContainer>

**Metrics to track for serverless:**

| Metric | Why It Matters |
|--------|---------------|
| **Invocation time** | How long does the function run? |
| **Resource usage** | Memory and compute consumption |
| **Cold start time** | First-invocation latency |
| **Error rate** | Function failures |

**OpenTelemetry Lambda Layer:**

<DiagramContainer>
  <Column gap="md" align="center">
    <Box color={colors.orange} variant="filled" size="md">
      <strong>AWS Lambda</strong>
    </Box>
    <Arrow direction="down" />
    <Box color={colors.purple} variant="filled" size="lg">
      OpenTelemetry Lambda Layer<br/>
      • Auto-instruments common libraries<br/>
      • Manages span lifecycle<br/>
      • Flushes on invocation end
    </Box>
    <Arrow direction="down" />
    <Box color={colors.blue} variant="filled" size="lg">
      Your Function Code<br/>
      • Runs with tracing enabled<br/>
      • No code changes needed for basic telemetry
    </Box>
    <Arrow direction="down" label="OTLP" />
    <Box color={colors.green} variant="filled" size="md">
      Collector<br/>
      (dedicated pool)
    </Box>
  </Column>
</DiagramContainer>

### 4.3. Queues and Async Workflows

Event-driven architectures present unique challenges:

<DiagramContainer>
  <Row gap="lg" align="start" wrap>
    <Group title="Traditional Request/Response" color={colors.blue}>
      <Column gap="sm" align="center">
        <Box color={colors.blue} variant="filled" size="sm">User</Box>
        <Arrow direction="down" />
        <Box color={colors.green} variant="filled" size="sm">Service A</Box>
        <Arrow direction="down" />
        <Box color={colors.green} variant="filled" size="sm">Service B</Box>
        <Arrow direction="down" />
        <Box color={colors.green} variant="filled" size="sm">Service C</Box>
        <Arrow direction="down" />
        <Box color={colors.purple} variant="filled" size="sm">Response</Box>
      </Column>
    </Group>

    <Group title="Async/Event-Driven" color={colors.orange}>
      <Column gap="sm" align="center">
        <Box color={colors.blue} variant="filled" size="sm">User</Box>
        <Arrow direction="down" />
        <Box color={colors.green} variant="filled" size="sm">Service A</Box>
        <Arrow direction="down" />
        <Box color={colors.orange} variant="filled" size="sm">Queue</Box>
        <Row gap="sm">
          <Column gap="sm" align="center">
            <Arrow direction="down" />
            <Box color={colors.green} variant="filled" size="sm">Service B</Box>
          </Column>
          <Column gap="sm" align="center">
            <Arrow direction="down" />
            <Box color={colors.green} variant="filled" size="sm">Service C</Box>
            <Arrow direction="down" />
            <Box color={colors.orange} variant="filled" size="sm">Queue</Box>
            <Arrow direction="down" />
            <Box color={colors.green} variant="filled" size="sm">Service D</Box>
            <Arrow direction="down" />
            <Box color={colors.green} variant="filled" size="sm">Service E</Box>
          </Column>
        </Row>
      </Column>
    </Group>
  </Row>
</DiagramContainer>

**Solution: Span Links**

<DiagramContainer>
  <Row gap="md" align="center">
    <Box color={colors.blue} variant="filled" size="lg">
      <strong>Producer (Trace 1)</strong><br/><br/>
      Span: 'publish-message'<br/>
      trace_id: abc123<br/>
      span_id: 001<br/><br/>
      Attaches span context to message headers
    </Box>
    <Arrow direction="right" label="message" />
    <Box color={colors.orange} variant="filled" size="md">
      Queue
    </Box>
    <Arrow direction="right" />
    <Box color={colors.purple} variant="filled" size="lg">
      <strong>Consumer (Trace 2 - NEW trace!)</strong><br/><br/>
      Span: 'process-message'<br/>
      trace_id: xyz789 ← Different trace!<br/>
      span_id: 001<br/>
      links: [{'{'}trace_id: abc123, span_id: 001{'}'}] ← Link to producer
    </Box>
  </Row>
</DiagramContainer>

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
