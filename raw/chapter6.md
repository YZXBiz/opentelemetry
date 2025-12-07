Skip to Content
Chapter 6. Instrumenting Libraries
The price of reliability is the pursuit of the utmost simplicity. It is a price which the very rich find most hard to pay.

Sir Antony Hoare1

Internet applications are all very similar. Their code is not written in a vacuum; their developers apply a common set of tools—network protocols, databases, thread pools, HTML—to solve a specific problem. That’s why we call them applications. The tools these applications leverage are called libraries, and that is what we will focus on in this chapter.

Shared libraries are those that have been widely adopted across many applications. Most shared libraries are open source, but not all: two notable proprietary shared libraries are the Cocoa and SwiftUI frameworks provided by Apple. Regardless of its license, the wide adoption of a library can create additional challenges that are not present when you’re instrumenting ordinary application code. When we use the term library in this chapter, this type of shared library is what we mean.

OpenTelemetry is designed for library instrumentation. If you’re a maintainer of one of these libraries, this chapter is for you. Even libraries that are internal to a single organization will benefit from the advice that follows. If you’re just looking for best practices, you’ll find those sections at the end of the chapter.

As a maintainer, the idea of instrumenting your own library may be a novel concept. We call this practice native instrumentation, and we hope to convince you that it is superior to the traditional approach, in which instrumentation is maintained by a third party. We’ll also cover why high-quality library telemetry is so critical to observability and look at the barriers that maintainers face when they write instrumentation themselves.

As we did in Chapter 5, we provide a checklist of best practices to use when instrumenting libraries. We also touch on additional best practices that come with shared services, such as databases, load balancers, and container platforms like Kubernetes.

Beyond the actual code that goes into the library itself, native instrumentation opens the door to a wider set of practices that we believe are beneficial for library maintainers and users alike. These are new ideas, and we look forward to developing them with you as native instrumentation becomes more common.

The Importance of Libraries
The distinction between application code and libraries may seem obvious, but it has important ramifications for observability. Remember, most production problems don’t originate from simple bugs in application logic: they come from large numbers of concurrent user requests to access shared resources interacting in ways that cause unexpected behavior and cascading failures that do not appear in development.

Most resource usage within most applications occurs within library code, not within application code. Application code itself rarely consumes a large amount of resources; instead, it directs library code to utilize resources. The problem is that application code may direct those libraries poorly. For example, it might direct an application to gather resources in serial when they could more efficiently be gathered in parallel, leading to excess latency (as shown in Figure 6-1).

Beyond making everything slower, multiple requests attempting to simultaneously read and write from the same resources can create consistency errors. A request that reads data from several independent resources may attempt to prevent inconsistent reads by trying to obtain a lock on every resource for the duration of the transaction. But this may result in deadlock when another request tries to obtain a lock on the same resources in a different order. It’s true that these problems are bugs in the application logic, but they are induced by the fundamental nature of the shared systems those applications are attempting to access—and they manifest only in production.


Figure 6-1. Serial database calls (top) that could be replaced by parallel calls (bottom) to significantly reduce latency
To make matters worse, production problems can compound. As overall load on a database increases, every request to that database becomes slower. Slow requests can in turn increase the chances of inconsistent reads, deadlocks, and other bugs. The deadlocks and inconsistent reads cascade into further failures, which can spread across an entire system.

When investigating all these problems, it’s important to look at patterns of library usage. This puts libraries at the forefront of observability—which means that high-quality telemetry for libraries is critical.

Why Provide Native Instrumentation?
It’s clear that library telemetry is critical. But why is native instrumentation important? What’s wrong with just providing some hooks and letting your users write plug-ins for whatever instrumentation they would like to add—or better yet, just having the observability system dynamically insert everything with auto-instrumentation?

It turns out that writing your own instrumentation has a number of advantages for both you and your users. This section will explain these advantages in some detail.

Observability Works by Default in Native Instrumentation
Observability systems are notoriously difficult to set up, and a big part of why that’s the case is the need to install and instrument plug-ins for every library.

But what if the instrumentation was already there—off by default, but instantly switched on across every library in the application the moment the user installs something to receive the data? And what if that instrumentation all used the same standards to describe common operations, like HTTP requests? This would dramatically lower the barrier for observability.

What’s Wrong with Plug-Ins?
You might be wondering why you need native instrumentation when you could instead provide hooks that let someone else write the plug-ins.

Well, for one, when you delegate key features to a plug-in, you are now dependent on someone else writing and updating it. When you release a new version of your library, it won’t ship with correct instrumentation; until the plug-in author notices and updates the plug-in, your users will have a degraded experience.

More subtly, plug-ins confine your instrumentation to places in which you feel comfortable allowing your users to execute arbitrary code. Plug-ins require hooks into your library’s runtime, which add surface area that you will have to support in the future. Architecture improvements often change which hooks are available, which breaks plug-in compatibility. The more hooks you have, the worse your compatibility problems become.

Finally, plug-ins and hooks add a layer of indirection, which can increase overhead. Whatever data you provide will have to be converted into the format the instrumentation uses, which wastes memory.

Native Instrumentation Lets You Communicate with Your Users
Owning your library’s telemetry facilitates communication. As a library maintainer, you have a relationship and a responsibility to your users. Telemetry is an important part of maintaining this relationship, and it’s important to speak with your own voice. The metrics and traces you provide will power the dashboards, alerts, and firefighting tools that your users need to keep their systems running. You’ll want to warn them when they misconfigure something, exceed the maximum size of a buffer, or experience a failure. You can use the telemetry you produce to communicate with your users about these issues.

One way to communicate with your users is through documentation and playbooks, and another is through dashboards and alerts.

Documentation and playbooks
When you own your observability, you have a precise schema that you can use to explain how your library works.

For example, you can use traces to describe the structure of your library. This gives new users valuable feedback and helps them visualize how they are using your library. There are many ways to use a library incorrectly—for example, performing operations serially when they could be parallelized, suboptimal configuration of caches or buffers, reinstantiating clients or objects rather than reusing them when appropriate, or unintentional mutation of data due to improper use of mutexes. If you show your users what to look for, tracing can make it easy for them to identify common “gotchas” and antipatterns.

You can also create playbooks that document the warnings and errors your library emits and explain how to fix each problem. Many libraries provide configuration options for tuning various parameters. But when should users change these settings, and how can they confirm that they’ve tuned them correctly? Telemetry can form the basis for these instructions.

Dashboards and alerts
Your library will also emit metrics, which should always be designed with a use case in mind. Any library that emits metrics should recommend a default set of dashboards that new users should set up when they start monitoring their application, including common performance metrics that are derived from trace data. If you have explicitly defined the exact telemetry your library emits, it will be easy to describe a default set of dashboards and alerts using the exact attribute names and values your users will need when setting them up.

All of this may sound like extra work, but it’s quite valuable. If you try to add tests to a library built without them, you may discover that it was built in a way that makes it untestable. The same is true for observability: working on observability as you develop, and describing how your users should make use of that observability, will improve your library’s design and architecture. Clear communication is as valuable for the speaker as it is for the listener.

Native Instrumentation Shows That You Care About Performance
Observability can also be thought of as a form of testing. In fact, it’s the only form of testing we have available when running production systems. What are alerts if not tests? “I expect that X will not exceed Y for more than Z minutes” sure looks like a test.

But you can also use observability as a form of testing during development. Generally speaking, developers spend a lot of time testing for logical errors, but very little time testing for performance problems and resource usage. Given how many cascading production problems stem from latency, timeouts, resource contention, and unexpected behavior under load, this is worth revisiting.

As an industry, we have reached a stage at which observability needs to become a first-class citizen. Like testing, observability should be an important and informative part of the development process, not tacked on as an afterthought. And if the library maintainer is not in charge of their own observability, this can never happen.

Why Aren’t Libraries Already Instrumented?
Now that you’ve learned how important library telemetry is, you might be surprised to discover that almost no libraries currently emit any telemetry at all. Library instrumentation is almost always written by someone other than the maintainer and installed after the fact. Why? Two reasons: composition and tracing.

Observability systems don’t compose well. In the past, instrumentation has always been tied to a specific observability system. Picking an instrumentation library has also meant picking a client and a data format.

So what happens if you pick one observability tool and another library picks a different one? The user now has to run two completely separate observability tools. More likely, they have to rely on a third-party agent or integration to translate between your choice and their choice of tools. This is the status quo for most library authors; they emit logs, which can be translated into metrics, and rely on their users to fill in the blanks.

Even something as simple as logging errors can be problematic. Which logging library should you pick? If you have many users, there’s no right answer; some of them use one logging library, and some of them use another. Most languages provide a variety of logging facades to ease this problem, but there’s no truly universal solution. Even logging to stdout will be problematic for some users. As Figure 6-2 shows, no choice a library maintainer can make will be correct in all applications.


Figure 6-2. There is no right answer when different applications use different observability systems
Right out of the gate, then, library authors and maintainers are stuck, because they’re not in a position to choose the observability system. The application maintainer must make this choice, since it affects the entire application.

Tracing is the real blocker for library observability. Juggling multiple logging and metrics systems would be inefficient and annoying, but possible. Where things truly fall apart is with tracing. Since tracing propagates context across library boundaries, it works only if all libraries are using the same tracing system.

A handful of languages offer logging and metrics interfaces capable of interoperating across libraries—Log4j and Micrometer are two examples for Java. But at the time of this writing, no acceptable tracing option is available for library instrumentation, except for OpenTelemetry and its predecessor, OpenTracing. So let’s pivot and look at the qualities that make OpenTelemetry such a good fit for library instrumentation.

How OpenTelemetry Is Designed to Support Libraries
Instrumentation is a cross-cutting concern—that is, a subsystem that ends up everywhere, used by every part of the codebase. Security and exception handling are other examples of cross-cutting concerns.

Normally, sprinkling API calls everywhere would be an antipattern. Compartmentalizing functionality is a best practice in application design, as is limiting the number of places in which different libraries interact. For example, it’s better to encapsulate all of the code that deals with database access in one part of the codebase. It would be alarming to see SQL calls everywhere, mixed in with HTML rendering and all kinds of other code.

But cross-cutting concerns have to interact with every part of an application, so you’ll need to handle the interfaces for these software features with extreme care. In this section, we’ll look at several best practices for writing cross-cutting concerns and show you how following those practices makes OpenTelemetry a good fit for library instrumentation.

OpenTelemetry Separates the Instrumentation API and the Implementation
Earlier we pointed out that while individual libraries emit library-specific telemetry, end users need to make application-wide choices for how to process and export all of that telemetry as a whole. So we have two separate concerns: writing instrumentation for a particular library, and configuring the telemetry pipeline for the entire application. Two separate people handle those concerns: the library maintainer and the application maintainer.

This separation of concerns brings us back to the architecture of OpenTelemetry, which separates the instrumentation API from the implementation for precisely this reason. The library maintainer needs an interface for writing instrumentation for the code they own, and the application maintainer needs to install and configure plug-ins and exporters and make other application-wide decisions.

Transitive dependency conflicts include incompatible versions of an API (discussed later in this section), but they don’t stop there. If that API package itself relies on a large number of dependencies, there is a chance that those dependencies will themselves cause problems.

Splitting the API from the implementation solves this problem. The API itself has almost no dependencies. The SDK and all its dependencies are referenced only once, by the application developer during setup. This means that the app developer can resolve any dependency conflicts by choosing different plug-ins or implementations.

This pattern of loose coupling enables OpenTelemetry to solve the issue of embedding instrumentation into shared libraries that will be installed in many applications with different owners.

OTel Maintains Backward Compatibility
Separating the API from the implementation is important but not sufficient on its own. The API also needs to maintain compatibility across all the libraries that use it.

If the API were to break frequently, with new major versions published on a regular basis, compatibility would be broken. It doesn’t matter if the project correctly follows semver and releases new major versions in a responsible manner. A new major version number would create a transitive dependency conflict, which occurs when an application depends on two libraries, and those two libraries depend on incompatible versions of a third library (Figure 6-3).


Figure 6-3. Two libraries that depend on different major versions of the API cannot be compiled into the same application
To avoid this issue, all OpenTelemetry APIs are backward compatible. In fact, backward compatibility is a strict requirement for the OpenTelemetry project. We have to assume that instrumentation, once written, may never be updated again. Thus, in OpenTelemetry stable APIs are released as v1.0, with no plans to ever release a v2.0. This ensures that any existing instrumentation will continue to work even a decade into the future.

OTel Keeps Instrumentation Off by Default
What happens to instrumentation when a library is installed in an application that doesn’t use OpenTelemetry? Nothing at all. OpenTelemetry API calls are always safe; they will never throw an exception.

In native instrumentation, the OpenTelemetry API is used directly within the library code, without any kind of wrapper or indirection. Because the OpenTelemetry API has zero overhead and is off by default, library maintainers can embed OpenTelemetry instrumentation directly in their code, rather than in a plug-in or behind a wrapper that needs to be configured in order to work.

Why does this matter? Because every library requires a plug-in or a configuration change to enable instrumentation, end users have to do a lot of work to make their applications observable. They might even miss that instrumentation is available as an option!

Imagine an application that uses five libraries (pictured in Figure 6-4). Now there are five places that need configuration, and five opportunities to fail to enable the telemetry that is critical to observing the application.

With native instrumentation, no configuration is needed. As Figure 6-5 shows, when the user registers the SDK, it immediately starts receiving telemetry from all libraries. The user doesn’t have to take any additional steps.


Figure 6-4. Non-native instrumentation requires a lot of configuration

Figure 6-5. All native instrumentation is automatically enabled as soon as the SDK is installed
Shared Libraries Checklist
So what should you do when instrumenting your library? The following checklist of best practices encapsulates what we believe to be a successful approach. If you do the following, you can make your library one of the most observable and operator-friendly libraries available.

Have you enabled OpenTelemetry by default?

It may be tempting to provide OpenTelemetry as an option that is disabled by default. This will prevent your library from automatically enabling instrumentation when the user registers their OpenTelemetry implementation. Remember, the OpenTelemetry API is off by default, activating only when the application owner turns it on. If you add a step by requiring users to configure your library to enable OpenTelemetry, they’re less likely to use it.

Have you avoided wrapping the API?

It might be tempting to wrap the OpenTelemetry API in a custom API, but the OpenTelemetry API is pluggable! If a user wants a different implementation, they can register it as an OpenTelemetry provider, enabling that implementation across all libraries that use OpenTelemetry.

Have you used existing semantic conventions?

OpenTelemetry provides a standard schema for describing most common operations, such as HTTP requests, database calls, and message queues: the OpenTelemetry Semantic Conventions. Review the semantic conventions and make sure your instrumentation uses them everywhere they apply.

Have you created new semantic conventions?

For operations that are specific to your library, use the existing semantic conventions as a guide for writing your own. Document these conventions for your users. If your library has multiple implementations in multiple languages, consider upstreaming your conventions to OpenTelemetry so that other library maintainers can use them.

Have you imported only API packages?

When writing instrumentation, it is sometimes possible to reference an SDK package by mistake. Make sure your library references only API packages.

Have you pinned your library to the major version number?

To avoid creating dependency conflicts with other libraries, it is important to allow your library to take a dependency on any future version of the OpenTelemetry API, up to the next major version. For example, if your library requires an API feature added in version 1.2.0, you should require the version range v1.2.0 < v2.0.0.2

Have you provided comprehensive documentation?

Provide documentation that describes the telemetry your library produces. In particular, make sure to describe any library-specific conventions you have created. Provide playbooks for how to correctly tune and operate your library, based on the telemetry it provides.

Have you tested performance and shared the results?

Use the telemetry you have to create performance tests and provide the results to your users.

Shared Services Checklist
We’ve described how users can compose shared libraries into their applications, but another type of open source system deserves attention: shared services. These are entirely self-contained standalone applications, such as databases, proxies, and messaging systems.

When instrumenting a shared service, all of the best practices for shared libraries still apply. We recommend adding the following as well:

Have you used the OpenTelemetry config file?

Allow users to configure the telemetry your system produces the same way they configure it for all other services: by exposing the standard OpenTelemetry configuration options and environment variables.

Are you outputting OTLP by default?

While it’s fine to include additional exporters and plug-ins, simply providing OTLP over HTTP/Proto as the default exporting option is sufficient. Users can split and transform this output downstream by using a Collector.

Have you bundled a local Collector?

If you are providing a virtual machine or container image, consider providing a version with a local Collector installed for capturing machine metrics and additional resources.

Conclusion
If you can’t write your own instrumentation, it’s hard to produce telemetry. And if you can’t produce telemetry, it’s hard to care about performance. Putting the control—and the responsibility—into the right hands is an important part of how OpenTelemetry is helping people redesign and rethink observability.

We hope that you agree with us, and that this chapter has helped you to consider all the ways you can incorporate observability into your development practice. In five years, we’d like developers to be thinking of runtime observability as being just as important as testing. If you find this inspiring too, please join us in making this dream a reality!

1 Charles Antony Richard Hoare, “1980 ACM Turing Award Lecture: The Emperor’s Old Clothes,” Communications of the ACM 24, no. 2 (February 1981): 75–83.

2 While OpenTelemetry doesn’t plan on releasing a version 2.0, it would be bad practice to recommend taking a dependency on a new major version. So much software is so bad at backward compatibility that users have become accustomed to mistrusting any kind of update, but here, trust that minor version bumps really would be minor version bumps.


Copy

table of contents
search
Settings
Previous chapter
5. Instrumenting Applications
Next chapter
7. Observing Infrastructure
Table of contents collapsed
