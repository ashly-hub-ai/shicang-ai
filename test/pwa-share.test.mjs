import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("PWA 声明为系统分享接收目标",async()=>{
  const manifest=JSON.parse(await readFile("public/manifest.webmanifest","utf8"));
  assert.equal(manifest.share_target.action,"/?share_target=1");
  assert.equal(manifest.share_target.method,"GET");
  assert.equal(manifest.share_target.params.text,"text");
  assert.equal(manifest.share_target.params.url,"url");
});

test("首页包含快捷收藏确认和复制链接兜底入口",async()=>{
  const [html,script,styles]=await Promise.all([readFile("public/index.html","utf8"),readFile("public/app.js","utf8"),readFile("public/pwa.css","utf8")]);
  assert.match(html,/id="quickImportDialog"/);
  assert.match(html,/分享菜单里没有“拾藏”/);
  assert.doesNotMatch(html,/>存入拾藏</);
  assert.match(html,/id="imageImportSubmit" class="primary hidden"/);
  assert.match(styles,/\.primary\.hidden/);
  assert.match(script,/detectClipboardCandidate/);
  assert.match(script,/offerQuickImport\(shared,"share_target"\)/);
});

test("搜索建议、回顾反馈和批量删除入口可用",async()=>{
  const [html,script]=await Promise.all([readFile("public/index.html","utf8"),readFile("public/app.js","utf8")]);
  assert.match(html,/id="searchSuggestions"/);
  assert.match(html,/id="deleteSelected"/);
  assert.match(html,/id="scanInvalidLinks"/);
  assert.match(script,/data-review-action/);
  assert.match(script,/suggestedKeywords/);
});

test("首页文案更自然且搜索框支持本机最近搜索",async()=>{
  const [html,script,styles]=await Promise.all([readFile("public/index.html","utf8"),readFile("public/app.js","utf8"),readFile("public/pwa.css","utf8")]);
  assert.match(html,/把灵感，轻轻收好/);
  assert.match(html,/想起什么，就搜什么/);
  assert.match(html,/输入一个关键词，或说说你记得的内容/);
  assert.match(html,/id="recentSearches"/);
  assert.match(script,/shicang-recent-searches/);
  assert.match(script,/rememberSearch/);
  assert.match(script,/clearRecentSearches/);
  assert.match(styles,/#importStatus:not\(:empty\)/);
  assert.match(styles,/\.save-toast/);
});

test("快捷收藏成功后留在首页并聚焦下一次输入",async()=>{
  const script=await readFile("public/app.js","utf8");
  const handler=script.match(/\$\("#quickImportForm"\)[\s\S]+?\$\("#closeQuickImport"\)/)?.[0]||"";
  assert.match(handler,/showView\("home"\)/);
  assert.match(handler,/\$\("#shareText"\)\.focus/);
  assert.doesNotMatch(handler,/showView\("mine"\)/);
});
