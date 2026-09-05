import test from 'node:test';
import assert from 'node:assert/strict';
import {quietRoute,routeDays,advance,summarize} from '../docs/game-core.mjs';
const week=(counts,offset=0)=>({contributionDays:counts.map((n,i)=>({date:`day-${offset+i}`,weekday:i,contributionCount:n}))});
test('path snakes between weeks and visits every empty square exactly once',()=>{const weeks=[week([0,3,0]),week([0,1,0],3)];assert.deepEqual(routeDays(weeks).map(d=>d.date),['day-0','day-1','day-2','day-5','day-4','day-3']);const route=quietRoute(weeks);assert.equal(route.length,4);assert.equal(new Set(route.map(d=>d.date)).size,4);assert.ok(route.every(d=>d.contributionCount===0));});
test('dice cannot move past finish or accept invalid rolls',()=>{assert.equal(advance(8,6,10),9);assert.equal(advance(0,6,0),0);assert.throws(()=>advance(0,0,5));assert.throws(()=>advance(0,1.5,5));});
test('all-active and all-quiet calendars are valid',()=>{assert.equal(quietRoute([week([1,2,1])]).length,0);assert.equal(quietRoute([week([0,0,0])]).length,3);assert.deepEqual(summarize([]),{days:0,active:0,quiet:0,total:0,best:0,current:0});});
test('counts and streaks span week boundaries, allowing an unfinished today',()=>{assert.deepEqual(summarize([week([0,2,1]),week([4,0],3)]),{days:5,active:3,quiet:2,total:7,best:3,current:3});assert.equal(summarize([week([1,0,0])]).current,0);});
