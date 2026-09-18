import test from "node:test";import assert from "node:assert/strict";import {extractUrl,classify,parseSearchQuery,reviewScore} from "../src/core.mjs";
const fixture=`3.38 :9pm 10/31 iPk:/ l@C.us 一周练完可以写进简历的Agent项目都已整理好，九月最新agent项目合集，拿走不谢！# agent项目 # agent搭建 # agent开发 # 大模型 # 人工智能 https://v.douyin.com/P5AthMrw2bI/ 复制此链接，打开Dou音搜索，直接观看视频！`;
test("从完整分享文本提取抖音链接",()=>assert.equal(extractUrl(fixture),"https://v.douyin.com/P5AthMrw2bI/"));
test("规则分类可识别 AI 内容和标签",()=>{const result=classify(fixture);assert.equal(result.category,"AI");assert.ok(result.tags.includes("agent项目"));});
test("自然语言搜索会去掉无意义词",()=>assert.deepEqual(parseSearchQuery("我之前收藏过哪些面试技巧？"),["面试技巧"]));
test("今日回顾优先较久且少回顾内容",()=>{const now=new Date("2026-09-17").getTime(),old={imported_at:"2026-01-01",last_reviewed_at:null,review_count:0},recent={imported_at:"2026-09-16",last_reviewed_at:null,review_count:0},reviewed={imported_at:"2026-01-01",last_reviewed_at:"2026-09-16",review_count:20};assert.ok(reviewScore(old,now)>reviewScore(recent,now));assert.ok(reviewScore(old,now)>reviewScore(reviewed,now));});
