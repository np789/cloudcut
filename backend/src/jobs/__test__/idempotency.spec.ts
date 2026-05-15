/// &lt;reference types="jest" /&gt;
import { Test, TestingModule } from '@nestjs/testing';
import { ExportsService } from '../../exports/exports.service';
import { PrismaService } from '../../prisma.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { getQueueToken } from '@nestjs/bullmq';
import { EXPORT_QUEUE } from '../queues.module';

const mockProject = { id: 'proj-1', workspaceId: 'ws-1', deletedAt: null };
const mockExportJob = {
  id: 'export-1',
  projectId: 'proj-1',
  idempotencyKey: 'test-key-123',
  status: 'QUEUED',
};

describe('Export Idempotency', () => {
  let service: ExportsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportsService,
        {
          provide: PrismaService,
          useValue: {
            project: { findUnique: jest.fn().mockResolvedValue(mockProject) },
            exportJob: {
              findUnique: jest.fn(),
              create: jest.fn().mockResolvedValue(mockExportJob),
            },
          } as any,
        },
        {
          provide: WorkspacesService,
          useValue: {
            requireRole: jest.fn().mockResolvedValue({}),
          } as any,
        },
        {
          provide: getQueueToken(EXPORT_QUEUE),
          useValue: { add: jest.fn().mockResolvedValue({}) } as any,
        },
      ],
    }).compile();

    service = module.get<ExportsService>(ExportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('returns existing job when same idempotency key is used', async () => {
    prisma.exportJob.findUnique.mockResolvedValueOnce(mockExportJob);

    const result = await service.createExport('proj-1', 'user-1', {
      idempotencyKey: 'test-key-123',
    });

    expect(result).toEqual(mockExportJob);
    expect(prisma.exportJob.create).not.toHaveBeenCalled();
  });

  it('creates a new job when idempotency key is new', async () => {
    prisma.exportJob.findUnique.mockResolvedValueOnce(null);

    const result = await service.createExport('proj-1', 'user-1', {
      idempotencyKey: 'brand-new-key',
    });

    expect(prisma.exportJob.create).toHaveBeenCalledTimes(1);
    expect(result.idempotencyKey).toBe('test-key-123');
  });
});