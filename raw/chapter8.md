Skip to Content
Chapter 8. Designing Telemetry Pipelines
I have always found that plans are useless, but planning is indispensable.

President Dwight D. Eisenhower1

In the previous chapters, we have focused on managing the components that emit telemetry: applications, libraries, services, and infrastructure. Let’s pivot now to managing the telemetry itself, once you have it. Collecting and processing telemetry from every single application, service, and infrastructure component is a sustained, high-throughput operation. Like any other significant component in a distributed system, it takes careful planning to design a telemetry pipeline that always makes sufficient resources available while also minimizing costs.

When telemetry is dropped, you lose observability. Because the volume of telemetry emitted by a system is directly proportional to the load on the system, operators need a clear playbook for scaling the telemetry pipeline in response to sudden traffic spikes and changes in application behavior.

If you plan on operating a telemetry pipeline, this chapter is for you. We discuss the most common telemetry pipelines you will want to adopt as your system grows. We also discuss the various kinds of processing you may want your telemetry pipeline to perform. At the end of the chapter, we focus specifically on managing Collectors within Kubernetes.

Common Topologies
Occasionally, a system is simple enough or new enough that no telemetry management needs to occur. But as systems grow in complexity and size, this rarely remains the case. As the system scales in size and traffic, you can add additional pieces to the telemetry pipeline to manage the load. Using the Collector as our primary component, we’ll start with the simplest setup and progressively add additional Collectors to perform different roles.

No Collector
Like any program, the Collector consumes resources and requires management. But it’s an optional component; if it’s not providing any value, you don’t have to run it. You can always add Collectors later if the need arises.

If the telemetry being emitted requires little to no processing, it may make sense to connect the SDKs directly to the backend, without a Collector. Figure 8-1 illustrates this simple setup.


Figure 8-1. Applications send telemetry directly to the analysis tool being used
The only things missing from this setup are host metrics, such as RAM, CPU, network, and system load. In general, it is inadvisable to collect host metrics via an application. Doing so consumes application resources, and many application runtimes have difficulty reporting these metrics correctly. So, to make this simple setup work, have your host metrics reported through other channels. For example, your cloud provider may automatically collect them.

This lack of host metrics leads to the second setup: running a local Collector. This is actually a better starting point for most systems.

Local Collector
Running a local Collector on the same machine as your application has a number of benefits. Host metrics can be difficult to collect effectively from within application runtimes, so observing the host machine is the most common reason to run a local Collector. Figure 8-2 illustrates this setup.


Figure 8-2. Applications send telemetry to a local Collector, which also collects host metrics
Besides collecting metrics, additional advantages to running a local Collector include the following:

Gathering environment resources
Environment resources are attributes critical for describing where telemetry originates from. You can often obtain them from your cloud provider, Kubernetes, and other sources of infrastructure. While these resources are very valuable, obtaining them often requires API or system calls. This process takes time, and in some cases API calls may require retries or fail entirely. This can lead to a delay in application startup. If you delegate this resource gathering to a local Collector, you’ll free up an application to start immediately.

Avoiding data loss from crashes
Telemetry is usually exported in batches. This is efficient, but it leads to a problem—if an application crashes, any telemetry not yet exported will be lost. When exporting data to a remote receiver, you can use larger batch sizes to make transmission more efficient. But if the application crashes, you lose an even larger batch of telemetry. Considering how important the logs are when you’re investigating a crash, this can be a real problem!

The solution is to set the export batch sizes and time windows on your application to be very small, so that data is evacuated quickly from the application to a local Collector. Because the Collector is on the same host, this is a fast and reliable place to send the data. Then you can configure the local Collector to batch data more appropriately for sending to a remote destination. It’s a win-win situation.

As time goes on and your telemetry pipeline becomes more advanced, it tends to do more processing, filtering, and sampling. In general, the Collector is more robust and efficient at performing these operations than the individual language SDKs. But there are other reasons to separate these workloads out of the SDK and into a Collector. Most telemetry management—managing where your telemetry data is going, what format it needs to be in, and what processing needs to happen—is not specific to individual applications. Instead, it needs to be normalized across all services in the entire deployment.

Mixing telemetry configuration with application configuration can be messy. For one, it means you have to restart your applications every time there’s a telemetry configuration change. It also makes coordinating telemetry changes across the fleet more difficult, since application configuration is delegated to individual teams.

In large organizations, an observability or infrastructure team usually manages telemetry configuration options. But even when organizations take a DevOps approach and have no centralized team, it’s better to treat telemetry as a separate service—which is much easier to do when it is centered around the Collector.

Teams can work together to build up a shared knowledge base, including deployment strategies and tooling for Collector management. Ideally, you can design the deployment of your local Collector to avoid having to redeploy all applications running on the same machine. But even when Collector deployment is tied to application deployment, using a centralized repository makes it easy for teams to deploy the most up-to-date version of the Collector, with the correct configuration settings.

Once you’ve set up a local Collector, SDK configuration becomes much simpler and more stable. You can use the default configuration of OpenTelemetry Protocol (OTLP) over HTTP sent to the standard local Collector address, without any additional exporters or plug-ins. The only custom configuration should be lowering the batch size and export timeout, as mentioned previously.

Finally, you can package your organization’s default SDK setup as a library and add it to your shared knowledge base. This turns your OpenTelemetry setup into a one-line operation that you can simply copy and paste into every application. This shared package also ensures that every application stays up-to-date with your latest version of OpenTelemetry.

Collector Pools
Running with local Collectors is a sufficient starting point for many organizations. However, for systems operating at large scales, adding several Collector pools to the pipeline becomes an attractive option. A Collector pool is a set of Collectors, each running on its own machine, that uses a load balancer to manage and distribute traffic. Figure 8-3 illustrates this setup.


Figure 8-3. Local Collectors for every application send telemetry to a Collector pool for additional processing and buffering
Running a Collector pool has advantages. First, it means you can use load balancing to handle backpressure, which occurs when a producer begins to send data faster than a consumer can receive it. Applications don’t produce telemetry in a steady stream. Depending on their traffic levels and design, applications sometimes begin emitting unexpectedly high volumes of telemetry. If these bursts produce telemetry faster than the analysis tool can consume it, the buffer in the Local Collector may fill to the point that it must begin dropping data to avoid running out of memory.

A Collector pool lets you add additional memory to your telemetry pipeline. The load balancer helps smooth out the spikes in telemetry caused by bursts of traffic, spreading the data evenly across the Collectors to maximize available memory. Because OTLP is stateless, this type of distributed memory buffer is simple to deploy, manage, and scale. (See “Buffering and Backpressure” for more details.)

Resource management
Processing telemetry consumes resources. Holding telemetry requires memory, and transforming telemetry requires CPU cycles. When a local Collector is using these resources, they are no longer available to the application running on the same machine.

The local Collector has two primary purposes: allowing the application to evacuate the telemetry it produces quickly, and gathering host metrics. Any additional processing outside of these two tasks can be handed off to the Collector pool. Because these Collectors are running on their own machines, they do not compete with applications for available resources.

Collector pools are load balanced, making the resource consumption for every Collector fairly uniform and predictable. This has two advantages.

First, you can accurately match the specs on the machines requisitioned for these Collectors to the resources the Collectors are configured to consume. This allows them to run on machines with a minimal amount of headroom, ensuring there are no wasted resources. This is much harder to do with a Local Collector, which must share resources with applications of all different shapes and sizes.

Second, over time, you can analyze the average throughput for each Collector in a pool and use this information to scale the size of the pool, so that it provides the throughput needed to consume all of the telemetry the system produces.

Deployment and configuration
While running a local Collector helps separate concerns between the telemetry pipeline and the application, the fact that local Collectors must run on the same host as the application means that they are still entangled. Collector pools are completely independent, so an infrastructure team can manage them without needing to coordinate deployments with individual application teams every time they want to make a change.

OpAMP and the Future
OpenTelemetry is currently developing a protocol for managing Collectors via a control plane. The Open Agent Management Protocol (OpAMP) will make it much easier to roll out configuration changes and new Collector binaries across the Collector fleet, independent of application management. It also will allow Collectors to report load and health metrics.

This approach will make it much easier for infrastructure teams to manage Collectors without having to bother the application teams. Even better, you will be able to control Collector management with the analysis tool to which the Collectors are sending information. This will allow you to tightly couple the configurations of the Collector and the analysis tool. As you change how you use the data in the analysis tool, the Collector pipelines can be automatically updated to match.

This tight coupling is especially important when managing sampling. You can’t make sampling decisions independently from how the telemetry is being analyzed. Every form of analysis has an optimal sampling configuration that provides maximum value with minimal data—and this optimal configuration is notoriously difficult for humans to figure out. Allowing the analysis tool to control sampling paves the way for nuanced, safe, and precise sampling configurations, far beyond what you could manage on your own.

At the time of this writing, OpAMP is not ready for production. But we encourage you to follow the development of this protocol and make use of it once it becomes available.

Gateways and specialized workloads
In most cases, even if some applications push telemetry via OTLP and other applications pull metrics via Prometheus scraping, it is fine to have a single Collector configuration that does both.

However, as your pipeline continues to grow in size and complexity, adding specialized Collector pools can have advantages. These pools can then be connected together as needed to make pipelines that on the one hand are more complicated, but on the other hand are easier to maintain and observe. Figure 8-4 shows how a specialized pipeline might look.


Figure 8-4. A pipeline consisting of an egress gateway and several workload-specific Collector pools
Here are some reasons you might want to create specialized Collector pools:

Reducing the size of the Collector binary
Normally, size is not an issue. But in some environments, such as FaaS, the time and cost involved in downloading a large binary can become problematic. In these cases, you might need to create a stripped-down build of the Collector with the minimal set of plug-ins needed for that particular environment, such as the OpenTelemetry Lambda Layer.

Reducing resource consumption
In some cases, two pipeline tasks can utilize machine resources very differently. Having the same Collector pools perform both tasks can lead to unpredictable resource consumption, requiring significantly more headroom than if the two tasks were separated onto different machines.

In these cases, it may make sense to create separate Collector pools for each task—especially if only a subset of telemetry requires one of the tasks. In each case, weigh the network cost of having separate pools against the savings gained in machine provisioning. Obviously, this separation of concerns is worthwhile only when the system is so large that the savings would be significant.

Tail-based sampling
In general, tail sampling requires all spans that make up a trace to be completed in order to make a sampling decision. The current design of the Collector’s tail sampling algorithm requires that all spans for a given trace end up on the same instance in order to make the decision. This necessitates a gateway pool using a Collector with the load balancing exporter to make sure that spans go to the correct instance, and then a separate pool that performs the sampling process itself.

Keep in mind that the resource requirements for tail sampling can be very high based on span throughput, attribute count, and sampling window. The defaults for this processor assume a 30-second window of time and a max of 50,000 spans in memory at any given time. This may sound like a lot, but highly verbose traces or complex systems can easily dwarf it. We’ve seen production traces in the hundreds of thousands of spans for a single trace, on operations that can take many minutes to succeed or fail. We’ll discuss sampling in more detail in the next section.

Backend-specific workloads
Not all telemetry requires the same processing. If, for example, you are using Prometheus for metrics and Jaeger for traces, the traces and metrics are being sent to different backends. Any Prometheus-specific Collector plug-ins for processing and managing metrics could be moved to a Collector pool that runs after metrics and traces have been separated, and right before the metrics are sent to Prometheus. This would help prevent traces from getting caught in backpressure or otherwise contending for resources with a workload that does not apply to them.

Reducing egress costs
Most cloud providers charge for network egress, and high volumes of telemetry can make these costs significant. Given that most analysis tools run in a separate network zone from the applications they monitor, high egress costs are common with large systems.

When egressing large amounts of telemetry over long periods of time, we recommend using a specialized protocol to compress the data, beyond the GZip compression of OTLP. The OTel Arrow protocol, in beta as we write this, is one example. Given the savings involved, we expect plenty of vendor and OSS support for OTel Arrow once it reaches stability.

Isn’t OTel Arrow Better?
You might be wondering: if OTel Arrow is so efficient, why not use it everywhere, instead of OTLP? There are two reasons. First, to get to high levels of compression, OTel Arrow requires sustained transmission of large amounts of data. Second, OTel Arrow is a stateful protocol. For these reasons, it does not perform well with load balancers, Collector pools, or applications that send relatively small amounts of data. It’s a specialized protocol designed specifically for high-throughput gateways egressing large volumes of data over a stable connection.

Pipeline Operations
Every system needs to evolve, and telemetry is no exception. While modifying your telemetry by hand-tuning each and every piece of instrumentation might be the ideal solution, it isn’t often feasible. Using a pipeline of Collectors to apply changes to telemetry data and protocols is a key part of making adjustments to your observability system without creating downtime or observability blackouts. In this section, we’ll review the types of operations available to you when using a Collector.

Filtering and Sampling
The first step of any pipeline should be to remove anything that you absolutely don’t want. You can use filters to completely drop specific log messages, spans, or metric instruments from your pipeline. In OpenTelemetry, filters are implemented as processors, but how you use them varies slightly based on telemetry type and where they are (in the SDK or in the Collector).

The first thing to know is that while filtering and sampling both remove data, they work differently and are used to obtain different results. Filtering is the process of completely removing specific types of data, based on a set of rules. Sampling is the process of identifying a statistically representative subset of data and removing the rest.

For example, many microservice architectures expose a health-check endpoint (such as /health or /healthz) that an external monitoring script or hook checks periodically. Emitting traces for health checks is usually not very valuable, so this is an easy one to filter out—operators are never going to set alerts based on these endpoints or care about measuring their latency. It makes sense to reduce noise and lower costs by filtering out the traces for these health checks early in the telemetry pipeline.

Filtering Out the Noise
Noisy health checks are such a common nuisance that there are predefined processors for filtering based on the attributes commonly associated with health checks and synthetic monitoring. For an example of how to set up these filters, see the OpenTelemetry Demo Load Generator.

In other cases, a system may have an operation that is valuable to monitor but also extremely common—for example, the GET request for the home page of a website. If the volume of requests is high enough, even rare outlier events become common enough that they will be picked up in a statistical sampling. You can achieve significant savings with little loss to observability by only transmitting sampling requests such as these.

You can also filter based on allow lists. In this method, instead of writing a filter that removes certain spans, you write one that allows only spans with specific names or attributes to pass through.

You can implement most filtering strategies in both the SDK and the Collector. In general, handling this processing at the Collector is a better idea than handling it at the SDK—it creates a clean separation of concerns between developers and platform engineers or SREs, and you can customize your pipeline without code redeployments. If you’re wrapping the SDK or distributing it as part of an internal observability framework, however, then it can make sense to do “first-pass” filtering at the code level. You’ll consume fewer resources and reduce network overhead if spans that aren’t going to be collected never get created.

Sampling differs from filtering in that its goal is to reduce the overall data volume the pipeline must process. Sampling, like filtering, should happen early in the pipeline to avoid wasting time processing telemetry that isn’t going to be exported. Broadly, you can employ three sampling strategies: head-based, tail-based, and storage-based.

Head-based sampling
Making sampling decisions when a trace starts—typically with a factor like 1-in-10 or 1-in-100. We don’t suggest using head-based sampling in OpenTelemetry, since you could miss out on important traces.

Tail-based sampling
Waiting until a trace is done before making a sampling decision. This strategy allows you to keep specific subsets of traces, such as those that have errors or that correspond to specific users.

Storage-based sampling
Implemented in the analysis tool, not the telemetry pipeline. This involves having several types of storage that offer different features. For example, a system may store 100% of telemetry for one week in a system that supports live querying and debugging workflows needed to fight fires and discover the root cause of an ongoing system outage. After a week, most of the telemetry is deleted and only a small statistical sample is stored for historical purposes. While this approach does not reduce the cost of sending telemetry to the analysis tool, it does allow for the best of both worlds in terms of features and storage costs.

When and how to use these sampling strategies is often a difficult question to answer. Worse, implementing sampling poorly or incorrectly can have serious repercussions on your ability to observe your system.

Filtering is easy; sampling is dangerous
How to filter your telemetry is usually obvious—simply throw out any data you do not plan on ever using. When and how to sample is a much more difficult question to answer. In fact, how to correctly sample telemetry is one of the most vexing and pernicious issues in all of observability! The unfortunate reality is that the question “What sampling technique should I use and how should I configure it?” has no universal answer. It is highly dependent on the quantity of the data and the type of analysis being performed.

For example, if you are interested only in average latency over time, head-based sampling is a very effective strategy for controlling costs. Averages over time can easily be derived from a completely random sampling of traces. What percentage of traces should you sample? Well, that depends on how detailed you would like your averages to be. The lower the sampling rate, the less information will be available and the smoother the curve will be.

But what if you don’t just care about average latency? What if you also care about errors? Some errors might be common enough to be recorded as part of a random sample of requests. But there is always the possibility for a critical error to occur infrequently enough that it is missed entirely by a sample. How many errors you miss depends on the sampling rate you set.

Of course, missing any errors at all seems like a bad quality for an observability system to have! Instead, it might be better to wait for a trace to be completed, and sample it only if it does not contain an error. This approach can’t be accomplished with head-based sampling. Instead, you need to switch to tail-based sampling. But now you have another problem: tail-based sampling can check for an error before returning a completed trace only if all of the spans are being sent to the same Collector. Given that all the spans in a distributed trace will be coming from different services, collecting them all in one place interferes with load balancing. It also consumes more resources, as all the spans in every trace must be held in memory until the trace is completed. Depending on the shape of the system and the cost trade-offs, tail-based sampling could actually cost you more in machine resources than you save in network egress costs.

And if you want all the traces available to you when debugging a live system (which is extremely helpful!), you can’t do any sampling at all before sending the telemetry all the way to the analysis tool. Remember, traces are rich, well-organized logs that make it easy to find all the events leading to an error or a timeout. If sampling your logs sounds like a bad idea, why would you want to sample your traces?

The Future of Sampling Is Automation
Correct sampling is so specific, to both the type of analysis tool being used and the way it is currently configured, that human operators can almost never find an optimal sampling configuration. It’s much better to allow the analysis tool to control sampling directly. This allows for a nuanced set of sampling rules to be constantly updated in response to changes in both the analysis tool and the system being observed. It also ensures that sampling is never implemented in a way that would harm observability. The upcoming OpAMP protocol from OpenTelemetry is specifically designed to allow analysis tools to control sampling in this manner.

In general, we do not recommend sampling at all until your egress and storage costs become significant. Never implement any kind of sampling without first consulting with the vendor or OSS project you are using for analysis. Avoiding excessive instrumentation, aggressively filtering out telemetry you have no use for, and adopting high compression gateway protocols such as OpenTelemetry Arrow are much simpler and safer alternative strategies to lowering the cost of observability. Reach for them first.

Discovering Unused Telemetry
There are several generalizable techniques that you can use to discover unused telemetry data. The first is to reconcile your telemetry streams with what’s actually used in your dashboards and queries. You can automate this with some scripting—for instance, by analyzing all of the dashboard queries in a Grafana instance and comparing them to the metric names and attributes being collected. You can then write filtering rules that drop unused telemetry streams. More advanced techniques include adding telemetry to queues and setting time-to-live values on your incoming streams that delete them if they aren’t accessed within a certain amount of time. Another strategy is to batch and reaggregate your telemetry at ingest to reduce the number of distinct events. For instance, you can turn many unique Kubernetes metrics into a single one by combining attributes, or you can turn dozens of log lines into a single metric.

Generally, these techniques require a fairly significant investment in tooling and custom code. Few pure open source solutions exist to support them, and many vendors offer standalone or integrated solutions that address this issue.

Transforming, Scrubbing, and Versioning
Once you’ve eliminated the data you don’t want or need, you need to process what’s left. That’s where transformation—modifying attributes, or telemetry signals themselves—comes in.

One of the most common transformations is to modify attribute values on emitted telemetry. You can remove or obfuscate sensitive information, create new synthetic attributes by combining existing attribute values, or use schema transformations to ensure semantic convention attributes are consistent among versions of OpenTelemetry SDKs. You can add new attributes as well. For example, the k8sattributes processor can query the Kubernetes API server for relevant attributes and then add them to telemetry emitted by a given pod, even if the service running in that pod doesn’t know where or how it’s running.

Order of Operations Matter
Be careful when using transformations with tail-based sampling! Certain processors require context objects that are stripped by the sampling process, and certain sampling algorithms may require attributes that are added or modified by transformations. In this case, your pipeline would look like this: Filter -> Transform -> Sample -> Export.

Certain specialized transformations, such as the redaction processor, are available only to the Collector. Another unique Collector feature is its ability to transform telemetry signals between types—for example, converting spans to metrics. Connectors allow you to receive and send telemetry from one Collector pipeline to another. You can use connectors to create new metrics from existing ones, turn a set of traces into a histogram, analyze logs and create metrics from them, and more.

When transforming telemetry, it’s important to keep two things in mind. First, the more transformations you do, the more resources you use. Complex or complicated transforms do incur memory and CPU-performance penalties, which may require you to scale up your Collector pools. Second, the more transformations you do, the longer it takes for your telemetry to become actionable. Generally, it’s better to do things right the first time, and to use attribute transformations to normalize telemetry that you can’t fix at the source.

That said, signal transformation can also be a very effective part of a cost-control strategy. Converting traces to metrics, for example, allows you to store those metrics for years at a fraction of the cost of keeping the original trace data. Similarly, converting logs into metrics is a cost-effective way to operationalize resource logs from resources such as web servers or databases.

Transforming Telemetry with OTTL
The transform processor is responsible for modifying telemetry data as it passes through the Collector. Transform rules are defined in YAML and are specific to a single signal. For example, you can use the transform processor to remove or add attributes from log messages, modify message bodies, or redact information that shouldn’t be preserved. If you wanted to do the same transformation for different signal types, you would need to define those rules for each signal.

This processor can perform many functions, including converting existing logs into new ones that comply with OpenTelemetry Semantic Conventions. We’ve provided an example on GitHub for you to look at and run, but it can be helpful to explain a few things that might not be obvious.

The example deployment is intended to show you how you can remap attributes that are being ingested from logs, such as those emitted by nginx, to conform to OpenTelemetry Semantic Conventions. AWS offers OTLP-formatted CloudWatch Metric Streams, but these streams do not remap attributes into OpenTelemetry Semantic Conventions, so you’ll need to perform this mapping by using OpenTelemetry Transformation Language (OTTL). Logs can be processed in OpenTelemetry in a variety of ways; in this case, we’re using a file log receiver, which reads lines from files as they’re written. As it reads, it passes the lines to modules that can parse the input data. The Collector’s log parsing is based on Stanza, a fast and efficient Golang-based log processor.2

In the following excerpt, you can see how the transform processor works:

processors:
  transform:
    error_mode: ignore
    log_statements:
      - context: log
        statements:
          - set(attributes["http.request.method"], attributes["request"])
          - delete_key(attributes, "request")
In this instance, we’re copying the value from the nginx access log (request) into the appropriate semantic attribute and then deleting the nonstandard key. That isn’t the only way to perform this sort of transform, though—in the collector-config.yaml file, you can see the nginx receiver being used to listen for statistical data exposed through the nginx status module. This receiver turns the data scraped from that endpoint into appropriate metrics.

Privacy and Regional Regulations
As the internet has evolved, so have the rules and regulations that define how data is allowed to be transmitted and stored. Because telemetry can contain PII and cross regional boundaries, these rules are directly relevant to your telemetry pipeline.

Because the rules are inherently regional, they change depending on where the data is coming from and going to. The Collector is an ideal place to manage the data scrubbing and routing that such regulations often mandate. While we can’t make any specific recommendations, we advise that you consider these rules when building your telemetry pipeline.

Buffering and Backpressure
Telemetry creates high volumes of network traffic. It’s also critical—you don’t want to lose any data. This means that you need enough resources available in the pipeline to buffer, or temporarily hold this data in memory, when temporary spikes in traffic or unexpected issues create backpressure. It also means that when your system is sustaining traffic levels beyond its current buffering capacity, you need a way to scale your available resources quickly.

Remember, Collectors aren’t just for data transformation! In many ways, managing backpressure and avoiding data loss is the most important function of the telemetry pipeline.

Changing Protocols
The final stage of a pipeline is export. Where do you put the data? We’re not going to recommend a specific solution here—that will depend on your organization’s needs—but we’ll give you some suggestions.

The “default” open source observability stack includes Prometheus, Jaeger, OpenSearch, and Grafana. These tools allow you to ingest, query, and visualize metrics, traces, and log data. You can also export to dozens of commercial tools that support OpenTelemetry.

Where things get interesting is in designing pipelines that decide where to export data based on information about the telemetry itself. Processors like the routing processor allow you to specify destinations based on telemetry attributes. Imagine you have a free and a paid version of your product, and you want to prioritize telemetry associated with paid users. By configuring the routing processor to look for attributes that correspond to user type, you could send paid traffic to a commercial tool that offers improved analysis capabilities and free traffic to a less sophisticated one.

You can also be creative with exports in order to better trace unique architectures. Say you have a job that takes a variable number of steps to complete. If you want to know the average number of steps, routing the spans from those transactions into a queue would let you create a histogram that shows how many transactions fall into each bucket of steps. You could even record traces as representative examples of each bucket.

You can also use this strategy to measure gaps, or process time between spans in a trace, by calculating the difference between the end and start times of adjacent spans. These calculations can then be added to spans at final export or emitted as metrics.

Ultimately, what and how you export is going to vary based on your needs and wants. The nice thing about OpenTelemetry is that you can change where data goes with a couple of lines of configuration, which makes it very easy to scale from a self-managed open source solution to a more robust commercial offering.

Collector Security
Deploy and maintain the Collector as you would any piece of software, with an eye toward security. As we write this book in 2024, the OpenTelemetry project is building out best-practice guides for securing not just the Collector but other components in the ecosystem. Be sure to check out the OpenTelemetry website and documentation for more information and more complete guides on security, but we’ll give you an overview of some commonly accepted best practices here.

Ensure that Collectors that are listening for local traffic don’t bind their receiver interfaces to open IP addresses. For example, instead of listening on 0.0.0.0:4318, prefer localhost:4318. This helps prevent denial-of-service attacks by unauthorized third parties.

For Collector instances that accept traffic across a WAN, always use SSL/TLS to encrypt data as it moves over the network. You may also wish to set up TLS- and certificate-based authentication and authorization even for internal receivers, both to guarantee that only authorized traffic is being sent to desired Collectors and to reduce the chance of unredacted PII exposure.

Kubernetes
Kubernetes is ubiquitous enough that it deserves special attention. So we will end our chapter on pipelines with a short note on how to use the OpenTelemetry Kubernetes Operator to manage Collectors.

You can install the OpenTelemetry Kubernetes Operator through either kubectl or a Helm chart. It supports several deployment types, including these:

DaemonSet to run a Collector on every node

Sidecar to run a Collector in every container

Deployment to run a Collector pool

StatefulSet to run a stateful Collector pool

DaemonSets and Sidecars are a good way to run a local Collector. A DaemonSet may be more efficient, since all the pods on a node can share the same Collector. While Deployment and StatefulSet both run Collector pools, almost all Collector configurations are stateless, so Deployments are our recommended option.

You can also use the OpenTelemetry Kubernetes Operator to inject auto-instrumentation into applications and configure it. This is a great way to get up and running with OpenTelemetry quickly. As of this writing, the OpenTelemetry Kubernetes Operator supports Apache HTTPD, .NET, Go, Java, nginx, Node.js, and Python, while auto-instrumentation can be installed only via kubectl.

Managing Telemetry Costs
In the past couple of years, many software companies have concentrated, with laser-like focus, on cutting costs and improving efficiencies. Often, these organizations spend a lot of time looking at their monitoring and observability programs for potential savings. We wrote earlier in this chapter about your primary levers for actually controlling telemetry costs—filtering out unneeded or unwanted data and sampling the rest—but we’ll address the topic somewhat holistically here.

It’s very difficult, even impossible at times, to gauge the value of a given piece of telemetry. For example, consider data known to be “uninteresting.” While a data point may be considered uninteresting in isolation, it can become interesting when mixed with other data points, because the presence of outliers and correlation paints a clearer picture of system behavior. Furthermore, you can’t predict when a given datapoint may cross that threshold from uninteresting to interesting. Data is valuable when it is interesting and worthless when it’s not.

This isn’t to say that you shouldn’t care about cost management or that it’s not worthwhile. It’s more that no one can give you a set of general guidelines to follow in all circumstances. Indeed, the only truly general advice we can give you is, don’t monitor what doesn’t matter. If nobody is paying attention to something, then it’s not worth keeping track of. As we mentioned earlier in the chapter, you can look at how frequently certain telemetry is used or accessed. However, blithely trusting this sort of analysis can leave you suddenly clueless when novel problems crop up.

Another lens is to consider the trade-off between cost and value. For example, a common concern with metrics-based systems is the use of custom metrics that contain a lot of unique values, such as user IDs. These “high-cardinality” values can lead to high costs, which is bad—or is it? If you need to understand why a particular user is having a poor experience, there aren’t many ways around it: you need a value like that to slice and dice your data.

A better way to consider telemetry cost management is to think about the resolution of your data and how to optimize it. The exact methods you can use here will vary based on the capabilities of your analysis tool, but here are some examples to get you thinking.

First, consider how to deduplicate telemetry signals by layering them effectively. If you’re getting accurate rate, error, duration, and throughput counts from histogram metrics, you can potentially save on collecting and storing “fast” traces (since they’re less likely to have useful information) by preferring only “slow” ones. Similarly, with logs, rather than ingesting millions of individual log lines, deduplicate them at the point of collection and convert them to a metric or a bigger structured log.

You can take this a step further, especially if you’re using column-based data stores for your telemetry data. Rather than sending instantaneous metrics (such as counters or gauges) to your data store as individual events, read the value of those metrics as a span is being recorded and add them to the span as attributes.

Ultimately, your cost management choices should be driven by the value you want to get out of your observability practice. Collect the data that you need to get the results that you want.

Conclusion
In an OpenTelemetry rollout, there’s often one big push to move every application over to OpenTelemetry instrumentation. After that, pipeline setup and management become the primary ongoing efforts. Given the high volumes of telemetry, the potential sensitivity of some information, and the frequency with which organizations shift from one analysis tool to another, any organization that wants to leverage its observability to the fullest needs a clear and concise long-term strategy for managing telemetry-pipeline operations.

However, that large initial OpenTelemetry rollout has its own challenges, and overcoming them will take coordination and cooperation across the entire organization. The next chapter focuses on strategies for avoiding pitfalls and finding success when migrating to OpenTelemetry.

1 Quoted in Richard M. Nixon, Six Crises (Garden City, NY: Doubleday, 1962).

2 You can find a detailed breakdown of various Stanza configuration options on the Stanza GitHub repository.


Copy

table of contents
search
Settings
Previous chapter
7. Observing Infrastructure
Next chapter
9. Rolling Out Observability
Table of contents collapsed
