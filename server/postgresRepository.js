import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { getPrisma } from "./prisma.js";

const validStatuses = new Set(["pending", "passed", "failed", "rectification", "closed"]);
const roles = new Set(["admin", "manager", "engineer", "field"]);
const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 12);

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
    users: users.map(toPublicUser),
    auditLogs: auditLogs.map(toAuditLog)
  };
}

export async function upgradePostgresPasswordHash(userId, passwordHash) {
  await getPrisma().user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function updatePostgresProject(user, body) {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const projectId = String(body.id || "").trim();
    const project = projectId ? await tx.project.findUnique({ where: { id: projectId } }) : null;
    if (!project) return mutationError(404, "Project not found.");
    if (!canAccessProject(user, projectId)) return mutationError(403, "Permission denied.");
    await tx.project.update({
      where: { id: projectId },
      data: {
        name: body.name || project.name,
        client: body.client ?? project.client,
        manager: body.manager ?? project.manager
      }
    });
    await tx.auditLog.create({ data: auditData(user, "project.update", "project", projectId, { projectId, manager: body.manager ?? project.manager }) });
    return { ok: true };
  });
  return result?.mutationError ? result : { data: await getPostgresBootstrapForUser(user) };
}

export async function upsertPostgresUser(adminUser, body) {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const username = String(body.username || "").trim().toLowerCase();
    const name = String(body.name || username || "User").trim();
    const role = roles.has(body.role) ? body.role : "field";
    const projectIds = await normalizeProjectIds(tx, body.projectIds);
    if (!username) return mutationError(400, "Username is required.");
    const existing = await tx.user.findFirst({
      where: { OR: [{ id: String(body.id || "") }, { username }] }
    });
    const userId = existing?.id || createImportedId("u");
    const passwordHash = body.password
      ? bcrypt.hashSync(String(body.password), bcryptRounds)
      : existing?.passwordHash || bcrypt.hashSync("changeme123", bcryptRounds);
    await tx.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username,
        name,
        role,
        active: body.active === false || body.active === "false" ? false : true,
        passwordHash
      },
      update: {
        username,
        name,
        role,
        active: body.active === false || body.active === "false" ? false : true,
        passwordHash
      }
    });
    await tx.userProjectAccess.deleteMany({ where: { userId } });
    if (role !== "admin" && projectIds.length) {
      await tx.userProjectAccess.createMany({
        data: projectIds.map((projectId) => ({ userId, projectId })),
        skipDuplicates: true
      });
    }
    await tx.auditLog.create({ data: auditData(adminUser, existing ? "user.update" : "user.create", "user", userId, { role, active: body.active !== false }) });
    return { ok: true };
  });
  return result?.mutationError ? result : { data: await getPostgresBootstrapForUser(adminUser) };
}

export async function syncPostgresRecords(user, incomingRecords) {
  const prisma = getPrisma();
  const conflicts = [];
  await prisma.$transaction(async (tx) => {
    for (const record of incomingRecords) {
      if (!canAccessProject(user, record.projectId)) {
        conflicts.push({ local: record, server: null, error: "Permission denied." });
        continue;
      }
      const current = await tx.inspectionRecord.findUnique({
        where: { id: String(record.id) },
        include: { attachments: true }
      });
      const serverTime = current?.serverUpdatedAt?.getTime?.() || 0;
      if (current && record.baseServerUpdatedAt && Number(record.baseServerUpdatedAt) < serverTime) {
        conflicts.push({ local: record, server: toRecord(current) });
        await tx.syncConflict.create({
          data: {
            recordId: current.id,
            localPayload: record,
            serverPayload: toRecord(current)
          }
        });
        continue;
      }
      const nextRecord = toRecordData(record);
      const relationOk = await validateRecordRelations(tx, nextRecord);
      if (!relationOk.ok) {
        conflicts.push({ local: record, server: null, error: relationOk.error });
        continue;
      }
      if (!current) {
        await tx.inspectionRecord.create({ data: nextRecord });
        await tx.auditLog.create({ data: auditData(user, "record.create", "record", nextRecord.id, { projectId: nextRecord.projectId, status: nextRecord.status }) });
      } else {
        const { id, ...recordUpdate } = nextRecord;
        await tx.inspectionRecord.update({
          where: { id: current.id },
          data: { ...recordUpdate, revision: { increment: 1 } }
        });
        await tx.auditLog.create({ data: auditData(user, "record.sync", "record", current.id, { projectId: nextRecord.projectId, status: nextRecord.status }) });
      }
      await syncRecordAttachments(tx, nextRecord.id, record.photos || []);
      if (nextRecord.pointId) await refreshPostgresPointStatus(tx, nextRecord.pointId);
      await refreshPostgresEquipmentStatus(tx, nextRecord.equipmentId);
    }
  }, { timeout: 60_000 });
  return { data: await getPostgresBootstrapForUser(user), conflicts };
}

export async function upsertPostgresEquipment(user, body, idPrefix = "e") {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const equipment = await validatePostgresEquipmentPayload(tx, body, idPrefix);
    if (equipment.mutationError) return equipment;
    if (!canAccessProject(user, equipment.projectId)) return mutationError(403, "Permission denied.");
    const existing = await tx.equipment.findUnique({ where: { id: equipment.id } });
    if (existing) {
      const { id, ...equipmentUpdate } = equipment;
      await tx.equipment.update({ where: { id }, data: { ...equipmentUpdate, revision: { increment: 1 } } });
      await tx.inspectionRecord.updateMany({
        where: { equipmentId: equipment.id },
        data: { projectId: equipment.projectId, locationId: equipment.locationId, team: equipment.team, serverUpdatedAt: new Date(), revision: { increment: 1 } }
      });
    } else {
      await tx.equipment.create({ data: equipment });
    }
    await tx.auditLog.create({ data: auditData(user, existing ? "equipment.update" : "equipment.create", "equipment", equipment.id, { projectId: equipment.projectId, name: equipment.name }) });
    return equipment;
  });
  return result?.mutationError ? result : { data: await getPostgresBootstrapForUser(user), item: result };
}

export async function updatePostgresRow(user, body) {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const equipment = await tx.equipment.findUnique({ where: { id: String(body.equipmentId || "") } });
    const point = await tx.point.findUnique({ where: { id: String(body.pointId || "") } });
    const record = await tx.inspectionRecord.findUnique({ where: { id: String(body.recordId || "") } });
    if (!equipment || !point || !record) return mutationError(404, "Row target not found.");
    if (!canAccessProject(user, equipment.projectId) || !canAccessProject(user, body.projectId || equipment.projectId)) return mutationError(403, "Permission denied.");

    const nextEquipment = {
      projectId: String(body.projectId || equipment.projectId),
      locationId: String(body.locationId || equipment.locationId),
      team: String(body.team || equipment.team),
      name: String(body.equipmentName || equipment.name),
      type: String(body.equipmentType || equipment.type)
    };
    const nextPoint = {
      name: String(body.pointName || point.name),
      type: String(body.pointType || point.type),
      reference: body.reference ?? point.reference,
      status: toStatus(body.status || point.status)
    };
    await tx.equipment.update({ where: { id: equipment.id }, data: { ...nextEquipment, revision: { increment: 1 } } });
    await tx.point.update({ where: { id: point.id }, data: { ...nextPoint, revision: { increment: 1 } } });
    await tx.inspectionRecord.update({
      where: { id: record.id },
      data: {
        projectId: nextEquipment.projectId,
        locationId: nextEquipment.locationId,
        team: nextEquipment.team,
        equipmentId: equipment.id,
        pointId: point.id,
        title: `${nextEquipment.name} - ${nextPoint.name}`,
        assignee: body.assignee ?? record.assignee,
        due: parseDateOnly(body.due) ?? record.due,
        status: toStatus(body.status || record.status),
        result: resultFromStatus(body.status || record.status),
        syncState: "synced",
        serverUpdatedAt: new Date(),
        revision: { increment: 1 }
      }
    });
    await refreshPostgresPointStatus(tx, point.id);
    await refreshPostgresEquipmentStatus(tx, equipment.id);
    await tx.auditLog.create({ data: auditData(user, "row.update", "record", record.id, { projectId: nextEquipment.projectId, status: toStatus(body.status || record.status) }) });
    return { ok: true };
  });
  return result?.mutationError ? result : { data: await getPostgresBootstrapForUser(user) };
}

export async function upsertPostgresPoint(user, body) {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const equipment = await tx.equipment.findUnique({ where: { id: String(body.equipmentId || "") } });
    if (!equipment) return mutationError(404, "Equipment not found.");
    if (!canAccessProject(user, equipment.projectId)) return mutationError(403, "Permission denied.");
    const pointId = String(body.id || createImportedId("pt"));
    const pointData = {
      equipmentId: equipment.id,
      name: String(body.name || "New Point"),
      type: String(body.type || "Point"),
      reference: body.reference || "",
      status: toStatus(body.status || "pending")
    };
    const existingPoint = await tx.point.findUnique({ where: { id: pointId } });
    const point = existingPoint
      ? await tx.point.update({ where: { id: pointId }, data: { ...pointData, revision: { increment: 1 } } })
      : await tx.point.create({ data: { id: pointId, ...pointData } });
    const record = await tx.inspectionRecord.findFirst({ where: { pointId: point.id } });
    const recordTitle = `${equipment.name} - ${point.name}`;
    if (record) {
      await tx.inspectionRecord.update({
        where: { id: record.id },
        data: {
          title: recordTitle,
          status: point.status,
          result: resultFromStatus(point.status),
          assignee: body.assignee ?? record.assignee,
          due: parseDateOnly(body.due) ?? record.due,
          serverUpdatedAt: new Date(),
          revision: { increment: 1 }
        }
      });
    } else {
      await tx.inspectionRecord.create({
        data: {
          id: createImportedId("r"),
          projectId: equipment.projectId,
          locationId: equipment.locationId,
          team: equipment.team,
          equipmentId: equipment.id,
          pointId: point.id,
          title: recordTitle,
          status: point.status,
          result: resultFromStatus(point.status),
          assignee: body.assignee || null,
          due: parseDateOnly(body.due),
          syncState: "synced",
          serverUpdatedAt: new Date()
        }
      });
    }
    await refreshPostgresPointStatus(tx, point.id);
    await refreshPostgresEquipmentStatus(tx, equipment.id);
    await tx.auditLog.create({ data: auditData(user, existingPoint ? "point.update" : "point.create", "point", point.id, { projectId: equipment.projectId, equipmentId: equipment.id, status: point.status }) });
    return { ok: true };
  });
  return result?.mutationError ? result : { data: await getPostgresBootstrapForUser(user) };
}

export async function createPostgresMedia(user, body, files = []) {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const equipment = await tx.equipment.findUnique({ where: { id: String(body.equipmentId || "") } });
    if (!equipment) return mutationError(404, "Equipment not found.");
    if (!canAccessProject(user, equipment.projectId)) return mutationError(403, "Permission denied.");
    const comments = String(body.comments || "").trim();
    if (!files.length && !comments) return mutationError(400, "Media file or comment is required.");
    const mediaRecords = [];
    if (files.length) {
      for (const file of files) {
        const media = await tx.mediaAsset.create({
          data: mediaData(equipment, body, comments, {
            create: [toMediaAttachmentCreate(file)]
          })
        });
        mediaRecords.push(media);
      }
    } else {
      mediaRecords.push(await tx.mediaAsset.create({ data: mediaData(equipment, body, comments) }));
    }
    await tx.auditLog.create({ data: auditData(user, files.length ? "media.upload" : "media.create", "equipment", equipment.id, { projectId: equipment.projectId, files: files.length, category: body.category }) });
    return { ok: true, count: mediaRecords.length };
  });
  return result?.mutationError ? result : { data: await getPostgresBootstrapForUser(user) };
}

export async function importPostgresEquipmentRows(user, fileName, rows, aliases) {
  const prisma = getPrisma();
  const importedIds = new Set();
  const result = await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const name = pickAlias(row, aliases.equipmentNameAliases);
      if (!name) continue;
      const projectName = pickAlias(row, aliases.projectAliases) || "Default Project";
      const locationName = pickAlias(row, aliases.locationAliases) || "Unassigned";
      const team = pickAlias(row, aliases.teamAliases) || "BMS";
      const type = pickAlias(row, aliases.equipmentTypeAliases) || "Equipment";
      const pointName = pickAlias(row, aliases.pointNameAliases);
      const pointType = pickAlias(row, aliases.pointTypeAliases) || "Point";
      const reference = pickAlias(row, aliases.referenceAliases) || "";
      const assignee = pickAlias(row, aliases.assigneeAliases) || "";
      const due = pickAlias(row, aliases.dueAliases) || "";

      const project = await upsertProjectByName(tx, projectName);
      if (!canAccessProject(user, project.id)) continue;
      const location = await upsertLocationByName(tx, project.id, locationName);
      const equipment = await upsertEquipmentByName(tx, { project, location, team, name, type });
      importedIds.add(equipment.id);

      if (pointName) {
        const point = await upsertPointByName(tx, equipment.id, pointName, pointType, reference);
        const existingRecord = await tx.inspectionRecord.findFirst({ where: { pointId: point.id } });
        const status = point.status || existingRecord?.status || "pending";
        if (existingRecord) {
          await tx.inspectionRecord.update({
            where: { id: existingRecord.id },
            data: {
              projectId: project.id,
              locationId: location.id,
              team,
              equipmentId: equipment.id,
              pointId: point.id,
              title: `${name} - ${pointName}`,
              status,
              result: resultFromStatus(status),
              assignee: assignee || existingRecord.assignee,
              due: parseDateOnly(due) || existingRecord.due,
              syncState: "synced",
              serverUpdatedAt: new Date(),
              revision: { increment: 1 }
            }
          });
        } else {
          await tx.inspectionRecord.create({
            data: {
              id: createImportedId("r"),
              projectId: project.id,
              locationId: location.id,
              team,
              equipmentId: equipment.id,
              pointId: point.id,
              title: `${name} - ${pointName}`,
              status,
              result: resultFromStatus(status),
              assignee: assignee || null,
              due: parseDateOnly(due),
              syncState: "synced",
              serverUpdatedAt: new Date()
            }
          });
        }
        await refreshPostgresPointStatus(tx, point.id);
        await refreshPostgresEquipmentStatus(tx, equipment.id);
      }
    }
    await tx.auditLog.create({ data: auditData(user, "equipment.import", "import", fileName, { importedCount: importedIds.size }) });
    return { importedCount: importedIds.size };
  }, { timeout: 60_000 });
  return { importedCount: result.importedCount, data: await getPostgresBootstrapForUser(user) };
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

function toPublicUser(user) {
  const item = toClientUser(user);
  if (!item) return null;
  const { passwordHash, ...publicUser } = item;
  return publicUser;
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

async function validatePostgresEquipmentPayload(tx, body, prefix) {
  const projectId = String(body.projectId || "").trim();
  const locationId = String(body.locationId || "").trim();
  const name = String(body.name || "").trim();
  const [project, location] = await Promise.all([
    projectId ? tx.project.findUnique({ where: { id: projectId } }) : null,
    locationId ? tx.location.findUnique({ where: { id: locationId } }) : null
  ]);
  if (!projectId || !locationId || !name) return mutationError(400, "projectId, locationId and name are required.");
  if (!project) return mutationError(400, "Project not found.");
  if (!location || location.projectId !== projectId) return mutationError(400, "Location not found for project.");
  return {
    id: body.id || createImportedId(prefix),
    projectId,
    locationId,
    team: String(body.team || "BMS").trim() || "BMS",
    name,
    type: String(body.type || "Equipment").trim() || "Equipment",
    status: toStatus(body.status || "pending")
  };
}

function toRecordData(record) {
  const status = toStatus(record.status);
  return {
    id: String(record.id || createImportedId("r")),
    projectId: String(record.projectId || ""),
    locationId: String(record.locationId || ""),
    team: String(record.team || "BMS"),
    equipmentId: String(record.equipmentId || ""),
    pointId: record.pointId ? String(record.pointId) : null,
    title: String(record.title || "Inspection Record"),
    status,
    result: String(record.result || resultFromStatus(status)),
    comments: record.comments || null,
    assignee: record.assignee || null,
    due: parseDateOnly(record.due),
    syncState: "synced",
    clientUpdatedAt: parseDateTime(record.updatedAt),
    serverUpdatedAt: new Date()
  };
}

async function normalizeProjectIds(tx, projectIdsValue) {
  const rawIds = Array.isArray(projectIdsValue)
    ? projectIdsValue
    : String(projectIdsValue || "").split(",");
  const ids = rawIds.map((id) => String(id).trim()).filter(Boolean);
  if (!ids.length) return [];
  const projects = await tx.project.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return projects.map((project) => project.id);
}

function mediaData(equipment, body, comments, attachments) {
  return {
    id: createImportedId("m"),
    equipmentId: equipment.id,
    projectId: equipment.projectId,
    locationId: equipment.locationId,
    category: String(body.category || "document").trim() || "document",
    title: body.title || null,
    reference: body.reference || null,
    comments: comments || null,
    attachments
  };
}

function toMediaAttachmentCreate(file) {
  return {
    id: file.id || createImportedId("att"),
    fileName: file.name || file.url?.split("/").pop() || "media-file",
    mimeType: file.type || null,
    size: Number(file.size || 0) || null,
    storagePath: file.url || "",
    source: "media",
    createdAt: parseDateTime(file.uploadedAt) || new Date()
  };
}

function pickAlias(row, names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

async function upsertProjectByName(tx, name) {
  const existing = await tx.project.findFirst({ where: { name } });
  if (existing) return existing;
  return tx.project.create({ data: { id: createImportedId("p"), name, client: "" } });
}

async function upsertLocationByName(tx, projectId, name) {
  const existing = await tx.location.findFirst({ where: { projectId, name } });
  if (existing) return existing;
  return tx.location.create({
    data: {
      id: createImportedId("l"),
      projectId,
      name,
      path: name,
      type: "area"
    }
  });
}

async function upsertEquipmentByName(tx, { project, location, team, name, type }) {
  const existing = await tx.equipment.findFirst({ where: { locationId: location.id, name } });
  if (existing) {
    return tx.equipment.update({
      where: { id: existing.id },
      data: {
        projectId: project.id,
        locationId: location.id,
        team,
        type,
        revision: { increment: 1 }
      }
    });
  }
  return tx.equipment.create({
    data: {
      id: createImportedId("e"),
      projectId: project.id,
      locationId: location.id,
      team,
      name,
      type,
      status: "pending"
    }
  });
}

async function upsertPointByName(tx, equipmentId, name, type, reference) {
  const existing = await tx.point.findFirst({ where: { equipmentId, name: { equals: name, mode: "insensitive" } } });
  if (existing) {
    return tx.point.update({
      where: { id: existing.id },
      data: {
        type,
        reference,
        revision: { increment: 1 }
      }
    });
  }
  return tx.point.create({
    data: {
      id: createImportedId("pt"),
      equipmentId,
      name,
      type,
      reference,
      status: "pending"
    }
  });
}

async function refreshPostgresPointStatus(tx, pointId) {
  if (!pointId) return;
  const records = await tx.inspectionRecord.findMany({ where: { pointId }, select: { status: true } });
  if (!records.length) return;
  await tx.point.update({ where: { id: pointId }, data: { status: summarizeStatus(records.map((record) => record.status)) } });
}

async function syncRecordAttachments(tx, recordId, photos) {
  const incoming = (Array.isArray(photos) ? photos : []).filter((file) => file?.url);
  const existing = await tx.attachment.findMany({ where: { recordId } });
  const existingByPath = new Map(existing.map((item) => [item.storagePath, item]));
  const incomingPaths = new Set(incoming.map((file) => file.url));
  for (const item of existing) {
    if (!incomingPaths.has(item.storagePath)) {
      await tx.attachment.delete({ where: { id: item.id } });
    }
  }
  for (const file of incoming) {
    if (existingByPath.has(file.url)) continue;
    await tx.attachment.create({
      data: {
        id: file.id || createImportedId("att"),
        recordId,
        fileName: file.name || file.url.split("/").pop() || "attachment",
        mimeType: file.type || null,
        size: Number(file.size || 0) || null,
        storagePath: file.url,
        source: file.source === "camera" ? "camera" : "upload",
        createdAt: parseDateTime(file.uploadedAt) || new Date()
      }
    });
  }
}

async function validateRecordRelations(tx, record) {
  const [project, location, equipment, point] = await Promise.all([
    tx.project.findUnique({ where: { id: record.projectId }, select: { id: true } }),
    tx.location.findUnique({ where: { id: record.locationId }, select: { id: true, projectId: true } }),
    tx.equipment.findUnique({ where: { id: record.equipmentId }, select: { id: true, projectId: true, locationId: true } }),
    record.pointId ? tx.point.findUnique({ where: { id: record.pointId }, select: { id: true, equipmentId: true } }) : Promise.resolve(null)
  ]);
  if (!project) return { ok: false, error: "Project not found." };
  if (!location || location.projectId !== record.projectId) return { ok: false, error: "Location not found for project." };
  if (!equipment || equipment.projectId !== record.projectId || equipment.locationId !== record.locationId) return { ok: false, error: "Equipment not found for location." };
  if (record.pointId && (!point || point.equipmentId !== record.equipmentId)) return { ok: false, error: "Point not found for equipment." };
  return { ok: true };
}

async function refreshPostgresEquipmentStatus(tx, equipmentId) {
  if (!equipmentId) return;
  const records = await tx.inspectionRecord.findMany({ where: { equipmentId }, select: { status: true } });
  if (!records.length) return;
  await tx.equipment.update({ where: { id: equipmentId }, data: { status: summarizeStatus(records.map((record) => record.status)) } });
}

function summarizeStatus(statuses) {
  if (statuses.includes("failed")) return "failed";
  if (statuses.includes("rectification")) return "rectification";
  if (statuses.every((status) => ["passed", "closed"].includes(status))) return "passed";
  return "pending";
}

function canAccessProject(user, projectId) {
  if (!user || user.role === "admin") return true;
  return !projectId || (Array.isArray(user.projectIds) && user.projectIds.includes(projectId));
}

function auditData(user, action, targetType, targetId, details = {}, success = true) {
  return {
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
  };
}

function mutationError(status, message) {
  return { mutationError: true, status, error: message };
}

function toStatus(status) {
  const value = String(status || "pending").toLowerCase();
  return validStatuses.has(value) ? value : "pending";
}

function resultFromStatus(status) {
  const value = toStatus(status);
  if (value === "passed") return "Pass";
  if (value === "failed") return "Fail";
  if (value === "closed") return "N/A";
  if (value === "rectification") return "Rectification";
  return "Pending";
}

function formatDate(value) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "";
  return value.toLocaleString("sv-SE");
}

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseDateTime(value) {
  if (!value) return null;
  if (typeof value === "number") return new Date(value);
  const normalized = String(value).includes("T") ? String(value) : String(value).replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function createImportedId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
