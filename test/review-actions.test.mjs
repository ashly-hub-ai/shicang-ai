import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

test("今日回顾支持有用、以后再看和不再推荐状态",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"shicang-review-")),port=43919;
  const child=spawn(process.execPath,["server.mjs"],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DB_PATH:join(dir,"test.db")}});
  try{
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error("启动超时")),5000);child.stdout.on("data",()=>{clearTimeout(timer);resolve()});child.on("error",reject)});
    const call=async(path,options={})=>{const response=await fetch(`http://127.0.0.1:${port}${path}`,{headers:{"content-type":"application/json"},...options});return response.json()};
    const first=await call("/api/collections",{method:"POST",body:JSON.stringify({raw_share_text:"面试复盘 https://example.com/1"})});
    const useful=await call(`/api/collections/${first.id}/review`,{method:"PATCH",body:JSON.stringify({review_action:"useful"})});
    assert.equal(useful.review_feedback,"useful");
    const second=await call("/api/collections",{method:"POST",body:JSON.stringify({raw_share_text:"秋招清单 https://example.com/2"})});
    const later=await call(`/api/collections/${second.id}/review`,{method:"PATCH",body:JSON.stringify({review_action:"later"})});
    assert.equal(later.review_feedback,"later");assert.ok(later.snooze_until);
    const third=await call("/api/collections",{method:"POST",body:JSON.stringify({raw_share_text:"过期内容 https://example.com/3"})});
    const dismissed=await call(`/api/collections/${third.id}/review`,{method:"PATCH",body:JSON.stringify({review_action:"dismiss"})});
    assert.equal(dismissed.review_excluded,1);
    const reviews=await call("/api/review");assert.equal(reviews.some(item=>item.id===second.id||item.id===third.id),false);
  }finally{const exited=new Promise(resolve=>child.once("exit",resolve));child.kill();await exited;await rm(dir,{recursive:true,force:true})}
});
