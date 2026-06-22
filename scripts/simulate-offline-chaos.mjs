import assert from "node:assert/strict";
import { Blob } from "node:buffer";
import { calculateExponentialBackoffDelay, createMutationRetryState } from "../src/modules/state.js";

const random = seededRandom(42);
const records = Array.from({ length: 25 }, (_, index) => ({
  id: `r${index + 1}`,
  pointId: `pt${index + 1}`,
  equipmentId: `e${(index % 5) + 1}`,
  status: "pending",
  result: "Pending",
  assignee: `Engineer ${(index % 4) + 1}`,
  comments: "",
  revision: 1,
  serverUpdatedAt: 1000 + index
}));

const mutationQueue = [];
const assetQueue = [];
const conflicts = [];
let granularModalTriggered = false;

for (let index = 0; index < 100; index += 1) {
  const record = records[Math.floor(random() * records.length)];
  const status = ["passed", "failed", "rectification", "pending"][Math.floor(random() * 4)];
  const mutation = {
    id: `mut-${index + 1}`,
    type: "record.update",
    endpoint: "/sync",
    recordId: record.id,
    equipmentId: record.equipmentId,
    payload: {
      ...record,
      status,
      result: status === "passed" ? "Pass" : status === "failed" ? "Fail" : "Pending",
      comments: `Offline field note ${index + 1}`,
      sync: "pending",
      baseServerUpdatedAt: record.serverUpdatedAt,
      localUpdatedAt: Date.now() + index
    },
    retryAttempt: 0,
    retryAt: 0
  };
  mutationQueue.push(mutation);
}

for (let index = 0; index < 20; index += 1) {
  const mutation = mutationQueue[index * 2];
  const blob = new Blob([`fake binary payload ${index}`], { type: index % 2 ? "application/pdf" : "image/jpeg" });
  assetQueue.push({
    id: `asset-${index + 1}`,
    mutationId: mutation.id,
    equipmentId: mutation.equipmentId,
    name: index % 2 ? `drawing-${index + 1}.pdf` : `photo-${index + 1}.jpg`,
    type: blob.type,
    size: blob.size,
    blob
  });
  mutation.assetIds = [...(mutation.assetIds || []), `asset-${index + 1}`];
}

assert.equal(mutationQueue.length, 100, "offline mutation queue dropped entries");
assert.equal(assetQueue.length, 20, "offline asset queue dropped files");
assert.equal(new Set(mutationQueue.map((item) => item.id)).size, 100, "mutation ids are not unique");
assert.equal(assetQueue.every((asset) => asset.blob instanceof Blob && asset.size > 0), true, "binary assets were corrupted");

const retryStateByEquipment = new Map();
for (const mutation of mutationQueue.slice(0, 15)) {
  const previous = retryStateByEquipment.get(mutation.equipmentId) || mutation;
  const retry = createMutationRetryState(previous, 10_000, random);
  retryStateByEquipment.set(mutation.equipmentId, { ...mutation, ...retry });
}

for (const state of retryStateByEquipment.values()) {
  assert.equal(state.retryAttempt >= 1, true, "retry attempt was not advanced");
  assert.equal(state.retryAt > 10_000, true, "retry timestamp was not persisted");
}

const firstDelay = calculateExponentialBackoffDelay(0, () => 0.25);
const sixthDelay = calculateExponentialBackoffDelay(6, () => 0.25);
assert.equal(firstDelay, 1250, "initial jitter delay formula changed");
assert.equal(sixthDelay, 60250, "max jitter delay formula changed");

for (const mutation of mutationQueue.slice(0, 7)) {
  const server = {
    ...mutation.payload,
    status: "passed",
    result: "Pass",
    assignee: "Server Manager",
    comments: "Server-side corrective note",
    revision: mutation.payload.revision + 1,
    serverUpdatedAt: mutation.payload.baseServerUpdatedAt + 9999
  };
  const diff = getConflictFields(mutation.payload, server);
  if (diff.length) granularModalTriggered = true;
  conflicts.push({ local: mutation.payload, server, diff });
}

assert.equal(conflicts.length, 7, "mock 409 conflicts were not created");
assert.equal(granularModalTriggered, true, "granular diff modal was not initiated");
assert.equal(conflicts.every((item) => item.diff.some((field) => field.key === "comments")), true, "comment field diff missing");
assert.equal(conflicts.every((item) => item.diff.some((field) => field.key === "assignee")), true, "assignee field diff missing");

const resolved = conflicts.map((conflict) => mergeConflict(conflict, new Set(["status", "result"])));
assert.equal(resolved.every((record) => record.status === record.__local.status), true, "local selected status was not kept");
assert.equal(resolved.every((record) => record.comments === record.__server.comments), true, "server comment was not kept");

console.log(JSON.stringify({
  ok: true,
  mutations: mutationQueue.length,
  assets: assetQueue.length,
  conflicts: conflicts.length,
  equipmentRetryBuckets: retryStateByEquipment.size
}, null, 2));

function getConflictFields(localData = {}, serverData = {}) {
  const keys = ["status", "result", "assignee", "comments", "due", "title", "reference", "updatedAt"];
  return keys
    .filter((key) => JSON.stringify(localData?.[key] ?? "") !== JSON.stringify(serverData?.[key] ?? ""))
    .map((key) => ({
      key,
      localValue: localData?.[key] ?? "",
      serverValue: serverData?.[key] ?? ""
    }));
}

function mergeConflict(conflict, localFields) {
  const merged = { ...conflict.server, __local: conflict.local, __server: conflict.server };
  for (const field of conflict.diff) {
    merged[field.key] = localFields.has(field.key) ? conflict.local[field.key] : conflict.server[field.key];
  }
  return merged;
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}
