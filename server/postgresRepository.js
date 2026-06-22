import { randomUUID } from "node:crypto";
import { getPrisma } from "./prisma.js";

export async function findPostgresUserByUsername(username) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { username: String(username || "").toLowerCase() },
    include: { projectAccess: true }
  });
  return toClientUser(user);
}

export async function findPostgresUserById(userId) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { projectAccess: true }
  });
  return toClientUser(user);
}

export async function createPostgresSession(userId, durationMs) {
  const prisma = getPrisma();
  const token = randomUUID();
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + durationMs)
    }
  });
  return token;
}

export async function deletePostgresSession(token) {
  if (!token) return;
  await getPrisma().session.deleteMany({ where: { token } });
}

export async function getPostgresUserByToken(token) {
  if (!token) return null;
  const prisma = getPrisma();
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { projectAccess: true } } }
  });
  if (!session || session.expiresAt < new Date() || session.user.active === false) {
    if (session) await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  return toClientUser(session.user);
}

export async function appendPostgresAuditLog(user, action, targetType, targetId, details = {}, success = true) {
  const prisma = getPrisma();
  await prisma.auditLog.create({
    data: {
      id: createImportedId("log"),
      userId: user?.id || null,
      userName: user?.name || user?.username || "Guest",
      role: user?.role || "guest",
      action,
      targetType,
      targetId: targetId || "",
      projectId: details.projectId || null,
      success,
      details
    }
  });
}

export async function getPostgresBootstrapForUser(user) {
  const prisma = getPrisma();
  const projectWhere = user?.role === "admin" ? {} : { id: { in: user?.projectIds || [] } };
  const projects = await prisma.project.findMany({ where: projectWhere, orderBy: { name: "asc" } });
  const projectIds = projects.map((project) => project.id);
  const [locations, equipment, points, records, media, users, auditLogs] = await Promise.all([
    prisma.location.findMany({ where: { projectId: { in: projectIds } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.equipment.findMany({ where: { projectId: { in: projectIds } }, orderBy: { name: "asc" } }),
    prisma.point.findMany({ where: { equipment: { projectId: { in: projectIds } } }, orderBy: { name: "asc" } }),
    prisma.inspectionRecord.findMany({
      where: { projectId: { in: projectIds } },
      include: { attachments: true },
      orderBy: { serverUpdatedAt: "desc" }
    }),
    prisma.mediaAsset.findMany({
      where: { projectId: { in: projectIds } },
      include: { attachments: true },
      orderBy: { createdAt: "desc" }
    }),
    user?.role === "admin" ? prisma.user.findMany({ include: { projectAccess: true }, orderBy: { username: "asc" } }) : Promise.resolve([]),
    prisma.auditLog.findMany({
      where: user?.role === "admin" ? {} : { OR: [{ projectId: { in: projectIds } }, { userId: user?.id }] },
      orderBy: { createdAt: "desc" },
      take: 300
    })
  ]);

  return {
    version: 1,
    projects: projects.map(toProject),
    locations: locations.map(toLocation),
    equipment: equipment.map(toEquipment),
    points: points.map(toPoint),
    records: records.map(toRecord),
    media: media.map(toMedia),
    users: users.map(toClientUser),
    auditLogs: auditLogs.map(toAuditLog)
  };
}

export async function upgradePostgresPasswordHash(userId, passwordHash) {
  await getPrisma().user.update({ where: { id: userId }, data: { passwordHash } });
}

function toClientUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    active: user.active !== false,
    passwordHash: user.passwordHash,
    projectIds: Array.isArray(user.projectAccess) ? user.projectAccess.map((item) => item.projectId) : []
  };
}

function toProject(project) {
  return { id: project.id, name: project.name, client: project.client || "", manager: project.manager || "" };
}

function toLocation(location) {
  return {
    id: location.id,
    projectId: location.projectId,
    parentId: location.parentId || "",
    type: location.type,
    name: location.name,
    path: location.path || location.name,
    sortOrder: location.sortOrder
  };
}

function toEquipment(item) {
  return {
    id: item.id,
    projectId: item.projectId,
    locationId: item.locationId,
    team: item.team,
    name: item.name,
    type: item.type,
    status: item.status,
    revision: item.revision
  };
}

function toPoint(point) {
  return {
    id: point.id,
    equipmentId: point.equipmentId,
    name: point.name,
    type: point.type,
    reference: point.reference || "",
    status: point.status,
    revision: point.revision
  };
}

function toRecord(record) {
  return {
    id: record.id,
    projectId: record.projectId,
    locationId: record.locationId,
    team: record.team,
    equipmentId: record.equipmentId,
    pointId: record.pointId || "",
    title: record.title,
    status: record.status,
    result: record.result,
    comments: record.comments || "",
    photos: record.attachments.map(toAttachment),
    assignee: record.assignee || "",
    due: formatDate(record.due),
    sync: record.syncState || "synced",
    revision: record.revision,
    updatedAt: formatDateTime(record.clientUpdatedAt || record.updatedAt),
    serverUpdatedAt: record.serverUpdatedAt?.getTime?.() || Date.now()
  };
}

function toMedia(media) {
  const file = media.attachments[0] ? toAttachment(media.attachments[0]) : null;
  return {
    id: media.id,
    equipmentId: media.equipmentId,
    projectId: media.projectId,
    locationId: media.locationId,
    category: media.category,
    title: media.title || "",
    reference: media.reference || "",
    comments: media.comments || "",
    file,
    createdAt: media.createdAt?.toISOString?.() || ""
  };
}

function toAttachment(attachment) {
  return {
    id: attachment.id,
    name: attachment.fileName,
    type: attachment.mimeType || "",
    size: attachment.size || 0,
    url: attachment.storagePath,
    source: attachment.source,
    uploadedAt: attachment.createdAt?.toISOString?.() || ""
  };
}

function toAuditLog(log) {
  return {
    id: log.id,
    userId: log.userId || "",
    userName: log.userName,
    role: log.role,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    projectId: log.projectId || "",
    success: log.success,
    details: log.details || {},
    createdAt: log.createdAt?.toISOString?.() || ""
  };
}

function formatDate(value) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "";
  return value.toLocaleString("sv-SE");
}

function createImportedId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
