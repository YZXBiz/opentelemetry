Skip to Content
Chapter 3. OpenTelemetry Overview
You can’t communicate complexity, only an awareness of it.

Alan J. Perlis1

OpenTelemetry contains everything you need to create a modern telemetry system. To understand it, you need to know how it fits into the landscape of not only cloud native software but also the greater commercial and open source observability market.

OpenTelemetry solves two big problems. First, it gives developers a single solution for built-in, native instrumentation of their code. Second, it allows for instrumentation and telemetry data to be broadly compatible with the rest of the observability ecosystem.

These problems have enough in common that they’re effectively the same challenge, but it’s good to clarify exactly what we mean by breaking them apart. Built-in (or native) instrumentation in this context means that a library, service, managed system, or something similar is creating a variety of telemetry signals directly from the application code that are linked with other signals.

You need to be able to create and process data using not just a common API or SDK but a set of “nouns and verbs”—a common set of definitions around what things mean (also known as semantics). This isn’t just about having consistent attributes across signals, although that’s part of it. You need consistent attributes and labels across your telemetry in order to correlate it together. Truly native instrumentation is about having semantically accurate instrumentation.

To learn OpenTelemetry, you need to know more than just how to create a span or initialize the SDK—you need to understand the signals, the context, and the conventions, and how they all fit together. We’ll get into the finer details in Chapters 5 through 8, but let’s start by understanding the model OpenTelemetry uses to fit all these pieces together. Figure 3-1 shows this model at the highest level.


Figure 3-1. A high-level model of OpenTelemetry
In the rest of this chapter, we’ll dive into each component of this model. We’ll start with the types of signals that OpenTelemetry produces, the context that binds these signals together, and the attributes and conventions used to model different types of libraries and software components. Then we’ll have a look at the protocols and services used to create a pipeline to send all of these signals to an observability tool for storage and analysis. At the end, we’ll briefly touch on OpenTelemetry’s commitment to stability and future-proofing.

Primary Observability Signals
As alluded to in Chapter 1, instrumentation is the process of adding observability code to a service or system. Broadly, there are two ways to perform this. The first is through a “white-box” approach that involves directly adding telemetry code to a service or library, and the second is a “black-box” approach that utilizes external agents or libraries to generate telemetry without requiring direct code changes. In both cases, your objective is to generate one or more signals—raw data about what’s happening in a process. OpenTelemetry concerns itself with three primary signals: traces, metrics, and logs.2 These signals are ordered roughly by importance. Their importance comes from the following goals:

Capturing the relationships between services in your system using actual production data and service-to-service communication

Annotating service telemetry with consistent and descriptive metadata about what the service is doing and where it’s running

Definitively identifying the relationships between arbitrary groups of measurements—basically, “this thing happened at the same time as this other thing”

Efficiently creating accurate counts and measurements of events occurring in a system, such as the number of requests that occur, or how many requests took between 100 and 150 milliseconds to complete

These tasks can be fiendishly difficult at scale; the amount of money large enterprises spend on performing even simple tasks, such as enumerating the amount and criticality of various services, is staggering. Smaller organizations are beginning to suffer similar challenges, as the complexity of cloud native architectures results in a significant amount of ephemeral and dynamic work being performed. OpenTelemetry is designed to provide the building blocks needed to answer these questions, and perform these tasks, for cloud native architectures. Thus, OpenTelemetry focuses on providing semantically accurate instrumentation for cloud native software.

Let’s discuss each of the three primary signals in turn.

Traces
A trace is a way to model work in a distributed system. You can think of it as a set of log statements that follow a well-defined schema. The work done by each service in the system is linked together through hard context, as shown in Figure 3-2. Tracing is the fundamental signal of observability for a distributed system. Each trace is a collection of related logs, called spans, for a given transaction. Each span in turn contains a variety of fields.3 If you’re familiar with structured logging, you can think of a trace as a set of logs that are correlated through a shared identifier.


Figure 3-2. A basic payment application for a store. The trace underneath describes a payment request
The difference between structured logs and tracing, though, is that tracing is an incredibly powerful observability signal for request/response transactions, which are prevalent throughout cloud native distributed systems. Traces offer several semantic benefits that make them a valuable observability signal—for example:

A single trace represents a single transaction, or journey, through a distributed system. This makes traces the best way to model end-user experience, since one trace corresponds to one user’s path through a system.

A group of traces can be aggregated across multiple dimensions in order to discover performance characteristics that would be difficult to spot otherwise.

Traces can be transformed into other signals, such as metrics, allowing for downsampling of the raw data without losing key performance information. In other words, a single trace contains all the information needed to compute the “golden signals” (latency, traffic, errors, and saturation) for a single request.

Golden Signals
The golden signals are the four crucial measurements you should take of a system, as defined in the Google SRE Handbook. Latency is the time it takes to service a request, traffic is the number of requests, errors represent the rate of failing requests, and saturation is a measure of utilization of system resources.

Tracing is the core of transaction observability. It is the best way to understand the performance, health, and behavior of a distributed system in production. It’s not the only way to measure a system, though, and observability requires you to blend multiple signals together. With that in mind, let’s discuss one of the most widespread signals: metrics.

Metrics
Metrics are numeric measurements and recordings of system state, such as the number of users concurrently logged into a system, the amount of disk space used on a device, or the amount of RAM available on a virtual machine (VM). They’re useful for accurately measuring the “big picture” of a system because they’re cheap to create and store.

Metrics are often the first port of call for developers trying to understand overall system health. They’re ubiquitous, fast, and inexpensive for what they do. There are some challenges with traditional metrics, though. Traditionally, they lack hard context—it’s difficult, and in some cases impossible, to accurately correlate a given metric with specific end-user transactions. They can also be difficult to modify, especially when they’re defined in third-party libraries and frameworks. This raises challenges when two similar metrics are inconsistent in how, or when, they report things. We know from speaking with operators and observability teams that controlling the costs and complexity of metrics is one of their primary challenges.

In OpenTelemetry, metrics have been designed to support three main goals:

Developers should be able to define important, semantically meaningful events in their code and specify how those events translate into metric signals.

Operators should be able to control costs, data volume, and resolution by aggregating or reaggregating the time or attributes of those metrics.

Conversions should not change the intrinsic meaning of a measurement.

By way of example, imagine you want to measure the size of incoming requests through a service that processes images. OpenTelemetry allows you to record this size in bytes through a metric instrument and then apply aggregations to those events, such as determining the maximum size recorded over a time window, or adding them together to get the total number of bytes for a given attribute. These streams are then exported to other OpenTelemetry components, where they can be further modified—by adding or removing attributes, for example, or by modifying the time window—without altering the meaning of the measurements.

This may seem like a lot to absorb, but here are the important takeaways:

OpenTelemetry metrics include semantic meaning that observability pipelines or frontends can take advantage of to intelligently query and visualize metric streams.

OpenTelemetry metrics can be linked to other signals through both hard and soft context, allowing you to layer telemetry signals for cost control or other purposes.

OpenTelemetry metrics support StatsD and Prometheus out of the box, allowing you to map those existing metrics signals into the OpenTelemetry ecosystem.

Exemplars
OpenTelemetry metrics have a special type of hard context known as exemplars, which allow you to link an event to a specific span and trace. In Chapter 5, we’ll discuss how to create these metrics and use them in your applications.

Logs
Logging is the final primary signal, and perhaps it’s surprising to you that we’d cover it last. After all, logs are ubiquitous for their ease of use—they’re the lowest common denominator of methods to get the computer to tell you what it’s doing. OpenTelemetry’s log support has more to do with supporting the existing logging APIs that you’re comfortable and familiar with, rather than trying to reinvent the wheel.

That said, existing logging solutions are weakly coupled to other observability signals. Associating log data with traces or metrics is usually accomplished through correlations. These correlations are performed either by aligning time windows (such as “what happened between 09:30:25 and 09:31:07”) or by comparing shared attributes. There’s not a standard way to include uniform metadata, or to link log signals with traces and metrics, in order to discover causal relationships. Distributed systems, such as those common in cloud native architectures, often wind up with highly disjointed sets of logs that are collected from different components in the system and often centralized in different tools.

Fundamentally, the OpenTelemetry model seeks to unify this signal by enriching log statements with trace context and links to metrics and traces recorded concomitantly. In plainer terms, OpenTelemetry can take existing log statements in your application code, see if there’s an existing context, and, if so, ensure that the log statements are associated with that context.

Some readers may ask about the role of logs in observability, and it’s a fair question. Traditionally, logging occupies the same “mental space” as tracing in terms of utility, but logs are perceived as being more flexible and easier to use. In OpenTelemetry, there are four main reasons to use logs:

To get signals out of services that can’t be traced, such as legacy code, mainframes, and other systems of record

To correlate infrastructure resources such as managed databases or load balancers with application events

To understand behavior in a system that isn’t tied to a user request, such as cron jobs or other recurring and on-demand work

To process them into other signals, such as metrics or traces

Again, we’ll go into more depth about how to create and set up log pipelines in later chapters. Next, though, we’ll delve more deeply into how each signal in OpenTelemetry can be linked via hard and soft context, and we’ll introduce you to the specifics of observability context.

Observability Context
We introduced several ideas in the prior section—attributes, resources, and so forth. They’re all, on some level, the same thing—metadata. Understanding the differences and similarities between them, however, is a crucial part of learning OpenTelemetry. Logically, they’re all forms of context.

If a signal gives you some sort of measurement or data point, the context is what makes that data relevant. Think back to our earlier example of a transit planner. Knowing how many people across the entire city are waiting for a bus is useful, but it would be impossible to understand where you need to add more buses without the context of where those people are waiting.

There are three basic types of context in OpenTelemetry: time, attributes, and the context object itself. Time is fairly self-explanatory: when did something happen? We’ll discuss the rest next.

OK, but When DID Something Happen?
Time seems like a very logical way to order events, but it’s incredibly unreliable when thinking about telemetry in a distributed system. Clocks can drift and become inaccurate because of a variety of factors, including paused execution of a thread, resource exhaustion, device sleep/wake behavior, or loss of network connectivity. Even in a single JavaScript process, the system clock can lose up to ~100ms of precision over the course of a single hour. This is one of many reasons that specific contexts—such as the relationship between calls in a trace, or shared attributes—are so useful.

The Context Layer
As mentioned earlier, context is an essential part of a telemetry system. The OpenTelemetry Context Specification seems deceptively simple from this perspective. At a high level, the specification defines context as a “propagation mechanism which carries execution-scoped values across API boundaries and between logically associated execution units.” (An execution unit is a thread, coroutine, or other sequential code execution construct in a language.) In other words, contexts carry information across a gap: between two services running on the same computer through a pipe, between different servers through remote procedure calls, or between different threads in a single process (Figure 3-3).

The goal of the context layer is to provide a clean interface either to existing context managers (such as Golang’s context.Context, Java ThreadLocals, or Python’s context manager) or to some other suitable carrier. What’s important is that the context is required and that it holds one or more propagators.

Propagators are how you actually send values from one process to the next. When a request begins, OpenTelemetry creates a unique identifier for that request based on registered propagators. This identifier can then be added to the context, serialized, and sent to the next service, which will deserialize it and add it to the local context.4

Baggage
Propagators carry the hard context of a request (such as W3C Trace Context), but they can also carry what’s known as baggage, or soft-context values. Baggage is meant to transmit certain values that you may wish to put on other signals (for example, customer or session IDs) from where they were created to other parts of your system. Once baggage is added, it cannot be removed and will be transmitted to external systems as well—so be careful about what you put in there!


Figure 3-3. Context flows between services and within a service (inter-service versus intra-service propagation)
This forms the basis of hard context in OpenTelemetry: any service with OpenTelemetry tracing enabled will create and use tracing contexts to create telemetry data representing the work being done in that service. In addition, OpenTelemetry can associate this context with other telemetry signals such as metrics or logs.

This isn’t the only type of context OpenTelemetry is able to provide, however. The project maintains a variety of semantic conventions to create a consistent and clear set of metadata that can be applied to telemetry signals. These conventions allow for analysis across standard dimensions, reducing the need for data to be postprocessed and normalized. These semantics run the gamut from metadata (to represent resources such as server hostnames, IP addresses, or cloud regions) to specific naming conventions for HTTP routes, serverless execution environment information, and pub-sub messaging queue directions. You can find an example on the OpenTelemetry project site.

Merging standards
In April 2023, OpenTelemetry and Elastic announced the merger of the Elastic Common Schema with OpenTelemetry Semantic Conventions. This process will result in fewer competing standards for telemetry metadata once it’s complete and is a great example of the value of standards-making efforts in the cloud native space.

The goal of the semantic conventions process is to create a standardized and representative set of metadata that can accurately model and describe the underlying resources that power not only a given transaction in a distributed system but also the actual transaction itself. Think back to earlier in this chapter where we discussed semantic instrumentation. If the traces, metrics, and logs are the verbs that describe how your system functions, the semantic conventions provide the nouns that describe what it’s doing. We’ll go deeper into this topic in “Semantic Conventions”.

Attributes and Resources
Every piece of telemetry that’s emitted by OpenTelemetry has attributes. You may have heard these referred to as fields or tags in other monitoring systems. These attributes are a form of metadata that tell you what a piece of telemetry represents. Simply put, an attribute is a key-value pair that describes an interesting, or useful, dimension of a piece of telemetry. Attributes are things you’d want to filter on or group by if you were trying to understand what’s happening in your system.

Let’s go back to our transit system. If you wanted to measure how many people are using it, you’d have a single quantity—the count of riders in a given day. Attributes give that measurement useful dimensions, such as the form of transit someone is using, the station they departed from, or even unique identifiers such as their name. With those attributes, you can ask some really interesting questions that you couldn’t ask if all you knew were how many people were riding! You can see which modes of transit were most popular or whether particular stations were overloaded. With highly unique attributes, you could even track ridership across time to see if there were interesting patterns of use.

Similarly, when you are asking questions about a distributed system, you might want to consider a variety of dimensions, such as the region or zone of a workload, the specific pod or node on which a service is running, the customer or organization a request has been issued for, or the topic ID or shard of a message on a queue.

Attributes in OpenTelemetry have some straightforward requirements. A given attribute key can point to a single string, Boolean, floating point, or signed integer value. It can also point to an array of homogeneous values of the same types. This is an important thing to keep in mind, as attribute keys cannot be duplicated. If you want to assign multiple values to a single key, you need to use an array.

Attributes are not infinite, and you should be careful when using them on different types of telemetry. By default, any single piece of telemetry can have no more than 128 unique attributes in OpenTelemetry; there’s no limit on how long those values can be.

There are two reasons for these requirements. First, it’s not free to create or assign an attribute. The OpenTelemetry SDK needs to allocate memory for each attribute, and it can be very easy to accidentally run out of memory in the event of unexpected behavior or code errors. (Incidentally, these are extremely challenging crashes to diagnose, because you’re also losing your telemetry about what’s happening.) Second, when adding attributes to metric instruments, you can quickly trigger what’s known as a cardinality explosion when sending them to a time-series database.

Each unique combination of metric name and attribute value creates a new time series, as shown in Figure 3-4. Thus, if you create attributes that each have thousands or millions of values, then the number of created time series can increase exponentially, causing resource starvation or crashes on your metric backend. Regardless of the signal type, attributes are unique to each point or record. Thousands of attributes per span, log, or point would quickly balloon not only memory but also bandwidth, storage, and CPU utilization when telemetry is being created, processed, and exported.


Figure 3-4. Cardinality in action. Adding attributes to a metric creates a unique time series for each combination of attribute values. In this example, the cardinality of status_code is 3, so it has only three time series. If you added an attribute such as customer_id with thousands or millions of variations, this would turn into many thousands or millions of time series!
There are two ways to manage attribute cardinality. The first is to use observability pipelines, views, and other tools to reduce the cardinality of metrics, traces, and logs as they’re emitted and processed. OpenTelemetry is specifically designed for this use case, especially in the case of metrics. We’ll have a more detailed explanation of this method in 5 and 6.

Additionally, you can omit attributes from metrics with high cardinality and use those keys on spans or logs instead. Spans and logs generally do not suffer from the cardinality explosions we’ve mentioned, and in general, more structured metadata about what one of these signals represents is very good to have! You can ask far more interesting questions about your data, and you can build real semantic understanding of what’s going on in a system by crafting accurate and descriptive custom attributes for your services.

OpenTelemetry also defines a special type of attribute called a resource. The difference between an attribute and a resource is straightforward: attributes can change from one request to the next, but resources remain the same for the entire life of a process. For example, a server’s hostname would be a resource attribute, while a customer ID would not be. We’ll talk more about creating resource attributes in Chapters 5 and 6.

Semantic Conventions
Several years ago, during a meeting between the maintainers of Prometheus and OpenTelemetry, an unnamed Prometheus maintainer quipped, “You know, I’m not sure about the rest of this, but these semantic conventions are the most valuable thing I’ve seen in a while.” It may sound a bit silly, but it’s also true.

System operators are forced to contend with a significant amount of toil simply to ensure that attribute keys, values, and what they represent are the same across multiple clouds, application runtimes, hardware architectures, and versions of frameworks and libraries. The OpenTelemetry Semantic Conventions are designed to remove this consistent point of friction and offer developers a single well-known and well-defined set of attribute keys and values. As of this writing, these conventions are being driven toward stability. Indeed, by the time you read this, we hope that many of them will be stable.

There are two main sources of semantic conventions. The first source is the set of conventions that the project itself describes and ships. These conventions are versioned independently of other OpenTelemetry components, and each version includes a schema that lists validation and transformation rules (see “Compatibility and Future-Proofing” later in this chapter for more information). They are designed to cover most common resources and concepts in cloud native software. For example, the semantic conventions for exceptions define how exceptions and stack traces should be recorded in a span or log. This is useful for developers writing instrumentation code or observability frontends, as they can create user interfaces that support this semantic data.

The other source of conventions is platform teams and other internal sources. Since OpenTelemetry is extensible and composable, you can write a semantic conventions library yourself that includes attributes and values that are specific to your technology stack or services. This is hugely beneficial for organizations with centralized observability teams, since it lets them provide tools to ensure that telemetry data has consistent attributes across teams. This also means that they can leverage the telemetry schema concepts we’ll discuss in a few pages to provide migrations as their own internal schemas change. This reduces the burden placed on maintainers of internal platforms—instead of pages of rewrite rules and regular expressions, they can use built-in OpenTelemetry functions to apply transforms.

Third-party library and framework developers also benefit from semantic conventions. Semantic conventions allow them to “ship their observability” alongside their software, giving users well-defined attributes to monitor and alert on. In the future, we hope to see more work along these lines similar to OpenSLO and OpenFeature, giving users an open standard for defining alerts, dashboards, and queries across OpenTelemetry data.

OpenTelemetry Protocol
One of the most exciting features of OpenTelemetry is that it provides a standard data format and protocol for observability data. OpenTelemetry Protocol (OTLP) offers a single well-supported wire format (how data is stored in memory or sent across the network) for telemetry to be transmitted between agents, services, and backends. It can be sent or received in both binary and text-based encoding and aims to use low amounts of CPU and memory. In practice, OTLP offers significant benefits to an array of telemetry producers and consumers.5

Producers of telemetry are able to target OTLP through a thin translation layer between their existing telemetry export formats, making it compatible with a huge array of existing systems. Hundreds of integrations of this sort now exist, such as OTLP through AWS Kinesis Streams, or the contrib receivers for the OpenTelemetry Collector. In addition, this translation may remap existing attributes into their specified semantic conventions, ensuring data consistency between old and new.

Consumers of telemetry can use OTLP with dozens of open source and commercial tools, freeing them from proprietary lock-in. OTLP can be exported to flat files or columnar stores as well, or even to event queues such as Kafka, allowing for nearly endless customization of telemetry data and observability pipelines.

Finally, OTLP is a living part of the OpenTelemetry project. New signals will require updates, but it remains backward compatible with legacy receivers and exporters, ensuring that investments will not go to waste over time. While upgrades to the data format might be required to take advantage of new features or functionality, you can rest easy knowing that telemetry in OTLP will remain compatible with your analysis tools.

Compatibility and Future-Proofing
The foundation of OpenTelemetry is built on two points: standards-based context and conventions, alongside a universal data format. There will be new signals, new features, and a growing ecosystem of tools and clients—so how do you stay up-to-date, and how can you plan for changes?

The project has devised a rigorous guide to versioning and stability, which guides its thinking and roadmap. In short, there will never be an OpenTelemetry v2.0. All updates will continue along the v1.0 line, and while there may be deprecations and changes, they’ll take place according to a published timeline. Figure 3-5 shows the long-term support guidelines.


Figure 3-5. OpenTelemetry’s long-term support guarantees
OpenTelemetry has a concept of telemetry schemas to help consumers and producers of telemetry address changes in semantic conventions over time. By building schema-aware analysis tools and storage backends or relying on the OpenTelemetry Collector to perform schema transformations, you can benefit from changes in semantic conventions (and their associated support in analysis tools) without having to reinstrument or redefine output from existing services (see Figure 3-6).


Figure 3-6. An example of a schema-aware telemetry system
Conclusion
Taken in concert, these efforts to provide stability and a seamless upgrade path make OpenTelemetry uniquely suitable to address the challenges faced by large organizations seeking to standardize their telemetry systems and by developers and operators who feel constrained by the limits of existing tooling. Whether you’re a single engineer working on a hobby project or a Fortune 10 company building out a multiyear strategy for monitoring and observability, OpenTelemetry can provide a clear and unambiguous answer to the question “What logging/metrics/tracing library should we use?”

1 Alan J. Perlis, “Epigrams on Programming,” SIGPLAN Notices 17, no. 9 (September 1982): 7–13.

2 OpenTelemetry is currently working to add support for sessions and profiles; a session is a signal used to represent a continuous client session in a web or mobile client, while a profile is a set of stack traces and metrics used for line-level performance data.

3 See the OpenTelemetry Specifications for a full dissection of these fields and their purposes.

4 OpenTelemetry uses W3C Trace Context as a default propagator across RPCs and other services, but it supports other options, such as B3 Trace Context and AWS X-Ray.

5 For a full discussion of OTLP, as well as a protocol buffer reference, please see the OpenTelemetry protocol page on GitHub.


table of contents
search
Settings
Previous chapter
2. Why Use OpenTelemetry?
Next chapter
4. The OpenTelemetry Architecture
Table of contents collapsed
