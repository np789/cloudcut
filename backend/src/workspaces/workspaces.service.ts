import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateWorkspaceDto, InviteMemberDto, UpdateMemberRoleDto } from './dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug already taken');

    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        ownerId: userId,
        members: {
          create: { userId, role: WorkspaceRole.OWNER },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } } },
    });
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { members: true, projects: true } },
      },
    });
  }

  async findOne(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    await this.requireMember(workspaceId, userId);
    return workspace;
  }

  async invite(workspaceId: string, requesterId: string, dto: InviteMemberDto) {
    await this.requireRole(workspaceId, requesterId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User with that email not found');

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (existing) throw new ConflictException('User is already a member');

    return this.prisma.workspaceMember.create({
      data: { workspaceId, userId: user.id, role: dto.role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
  }

  async updateMemberRole(workspaceId: string, requesterId: string, targetUserId: string, dto: UpdateMemberRoleDto) {
    await this.requireRole(workspaceId, requesterId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { role: dto.role },
    });
  }

  async removeMember(workspaceId: string, requesterId: string, targetUserId: string) {
    await this.requireRole(workspaceId, requesterId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });

    return { message: 'Member removed' };
  }

  async requireMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this workspace');
    return member;
  }

  async requireRole(workspaceId: string, userId: string, roles: WorkspaceRole[]) {
    const member = await this.requireMember(workspaceId, userId);
    if (!roles.includes(member.role)) {
      throw new ForbiddenException(`Required role: ${roles.join(' or ')}`);
    }
    return member;
  }
}
