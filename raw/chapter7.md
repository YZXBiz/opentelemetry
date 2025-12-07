Skip to Content
Chapter 7. Observing Infrastructure
We build our computer systems the way we build our cities: over time, without a plan, on top of ruins.

Ellen Ullman1

Despite the many advances in cloud computing, serverless, and other technologies that promise to shield programmers from having to care about where and how their programs run, we are still stymied by a basic fact: software has to run on hardware. What has changed, though, is how we interact with hardware. Rather than relying on bare syscalls, we rely heavily on increasingly sophisticated APIs and other abstractions of the underlying infrastructure that powers our software.

Infrastructure isn’t limited to physical hardware either. Planet-scale cloud computing platforms offer managed services for everything from key management to caches to text-message gateways. New AI- and ML-powered services seem to crop up weekly, and new orchestration and deployment methods promise more speed and flexibility in where and how code runs.

Infrastructure is a key part of any software system, and understanding your infrastructure resources is a key part of observability. In this chapter, we’ll cover infrastructure observability with OpenTelemetry and discuss how to understand and model this part of your systems.

What Is Infrastructure Observability?
Just about every developer or operator has done some infrastructure monitoring, such as watching a system’s CPU utilization, memory usage, or free disk space, or even a remote host’s uptime. Monitoring is an extremely common task when working with computers. What separates infrastructure observability from monitoring tasks? Context. While it’s useful to know how much memory a given Kubernetes node uses, that statistic tells you little about what parts of the system influence it.

Infrastructure observability is concerned with two things: infrastructure providers and infrastructure platforms. Providers are the actual “source” of infrastructure, such as datacenters or cloud providers. Amazon Web Services (AWS), Google Cloud Platform (GCP), and Microsoft Azure are infrastructure providers.

Platforms are higher-level abstractions over those providers that provide some sort of managed service and vary in size, complexity, and purpose. Kubernetes, which aids in container orchestration, is a type of platform. Functions as a service (FaaS) such as AWS Lambda, Google App Engine, and Azure Cloud Functions are serverless platforms. Platforms aren’t necessarily limited to code or container runtimes either; continuous integration and continuous delivery (CI/CD) platforms, such as Jenkins, are a type of infrastructure platform.

Incorporating infrastructure observability into your overall observability profile can be challenging. This is because infrastructure resources are most often shared—many requests can use the same unit of infrastructure at the same time, and figuring out the correlation between infrastructure and service state is difficult. Even if you do have the ability to perform this correlation, is the data that you get useful? Your infrastructure needs to be designed in such a way that you can act on these insights.

We can create a simple taxonomy of “what matters” when it comes to observability. In short:

Can you establish context (either hard or soft) between specific infrastructure and application signals?

Does understanding these systems through observability help you achieve specific business/technical goals?

If the answer to both of these questions is no, then you probably don’t need to incorporate that infrastructure signal into your observability framework. That doesn’t mean you don’t want—or need—to monitor that infrastructure! It just means you’ll need to use different tools, practices, and strategies for that monitoring than you would use for observability.

Let’s step through providers and platforms with an eye to these questions and discuss what telemetry signals we need and how OpenTelemetry can help us acquire them. First, we’ll discuss using OpenTelemetry to collect signals from cloud infrastructure, such as virtual machines or API gateways. After that, we’ll look deeper into observability strategies for Kubernetes, serverless, and event-driven architectures.

Observing Cloud Providers
Cloud providers offer a fire hose of telemetry data. Your responsibility is to retrieve and store only what’s most relevant. So how do you know what infrastructure data is relevant?

The most important question you need to answer is “What telemetry data is valuable to my observability?” Consider a single EC2 instance on AWS. Hundreds of metrics could be available from a single instance, with dozens of dimensions: health checks, CPU utilization, bytes written to disk, network traffic in and out, CPU credits consumed, and so on. A Java service running on that instance would expose many more metrics: statistics around garbage collection, thread count, memory consumption, and more. This instance and service would also create system logs, kernel logs, access logs, JVM runtime logs, and more.

We can’t really provide a completely authoritative guide to managing telemetry from each service on each cloud. Instead, let’s look at what kinds of services are common in cloud native architectures and then examine some solutions for managing those signals through OpenTelemetry.

We can broadly categorize the services available through cloud providers into two groups. The first is bare infrastructure, which includes on-demand and scalable services that provide compute, storage, networking, and so forth: on-demand virtual machines, blob storage, API gateways, or managed databases. The second is managed services—these can be on-demand Kubernetes clusters, machine learning, stream processors, or serverless platforms.

In a traditional datacenter, you’d be responsible for aggregating metrics and logs. Cloud providers usually perform this step for you via services such as AWS CloudWatch, but you’re also free to collect them. You can do so through preexisting or custom receivers in OpenTelemetry.

You’ve learned that OpenTelemetry is built on the hard context provided by tracing. You’ve also learned that profiling transactions that offer meaningful opportunities for performance improvement is an important part of observability. With that in mind, let’s take a deeper dive into integrating cloud-infrastructure metrics and logs into your OpenTelemetry strategy.

Collecting Cloud Metrics and Logs
If you’re building in the cloud, then you’re almost certainly already collecting metrics and logs. Each cloud provider offers various services and agents that emit system monitoring data and log contents to its own (or third-party) monitoring services. The question you need to answer when you come calling with OpenTelemetry is, what signals are valuable to observability? Many, but not all, of the signals emitted from your existing infrastructure are useful for integration into your observability strategy. You can think of cloud telemetry as an “iceberg,” as illustrated in Figure 7-1. While OpenTelemetry is capable of collecting all of these signals, you should think about how they fit into your overall monitoring posture.


Figure 7-1. The cloud telemetry iceberg
Take instance status. “Is the computer running or not?” may seem to be an absolutely crucial piece of data to track, but in a distributed system, a single virtual machine being up or down doesn’t tell you much. And you wouldn’t rely on instance availability metrics alone to solve a problem, as it would be a single data point. While it can be a useful event to keep track of, looking at just this data wouldn’t tell you a lot about the overall state of the system. A well-architected distributed system should be fairly resilient to a single node being offline, for example.

However, when you look at this event as part of an observability system, it becomes more useful. If you can correlate an instance being offline to an improperly routed request through an API gateway or load balancer, you can use that to diagnose poor performance for user requests. If those metrics or traces that use those signals feed into SLOs, that data becomes a valuable part of your overall business and reliability engineering posture. Even if a single signal might not appear valuable in isolation, its value needs to be considered as part of an overall observability strategy.

To this end, you do need to consider what signals are important to collect and how to use them. Doing so requires you to adopt a few foundational principles:

Use semantic conventions to build soft context between metric signals and application telemetry. Ensure that metadata emitted from service code and infrastructure uses the same keys and values.

You don’t have to reinvent the wheel: leverage existing integrations and formats where possible. The OpenTelemetry Collector has a large plug-in ecosystem that allows you to convert existing telemetry from many sources into OpenTelemetry Protocol (OTLP).

Be purposeful with your data! You should really think about how you’re collecting your metrics and logs, what you actually need, and how long you need to keep it. We’ve talked to developers who spent $10 or less on compute resources for a cloud job that generated over $150 in logging costs!

Your main tool for capturing or transforming cloud metric and log data will be the OpenTelemetry Collector. You can deploy it in a variety of ways—you could install it as a system service on Linux or Windows hosts to directly scrape metrics, or you could deploy multiple Collectors to scrape remote metrics endpoints. A complete discussion of installation and configuration options is outside the scope of this book, but in this section we’ll go through some configuration and usage best practices.

While you can easily pull a Docker container or prebuilt binary image of the Collector, production deployments should rely on the Collector Builder. This utility allows you to generate a custom build with the specific receivers, exporters, and processors you need built in. You may also run into problems that are best solved by adding a custom module to the Collector—using the builder makes this easier, so it’s a good habit to get into.

When it comes to attributes, err on the side of “too many” early in your metric pipeline. It’s easier to throw away data you don’t need before it gets sent for analysis than to add in data that doesn’t exist. Adding a new dimension can cause a cardinality explosion, or a dramatic increase in the number of time series a metric database needs to store, but you can control this by allow-listing metrics later in the pipeline.

Push Versus Pull
OpenTelemetry is generally agnostic to push versus pull metrics (a system in which metrics are transmitted from hosts to central servers versus one in which a central server fetches metrics from well-known paths), but it’s important to note that OTLP has no concept of pull-based metrics. If you choose to use OTLP, then your metrics will be pushed.

As OpenTelemetry adoption increases, more vendors are creating native offerings to export metric data in OTLP format. We go into more detail about this shortly, so read on!

You always have the option to use the Collector to directly produce and transmit metrics and log data from virtual machines, containers, and so forth. There are many out-of-the-box integrations for this, such as the hostmetrics receiver.

To avoid laborious remapping (see the next subsection for more on this), try to find a handful of attributes that you’d like to share across preexisting metrics and logs and add them to your trace and application metric signals, rather than the other way around. If you’re starting from scratch, consider building around OpenTelemetry from the start by using the Collector and the SDK to capture system and process telemetry.

One of the more popular deployment architecture implementations is illustrated in Figure 7-2. Here, Collectors act as a “gateway,” unifying telemetry coming from multiple aggregators or technologies. Note that not all components in the Collector are stateless; log processing and transformation are, but Prometheus scrapers are not, for example. Figure 7-3 demonstrates a more advanced version of the architecture with an application service and database, wherein each component has independent Collectors that can scale horizontally per signal type.


Figure 7-2. A “gateway” deployment of the Collector monitoring a Kubernetes node, where Prometheus and FluentD scrape metrics and logs and then send them to external Collectors that process any signal

Figure 7-3. A “gateway” deployment of the Collector, much like Figure 7-2, but instead of all telemetry being sent to the same pool of collectors, different signal types are emitted to specialized pools of collectors
Metamonitoring
Metamonitoring—that is, monitoring your Collector’s performance—is important as well. The Collector exposes a handful of metrics, such as otelcol_pro⁠cessor​_refused_spans and otelcol_processor_refused_metric_points (supplied by the Memory Ballast extension2). These metrics will tell you if the limiter is causing the Collector to refuse new data. If so, you should scale up. Similarly, calculating the difference between the queue_size and queue_capacity metrics will let you know when the receiving service is busy.

Here are some rough rules to keep in mind when planning for Collector capacity:

Experiment per host or per workload to determine the correct size of the ballast (a chunk of memory preallocated to the heap) for each type of Collector. Stress tests can be a good way to figure out an upper bound.

For scraped metrics, avoid scrape collisions (when the next scrape is scheduled to start before the current one has completed).

You don’t have to do all of your transformations immediately; heavier processing can be moved to later stages of your pipeline. This can reduce how much memory and compute the Collector uses, which is especially valuable for Collectors running alongside a process on a VM or host.

It’s better to overprovision a little than to lose telemetry!

Wait, What Ballast?
By the time you read this, the ballast extension may have been deprecated (see https://oreil.ly/aAhsP for details) in favor of tweaks to the GOMEMLIMIT and GOGC environment variables. Make sure you reference the OpenTelemetry documentation for the latest guidance and features of all components.

Collectors in Containers
Many OpenTelemetry users deploy Collectors in containers, as part of Kubernetes or some other container orchestrator. Inside a container, a good rule is to use factors of 2 for memory limits and ballast. For example, set a ballast of 40% of container memory, and then a limit of 80%. This improves performance by reducing churn, as memory is cleaned up through preallocating memory to the heap, and it allows the Collector to signal producers to back off their telemetry production without crashing or restarting due to running out of memory.

Observing Platforms
Cloud native applications are often built not for virtual machines or physical hardware but for managed platforms that provide powerful, flexible abstractions over compute, memory, and data. OpenTelemetry offers some unique strategies to aid in collecting telemetry data from these platforms, and it’s worth your time to familiarize yourself with them.

Kubernetes Platforms
Broadly, OpenTelemetry integrates into the Kubernetes ecosystem in two ways: through tooling to monitor and profile applications running on Kubernetes clusters, and through telemetry data about what Kubernetes components themselves are doing. Often, cloud native applications designed for Kubernetes will interact with the Kubernetes API, which makes both types of data extremely useful in investigating performance problems, deployment issues, scaling difficulties, or other production incidents.

In both cases, the OpenTelemetry Operator for Kubernetes allows you to manage Collector instances and automatic instrumentation of workloads running in pods.

Kubernetes telemetry
Kubernetes offers a wide variety of events, metrics, and logs to aid in managing clusters. Recent releases have also begun to add tracing for components such as the Kubelet and API Server. The OpenTelemetry Collector can ingest these signals, process them, and send them to analysis tools.

Depending on the size, scale, and complexity of your cluster, you could create separate Collector deployments to handle logging, metrics, and traces from system and application components independently. The Operator includes a service discovery mechanism called the Target Allocator (TA) that allows collectors to discover and scrape Prometheus endpoints and evenly distributes those scrape jobs across multiple collectors.

You do have another option. Three receivers are available to listen for cluster metrics and log: the k8sclusterreceiver, the k8seventsreceiver, and the k8sobjectsreceiver. The kubeletstatsreceiver can also pull pod-level metrics. While these receivers aren’t mutually exclusive with the TA-based approach of the Operator, you should pick one or the other. In the future, we expect the community to reach consensus on a single receiver approach, but as of this writing there are unknown gaps.

What’s the Deal with Kubernetes Receivers?
The OpenTelemetry community generally agrees that the best method to monitor a cluster is via receivers. However, many Kubernetes-based applications use Prometheus by convention, and the kube-state-metrics and node exporter plug-ins for Prometheus are widely adopted in existing installs. If you need something that can work with existing applications and clusters, then the Operator Target Allocator is a good choice, but if you’re doing a pure greenfield deployment of Kubernetes and OpenTelemetry, the receivers might work better. You may find gaps between what is collected by the Collector receivers and what is collected by Prometheus. If you’d like to get hands-on, we’ve provided an example based purely on OpenTelemetry logs and the metrics Collector in the book’s GitHub repository.

Kubernetes applications
OpenTelemetry doesn’t care where your applications run, but Kubernetes offers a wealth of metadata that is extremely valuable if you’re building OpenTelemetry-based instrumentation. If that’s you, most of the advice in Chapter 5 will apply, but there are some extra benefits that existing applications running in a Kubernetes cluster can take advantage of when paired with the Operator.

As mentioned, the Target Allocator allows for discovery of things to monitor in the cluster itself. The Operator also provides a custom resource for instrumentation that lets you inject an OpenTelemetry automatic instrumentation package into a pod. Such packages can then add instrumentation for tracing, metrics, or logs (depending on their functionality) to existing application code. You can generally use only one form of automatic instrumentation at a time, though—and proprietary instrumentation agents will conflict with OpenTelemetry ones.

A few production deployment tips for your Collector architecture:

Use sidecar Collectors in each pod as the first stop for your telemetry. Flushing telemetry out of the process and pod and into a sidecar can ease development and deployment, because it reduces memory pressure on your business services. It also allows for cleaner shutdowns of a pod during migrations or evictions, since the process isn’t potentially waiting on busy telemetry endpoints.

Split out Collectors by signal type, so they can scale independently. You could also create pools per application, or even per service, based on your usage patterns. Log, trace, and metric processing all have different resource-consumption profiles and constraints.

We suggest cleanly separating concerns between telemetry creation and telemetry configuration. For example, perform redaction and sampling on Collectors rather than in process. Placing hardcoded configuration in your process makes it harder to adjust things in production without redeploying services, whereas tweaking Collector configurations is often much easier.

Serverless Platforms
Serverless platforms such as AWS Lambda and Azure Cloud Functions have gained significant popularity, but they introduce observability challenges. Developers love their ease of use and opinionated structures, but their on-demand, ephemeral nature means you’ll need specialized tooling to get accurate telemetry.

In addition to your standard application telemetry, serverless observability adds a few more things to pay attention to:

Invocation time
How long does the function run for?
Resource usage
How much memory and compute does the function use?
Cold start time
How long does the function take to start up when it hasn’t been used recently?
These metrics should be available from your serverless provider, but how do you get the application telemetry itself? Tools like the OpenTelemetry Lambda Layer offer a convenient way to capture traces and metrics from AWS Lambda invocations, although you should be aware that they incur a performance overhead.

If you can’t use the Lambda Layer, ensure that your function waits on the export of telemetry data, and be sure to stop recording spans or measurements before handing control back to the function invocation library. Try to precompute strings or complex attribute values that won’t change from invocation to invocation, so that they can be cached. And to avoid having telemetry queued up and waiting for export, place a Collector “close” to them that’s dedicated to receiving telemetry from your functions.

Ultimately, your strategy for observing your serverless infrastructure depends on what role functions play in your application architecture. You may be able to skip directly tracing Lambda invocations (or simply pass headers through them) and link a Lambda to its calling service through attributes or span events. Then you can use Lambda service logs to pinpoint specific executions and get more details about failures or performance anomalies. If you have a complex, asynchronous workflow built on top of Lambda or other serverless platforms, you’ll probably be interested in more detailed information about the structures of requests themselves; we’ll talk more about that in the next section.

Queues, Service Buses, and Other Async Workflows
Many modern applications are written to take advantage of event- and queue-based platforms such as Apache Kafka. In general, the architecture of these applications revolves around services that publish and subscribe to topics on a queue. This raises several interesting challenges for observability. Tracing these transactions can be less useful than in “traditional” request/response architectures, since it’s often less clear when a given transaction ends. You’ll thus need to make quite a few decisions about your observability goals, what you want to optimize, and what you’re capable of optimizing.

Consider a bank loan. From the business perspective, this transaction starts when a customer fills out a loan application and ends when their payment is disbursed. This flow can be modeled logically, but the technical mechanics of this workflow interfere with the model. In Figure 7-4, we’ve illustrated several services, along with a queue, that all operate on the transaction. While the business flow is fairly straightforward, the technical flow needs to encompass permutations and gaps that are anything but.

It can be helpful to draw similar diagrams of your system architecture to determine whether you’re in this situation. Do you have many services acting on a single record? Do those services require human intervention to proceed? Does your workflow start and end at the same place? If your workflow diagram looks less like a tree and more like a “tree of trees,” then you probably have an asynchronous workflow.

Another way to make this determination is to ask yourself what kind of indicators you’re interested in tracking. Do you want to know how many steps were completed in a workflow or the median time it took for a certain step to run? Are you interested in how long it took for a service to process a record and for that record to be handled? If so, you’ll need to be creative.


Figure 7-4. The business flow of a bank transaction (top) versus its technical flow (bottom)
Instead of thinking of any highly async workflow as a single trace, think of it as many subtraces, linked to an origin either by a custom correlation ID (a unique attribute that you ensure is on each parent span in a set of traces, usually propagated through baggage) or a shared trace ID propagated through span links. A custom correlation ID is what it sounds like: a unique attribute that you ensure is on each parent span in a set of traces, usually propagated through baggage. Span links allow you to create a causal relationship between spans that don’t have an explicit parent-child relationship. The advantage of using links in this way is that you can calculate interesting things, such as the amount of time that work was waiting on a queue to be serviced.

In our bank loan example, you could consider the initial trace (where the transaction was created and placed on the queue) as the “primary” trace and have the terminal span of each trace link to the next root span. This requires you to have services treat the incoming span context from the message as a link, not a continuation, and start a new trace while linking to the old one. Since this relationship is initiated from the new trace, not the old one, you will need an analysis tool capable of discovering these relationships in reverse—that is, finding all traces that link together and then re-creating the journey from the end to the beginning. This type of correlation is challenging to create generalized tools for, which is why there’s a lack of them; however, support for these sorts of visualizations and discovery of span links is improving. (See Appendix B for links to resources on observability frontends.)

Not all subtraces in an asynchronous transaction are equally useful. Careful use of Collector filters and samplers can be helpful here, especially if you know what kinds of questions you’re interested in asking. Since the Collector allows you to convert spans to metrics, you can filter out specific subtraces and turn them into counts or histograms. If you’ve linked the traces together, then you can also pull in the parent trace ID as an attribute to be placed on the metrics. Imagine you have some sort of fan-out/fan-in work, such as a search or batch processing job: you could turn all child spans into a histogram, bucketed by how long it took for that particular job to complete, and then drop the child spans entirely. This would allow you to preserve the root span (and any subsequent child spans) while maintaining accurate counts and latency about its related work.

Conclusion
Infrastructure observability benefits you most when you have a clear and concise idea about your goals before you begin to implement it. Application and service observability are, strictly speaking, fairly easy in comparison. In general, instrumentation strategies for application observability don’t necessarily apply to virtual machines, managed databases, or event-driven architectures using serverless technology. If there’s one thing you should take away from this chapter, it’s that your infrastructure observability strategy needs to be driven by your overall observability goals and aligned to organizational incentives for using the observability data your system generates. “Starting at the end” in this case will allow you to focus on what’s important and what your team can actually use.

1 Ellen Ullman, quoted in the introduction to Kill It with Fire: Manage Aging Computer Systems (and Future Proof Modern Ones) by Marianne Bellotti (Burlingame, CA: No Starch Press, 2021).

2 See Ross Engers’s blog post “Go Memory Ballast” for more information about the Golang memory ballast and how Go’s concurrent garbage collection affects performance.


table of contents
search
Settings
Previous chapter
6. Instrumenting Libraries
Next chapter
8. Designing Telemetry Pipelines
Table of contents collapsed
