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