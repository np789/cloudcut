# Task 1: Database Design Decisions

## 1. Normalize vs Denormalize
Fully normalized: Users, Workspaces, and Projects are separate tables linked by foreign keys.
Timeline data (Clip, Track, Effect) is normalized for correctness — changing an asset's metadata
shouldn't require updating every clip that uses it. JSON columns are used for `settings`,
`transform`, and `metadata` because these are flexible bags of properties that don't need
to be queried individually (no WHERE clauses on fps or rotation values).

## 2. Soft Delete Strategy
`deletedAt` timestamp on User, Project, Asset, and Clip. Queries always add `WHERE deleted_at IS NULL`.
Cascade: deleting a Project soft-deletes its Clips and Assets via a cleanup cron job (not DB cascade),
giving a 30-day recovery window. Hard deletes happen in the cleanup job after 30 days.

## 3. Why track_position_ms (absolute) instead of relative-to-previous-clip?
Absolute positions make reads O(1) — to find what clip is at timecode T, just query
`WHERE track_position_ms <= T AND (track_position_ms + duration_ms) > T`.
Relative positions would require fetching and summing all prior clips on the track —
an O(n) read. More importantly, deleting or moving one clip would require updating
all subsequent clips, creating race conditions in collaborative editing.

## 4. OperationLog growth management
Partition by month using PostgreSQL declarative partitioning:
`PARTITION BY RANGE (created_at)`. Create new partitions monthly via a cron job.
Archive partitions older than 90 days to cold storage (S3 Glacier). Drop partitions
older than 1 year. This keeps the hot partition small while retaining history.

## 5. Storage estimation: 1,000 users × 10 projects × 30 clips
- users: 1,000 rows (~200 bytes each) = ~200 KB
- workspaces: ~1,000 rows = ~100 KB
- projects: 10,000 rows = ~2 MB
- clips: 300,000 rows (~400 bytes each) = ~120 MB
- clip_effects: ~900,000 rows (avg 3 per clip) = ~360 MB
- operation_logs: ~10M rows (100 ops/clip avg) = ~4 GB (partitioned)
Total hot storage: ~500 MB PostgreSQL data. Manageable on a single instance.

# Task 2: API Design Decisions

## 1. Why cursor-based pagination instead of offset?
OFFSET pagination requires the DB to scan and discard all rows before the offset —
slow on large tables. Cursor pagination uses the last item's ID as a pointer,
letting the DB use the index directly (O(log n) vs O(n)). It also handles insertions
correctly: if a new project is added while paginating, offset-based would skip or
duplicate items. Cursors are stable.

## 2. Presigned upload flow — why not upload through the backend?
Routing a 500MB video through NestJS means: (a) the request blocks a Node.js worker
for the duration of the upload (minutes), (b) the file sits in memory or on disk
on the API server, (c) you pay double bandwidth (client → server → S3).
With presigned URLs: client uploads directly to S3, API server only handles metadata.
The server generates a time-limited (15 min) signed URL that lets the client PUT
directly to the specific S3 key. Confirm-upload then triggers the processing pipeline.

## 3. Batch clip operations — atomic or partial? Why?
Atomic (Prisma $transaction). Timeline operations must be consistent — a "move 5 clips
right by 2 seconds" that partially fails leaves the timeline in an impossible state
(some clips moved, others not), breaking playback ordering. Transactions ensure
all-or-nothing. The tradeoff is that a single invalid clip ID fails the entire batch,
but that's the correct behavior for a timeline editor.

## 4. API versioning strategy for breaking changes
URL versioning: /v2/projects/:id. The v1 route stays alive for a deprecation window
(typically 6 months). We add a Deprecation: true header to v1 responses to signal
clients to migrate. For non-breaking additive changes (new optional fields, new
endpoints), no versioning needed. Schema versioning is tracked in a separate
API changelog document.

# Task 3: Queue & Processing Design Decisions

## 1. Why BullMQ over Cloudflare Queues / SQS?
BullMQ runs on Redis (which we already have for caching), so zero added infrastructure cost.
It supports job progress events, priority queues, repeatable jobs, and rate limiting natively.
SQS is better for massive scale (millions of jobs/day) and cross-region durability, but adds
AWS cost and latency. Cloudflare Queues is serverless-native — great for Workers but awkward
to integrate with a NestJS server process. BullMQ is the right choice for a self-hosted Node.js app.

## 2. ffmpeg.wasm on Node.js — how well does it work? Limitations?
It works, but with caveats: (a) It's 2-5x slower than native ffmpeg because it runs in a
WebAssembly sandbox. (b) Each FFmpeg instance loads ~30MB of WASM — memory pressure with
concurrent jobs. (c) No GPU acceleration. (d) The WASM binary must be fetched from CDN or
bundled locally. For production, native ffmpeg via child_process is preferred. For this
prototype, ffmpeg.wasm is zero-install and works on any OS.

## 3. 30-minute video — will memory hold?
A 30-minute 1080p video is ~3-4GB uncompressed in memory. Node.js on a typical server has
1-4GB heap. Strategy: (a) Process in chunks — trim each clip to the exact segment needed
rather than loading the full source, (b) Use streams where possible, (c) Set --max-old-space-size
to 4096 for the Node process, (d) In production, use native ffmpeg which streams rather than
loading to memory.

## 4. Dead letter queue — what happens to jobs in the DLQ?
Jobs land in the DLQ after exhausting all retry attempts. Actions: (a) Alert via Slack/email
using a BullMQ event listener on 'failed', (b) Log to DB with full error context,
(c) Allow manual re-queue via an admin API endpoint, (d) Investigate root cause before
re-queuing (corrupted file, out-of-memory, S3 permission issue etc.).

## 5. Cost estimate: 1 export job (1080p, 5 minutes)
- Compute: ~5-10 minutes of CPU time on a t3.medium ($0.04/hr) = ~$0.003-0.006 per export
- S3 storage: 5-min 1080p MP4 ≈ 500MB → $0.011/GB/month = $0.005/month per file
- S3 transfer: 500MB download (source) + 500MB upload (output) = 1GB → $0.09/GB = $0.009
- Total per export: ~$0.02-0.03
- At 1000 exports/month: ~$20-30/month

# Task 4: Collaboration Design Decisions

## 1. Why Pusher over self-hosted WebSocket?
Self-hosted WebSockets require: a persistent server process, sticky sessions for load balancing,
handling reconnects/heartbeats, and operational monitoring. Pusher handles all of this and
provides a free tier of 200k messages/day — enough for a prototype with dozens of users.
The tradeoff is a per-message cost at scale and less control over the transport layer.

## 2. Client events vs server events — why are cursor positions client events?
Client events (prefixed client-) go directly peer-to-peer via Pusher without hitting our server.
Cursor positions update ~10 times/second per user — at 5 collaborators that's 50 req/sec hitting
your NestJS server if they were server events. More critically, cursor positions don't need to
be persisted (nobody cares where your cursor was 2 seconds ago). Client events are the right
tool for ephemeral, high-frequency, non-persistent data.

## 3. Offline reconnect — syncing missed operations
When a client reconnects, it sends its last known OperationLog ID (or timestamp) to:
GET /projects/:id/operations?since=2025-01-01T00:00:00Z
The server returns all operations since that point, ordered by createdAt.
The client replays them in order against its local state. This is last-write-wins (LWW):
later operations overwrite earlier ones for the same property.

## 4. Optimizing Pusher message frequency
Batch small updates: instead of sending one Pusher event per effect slider change (which fires
many times/second while dragging), debounce 300ms and send one event after the drag ends.
For cursor moves, throttle to every 100ms max. Group related changes (e.g. moving 5 clips at
once) into a single broadcast instead of 5 separate events.

## 5. Scaling beyond Pusher
Options: (a) Ably — similar API, higher limits; (b) Socket.io with Redis adapter for horizontal
scaling of self-hosted WebSockets; (c) Cloudflare Durable Objects for edge-native real-time.
The migration path: keep the same event/channel naming convention, swap the Pusher SDK for the
new provider's SDK in both pusher.service.ts and the frontend usePusher.ts hook.