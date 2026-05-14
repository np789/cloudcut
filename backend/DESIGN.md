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