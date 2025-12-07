---
sidebar_position: 11
title: "Interactive Python"
description: "Try running Python code directly in your browser"
---

import PythonRunner from '@site/src/components/PythonRunner';

# 🐍 Interactive Python Demo

Run Python code directly in your browser using Pyodide - no installation required!

---

## Basic Example

<PythonRunner
  code={`# Basic Python example
print("Hello from the browser!")
print("Python is running via WebAssembly")

# Simple calculation
result = sum(range(1, 11))
print(f"Sum of 1-10: {result}")`}
  title="Hello World"
/>

---

## Data Structures

<PythonRunner
  code={`# Working with dictionaries - like OpenTelemetry attributes!
service_attributes = {
    "service.name": "payment-service",
    "service.version": "1.2.3",
    "deployment.environment": "production"
}

print("Service Attributes:")
for key, value in service_attributes.items():
    print(f"  {key}: {value}")

# Nested structures - like span events
span_events = [
    {"name": "payment.started", "timestamp": "2024-01-15T10:00:00Z"},
    {"name": "validation.complete", "timestamp": "2024-01-15T10:00:01Z"},
    {"name": "payment.complete", "timestamp": "2024-01-15T10:00:02Z"}
]

print("\\nSpan Events:")
for event in span_events:
    print(f"  {event['name']} at {event['timestamp']}")`}
  title="Data Structures"
/>

---

## Simulating Telemetry Concepts

<PythonRunner
  code={`import random
from datetime import datetime

# Simulate a simple trace
class SimpleSpan:
    def __init__(self, name):
        self.name = name
        self.trace_id = hex(random.randint(0, 2**128))[2:].zfill(32)
        self.span_id = hex(random.randint(0, 2**64))[2:].zfill(16)
        self.attributes = {}
        self.start_time = datetime.now()

    def set_attribute(self, key, value):
        self.attributes[key] = value

    def end(self):
        self.end_time = datetime.now()
        duration = (self.end_time - self.start_time).total_seconds() * 1000
        print(f"Span: {self.name}")
        print(f"  Trace ID: {self.trace_id[:16]}...")
        print(f"  Span ID: {self.span_id}")
        print(f"  Duration: {duration:.2f}ms")
        print(f"  Attributes: {self.attributes}")

# Create a span
span = SimpleSpan("process-order")
span.set_attribute("order.id", "ORD-12345")
span.set_attribute("order.amount", 99.99)
span.set_attribute("order.currency", "USD")

# Simulate some work
for i in range(1000000):
    pass

span.end()`}
  title="Simulating Spans"
/>

---

## Metrics Simulation

<PythonRunner
  code={`import random

# Simulate a Counter metric
class Counter:
    def __init__(self, name, description):
        self.name = name
        self.description = description
        self.value = 0

    def add(self, amount, attributes=None):
        self.value += amount
        attrs = attributes or {}
        print(f"Counter '{self.name}' += {amount} (total: {self.value}) {attrs}")

# Simulate a Histogram metric
class Histogram:
    def __init__(self, name, description, unit):
        self.name = name
        self.description = description
        self.unit = unit
        self.values = []

    def record(self, value, attributes=None):
        self.values.append(value)
        attrs = attributes or {}
        print(f"Histogram '{self.name}' recorded {value}{self.unit} {attrs}")

# Create metrics
request_counter = Counter("http.requests", "Total HTTP requests")
latency_histogram = Histogram("http.latency", "Request latency", "ms")

# Simulate some requests
endpoints = ["/api/users", "/api/orders", "/api/products"]
methods = ["GET", "POST"]

print("Simulating HTTP requests...\\n")
for i in range(5):
    endpoint = random.choice(endpoints)
    method = random.choice(methods)
    latency = random.uniform(10, 200)

    request_counter.add(1, {"endpoint": endpoint, "method": method})
    latency_histogram.record(round(latency, 2), {"endpoint": endpoint})

print(f"\\nTotal requests: {request_counter.value}")
print(f"Average latency: {sum(latency_histogram.values)/len(latency_histogram.values):.2f}ms")`}
  title="Simulating Metrics"
/>

---

> **💡 Note**
>
> These are simplified simulations to demonstrate concepts. Real OpenTelemetry instrumentation requires the SDK which runs on your server, not in the browser. The interactive examples here help you understand the data structures and patterns used in observability.

---

**Previous:** [Chapter 9: Rolling Out Observability](./chapter-9-rolling-out-observability)
