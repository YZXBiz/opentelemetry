Skip to Content
Chapter 2. Why Use OpenTelemetry?
A map is not the actual territory.

Alfred Korzybski1

If you’re reading this, you’re almost certainly in the business of software. Your job may be to solve business or human problems by writing code, or to ensure that great fleets of software and servers are highly available and responsive to requests. Or maybe that was your job at one point and now you tackle technical problems of a different sort—how to organize, coordinate, and motivate human beings to efficiently ship and maintain software.

Software itself is a vital part of our global economy; the only things more crucial are the people tasked with its creation and upkeep. And the scale of their task is enormous—modern developers and operations teams are being asked to do more with less, even as system complexity grows without bounds. You get some documentation, a group of like-minded individuals, and 40 hours a week to keep systems running that generate measurable fractions of the global gross domestic product.

It doesn’t take too long to realize that this is, perhaps, not quite enough.

The map of your software system that you build in your mind will inevitably drift away from that on paper. Your understanding of what’s happening at any given time is always limited by how expansive the system is, how many changes are occurring in it, and how many people are changing it. New innovations, such as generative AI, bring this observation into sharp focus—these components are true black boxes, where you have little to no insight into how they come to their results.

Telemetry and observability are your most potent weapons to combat this drift. As we discussed in Chapter 1, telemetry data tells you what your system is doing. However, the status quo of telemetry is not a sustainable one. OpenTelemetry seeks to upend this status quo, delivering not just more data but better data, data that serves the needs of the people who build and run systems and the organizations and businesses powered by those systems.

Production Monitoring: The Status Quo
Imagine for a moment that you don’t work in software at all. Your job is to manage the public-transit system of a growing municipality.

Your transit system started out small—just a handful of buses that operated on a fairly fixed schedule. This was fine until more people moved in and started demanding more service to more places. More business and industry came in, and suddenly the local government is mandating that you build specific one-off lines to remote industrial parks and light-rail service between outlying areas.

Think about everything you might want to monitor in this scenario. You would want to know how many vehicles you have in service, certainly, and where they are at any given point in time. You would want to know how many people are riding transit, in order to more efficiently allocate limited resources. You would also want to know about the maintenance status of your fleet so you can predict wear and tear, and possibly avoid emergency repairs. Different stakeholders will want to know different things as well, at different levels of detail. The city council probably doesn’t need to know about the tire-tread levels of every bus, but your maintenance supervisor certainly does—and you might too, in order to plan capital expenses.

This is a lot of data! It’s an overwhelming amount of data, in fact. And the worst part is, it’s not consistent. Your maintenance data relies on humans to transcribe and report values accurately. Your ridership data relies on sensors or ticket counts. Vehicle statistics come in all different types—and different vehicles in your fleet may report the same thing in different ways. How do you standardize this data? How do you analyze it? How do you ensure that you’re collecting what you need to, and how do you make changes to which data you collect over time?

This hypothetical should sound somewhat familiar to anyone who’s been building software for a while. All production software systems are a combination of decisions built up over time, and much of the work of operating them involves collecting, normalizing, interpreting, and parceling out data to various stakeholders for various purposes. Developers need highly detailed telemetry that they can use to pinpoint specific problems in code. Operators need broad, aggregated information from across hundreds or thousands of servers and nodes so that they can spot trends and respond quickly to outliers. Security teams need to analyze many millions of events across endpoints to discover potential intrusions; business analysts need to understand how customers interact with features and how performance impacts customer experience; directors and leaders need to understand the overall health of the system in order to prioritize work and expenditures.

The current status quo of production monitoring is that we use dozens of tools to collect a variety of signals in different formats on varying cadences, and then we send them off for storage and analysis. Smaller organizations may be able to put everything into a single database or data lake; larger organizations may find themselves with hundreds of storage destinations that have a variety of access controls. As organizational complexity increases, analyzing and responding to incidents becomes more difficult. Outages take longer to detect, diagnose, and remediate because the people doing that work don’t have the right data at hand.

The Challenges of Production Debugging
Most organizations face three main challenges when trying to understand their software systems: the amount of data that they need to parse, the quality of that data, and how the data fits together.

These problems have similar factors in common. There are no universal standards for creating telemetry. Telemetry signals are independently generated. There will be technical and organizational impediments to creating quality telemetry, and existing systems have their own momentum. The results are clear: incidents take longer to detect and remediate,2 software engineers burn out faster,3 and software quality drops. Anecdotally, we’ve heard stories from (very large) organizations of incidents that stretch into days or weeks because of the difficulty of sharing data among incident responders. In many organizations, it’s not uncommon to have to navigate between multiple independent monitoring tools in order to discover why a particular API is slow or why a customer is experiencing errors uploading a file. The cloud, and especially Kubernetes, makes this task even more challenging, since containers are created and destroyed at will by the cluster, taking uncollected logs with them.

Complicating this further, many debugging techniques are difficult to use when your systems are changing rapidly. The nodes on which your workload runs may change from hour to hour, or even minute to minute, in cloud environments. Discovering a slow node, network misconfigurations, or code that performs poorly under specific circumstances is extremely challenging when “where the code is running” can change in the middle of observing a failure.

To address this problem, system operators employ a wide array of tools, such as log parsers, metric-collection rules, and other complex telemetry pipelines, to collect, store, and normalize telemetry data for their use. Many businesses use proprietary tooling that collects this data in a massive managed platform, but this comes with its own trade-offs. The cost of managed platforms can be extremely high, and unless you want to go through an expensive migration process, you’re stuck with the features of that platform. If no one platform solves all your problems, you may be stuck managing multiple platforms, or a combination of platforms and point solutions, for specific features and functionality (such as frontend or mobile client observability). Organizations that build their own platforms wind up having to “reinvent the wheel” by creating their own instrumentation, collection, storage, and visualization layers at great expense.

How can the industry overcome these challenges? Our philosophy is that these challenges stem from a lack of high-quality, standards-based, consistent telemetry data. If observability is to make a difference in developers’ lives, then, as Charity Majors and her coauthors write, it “requires evolving the way we think about gathering the data needed to debug effectively.”4

The Importance of Telemetry
To solve the challenges of production monitoring and debugging, you need to rethink your approach to telemetry data. Rather than the three pillars of metrics, logs, and traces we mentioned in Chapter 1, you need an interwoven braid.

What does this mean in practice, though? In this section, you’ll learn about the three characteristics of unifying telemetry that OpenTelemetry practices: hard and soft context, telemetry layering, and semantic telemetry.

Hard and Soft Context
Context is an overloaded term in the monitoring and observability space. It can refer to a very literal object in your application, to data being passed over an RPC link, or to the logical and linguistic meaning of the term. However, the actual meaning is fairly consistent between these definitions: context is metadata that helps describe the relationship between system operations and telemetry.

Broadly speaking, there are two types of context that you care about, and those contexts appear in two places. The types of context are what we’ll refer to as “hard” and “soft” contexts, and they appear in an application or in infrastructure. An observability frontend can identify and support varying mixtures of these contexts, but without them, the value of telemetry data is significantly reduced—or vanishes altogether.

A hard context is a unique, per-request identifier that services in a distributed application can propagate to other services that are part of the same request. A basic model of this would be a single request from a web client through a load balancer into an API server, which calls a function in another service to read a database and returns some computed value to the client (see Figure 2-1). This can also be referred to as the logical context of the request (as it maps to a single desired end-user interaction with the system).

A soft context would be various pieces of metadata that each telemetry instrument attaches to measurements from the various services and infrastructure that handle that same request—for example, a customer identifier, the hostname of the load balancer that served the request, or the timestamp of a piece of telemetry data (also pictured in Figure 2-1). The key distinction between hard and soft contexts is that a hard context directly and explicitly links measurements that have a causal relationship, whereas soft contexts may do so but are not guaranteed to.


Figure 2-1. “Hard” and “soft” contexts emitted by a web application
Without contexts, the value of telemetry is significantly reduced, because you lose the ability to associate measurements with each other. The more context you add, the easier it becomes to interrogate your data for useful insights, especially as you add more concurrent transactions to a distributed system.

In a system with low levels of concurrency, soft contexts may be suitable for explaining system behavior. As complexity and concurrency increase, however, a human operator will quickly be overwhelmed by data points, and the value of the telemetry will drop to zero. You can see the value of soft context in Figure 2-2, where viewing the average latency of a particular endpoint doesn’t give a lot of helpful clues as to any underlying problems, but adding context (a customer attribute) allows you to quickly identify a user-facing problem.


Figure 2-2. A time-series metric showing average latency for an API endpoint. The top graph plots average (p50) latency; the bottom graph applies a single group-by context. You can see that the overall average is higher because of a single outlier, FruitCo.
The soft context most commonly used in monitoring is time. One tried-and-true method of spotting differences or correlating cause and effect is to align multiple time windows across several different instruments or data sources and then visually interpret the output. Again, as complexity increases, this method becomes less effective. Traditionally, operators are forced to layer in additional soft contexts, “zooming in and out” until they’ve identified a sufficiently narrow lens through which they can actually find useful results in their data set.

Hard context, on the other hand, can dramatically simplify this exploratory process. A hard context not only allows the association of individual telemetry measurements with other measurements of the same type—for example, ensuring that individual spans within a trace are linked together—but also enables linking different types of instruments. For example, you can associate metrics with traces, link logs to spans, and so forth. The presence of hard context can dramatically reduce the time a human operator spends investigating anomalous behavior in a system. Hard context is also useful for building certain visualizations, such as a service map, or a diagram of the relationships in a system. You can see this in Figure 2-3, where each service in a system is visually linked to the other services that it communicates with. Identifying these relationships just with soft context is difficult and usually requires human intervention.


Figure 2-3. A large microservice system map, from Uber.5 This kind of diagram is made possible using the hard context provided by distributed tracing.
To summarize: Hard context defines the overall shape of a system by defining relationships between services and signals. Soft context allows you to create unique dimensions across telemetry signals that help explain what a particular signal represents.

We’ll get to the “how” later in the book, but OpenTelemetry is designed from the ground up to provide both hard and soft context to all signals it emits. For now, keep in mind that these contexts are crucial to creating unified telemetry.

Telemetry Layering
Telemetry signals are generally convertible. As an example, content delivery networks (CDNs) such as Cloudflare give you dashboards full of website performance metrics, showing you the rate of requests broken down by HTTP status code. The underlying data for this is log statements, parsed into time-series metrics.

This is a fairly common practice for most monitoring and observability tools, but it has drawbacks. Costs are associated with these conversions, both in resources (they take CPU and memory) and in time (the more you convert and transform a piece of data, the longer it takes before the resulting measurement is available). There’s also a time cost to managing and maintaining transformation and parsing rules. This is toil, plain and simple, and it makes it difficult to understand what’s happening in production. Often, a system can fail for users for many minutes before alerts start to fire—and that’s because the system is using telemetry signals inefficiently.

A better solution is to layer telemetry signals and use them in complementary ways, rather than attempting to turn a single “dense” signal, such as application logs, into other forms. You can use more tailored instruments to measure application and system behavior at specific layers of abstraction, link those signals through contexts, and layer your telemetry to get the right data from these overlapping signals. You can then record and store it in appropriate, efficient ways. Such data can answer questions about your system that you might not even have known you had. Layering telemetry, as shown in Figure 2-4, allows you to better understand and model your systems.


Figure 2-4. An illustration of layered signals. A histogram measures API latency, with exemplars linking to specific traces, and with those traces linking to profiles or logs to get component- or function-level insights.
OpenTelemetry is built with this concept in mind. Signals are linked to each other through hard context—for example, metrics can have exemplars appended to them that link a specific measurement to a given trace. Logs also are attached to trace contexts as they’re processed. This means you can make better decisions about what type of data to emit and store based on factors such as throughput, alert thresholds, and service level objectives and agreements.

Semantic Telemetry
Monitoring is a passive action. Observability is an active practice. To analyze the territory of a system—to understand how it actually works and performs in production, rather than relying on the parts you can see, like code or documentation—you need more than just passive dashboards and alerts based on telemetry data.

Even highly contextual and layered telemetry is not enough by itself to achieve observability. You need to store that data somewhere, and you need to actively analyze it. Your ability to effectively consume telemetry is thus limited by many factors—storage, network bandwidth, telemetry creation overhead (how much memory or CPU is utilized to actually create and transmit signals), analysis cost, alert evaluation rate, and much more. To be more blunt, your ability to understand a software system is ultimately a cost-optimization exercise. How much are you willing to spend in order to understand your system?

This fact causes significant pain for existing monitoring practices. Developers are often restricted on the amount of context they can provide, as the amount of metadata attached to telemetry increases the cost of storing and querying that telemetry. In addition, different signals will often be analyzed multiple times for distinct purposes. As an example, HTTP access logs are a good source of data for the performance of a given server. They are also critical information for security teams keeping an eye out for unauthorized access or usage of production systems. This means that the data must be processed multiple times, by multiple tools, for multiple ends.

As we mentioned earlier in this chapter, the result is that developers are usually spelunking through multiple tools with different interfaces and query semantics, dealing with differing representations of the same data, hoping that what they need didn’t get thrown away for being too expensive to store.

OpenTelemetry seeks to change this through portable, semantic telemetry: portable, as in you can use it with any observability frontend, and semantic, as in self-describing. For example, a metric point in OpenTelemetry contains metadata that tells a frontend the granularity of the metric, as well as a description of each unique attribute. The frontend can use this to better visualize metric queries and allow you to search not just for the name of a measurement but for what it’s actually measuring.

Fundamentally, OpenTelemetry is an evolutionary step in understanding systems. It is in many ways a summation of the past two decades of work in defining and unifying observability as a concept. As an industry, we’ve been innovating faster than we can implement or define meaningful standards. OpenTelemetry changes that calculus. With that in mind, let’s talk about the problems that OpenTelemetry solves for developers, operators, and organizations.

What Do People Need?
Telemetry and observability have many stakeholders. Different groups and individuals will have different requirements for an observability system, and it stands to reason that they will also have different requirements for telemetry data itself. How can OpenTelemetry satisfy these broad and often competing interests?

In this section, we’ll discuss the benefits of OpenTelemetry for developers and operators as well as for teams and organizations.

Developers and Operators
The people who build and operate software need their observability data to be high in quality, highly contextual, highly correlated, and layered, among other things. They need telemetry to be built-in, not something they have to add in later. They need it to be consistently ubiquitous (available from many sources). And they need to be able to modify it—both by changing built-in telemetry and by adding new telemetry—in a consistent fashion across many languages, runtimes, clouds, and so on.

Today, developers use instrumentation libraries to create this data, and they have many existing options, such as Log4j, StatsD, Prometheus, and Zipkin. Proprietary tools also offer their own instrumentation APIs and software development kits (SDKs), along with built-in integrations for popular frameworks, libraries, databases, and so forth.

Ultimately, these instrumentation libraries and formats matter a lot to developers and operators because they define how—and how well—you can model your system through telemetry. The choice of instrumentation library can limit the effective observability of your system: if you can’t emit the right signals, with the right context and semantics, you may find yourself simply unable to answer certain questions. One of the biggest challenges that developers face as they learn observability is that everyone does it a little differently than everyone else. Organizations with strong, centralized platform engineering and internal tooling teams may offer powerful, well-integrated instrumentation libraries and telemetry, but many do not.

One of the motivating problems for observability is that systems are too large and complex for people to hold them in their heads and understand. Certainly, there have always been large and complex software systems, but what’s really different now is the rate of change and the resulting loss of human understanding. In a slower-paced world, there were people who understood the nuances of an application and how it all fit together—we called them quality assurance (QA). Over time, as more organizations jettison traditional QA processes and replace them with continuous integration and delivery, it’s become harder for people to absorb the “shape” of a system. The faster we go, the more we need ubiquitous, high-quality telemetry that describes what’s happening and why.

Beyond instrumentation libraries and high-quality telemetry, operators need a rich ecosystem of tools to help them collect and process telemetry data. When you generate petabytes of logs, metrics, and traces every day, you need a way to cut through the noise so you can find the signal, which is no small order! There’s simply too much data to store and look through later, and most of that data is probably not very interesting. Thus, operators rely on instrumentation that can produce a wide range of signals, as well as tools to help them filter out the things that don’t matter so that they can, together with developers, ensure system reliability and resilience.

Teams and Organizations
Observability isn’t just for developers. Its stakeholders also include security analysts, project managers, and the C-suite. They may need different views of the same data, at a different resolution, but observability is still a crucial part of any organization’s threat posture, business planning, and overall health.

You can think of these as the needs of “the business,” but they’re more than that. Everyone benefits from the following:

Open standards that prevent vendor lock-in

Standard data formats and wire protocols

Composable, extensible, and well-documented instrumentation libraries and tools

Predictability is catnip to most organizations—that’s why processes exist! They trade efficiency for reducing risk (most businesses’ least favorite word). It’s fine to take risks with innovative practices; it’s less fine to take risks around knowing whether your application is up and running. Thus, standards are the order of the day for organizations and their observability needs.

Standards-based approaches have many benefits. Maintainability is one example—adopting an open format means that developers and teams have increased training opportunities. Rather than new engineers slowly being onboarded to your custom in-house solution, they can build knowledge on how to instrument using an open standard and carry that with them. This improves your ability to maintain existing instrumentation as well as to onboard new developers as productive members of the team.

Open standards aren’t just less risky; they’re future-proof. Look around—between 2021 and 2023, the industry saw multiple rounds of consolidation, buyouts, and failures of observability products large and small. Over the past 20 years we’ve seen multiple metric formats be created and popularized, only to plateau or be diminished by new entrants.

Beyond being simply “nice to have,” open standards and open source are essential as you evaluate and build your observability practice. You don’t have to look too far to see some of the drawbacks associated with going all-in on proprietary solutions—Coinbase spent $65 million on Datadog in 2022! We’re not saying it wasn’t worth it, but gosh, that’s a lot of money.

The last important factor for organizations is compatibility. It’s unlikely that you’d rip out your existing (functional) instrumentation just to switch to something new, and in most cases doing so would be unwise, unless you’re getting significantly more value. There aren’t many hard-and-fast rules about this, so what you need is the ability to bridge old and new, to adopt new practices while maintaining what you already have in place, and to “level up” your existing telemetry into standard formats.

Why Use OpenTelemetry?
Given all of the requirements of these many stakeholders, what makes OpenTelemetry an ideal solution? At the highest level, OpenTelemetry provides two fundamental values that cannot be found elsewhere.

Universal Standards
OpenTelemetry solves the problems inherent to the status quo in observability. It provides a way to create high-quality, ubiquitous telemetry. It offers a standard way to represent and transmit that telemetry to any observability frontend, eliminating vendor lock-in. It seeks to make telemetry a built-in feature of cloud native software, and in many ways it is accomplishing this goal. As of this writing, all three major cloud providers (Amazon, Azure, and Google Cloud Platform) support OpenTelemetry and are moving to standardize on it. All major observability platforms and tools accept OpenTelemetry data in some way. More and more libraries and frameworks are adopting OpenTelemetry every month.

OpenTelemetry presages a future in which telemetry is truly a commodity and works to make that future a reality. The future it builds is one in which all software creates a rich stream of telemetry data, just below the surface, that you can tap into and pick what you need based on your observability goals. It’s more than just an emerging standard—it’s inevitable at this point, and it’s something you will need to adopt.

Correlated Data
OpenTelemetry is not just a codification of prior practices. To push the field forward, the next generation of observability tools needs to effectively model the workflows that operators perform when investigating their systems. They also need to employ machine learning to surface correlations that might otherwise be difficult to intuit.

Smooth workflows and high-quality correlations can happen only when all of the telemetry is regularized and interconnected. OpenTelemetry is not just a pile of traces, metrics, and logs dumped together in the same place. All these pieces are part of the same data structure, connected together into a single graph that describes the entire system over time.

Conclusion
In this chapter, we’ve discussed the challenges of production monitoring and the needs of developers, organizations, and observability tools vis-à-vis telemetry data. This is the motivating rationale for why you should use OpenTelemetry.

Now that we’ve discussed why, the rest of this book will address how you can successfully adopt OpenTelemetry. We’ll start by giving you a tour and an overview of OpenTelemetry’s code and components, and then we’ll dive deeper into the three primary observability signals (traces, metrics, and logs) and talk about OpenTelemetry’s data format in more detail.

1 Alfred Korzybski, “A Non-Aristotelian System and Its Necessity for Rigour in Mathematics and Physics” (paper, presented at annual meeting of the American Association for the Advancement of Science, New Orleans, Louisiana, December 28, 1931), https://oreil.ly/YnvRH.

2 The VOID Report for 2022 includes many interesting insights into the lack of a relationship between incident severity and duration, leading us to conclude that the important thing in telemetry isn’t its utility in reducing mean time to respond (MTTR).

3 Tien Rahayu Tulili, Andrea Capiluppi, and Ayushi Rastogi, “Burnout in software engineering: A systematic mapping study,” Information and Software Technology 155, (March 2023): 107116, https://oreil.ly/d9AMZ This review of studies about burnout in software development and IT found that “work exhaustion” was one of the most significant and durable predictors of turnover.

4 Charity Majors, Liz Fong-Jones, and George Miranda, Observability Engineering (Sebastopol, CA: O’Reilly, 2022), 8.

5 “Introducing Domain-Oriented Microservice Architecture,” Uber Blog, July 23, 2020, https://oreil.ly/FNb43. This screenshot (taken in mid-2018) shows services and their relationships.


table of contents
search
Settings
Previous chapter
1. The State of Modern Observability
Next chapter
3. OpenTelemetry Overview
Table of contents collapsed
