import { PrismaClient, WorkspaceRole, WorkspacePlan, AssetType, AssetStatus, TrackType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@cloudcut.dev' },
    update: {},
    create: {
      email: 'alice@cloudcut.dev',
      name: 'Alice Chen',
      passwordHash,
      avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@cloudcut.dev' },
    update: {},
    create: {
      email: 'bob@cloudcut.dev',
      name: 'Bob Smith',
      passwordHash,
      avatarUrl: 'https://i.pravatar.cc/150?u=bob',
    },
  });

  console.log('✅ Created users:', alice.email, bob.email);

  // ── Workspace ──────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-studio' },
    update: {},
    create: {
      name: 'Acme Studio',
      slug: 'acme-studio',
      plan: WorkspacePlan.PRO,
      ownerId: alice.id,
    },
  });

  // Add both users as members
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: alice.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: alice.id, role: WorkspaceRole.OWNER },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: bob.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: bob.id, role: WorkspaceRole.EDITOR },
  });

  console.log('✅ Created workspace:', workspace.name);

  // ── Projects ───────────────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Summer Campaign 2025',
      description: 'Main promo video for the summer campaign',
      createdById: alice.id,
      settings: { resolution: '1080p', fps: 30, aspectRatio: '16:9' },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Product Launch Teaser',
      description: 'Short teaser for the new product line',
      createdById: bob.id,
      settings: { resolution: '1080p', fps: 24, aspectRatio: '16:9' },
    },
  });

  console.log('✅ Created projects');

  // ── Assets ─────────────────────────────────────────
  const asset1 = await prisma.asset.create({
    data: {
      projectId: project1.id,
      uploadedById: alice.id,
      type: AssetType.VIDEO,
      originalUrl: 'assets/sample-video-1.mp4',
      status: AssetStatus.READY,
      metadata: { durationMs: 30000, width: 1920, height: 1080, codec: 'h264', fileSizeBytes: 15000000 },
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      projectId: project1.id,
      uploadedById: alice.id,
      type: AssetType.VIDEO,
      originalUrl: 'assets/sample-video-2.mp4',
      status: AssetStatus.READY,
      metadata: { durationMs: 20000, width: 1920, height: 1080, codec: 'h264', fileSizeBytes: 10000000 },
    },
  });

  const audioAsset = await prisma.asset.create({
    data: {
      projectId: project1.id,
      uploadedById: alice.id,
      type: AssetType.AUDIO,
      originalUrl: 'assets/background-music.mp3',
      status: AssetStatus.READY,
      metadata: { durationMs: 60000, codec: 'mp3', fileSizeBytes: 2000000 },
    },
  });

  console.log('✅ Created assets');

  // ── Tracks ─────────────────────────────────────────
  const videoTrack = await prisma.track.create({
    data: {
      projectId: project1.id,
      type: TrackType.VIDEO,
      label: 'V1',
      orderIndex: 0,
      color: '#6c63ff',
    },
  });

  const audioTrack = await prisma.track.create({
    data: {
      projectId: project1.id,
      type: TrackType.AUDIO,
      label: 'A1',
      orderIndex: 1,
      color: '#43e97b',
    },
  });

  console.log('✅ Created tracks');

  // ── Clips ──────────────────────────────────────────
  const clip1 = await prisma.clip.create({
    data: {
      trackId: videoTrack.id,
      projectId: project1.id,
      assetId: asset1.id,
      trackPositionMs: 0,
      inPointMs: 0,
      outPointMs: 10000,
      durationMs: 10000,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    },
  });

  const clip2 = await prisma.clip.create({
    data: {
      trackId: videoTrack.id,
      projectId: project1.id,
      assetId: asset2.id,
      trackPositionMs: 10000,
      inPointMs: 0,
      outPointMs: 8000,
      durationMs: 8000,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    },
  });

  const clip3 = await prisma.clip.create({
    data: {
      trackId: videoTrack.id,
      projectId: project1.id,
      assetId: asset1.id,
      trackPositionMs: 18000,
      inPointMs: 10000,
      outPointMs: 20000,
      durationMs: 10000,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    },
  });

  // Audio clip
  await prisma.clip.create({
    data: {
      trackId: audioTrack.id,
      projectId: project1.id,
      assetId: audioAsset.id,
      trackPositionMs: 0,
      inPointMs: 0,
      outPointMs: 28000,
      durationMs: 28000,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    },
  });

  // A 5th clip
  await prisma.clip.create({
    data: {
      trackId: videoTrack.id,
      projectId: project1.id,
      assetId: asset2.id,
      trackPositionMs: 28000,
      inPointMs: 8000,
      outPointMs: 15000,
      durationMs: 7000,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    },
  });

  console.log('✅ Created 5 clips');

  // ── Effects ────────────────────────────────────────
  await prisma.clipEffect.create({
    data: {
      clipId: clip1.id,
      type: 'brightness',
      orderIndex: 0,
      params: { value: 1.2 },
      enabled: true,
    },
  });

  await prisma.clipEffect.create({
    data: {
      clipId: clip1.id,
      type: 'contrast',
      orderIndex: 1,
      params: { value: 1.1 },
      enabled: true,
    },
  });

  await prisma.clipEffect.create({
    data: {
      clipId: clip2.id,
      type: 'saturation',
      orderIndex: 0,
      params: { value: 0.8 },
      enabled: false,
    },
  });

  console.log('✅ Created effects');
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('   Login with: alice@cloudcut.dev / password123');
  console.log('   Login with: bob@cloudcut.dev / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });