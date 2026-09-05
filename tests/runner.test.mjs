import test from 'node:test';
import assert from 'node:assert/strict';
import {frameAt,frameViewBox,RUN_CYCLE_MS,RUN_FRAMES} from '../docs/runner.mjs';
test('a complete stride shows eight distinct poses and loops without a blank frame',()=>{
  const views=new Set();
  for(let ms=0;ms<RUN_CYCLE_MS;ms+=10){const index=frameAt(ms);assert.ok(index>=0&&index<RUN_FRAMES.length);views.add(frameViewBox(index));}
  assert.equal(views.size,8);
  assert.equal(frameViewBox(frameAt(RUN_CYCLE_MS)),frameViewBox(frameAt(0)));
  for(const frame of RUN_FRAMES){assert.ok(frame.x+frame.width<=1536);assert.ok(frame.y+frame.height<=1024);}
});
