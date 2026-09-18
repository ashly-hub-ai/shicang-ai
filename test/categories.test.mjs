import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("分类支持添加、改名和安全删除", async () => {
  const dir = await mkdtemp(join(tmpdir(), "shicang-categories-"));
  const port = 43918;
  const child = spawn(process.execPath, ["server.mjs"], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), DB_PATH: join(dir, "test.db") } });
  try {
    await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error("启动超时")), 5000); child.stdout.on("data", () => { clearTimeout(timer); resolve(); }); child.on("error", reject); });
    const call = async (path, options = {}) => { const response = await fetch(`http://127.0.0.1:${port}${path}`, { headers: { "content-type": "application/json" }, ...options }); return [response.status, await response.json()]; };
    let [, category] = await call("/api/categories", { method: "POST", body: JSON.stringify({ name: "旅行" }) });
    assert.equal(category.name, "旅行");
    [, category] = await call(`/api/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ name: "旅行灵感" }) });
    assert.equal(category.name, "旅行灵感");
    await call("/api/collections", { method: "POST", body: JSON.stringify({ raw_share_text: "周末路线", category: "旅行灵感" }) });
    const [deleteStatus, deleted] = await call(`/api/categories/${category.id}`, { method: "DELETE" });
    assert.equal(deleteStatus, 200); assert.equal(deleted.moved_to, "其他");
    const [, items] = await call("/api/collections"); assert.equal(items[0].category, "其他");
    const [, categories] = await call("/api/categories"); assert.equal(categories.some(x => x.name === "旅行灵感"), false);
  } finally {
    const exited = new Promise(resolve => child.once("exit", resolve)); child.kill(); await exited; await rm(dir, { recursive: true, force: true });
  }
});
