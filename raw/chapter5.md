Skip to Content
Chapter 5. Instrumenting Applications
It is easier to write an incorrect program than understand a correct one.

Alan J. Perlis1

Adding OpenTelemetry to all of your application services is an important part of getting started—and it’s definitely the most complex part. The process of setting up OpenTelemetry is twofold: installing the software development kit (SDK) and installing instrumentation. The SDK is the OpenTelemetry client responsible for processing and exporting the telemetry. Instrumentation is code written using the OpenTelemetry API to generate telemetry.

Instrumenting applications can be difficult and time-consuming. While some languages can automate this process, it’s very helpful to understand what the components actually are and how they relate to each other. Occasionally there are problems with installation, and it’s very difficult to debug a system you aren’t familiar with!

This book does not provide detailed setup instructions or code snippets. That’s what the documentation is for, and we don’t want to provide instructions that could be out-of-date by the time you read this. Instead, in this chapter we’ll provide a high-level overview of the entire installation process, descriptions of the components involved, and advice on what we consider to be best practices. Read this before you begin so you will better understand the goals you are trying to reach and know what to look for in the documentation.

It’s also possible to overinstrument an application, or to spend too much time instrumenting one service before moving on to the next one. Check out the advice in “How Much Is Too Much?” to understand when to stop.

Near the end of this chapter, you will find a complete setup checklist. Reviewing a checklist before deploying OpenTelemetry is an extremely helpful way to ensure that everything is working properly. Even if you already know how to install OpenTelemetry, we recommend that you share this checklist with your team and use it every time you instrument an application.

Agents and Automated Setup
In all languages, you need to install two parts: the SDK that processes and exports telemetry, and all the instrumentation libraries that match the frameworks, database clients, and other common components used by your application. That’s a lot of pieces to install and set up. Ideally, we would want to automate all of this work.

But when it comes to automation, every language is different. Some languages provide complete automation that requires no code at all. Other languages provide no automation whatsoever. While we don’t want to go into details (again, read the docs!), we do believe that before you get started, it’s helpful to understand what kind of automation is available.

The following languages provide additional tooling for auto-instrumentation. When you install OpenTelemetry for the first time, we recommend you read the docs on these tools and learn how to use them:

Java
The OpenTelemetry Java agent can automatically install the SDK and all available instrumentation via the standard -javaagent command-line argument.

.NET
The .NET instrumentation agent automatically installs the SDK and available instrumentation packages and is run alongside a .NET application itself.

Node.js
The @opentelemetry/auto-instrumentations-node package can automatically install the SDK and all available instrumentation via the node --require flag.

PHP
For PHP 8.0 and greater, OpenTelemetry can automatically install the SDK and all available instrumentation via the OpenTelemetry PHP extension.

Python
The opentelemetry-instrumentation package can automatically install the SDK and all available instrumentation via the opentelemetry-instrument command.

Ruby
The opentelemetry-instrumentation-all package can automatically install all available instrumentation, but you’ll still need to set up and configure the OpenTelemetry SDK.

Go
The OpenTelemetry Go Instrumentation package uses eBPF to instrument popular Go libraries. Future work should allow it to extend manual instrumentation and set up an SDK for you.

Installing the SDK
In some languages—for example, Rust and Erlang—automation does not exist. You install and set up the OpenTelemetry SDK just like any other library. Even in languages in which auto-instrumentation is available, you may want to set things up by hand in order to have more control. Auto-instrumentation can sometimes come with extra overhead, and you may eventually want to customize the installation beyond what the automation will let you do.

So how do you install the SDK? You construct and configure a set of providers and register them with the OpenTelemetry API. This process is described next.

Registering Providers
What happens if you make an OpenTelemetry API call? By default, nothing. That API call is a no-op, meaning that the API is safe to call, but nothing happens and there is no overhead.

For something to happen, you need to register providers with the API. A provider is an implementation of the OpenTelemetry instrumentation API. These providers handle all of the API calls. The TracerProvider creates tracers and spans. The MeterProvider creates meters and instruments. The LoggerProvider creates loggers. As OpenTelemetry expands in scope, more providers may be added in the future.

You should register providers as early as possible in the application boot cycle. Any API calls made before registering a provider will be no-ops and will not be recorded.

Why Have Providers?
This provider business seems extra complicated. Why is OpenTelemetry separated like this? There are two main reasons.

One reason is that separate providers allow you to be selective and install only the parts of OpenTelemetry that you plan on using. For example, let’s say you already have a metrics and logs solution for your application, and you want to use OpenTelemetry only to add tracing. This is easy to do without ending up with an extra metrics and logging system: just install the OpenTelemetry tracing provider by itself. The metric and logging instrumentation will remain no-ops.

The second main reason is loose coupling. Registering providers allows the API to be completely separate from the implementation. The API packages contain only interfaces and constants. They have almost no dependencies and are very lightweight. This means that libraries that use the OpenTelemetry API do not automatically pull in a huge dependency chain. This is helpful for avoiding dependency conflicts in shared libraries that run in many applications.

An additional reason is flexibility. If you want to use OpenTelemetry instrumentation but don’t like our implementation, you don’t have to use it. You can write your own implementation and register that with the API instead of using the SDK. (See “Custom Providers” this chapter).

Providers
When we talk about the SDK, we’re talking about a set of provider implementations. Each provider is a framework that can be extended and configured through various types of plug-ins, as described in the following sections.

TracerProvider
A TracerProvider implements the OpenTelemetry tracing API. It consists of samplers, SpanProcessors, and exporters. Figure 5-1 shows how these components relate to one another.


Figure 5-1. The TracerProvider framework
Samplers
Samplers choose whether the span is recorded or dropped. A variety of sampling algorithms are available, and choosing which sampler to use and how to configure it is one of the most confusing parts of setting up a tracing system.

Dropped or Recorded?
Calling a span “sampled” can mean it was “sampled out” (dropped) or “sampled in” (recorded), so it’s good to be specific.

It’s difficult to choose a sampler without understanding how you plan to use the telemetry. Sampling means losing data. What data is safe to lose? If you’re trying to measure only average latency, a random sampler that records only one out of 1,024 traces will work fine and could save quite a bit of money. But if you want to investigate edge cases and outliers—extreme latency, rare but dangerous errors—a random sampler will lose too much data and could miss recording these events.

This means that the sampler you choose will very much depend on the kind of features available in the tracing analysis tool to which you are sending the telemetry. If you sample in a manner that is incompatible with your analysis tool, you’ll get misleading data and nonfunctional features. We strongly recommend that you consult with the vendor of the tracing or OSS product you’re using for advice on sampling.

When in doubt, do not sample at all. It’s better to start out without any sampling and then add it later in response to specific costs or overhead you are looking to reduce. Don’t reflexively add a sampler until you understand the costs you are trying to reduce and the kinds of sampling your tracing product is compatible with. (For a more complete discussion of sampling, check out “Filtering and Sampling”.)

SpanProcessors
SpanProcessors allow you to collect and modify spans. They intercept the span twice: once when it starts and once when it ends.

The default processor is called a BatchProcessor. This processor buffers span data and manages the exporter plug-ins described in the following subsection. Generally, you should install the BatchProcessor as the last SpanProcessor in your processing pipeline. BatchProcessors have the following configuration options:

exporter
The exporter to which the spans are pushed.

maxQueueSize
The maximum number of spans held in the buffer. Any further spans are dropped. The default value is 2,048.

scheduledDelayMillis
The delay interval in milliseconds between two consecutive exports. The default value is 5,000.

exportTimeoutMillis
How long an export can run before it is canceled. The default value is 30,000.

maxExportBatchSize
The maximum number of spans in an export. If the queue reaches maxExportBatchSize, a batch will be exported even if scheduledDelayMillis has not elapsed. The default value is 512.

Most default values are fine. But if telemetry is being exported to a local Collector, we recommend setting scheduledDelayMillis to a much smaller number. This ensures that you’ll lose only a minimal amount of telemetry data if the application suddenly crashes. The default value (five seconds) can also slow things down and create confusion during development, because you have to sit there and wait five seconds every time you want to test a change you made.

As time goes on, you may find it useful to write additional SpanProcessors to modify span attributes or integrate spans with other systems. However, most processing that can be done in a SpanProcessor can also be done later, in a Collector. This is preferable; it’s best to do as little processing in the application as possible. Then you can use a local Collector for any further buffering, processing, and exporting. It’s also helpful to run a local Collector to capture machine metrics and additional resources (see Chapter 8), so this is a very common setup.

When and How to Use SpanProcessors
If you elect to use processors at the SDK, order matters. Processors are chained together in order of registration and run in a linear fashion. This means that processors that modify telemetry should come before processors that batch it, for instance. Whether to process your telemetry at the SDK rather than in a Collector is a decision that you’ll need to make based on how your application is deployed, what it is, and what telemetry you want to get out of it. For example, an Internet of Things (IoT) device that is forward-deployed into untrusted LANs cannot reasonably expect a local Collector instance to be available to redact span attributes that contain personally identifiable information (PII). In such a case, you would use processors to perform the modification before compressing the telemetry data and sending it out for analysis.

Exporters
How do you get all these spans out of a process and into something you can read? Exporters! These plug-ins define the format and destination of your telemetry data.

The default is to use the OpenTelemetry Protocol (OTLP) exporter, which we recommend. The only situation in which you should not use OTLP is when you are not running a Collector and are sending data directly to an analysis tool that does not support OTLP. In that case, check the analysis tool documentation to find out which exporter is compatible.

Here are the OTLP configuration options that you should be aware of:

protocol
OTLP supports three transport protocols: gRPC, http/protobuf, and http/json. We recommend http/protobuf, which is also the default.

endpoint
The URL to which the exporter is going to send spans or metrics. The default values are http://localhost:4318 for HTTP and http://localhost:4317 for gRPC.

headers
Additional HTTP headers added to every export request. Some analysis tools may require an account or security token header to route data correctly.

compression
Used to turn on GZip compression. This is recommended for larger batch sizes.

timeout
The maximum time the OTLP exporter will wait for each batch export. It defaults to 10 seconds.

certificate file, client key file, and client certificate file
Used for verifying a server’s TLS credentials when a secure connection is required.

MeterProvider
A MeterProvider implements the OpenTelemetry metrics API. It consists of views, MetricReaders, MetricProducers, and MetricExporters. Figure 5-2 shows how these components relate to one another.


Figure 5-2. The MeterProvider framework
MetricReaders
MetricReaders are the metric equivalent of SpanProcessors. They collect and buffer metric data until it can be exported. The default MetricReader is a PeriodicExportingMetricReader. This reader collects metric data and then pushes it to an exporter in batches. Use it when exporting OTLP. Periodic readers have two configuration options you should be aware of:

exportIntervalMillis
The time interval in milliseconds between two consecutive exports. The default value is 60,000.

exportTimeoutMillis
How long the export can run before it is canceled. The default value is 30,000.

MetricProducers
It is common for existing applications to already have metric instrumentation of some kind. You need MetricProducers to connect some types of third-party instrumentation to an OpenTelemetry SDK, so that you can start mixing your existing instrumentation with new OpenTelemetry instrumentation. For example, Prometheus instrumentation may require a MetricProducer.

Every MetricProducer is registered with a MetricReader. If you have existing metric instrumentation, check the documentation to learn which MetricProducer is required to connect it to the OpenTelemetry SDK.

MetricExporters
MetricExporters send batches of metrics over the network. As with traces, we recommend using the OTLP exporter to send telemetry to a Collector.

If you are a Prometheus user and are not using a Collector, then you’ll want to use Prometheus’s pull-based collection system instead of the push-based system used by OTLP. Installing the Prometheus exporter will set this up.

If you are first sending data to a Collector, then use the OTLP exporter in your application and install the Prometheus exporter in the Collector. We recommend this approach.

Views
Views are a powerful tool for customizing the metrics the SDK outputs. You can choose which instruments are ignored, how an instrument aggregates data, and which attributes are reported.

When you are just getting started, there is no need to configure views; you may never need to touch them. Later, when you are fine-tuning metrics and looking to lower your overhead, you might want to look into creating your first views. You also don’t necessarily have to create views at the SDK level—you can use the OpenTelemetry Collector to create them as well.

LoggerProvider
A LoggerProvider implements the OpenTelemetry logging API. It consists of LogRecordProcessors and LogRecordExporters. Figure 5-3 shows how these components relate to one another.


Figure 5-3. The LoggerProvider framework
LogRecordProcessors
LogRecordProcessors work just like SpanProcessors. The default processor is a batch processor, which you use to register your exporters. As with the span batch processor, we recommend lowering the scheduledDelayMillis config parameter when sending data to a local Collector.

LogRecordExporters
LogRecordExporters emit logging data in a variety of common formats. As with the other signals, we recommend using the OTLP exporter.

Shutting Down Providers
When shutting down an application, it’s critical to flush any remaining telemetry before the application terminates. Flushing is the process of immediately exporting any remaining telemetry data already buffered in the SDK while blocking shutdown. If your application terminates before flushing the SDK, you could lose critical observability data.

To perform a final flush, every SDK provider includes a Shutdown method. Make sure to integrate this method into your application shutdown procedure as one of the final steps.

Automatic Shutdown
If you’re using automatic instrumentation through an agent, the agent will call shutdown as a process exits, so you don’t need to do anything.

Custom Providers
The SDK we’ve described is what the OpenTelemetry project recommends using with the OpenTelemetry API. These frameworks provide a balance of flexibility and efficiency, and in most scenarios they work just fine.

However, for some edge cases, the SDK architecture may not be appropriate. In these rare cases, it’s possible to create your own alternative implementation. Allowing alternative implementations is one of the reasons the OpenTelemetry API is separate from the SDK.

For example, the OpenTelemetry C++ SDK is multithreaded. Envoy, a popular proxy service, makes use of the OpenTelemetry API for instrumentation. However, Envoy requires that all its components be single-threaded. It’s not feasible to make the SDK optionally single-threaded; that would mean an entirely different architecture. So, in this case, a separate single-threaded implementation was written in C++ to work with Envoy.

It’s highly unlikely that you’ll need to build a custom implementation. We list the option for completeness and to help clarify why OpenTelemetry keeps a strict separation of concerns between the instrumentation interfaces and their implementation.

Configuration Best Practices
You can configure the SDK in three ways:

In code, when constructing exporters, samplers, and processors

Using environment variables

Using a YAML config file

The most widely supported method of configuring the OpenTelemetry SDK or automatic instrumentation is through environment variables. This is better than hard coding configuration options within an application, because it allows operators to set these values at deployment time. This is a critical feature, since the correct OpenTelemetry configuration options can vary greatly among development, testing, and production environments. For example, in development, you might send data to a local Collector to verify your installation. In testing, you might send data directly to a small-scale analysis tool designed to test-load and alert for performance regressions. Then, in production, you might send data to a load balancer specific to the network to which that particular application instance has been deployed.

Also, in production, telemetry pipelines can generate a lot of data, so they require a setup that can handle high throughput. You may need to tune several parameters to avoid overwhelming your telemetry pipeline. Sending more data than the system can actually process is called backpressure, and it will lead to dropped telemetry.

Recently, the OpenTelemetry project defined a config file that works across all languages. This is the new recommended approach for configuration. A config file has all the advantages of environment variables but is much easier to check and verify. It is also easy to create config file templates for developers and operators to follow. The same config file format works across all OpenTelemetry implementations. If necessary, you can still use environment variables to override any settings listed in the config file. As of this writing, support for this new configuration file is mixed, but we expect it to increase.

Remote Configuration
As we write this, OpenTelemetry is developing Open Agent Management Protocol (OpAMP), a remote configuration protocol for Collectors and SDKs. OpAmp will allow Collectors and SDKs to open a port, through which they transmit their current status and receive configuration updates. Using OpAMP, a control plane can manage the entire OpenTelemetry deployment without the need to restart or redeploy.

Some configuration options, such as sampling, are highly dependent on what telemetry data is being generated and how it is being used. With OpAMP, an analysis tool could control these settings dynamically, dropping any data that is not being used early in the telemetry pipeline. This can mean enormous cost savings in large deployments, because you can tune the data collected precisely to match the data required to run the features the analysis tool provides. As we mention later, configuring sampling by hand is difficult and not recommended unless you understand the type of sampling your analysis tool is compatible with.

Attaching Resources
Resources are a set of attributes that define the environment in which telemetry is being collected. They describe the service, the virtual machine, the platform, the region, the cloud provider—everything you need to know to correlate production problems with a particular location or service. If your telemetry data, such as spans, metrics, and logs, tells you what is happening, resources tell you where it is happening.

Resource Detectors
Beyond the service-specific resources, most resources come from the environment in which the application is deployed, such as Kubernetes, AWS, GCP, Azure, or Linux. These resources come from a known location and usually have a standard way of being acquired. Plug-ins that discover these resources are called resource detectors.

When setting up OpenTelemetry, make a list of every aspect of your environment you want to capture, and then investigate whether a resource detector already exists to capture this information. Most resources can be discovered by a local Collector and attached to the telemetry coming from an application as it passes through the Collector.

Almost all OpenTelemetry SDKs, regardless of language, include resource detectors. Accessing some resources requires API calls, which can slow application startup, so we recommend the Collector approach.

Service Resources
There’s one critical set of resources you can’t gather from the environment: the resources that describe your service. These resources are incredibly important, so make sure you define them as part of setting up OpenTelemetry. They include the following:

service.name
The name of this class of service—for example, frontend or payment-processor.

service.namespace
Service names are not always globally unique. A service namespace can help differentiate two different types of “frontend” service.

service.instance.id
The unique ID that describes this particular instance, written in whatever format you use for generating unique IDs.

service.version
The version number, written in whatever format you use for versioning.

Again, it is vitally important to set these resources. Many analysis tools require them in order to provide certain features. For example, let’s say you want to compare performance of different versions of an application and identify any regressions. If you haven’t recorded the service.version, there will be no way to do this.

Advanced Resource Annotation Strategies
Depending on the eventual destination of your telemetry streams, consider carefully how you place resource detection in your Collector pipelines. For example, perhaps you want to keep high-fidelity data from a Kubernetes cluster available in that cluster for a short time, while shipping the rest of it to a persistent store. In this case, you might apply resource detection and annotation only to the latter telemetry streams. It wouldn’t be important for the other streams, since the high-fidelity telemetry would be local to the cluster on which it was viewed. Please see Chapter 8 for more details on setting up telemetry pipelines.

Installing Instrumentation
Besides the SDK, OpenTelemetry requires instrumentation. Ideally, you should not have to write any of this instrumentation yourself. If your application is built out of common libraries (HTTP clients, web frameworks, messaging clients, database clients), their instrumentation should be sufficient to get you started.

Auto-instrumentation can help you find and install instrumentation for these libraries. If none is available, make a list of all the major libraries your application uses and compare it with the list of available instrumentation. You can find instrumentation information in the Registry section of the OpenTelemetry website and in the “contrib” repository for each language in the OpenTelemetry GitHub organization.

Each instrumentation package includes installation instructions for how to install it. Failing to install a critical instrumentation package is the most common way to break traces.

Native Instrumentation
More and more OSS libraries are starting to include OpenTelemetry instrumentation within the library itself. This means that no additional instrumentation needs to be installed. As soon as you install the SDK, OpenTelemetry will work out of the box for this library! For more details, see Chapter 6.

Instrumenting Application Code
You may want to instrument your in-house libraries as well as the application code itself.

To instrument in-house libraries, see Chapter 6 and follow the same pattern. This is the best approach to instrumentation. Ideally, instrumentation can remain in these shared libraries, and you won’t have to add instrumentation directly to application code, outside of adding attributes that help describe the business logic they’re implementing. You don’t want to spend your time rewriting the same instrumentation in every application!

Decorating Spans
Developers may want to add application-specific details to help track down issues and index their spans. As a reminder, there is no need to add an additional span when you want to do this. The library instrumentation you have installed should already have created a span for you. Instead of creating a new span, get the current span and decorate it with additional attributes. More attributes on a smaller number of spans usually results in a better observability experience.

How Much Is Too Much?
With tracing and logging, people often ask how to determine the right amount of detail. Should every function be wrapped in a span? Should every line of code be logged?

These questions have no clear-cut answers. But we recommend the following pattern: unless it is a critical operation, don’t add it until you need it. When starting with OpenTelemetry, don’t worry about application-level instrumentation. Take a breadth-first approach, not a depth-first one.

If you’re tracking down production issues, end-to-end tracing matters more than fine-grained detail. It is better to stand every service up with just the instrumentation OpenTelemetry provides and then progressively add instrumentation in specific areas when you desire additional detail. You can also focus on smaller, self-contained areas to start and then broaden your instrumentation as needed. In either case, quite a bit of the value in observability more generally is in custom instrumentation for your business logic, and other values that automatic instrumentation can’t capture. With that in mind, don’t get wrapped up in thinking about the “correct” amount of detail and focus instead on what you and your team need. This approach lets you ask—and answer—interesting questions. (For more on this subject, see Chapter 9.)

Layering Spans and Metrics
Metrics are good for more than just measuring how much CPU is in use in your service or how long garbage collection pauses take. Using application metrics effectively can save money and enable you to analyze long-term performance trends.

It’s a good practice to create histogram metrics for your API endpoints, especially high-throughput ones. Histograms are a particular type of metric stream that consists of buckets, and counts that fall into those buckets. You can think of them as ways to capture distributions of values.

OpenTelemetry supports both standard, predefined histograms and exponential bucket histograms. The latter are extremely useful. They automatically adjust for the scale and range of the measurements you put into them. They also can be added together. This means you could run one hundred instances of an API server, all creating exponential histograms to track throughput, error rate, and latency, and then sum all the values, even if their scales and ranges differ. If you combine this with exemplars, then you can get not only highly accurate statistics about service performance, but also contextual links to traces that demonstrate performance by bucket.

Browser and Mobile Clients
The devices users interact with, such as phones, laptops, touchscreens, and cars, are critical components in our distributed systems. Browser and mobile clients often run in restrictive environments with low memory and poor network connectivity. Solving these performance problems without client telemetry is difficult. It can also be difficult to understand how changes to product features or the GUI will affect the user experience.

In observability, client telemetry is traditionally referred to as real user monitoring (RUM). As of this writing, RUM is under active development for browsers, iOS, and Android.

Public Gateways
When you deploy OpenTelemetry for client monitoring, remember that the OpenTelemetry Collector is not designed to be a public gateway. If your client SDKs are sending data to Collectors instead of directly to an analysis tool, consider standing up an additional proxy for use as a public gateway, configured with an appropriate security regime for your organization.

Secondary Observability Signals
You may have heard of signals like profiling, sessions, and events. These are specialized types of telemetry data used in techniques such as RUM and continuous profiling (a way to get code-level telemetry data from a running process). As of this writing, these signals are not yet stable in OpenTelemetry, but work is underway. Ultimately, OpenTelemetry is agnostic to how signals are actually used; it focuses on how to create, collect, and express them in a standardized way. This includes unifying them. RUM is an important part of understanding a distributed system, but you need to connect it to backend telemetry to really transform your observability practice.

The Complete Setup Checklist
Telemetry is incredibly important! But there are many moving pieces, and it’s easy to miss something when you are first starting out. Like a pilot inspecting their airplane before takeoff, you will find it helpful to have a checklist to follow when verifying a successful installation of OpenTelemetry. Here’s a simple one to get you started.

Is instrumentation available for every important library?

HTTP, frameworks, database clients, and messaging systems should all be instrumented. Double-check that the libraries you are using are actually included on the list of available instrumentation.

Does the SDK register show providers for tracing, metrics, and logs?

You can check that the SDK is registered correctly by executing a function that explicitly creates a span, metric, and log (or whichever signals you’re using).

Is the exporter correctly installed?

Are the protocol, endpoint, and TLS certificate options configured?

Are the correct propagators installed?

If you do not intend to use the standard W3C tracing headers, check that traces correctly record a parent ID when the intended tracing header is included as part of an incoming HTTP request.

Is the SDK sending data to the Collector?

In your Collector, add a logging exporter to every pipeline, with verbosity set to detailed. This will show you whether the SDK is successfully sending data to the Collector.

Is the Collector sending data to the analysis tool?

If you have proven that the SDK is sending data to the Collector, any remaining telemetry pipeline problem is a misconfiguration between the Collector and the analysis tool.

Are the correct resources emitted?

List all the resource attributes you expect to be present on every service and include them in your checklist. Verify that these resources are present on the traces and logs emitted from these services.

Are all traces complete?

In the trace analysis tool, verify that the trace appears and that it contains a span for every instrumented library in every service participating in the transaction.

If all of the spans from a particular service are missing in a trace, then something earlier in this checklist has failed for that service.

If a trace appears to be connected and complete from end to end but is missing an expected span somewhere in the middle, then instrumentation has not been properly set up for that particular library.

Are no traces broken?

A trace is broken when it successfully makes it to the backend but appears as multiple separate traces. This happens when a span is created without a parent span and thus creates a new trace ID.

If a trace is broken between services, check for matching CLIENT and SERVER spans in each partial trace. If one of these spans is missing, then a piece of HTTP instrumentation is missing.

If CLIENT and SERVER spans exist, check whether the client and server SDKs are both configured to use the same propagation format (such as W3C, B3, or XRAY). If they are configured correctly, inspect the HTTP request and confirm whether the tracing headers are actually present. If they are not present, the client is failing to correctly inject the propagation headers. If they are present, the server is failing to correctly extract the headers.

If everything in this checklist passes, congratulations! Your services are properly instrumented with OpenTelemetry and are ready for production.

Packaging It All Up
If you’re using OpenTelemetry, you probably have multiple services as part of your application. Large distributed systems can have hundreds of different services, all of which will need to be instrumented. This may involve multiple development teams that own different parts of the system.

Regardless of how large your system is, once you have successfully instrumented one application, it’s good to package everything up to make it easier to add OpenTelemetry to the rest of your applications. It’s also good to write some internal documentation, explaining all the settings and setup procedures that are specific to your organization. (See Chapter 9 for more on rolling out observability.)

Setting up an application with OpenTelemetry can be tricky, because you need to learn and interact with every part of OpenTelemetry in the process. Understanding what the major components are and how they relate to each other makes it easier to verify that everything has been installed correctly and to debug any issues.

One great way to package OpenTelemetry is to add instrumentation directly to libraries and frameworks. This reduces the number of packages to install and simplifies installation in your applications. In the next chapter, we’ll discuss how to do this.

Conclusion
The work required to reinstrument a large system often turns into a form of vendor lock-in—it’s just too expensive and time-consuming to change everything. But the advantage of OpenTelemetry is that once it’s done, it’s done! You will never have to go through that process again, even if you switch analysis tools or vendors. Switching to OpenTelemetry means switching to a standard that works with every observability system.

1 Alan J. Perlis, “Epigrams on Programming,” SIGPLAN Notices 17, no. 9 (September 1982): 7–13.


table of contents
search
Settings
Previous chapter
4. The OpenTelemetry Architecture
Next chapter
6. Instrumenting Libraries
Table of contents collapsed
