export const categories = ["AI", "找工作", "美食", "小说", "其他"];
const rules = {
  AI: ["ai", "agent", "大模型", "人工智能", "langgraph", "rag", "编程", "开发", "模型"],
  找工作: ["找工作", "求职", "面试", "简历", "招聘", "岗位", "offer", "职场"],
  美食: ["美食", "餐厅", "小店", "探店", "好吃", "菜谱", "烹饪", "面馆", "咖啡"],
  小说: ["小说", "网文", "书荒", "作者", "章节", "推文", "文学"]
};
export function extractUrl(text = "") {
  const urls = text.match(/https?:\/\/[^\s，。；！!）)]+/gi) || [];
  return urls.find((url) => /(?:v\.)?douyin\.com/i.test(url)) || urls[0] || "";
}
export function classify(text = "") {
  const lower = text.toLowerCase(); let best = { category: "其他", score: 0 };
  for (const [category, words] of Object.entries(rules)) { const score = words.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0); if (score > best.score) best = { category, score }; }
  const hashtags = [...text.matchAll(/#\s*([^#\s，。！!]+)/g)].map((m) => m[1]);
  const keywords = Object.values(rules).flat().filter((word) => lower.includes(word));
  return { category: best.category, tags: [...new Set([...hashtags, ...keywords])].slice(0, 8) };
}
export function inferContentType(text = "", url = "") { if (/图文|图片|相册/.test(text)) return "gallery"; if (/视频|观看视频|douyin\.com/.test(`${text} ${url}`)) return "video"; return text ? "text" : "unknown"; }
export function parseSearchQuery(query = "") { return query.toLowerCase().replace(/我|之前|以前|收藏过|哪些|有没有|帮我|找找|的|吗|？|\?/g, " ").split(/[\s，。]+/).filter((word) => word.length > 1); }
export const searchSynonymGroups = [
  ["求职", "找工作", "就业", "秋招", "春招", "校招", "面试", "简历", "内推", "offer"],
  ["AI", "人工智能", "大模型", "agent", "智能体", "chatgpt", "提示词"],
  ["美食", "餐厅", "探店", "吃饭", "菜谱", "咖啡"],
  ["旅行", "旅游", "攻略", "景点", "酒店", "民宿"],
  ["学习", "课程", "考试", "考研", "读书", "笔记"],
  ["健身", "运动", "减脂", "增肌", "跑步", "瑜伽"]
];
export function expandSearchTerms(query = "") {
  const lower = query.toLowerCase(), base = parseSearchQuery(query), expanded = new Set(base);
  for (const group of searchSynonymGroups) if (group.some(word => lower.includes(word.toLowerCase()))) group.forEach(word => expanded.add(word.toLowerCase()));
  return [...expanded];
}
export function searchScore(item, query = "") {
  const terms = expandSearchTerms(query); if (!terms.length) return 0;
  const title = String(item.title || "").toLowerCase(), category = String(item.category || "").toLowerCase(), tags = (item.tags || []).join(" ").toLowerCase(), raw = `${item.description || ""} ${item.raw_share_text || ""} ${item.ocr_text || ""}`.toLowerCase();
  return terms.reduce((score, term) => score + (title.includes(term) ? 8 : 0) + (category.includes(term) ? 7 : 0) + (tags.includes(term) ? 6 : 0) + (raw.includes(term) ? 2 : 0), 0);
}
export function suggestSearchKeywords(items = [], query = "", limit = 6) {
  const queryLower = query.toLowerCase(), candidates = new Map();
  const add = value => { const word = String(value || "").trim(); if (word.length < 2 || queryLower.includes(word.toLowerCase())) return; candidates.set(word, (candidates.get(word) || 0) + 1); };
  for (const item of items) { add(item.category); (item.tags || []).forEach(add); }
  for (const group of searchSynonymGroups) if (group.some(word => queryLower.includes(word.toLowerCase()))) group.forEach(word => candidates.set(word, (candidates.get(word) || 0) + 8));
  return [...candidates].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN")).slice(0, limit).map(([word]) => word);
}
export function reviewScore(item, now = Date.now()) { const imported = new Date(item.imported_at).getTime(); const last = item.last_reviewed_at ? new Date(item.last_reviewed_at).getTime() : imported; return Math.max(0,(now-imported)/86400000)*1.2 + Math.max(0,(now-last)/86400000)*0.8 - Number(item.review_count||0)*12; }
