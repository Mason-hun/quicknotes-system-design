# QuickNotes System Architecture

## 1. Overview

QuickNotes is a web application that allows users to create, view, update, delete, and organize notes using tags.

The architecture must support growth toward one million registered users while maintaining reasonable performance, availability, security, and data integrity.

The design uses a stateless application layer, a relational database, caching, load balancing, database replication, and asynchronous background processing.

## 2. Requirements

### Functional Requirements

- Users can register and authenticate.
- Users can create, read, update, and delete their notes.
- Users can organize notes using tags.
- Users can retrieve their notes and filter or search them.
- Users can access only resources they are authorized to use.

### Non-Functional Requirements

- **Scalability:** Support increasing traffic and data volume.
- **Availability:** Continue serving requests when an application server fails.
- **Performance:** Retrieve notes with low latency.
- **Security:** Protect credentials and enforce authentication and authorization.
- **Reliability:** Protect stored data and provide recovery mechanisms.
- **Maintainability:** Keep components modular and responsibilities clearly separated.

## 3. Load Estimation

### Assumptions

| Metric | Assumption |
|---|---:|
| Registered users | 1,000,000 |
| Daily active users | 10% = 100,000 |
| Read requests per active user per day | 20 |
| Write requests per active user per day | 2 |
| Average new note content size | 2 KB |
| Peak-to-average traffic multiplier | 5× |

These are planning assumptions rather than measured production data.

### Read Throughput

Daily read requests:

100,000 active users × 20 reads = 2,000,000 reads/day.

Average reads per second:

2,000,000 ÷ 86,400 ≈ 23.1 reads/second.

Estimated peak reads per second:

23.1 × 5 ≈ 116 reads/second.

### Write Throughput

Daily write requests:

100,000 active users × 2 writes = 200,000 writes/day.

Average writes per second:

200,000 ÷ 86,400 ≈ 2.31 writes/second.

Estimated peak writes per second:

2.31 × 5 ≈ 11.6 writes/second, or approximately 12 writes/second.

### Annual Storage Growth

Assume each active user creates two notes daily, with each note containing an average of 2 KB of content.

Annual storage growth:

100,000 × 2 × 365 × 2 KB = 146,000,000 KB.

Using decimal storage units, this is approximately 146 GB of new note content per year.

This estimate excludes indexes, metadata, database overhead, backups, replicas, and existing notes. Actual storage requirements would be higher.

### Interpretation

The estimated workload is read-heavy, with approximately ten read requests for every write request.

This suggests that caching and read replicas may improve performance. However, these components should be evaluated against actual traffic, cache effectiveness, consistency requirements, and database performance.

## 4. Architecture Diagram

```text
                    Users / Browser
                          |
                          v
                       DNS
                          |
                          v
                    CDN / HTTPS
                          |
                          v
                  Load Balancer (HA)
                          |
              +-----------+-----------+
              |           |           |
              v           v           v
          App Server 1  App Server 2  App Server 3
              |           |           |
              +-----------+-----------+
                          |
                 +--------+--------+
                 |                 |
                 v                 v
             Cache Layer       Message Queue
                 |                 |
                 v                 v
          Primary Database    Background Workers
                 |
                 v
          Read Replica(s)

          Primary Database
                 |
                 v
          Backup / Recovery
```

The cache stores frequently requested data, while the primary database handles writes. Read replicas serve suitable read queries. The queue and workers handle background tasks asynchronously.

In production, the load balancer, cache, queue, and database must also be deployed with appropriate redundancy to avoid becoming single points of failure.

## 5. Component Responsibilities

| Component | Responsibility |
|---|---|
| Browser / Client | Displays the application and sends HTTP requests to the API. |
| DNS | Resolves the application's domain name to the appropriate network destination. |
| CDN / HTTPS | Terminates or supports secure HTTPS delivery and serves cacheable static assets from distributed locations. |
| Load Balancer | Distributes incoming requests across healthy application servers. |
| Application Servers | Validate requests, enforce authorization, execute application logic, and communicate with other services. |
| Cache | Stores frequently accessed data to reduce database queries and response latency. |
| Primary Database | Stores authoritative application data and processes writes. |
| Read Replicas | Serve suitable read queries to reduce load on the primary database. |
| Message Queue | Holds background jobs until workers process them. |
| Background Workers | Perform asynchronous tasks such as notifications, analytics, or other non-immediate processing. |
| Backup / Recovery | Provides a recovery path after data loss, corruption, or infrastructure failure. |

The application servers are stateless: they do not depend on local memory to preserve essential user or application state between requests. Shared state lives in the database or appropriate shared services.

## 6. Request Flow: GET /notes

1. The user opens QuickNotes and requests their notes.
2. DNS resolves the application domain.
3. The browser establishes an HTTPS connection and sends the request through the load balancer.
4. The load balancer routes the request to a healthy application server.
5. The application server validates the access token and checks authorization.
6. The server checks the cache for the requested user's notes.
7. If valid cached data exists, the server returns it.
8. If the cache misses, the server queries the database, using a read replica when appropriate.
9. The server returns the notes as a JSON response.
10. If suitable, the result is cached for subsequent requests.

Cache entries must be scoped to the authorized user and invalidated or updated when relevant notes change. This prevents users from receiving another user's cached data.

## 7. Request Flow: POST /notes

1. The user submits a note through the frontend.
2. The browser sends a `POST /api/v1/notes` request containing JSON over HTTPS.
3. The load balancer routes the request to a healthy application server.
4. The server validates the access token, request body, and user's authorization.
5. The server validates the title and other applicable fields.
6. The application writes the new note to the primary database.
7. After the write succeeds, the server returns `201 Created` with the created note.
8. Relevant cache entries are invalidated or updated.
9. Any non-critical background work can be submitted to a queue for asynchronous processing.

The client should not receive a success response before the database write has succeeded.

If cache invalidation or background-job publication fails, the application needs a defined recovery strategy. For important events, a transactional outbox can help ensure that database changes and event publication are coordinated reliably.

## 8. Trade-Offs

### Caching vs. Data Freshness

Caching reduces database load and can improve response time. However, cached data may become stale after a note is updated or deleted.

QuickNotes should use clear expiration and invalidation rules. User-specific note data must be isolated by user identity, and sensitive data must not be exposed through incorrectly shared cache entries.

### Read Replicas vs. Consistency

Read replicas can increase read capacity, but replication may be asynchronous. A newly created or updated note might not appear immediately on a replica.

Writes should go to the primary database. Where users expect to see their own latest changes immediately, the application can temporarily read from the primary or use another strategy that provides read-after-write consistency.

### More Infrastructure vs. Operational Complexity

Caches, replicas, queues, and multiple application servers can improve scalability and resilience. They also increase infrastructure costs and introduce additional failure modes.

QuickNotes should introduce these components when measured demand, reliability requirements, or operational needs justify them.

### Availability vs. Consistency

A distributed system must decide how to behave during network partitions and component failures.

For note creation and updates, preserving data integrity is important. The system should avoid reporting a write as successful when the authoritative database has not accepted it.

Some non-critical operations, such as analytics processing, can tolerate eventual consistency.

## 9. Avoiding Single Points of Failure

- **Application servers:** Run multiple instances and use health checks so traffic can be routed away from unhealthy instances.
- **Load balancing:** Use a highly available load-balancing service or redundant load balancers.
- **Database:** Configure a highly available primary database with standby or failover capability, backups, and tested recovery procedures.
- **Read replicas:** Monitor replica health and replication lag, and provide a fallback strategy if a replica becomes unavailable.
- **Cache:** Avoid making cached data the only copy of important information. Define a safe fallback when the cache is unavailable.
- **Message queue:** Use durable, replicated queue infrastructure where supported, with retry and dead-letter handling for failed jobs.
- **DNS and networking:** Use reliable managed services and appropriate redundancy.
- **Backups:** Maintain backups and regularly test restoration rather than assuming backups alone guarantee recovery.

Redundancy reduces the risk of a single failure taking down the application, but it does not eliminate every failure. Monitoring, alerts, recovery procedures, and regular testing remain necessary.

## 10. Conclusion

QuickNotes uses a stateless application tier behind a load balancer, a primary relational database with read replicas, caching for suitable reads, and a queue for asynchronous work.

The estimated workload is read-heavy, making caching and read scaling useful candidates for optimization. Database writes remain authoritative, and consistency, authorization, cache invalidation, and recovery procedures must be designed deliberately.

The architecture should evolve based on measured traffic, bottlenecks, reliability requirements, and operational cost rather than adding complexity without evidence.