const cloudbase = require("@cloudbase/node-sdk");

const app = cloudbase.init({ env: "shicang-d5ghnihwq293cd52c", accessKey: process.env.CLOUDBASE_APIKEY });
const db = app.rdb({ instance: "pgdb-f6zo20mx", database: "public" });
const ALLOWED_EVENTS = new Set(["visit", "import_success", "search", "review", "problem_opened"]);
const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
};

const response = (statusCode, data) => ({ statusCode, headers, body: JSON.stringify(data) });
const cleanId = (value) => /^[a-f0-9-]{16,64}$/i.test(String(value || "")) ? String(value) : "";
const cleanText = (value, max) => String(value || "").trim().slice(0, max);

async function dashboard() {
  const results = await Promise.all(["product_events", "product_ratings", "product_feedback"].map(async name => {
    const { data, error } = await db.from(name).select().limit(1000);
    if (error) throw new Error(error.message || String(error));
    return data || [];
  }));
  const [events, ratings, feedback] = results;
  const visitors = new Set(events.filter(item => item.event === "visit").map(item => item.device_id));
  const activated = new Set(events.filter(item => item.event === "import_success").map(item => item.device_id));
  const latestRating = new Map();
  ratings.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))).forEach(item => latestRating.set(item.device_id, Number(item.rating)));
  const values = [...latestRating.values()].filter(value => value >= 1 && value <= 5);
  return { users: visitors.size, activated: activated.size, imports: events.filter(item => item.event === "import_success").length, searches: events.filter(item => item.event === "search").length, reviews: events.filter(item => item.event === "review").length, feedback: feedback.length, ratings: values.length, average_rating: values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : null };
}

exports.main = async (event) => {
  if (event.httpMethod === "OPTIONS") return response(204, {});
  try {
    if (event.httpMethod === "GET") return response(200, await dashboard());
    const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || event || {});
    const deviceId = cleanId(body.device_id);
    if (!deviceId) return response(400, { error: "匿名设备编号无效" });
    const now = new Date().toISOString();
    if (body.action === "track" && ALLOWED_EVENTS.has(body.event)) {
      const { error } = await db.from("product_events").insert({ device_id: deviceId, event: body.event, created_at: now, day: now.slice(0, 10) });
      if (error) throw new Error(error.message || String(error));
      return response(200, { ok: true });
    }
    if (body.action === "rating") {
      const rating = Number(body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return response(400, { error: "评分应为1到5分" });
      const { error } = await db.from("product_ratings").insert({ device_id: deviceId, rating, created_at: now });
      if (error) throw new Error(error.message || String(error));
      return response(200, { ok: true });
    }
    if (body.action === "feedback") {
      const message = cleanText(body.message, 500);
      if (!message) return response(400, { error: "请填写问题描述" });
      const { error } = await db.from("product_feedback").insert({ device_id: deviceId, message, contact: cleanText(body.contact, 80), created_at: now, status: "new" });
      if (error) throw new Error(error.message || String(error));
      return response(200, { ok: true });
    }
    return response(400, { error: "不支持的操作" });
  } catch (error) {
    console.error(error);
    return response(500, { error: "统计服务暂时不可用" });
  }
};
