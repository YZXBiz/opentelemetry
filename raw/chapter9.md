Skip to Content
Chapter 9. Rolling Out Observability
Just because the standard provides a cliff in front of you, you are not necessarily required to jump off it.

Norman Diamond

Telemetry is not observability, as we’ve said in previous chapters. It’s a necessary part of observability, but it’s not sufficient in itself. So if telemetry isn’t enough, what are the other factors you should consider when rolling out observability to your organization, team, or project? This chapter answers that question.

We’ve written this chapter with a broad audience in mind—not just site reliability engineers (SREs) or developers, not just engineering managers or directors. The true value of observability lies in its ability to transform organizations, and to provide a shared language and understanding around how software performance translates into business health. Observability is a value, in the same way that trust and transparency are values. Observability is a commitment to building teams, organizations, and software systems in ways that allow you to interpret, analyze, and question their results so you can build better teams, organizations, and software systems.

This task is not for any one individual or group. It requires an organizational commitment, bottom to top, around how to use data as an input to processes, practices, and decision making. To that end, this chapter presents several case studies of organizations and projects that have implemented OpenTelemetry and uses them to present roadmaps that can help guide your organization to a successful observability rollout.

The Three Axes of Observability
As you roll out observability, you’ll need to answer many questions and make many decisions, but they can all roughly be placed on the following three axes:

Deep versus wide
Is it better to start by collecting incredibly detailed information from a few parts of the system, or to get a lot of data about the overall system and its relationships first?

Rewriting code versus rewriting collection
Should you spend effort on adding net-new instrumentation to existing or new services or on transforming existing data into new formats?

Centralized versus decentralized
What makes more sense for your use case: creating a strong central observability team or using a lighter touch?

There really is no wrong answer to any of these questions, and the answers will change over time. The short case studies in this chapter illustrate the trade-offs you’ll face as you move toward either extreme.

Deep Versus Wide
OpenTelemetry usually isn’t most software organizations’ first observability framework. They generally have plenty of existing open source metrics libraries and processors, log-aggregation agents and processors, and proprietary APM tools. When OpenTelemetry is being rolled out, then, an inevitable question is, what is this replacing?

We’ve seen well-intentioned platform teams or engineering leaders bring in exciting new technologies only to come up short when things get hard. You might have experienced this yourself. Changing macroeconomic conditions have led to many observability projects being canceled or reduced in scope, or struggling to elucidate their value when budgets are discussed. Often, this stress can directly be traced to the team failing to answer the “deep versus wide” question in a way that makes sense for the organization.

Let’s assume that you’re not building a completely new tech stack from the ground up. The best way to figure out whether you need deep or wide observability is to look at the biggest problem you’re trying to solve. Then ask how much of the system you can change from where you sit in the organization. If you’re working on a team with a large remit, such as a platform team or a central observability team, then going wide first will provide the most value to the rest of the organization. If you are on a service team, it’s probably better to go deep at first, so you can get value from observability more quickly.

Going deep
To elaborate, let’s look at a large financial-services organization that recently migrated to OpenTelemetry. The team that drove this effort had initially migrated between two proprietary APM tools. After this migration, the team’s GraphQL traces became isolated from the rest of the system, which spanned multiple clouds, languages, and teams. This presented a problem, since GraphQL eschews standard HTTP semantics and embeds a great deal of metadata about failures in the response body of traces. Relying on disconnected APM traces meant the team had little visibility into where errors were occurring or their downstream impact.

The team opted for OpenTelemetry because it offers a standards-based approach for establishing context, as well as built-in instrumentation for GraphQL libraries in JavaScript. Why did the team focus on GraphQL? That was what it owned, first of all. In a large software organization, where ownership of services is highly compartmentalized by team, it wouldn’t have been feasible to try to get everyone using OpenTelemetry out of the gate. This team didn’t control a central platform or a particularly critical service bus that it could leverage to drive adoption.

Second, OpenTelemetry’s trace-first approach proved valuable in handling GraphQL’s challenges. OpenTelemetry’s traces offered a rich set of detail about the status and dispensation of each call, which was difficult to get from HTTP-level metrics. (Recall that GraphQL embeds errors in messages rather than using semantic status codes.) The extensibility of OpenTelemetry allowed the team to integrate it with other teams’ non-OpenTelemetry tracing headers, ensuring that trace context wasn’t broken.

Ultimately, the team’s decision to go deep into GraphQL was mostly driven by the organization’s charter and responsibilities. The team had to keep these services up, provide high-quality telemetry to the whole organization, and interoperate with a variety of other telemetry backends and SDKs.

Going wide
The other extreme—going wide—can be seen in more modern organizations that have an existing tracing and observability solution. One SaaS startup encountered these challenges when migrating from its existing OpenTracing-based libraries to OpenTelemetry. Unlike the earlier firm, this organization had a significantly less sprawling service topology. It ran in a single public cloud on top of Kubernetes, and its services were written in Go.

In this case, going wide was an easy decision. The system was well-architected for observability, and all the team needed to do was update from one library to another. That said, the team still ran into challenges. Have you ever heard of the Hippocratic oath taken by new physicians? It begins, “First, do no harm.” The Hippocratic Oath of Migrations is “First, break no alerts.” That’s the foremost challenge when doing any large-scale replacement of an existing telemetry system.

In this case, a handful of engineers performed the migration by updating framework instrumentation libraries in a pre-production environment and then analyzing the dashboards and alerts to see if anything disappeared. What they discovered is that things looked good at first glance, but there were many subtle differences between the old and new telemetry. For example, metrics that used to measure bytes would now measure kilobytes. Attribute values that previously were case sensitive no longer were.

To ensure that alerts, dashboards, and queries didn’t break and impact the ability of operators to continue running the system, the team elected to run the new telemetry in pre-production alongside the old telemetry in production. Another option would have been to run both the old and new telemetry side by side in the same environment and use feature flags to slowly migrate traffic over. However, the team ruled that out because of the time and overhead involved.

When going wide, patience should be your watchword. The migration presented some surprises that required changes to the system itself and bug fixes in OpenTelemetry. It’s hard enough to roll out a complex instrumentation library aggressively in a fairly homogeneous environment. The more complex your architecture, the more difficult it becomes. In this case, two things helped the team. First, as mentioned, this system was already highly observable. Each service used a custom wrapper library that ensured requests were traced and custom attributes were applied. Second, like many cloud native applications, this system used HTTP and gRPC proxies for all service-to-service communication. The team integrated tracing at these proxies, making it significantly easier to get trace data about each request and ensuring that context was propagated or created on new requests.

Patience and preparation paid off for this organization. Over the course of about a month, the engineers successfully migrated and rolled out OpenTelemetry across their entire fleet of backend services and performed a gradual transition between old and new, without dropping data or incurring service downtime. Engineers didn’t even realize that anything was changing until they saw better data show up in their investigations!

Table 9-1 summarizes the trade-offs of going deep versus going wide.

Table 9-1. Deep versus wide: instrumentation approaches
Deep instrumentation	Wide instrumentation
Focuses heavily on a single team, service, or framework
Is quick to provide value, especially if instrumentation libraries exist
Can integrate into existing solutions with custom code (such as propagators)
Is a good place to start in larger organizations or ones without a larger observability practice in place	Focuses on rolling out instrumentation across as many services as possible
Can require more up-front work, depending on the system architecture
Generally requires a complete migration, or affordances to run side by side
Provides more value over the long run by giving insight into the overall system model
Code Versus Collection
You’ve learned throughout this book that OpenTelemetry is an entire ecosystem of tools that generate, collect, and transform telemetry data. This axis asks you to consider which is more important to you right now: generating that data, or collecting and transforming it. If the deep/wide axis asks how complex or embedded your existing telemetry system is, the code/collection axis asks where you sit in your organization and for what part of the system you are responsible.

While there’s no one-size-fits-all approach to team organization, observability is often driven by “platform teams” or other loosely centralized groups of SREs. These teams have broad oversight of the actual infrastructure of collecting telemetry from thousands of services and centralizing it into an observability backend. You may be part of—or leading—one of these teams yourself. We’ve seen, in our discussions with engineering leaders across the industry, that OpenTelemetry adoption is primarily driven by these groups. However, there is another pole: the service team, which might want to adopt a particular facet of telemetry, such as distributed tracing. The distance between these two positions leads to a common question: do I need to use the Collector or not?

OpenTelemetry doesn’t inherently require using a Collector to gather and export data. That said, we recommend it. When this question comes up, though, the real problem is often the split between code and collection, a distinction that has more to do with where you sit in an organization than it does with architecture or system design.

Ideally, adopting OpenTelemetry involves both code and Collector, with usage and implementation of one part pushing the other forward. For example, eBay began a project in 2021 to adopt distributed tracing by using OpenTelemetry. While the organization did its evaluation, the SREs investigated whether the Collector could replace their existing metrics and log-collection infrastructure.

In the case of eBay, the Collector offered significant performance improvements over its existing solution, as well as normalizing telemetry collection into a single agent rather than having different ones for traces, metrics, and logs. This consolidation made a lot of sense, especially since eBay needed to deploy Collectors anyway to perform trace collection at its scale (hundreds of clusters, some with thousands of nodes).

There are other advantages to “Collector-first” models. For instance, if you roll out the Collector widely across your organization’s infrastructure, you can pave the way for service teams to integrate OpenTelemetry into their code. In addition, you can leverage the Collector’s plug-in architecture to pull data from existing systems and send it to existing or new observability backends.

When does it make sense to integrate OpenTelemetry and go straight to an observability backend? Again, there’s no hard-and-fast rule. If you’re working with only a single signal, such as traces, this might be a good option at first. In addition, if you’re doing some sort of proof of concept, designating Collector architecture and infrastructure monitoring as a “day two” sort of project may help you get value out of OpenTelemetry quickly.

When we’ve spoken with developers who are working to bootstrap OpenTelemetry quickly—for example, as part of a hackathon or “20% work”—we’ve found that it makes more sense for them to dive straight into code-first instrumentation, even if they have to back those changes out later as they go to production. Why? One developer referred to it as “demonstrating the art of the possible”—showing the rest of their team what could be accomplished, getting buy-in, and building support for migrating to OpenTelemetry. At that point, the work could change over to deploying the necessary infrastructure for collecting metrics and logs using the Collector and rolling out automatic instrumentation for traces, before returning to custom instrumentation to get more value out of their new telemetry system.

Ultimately, this question isn’t about a single best practice. It has a lot more to do with how your team and organization are structured. We’ll touch on this further in the next section, but it’s really about separation of concerns. If you’re an SRE or a platform engineer, your focus should be on observability pipelines, telemetry collection, and setting “rules of the road” for service teams. If you’re a developer, whether frontend or backend, you’ll want to focus on creating descriptive and accurate telemetry data, with help from your platform team.

Centralized Versus Decentralized
Bottom-up or top-down? Every organization that adopts OpenTelemetry is going to have a variety of stakeholders driving the project. However, the two most common patterns are (1) to have a central observability and platform team mandate adoption, and (2) to have individual service teams promulgate adoption through osmosis.

Sometimes this question isn’t about the size or complexity of a software system but about the teams and organizations supporting it. In our experience, larger organizations (with, say, 250 or more engineers) handle their observability practices in two main ways. Cloud native and extremely large organizations often have a centralized platform-engineering team that provides monitoring as a service to its peer teams, who need to use their frameworks to deploy software to production. More traditional large organizations may not have this central platform function, or at least it may not be as well defined. In these organizations, work tends to be more project-oriented than continuous-delivery-based, and features or services are deployed with bespoke monitoring stacks and tooling.

Decentralized observability tends to appear in small to midsize organizations, as well as in more “legacy” ones. In smaller organizations (where tooling is often available on a best-effort basis), the overall system usually isn’t complex enough to need or want the strong guardrails provided by a central platform team. Midsize or legacy organizations may be complex, but different services are less interconnected. In these cases, central ownership is less important, because each team is responsible for its own monitoring and alerting. This is often paired with central alerting functionality that rolls up into an IT function, using some sort of IT service management offering. To paint with a somewhat broad brush: these organizations often rely on software, but software is not their primary output.

Let’s look at how Farfetch rolled out OpenTelemetry. This large organization (with more than two thousand engineers, working on top of Kubernetes) began migrating to OpenTelemetry in January 2023. The migration was driven by leadership initiatives to improve performance and reliability and to continue adopting observability practices across the organization. At Farfetch’s scale, a central platform-engineering team was crucial in order to roll out OpenTelemetry without disrupting existing work streams and alerting and monitoring functions.

The Farfetch platform team rolled out a Collector-driven approach to OpenTelemetry, using the Collector to monitor each Kubernetes cluster. With this infrastructure in place, teams could self-select into OpenTelemetry features by deploying automatic or manual instrumentation. This allowed the platform team to spend more time ensuring high data quality by improving its pipelines, setting up guidelines for service teams adopting OpenTelemetry, and creating custom processors and semantic conventions.

The decentralized approach, in contrast, looks a bit more like the example in “Deep Versus Wide” of the team that instrumented its GraphQL services. Indeed, all three of the axes explored here are asking very similar questions: who is driving OpenTelemetry implementations, and how much of the organization can they touch?

In our experience, successful OpenTelemetry implementations start at the top. To really derive the full value of end-to-end observability, you need to integrate OpenTelemetry into a sufficiently large amount of your system to allow you to ask and answer interesting questions. This usually means touching a lot of your software, and in some cases making hard decisions about backward compatibility. Without a high-level sponsor, this work can often get relegated to “20% time” or other backburners and stall out. We’ve found that the best way to gain adoption of OpenTelemetry is to achieve critical mass quickly. Once enough of your system is instrumented, even with automatic instrumentation, you can start to answer interesting performance questions. This shouldn’t take that long; time-box it to weeks or months, if you can, and focus on end-to-end, customer-facing endpoints.

This isn’t always the case. For instance, if you’re operating an “enclosed” service or architecture, such as a CI/CD system, you might not need a broad mandate to implement OpenTelemetry. Similarly, if you’re responsible for some sort of service bus or other multitenant infrastructure, you can often add tracing without requiring broad adoption, as long as your service is the terminal one for many types of data (and thus your customer is mostly yourself or teams that use the shared infrastructure). These are excellent places to start your OpenTelemetry implementation; they provide immediate utility and value without requiring broad changes to upstream services.

Regardless of your organization’s size or shape, keep in mind a few broad maxims as you roll out OpenTelemetry and observability:

Do no harm, break no alerts.
Don’t break existing alerting or monitoring practices out of the box. Make sure you’re comparing old functionality to new functionality as you migrate.

Prioritize value.
What are you getting out of OpenTelemetry? More consistent telemetry data? More options thanks to reducing vendor lock-in? A better understanding of end users’ experience? Identify the value you’re getting and state it repeatedly throughout your rollout to keep everyone focused.

Don’t forget the business.
OpenTelemetry and observability are great technologies, but what’s really great about them is making the telemetry data useful to the entire organization. Be sure to involve all necessary stakeholders, and ask them to consider how this data can help them as well.

Moving from Innovation to Differentiation
OpenTelemetry, like observability more generally, is still in the process of “crossing the chasm.” This concept, popularized by Geoffrey Moore, analyzes how technology moves from early adopters to an early majority. If you’re reading this book, you’re likely part of the second group: you’ve heard about OpenTelemetry, you recognize its value, and you’re ready to start building with it.

What’s next, then? Once you’re part of the early majority and you’ve implemented OpenTelemetry in your organization or team, how do you move forward? This section discusses several emerging topics in the field and how they can help you differentiate your OpenTelemetry architecture and deployments to gain an advantage for your organization.

Observability as Testing
The point of unit and integration testing is to validate that your applications respond in an expected way to predetermined inputs. What if you used traces and metrics to achieve the same outcome?

The basic idea of observability-based testing is that your tests are a way to compare the behavior of a system against a known good (or predefined) state. You use OpenTelemetry to trace your services and then record traces with predefined state (for example, a sample customer order in an ecommerce system) and save them. Then, on some regular cadence (such as after a deployment or as part of a canary release), you rerun the same test with the same state and compare the traces.

This can be extended or modified in a variety of ways. You can record specific metric measurements or set acceptable ranges for values, compare them at specific times in an application’s or service’s lifecycle, and then use those measurements as inputs to a continuous delivery tool to put a quality gate on canary releases (so you can be sure that new code isn’t making performance worse, or causing problems, before it rolls out to all users).

To take it a step further, you can even add tracing and profiling to your continuous integration and delivery tooling. Use it to profile deployments and builds!

Green Observability
As responsible technologists, we must consider the economic and environmental impact of our software. OpenTelemetry can aid in this pursuit. Ongoing work in the financial operations (FinOps) space aims to create standard metadata around cloud costs, in terms of both on-demand pricing information and CO2 emissions. We expect this telemetry to be integrated with OpenTelemetry in the future, providing insights on those costs for individual services or even specific API calls.

As this data becomes more readily available over the next few years, consider how you can use it not only to optimize spending but also to reduce emissions. Future regulations could make this even more important, especially in the EU.

AI Observability
As we write this book in 2024, generative AI has become the hot topic. Organizations large and small are hopping onto the hype train, excited about how ChatGPT or Copilot will soon revolutionize the way we live and work. While we make no comment about the correctness of these bets, large language models, such as Llama and GPT, appear to offer a great deal of value in the field of human-computer interaction in plain language.

Many complex legal, ethical, and even moral arguments and debates have arisen around AI. However, it’s clear that if people are to use these technologies, we must have observability for them.

There are three main use cases for observability in AI:

Understanding how a model (and vectors, or modifications to the model) is trained in order to accurately trace and monitor changes to the model itself

Understanding how the model works in action, such as using traces to correlate retrieval decisions with model outputs

Understanding the user experience of chat-like queries and the model’s responses

To elaborate on the third point: it’s extremely important for developers who are integrating generative AI to know how satisfied (or dissatisfied) users are with the model’s responses to their queries. Collecting tracing data on calls to a model API (or local model) can be extremely valuable in this case. You can even use sampling techniques to preserve specific traces where users were very unhappy—or happy—with the results, for further training and iteration.

We expect generative AI to become an area of increasing focus, with specialized observability analysis tooling being created and released to allow for deeper insights into training and model processing. We are eager to learn how OpenTelemetry can be used to glean insights from these systems.

OpenTelemetry Rollout Checklist
If you work in a large organization consisting of many independent software teams, rolling out a new observability system can be daunting. Since OpenTelemetry is a trace-based system, an organized rollout is critical for unlocking all the value it provides.

We have found over the years that a set of fundamentals is required in order for any OpenTelemetry rollout to succeed. We would like to end this book with a checklist of these best practices. If any of these appear to be missing from your rollout plan, make sure to address them!

Is management involved?

If you are a software engineer trying to coordinate a rollout, get management involved! It is their job to manage priorities and define backlogs for software teams. Having management actively involved helps avoid a situation in which teams have conflicting priorities and engineers end up trying to perform a rollout in their spare time.

Have you identified a small but important first goal?

Observability is a general practice that applies to everything in production. But when kicking off a rollout, having a particular goal in mind is important. This should be a specific transaction that is currently experiencing issues or is very important to your organization—the checkout transaction in an online store application, for example. Use this goal as a guide star for your initial rollout.

Are you implementing only what you need to accomplish your first goal?

Coordinating every single service team across an entire organization can be daunting. But if you are focused on a specific transaction, the number of services involved in that transaction may be only a small subset of the distributed system. Remember, tracing works only after every service participating in the transaction has OpenTelemetry enabled. Make sure that at minimum, the service teams involved in your first goal are coordinating their efforts to stand up OpenTelemetry. At all costs, avoid a patchwork rollout.

Have you found a quick win?

As soon as you have your first valuable transaction instrumented end to end, dig into observing it. If your organization has never used tracing before, chances are high that you will discover a way to either reduce latency or get to the bottom of a pernicious error. Since the transaction is valuable, improving it is valuable. This is your first quick win! Use this success to inspire other teams and services to prioritize the OpenTelemetry rollout. Pick a second goal, then a third goal, and keep going until the entire system ends up under observation.

Have you centralized observability?

If there is an in-house framework or other library that is widely used across many services, you can use it as a jumping-off point for installing and bootstrapping OpenTelemetry. If an infrastructure team has a way to inject OpenTelemetry agents and other forms of auto-instrumentation, partner with it. The less work individual application teams have to do themselves, the better.

Have you created a knowledge base?

OpenTelemetry provides a lot of documentation. But that documentation is very generalized and is not specific to your organization. By creating a knowledge base that provides installation instructions and troubleshooting tips that are specific to your organization, you can save your application teams from having to reinvent the wheel every time they go to instrument a new service.

Can your old and new observability systems overlap?

You don’t want a rollout to create a blackout. Remember, just because you are installing a new telemetry system, it doesn’t necessarily mean you have to uninstall the old system simultaneously. If there is a way to run both the new and the old observability systems at the same time, you can populate the dashboards and alerting tools in your new system while continuing to rely on your old system. Once the dashboards in your new system are populated with enough data to be useful, you can turn the old system off and avoid having a blackout period in which your system is not observable.

Conclusion
If you’ve reached this point, then congratulations—you’ve learned OpenTelemetry! Over the past nine chapters, we’ve laid out a vision and case for why and how OpenTelemetry should be your strategic choice as an observability framework. It standardizes and streamlines the essential telemetry data that you need for your observability practice, and it helps you break free from a traditional “three pillars” mindset and move toward a correlated braid of rich telemetry data.

The end of one journey is the start of a new one, though, and we hope that finishing this book marks your first step toward building more observable and understandable systems. Perhaps it’s inspired you to contribute to OpenTelemetry as well—if so, we would love to have you! Appendix A describes how to get involved and how the project is governed. Appendix B collects some links and further reading on both OpenTelemetry and observability more generally.

Finally, we’d like to thank you for your time. It’s been our pleasure to write this book for you, and we hope you get as much out of it as we put into it. Best of luck in all you do. Remember—you’ve got this! Now get out there and build something cool.


table of contents
search
Settings
Previous chapter
8. Designing Telemetry Pipelines
Next chapter
A. The OpenTelemetry Project
Table of contents collapsed
