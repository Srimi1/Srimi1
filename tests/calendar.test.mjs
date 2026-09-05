import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePublicCalendar} from '../scripts/public-calendar.mjs';
function fixture(){return Array.from({length:365},(_,i)=>{const date=new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10);return `<td data-date="${date}" id="day-${i}" data-level="${i===1?2:0}"></td><tool-tip for="day-${i}">${i===1?'7 contributions':'No contributions'} on date.</tool-tip>`;}).join('');}
test('public calendar counts and date ordering are parsed without owner data',()=>{const c=parsePublicCalendar(fixture());assert.equal(c.totalContributions,7);assert.equal(c.weeks.flatMap(w=>w.contributionDays).length,365);assert.equal(c.weeks[0].contributionDays[0].weekday,3);});
test('upstream HTML changes fail closed',()=>{assert.throws(()=>parsePublicCalendar('Sign in'));assert.throws(()=>parsePublicCalendar(fixture().replace('7 contributions','Some contributions')));assert.throws(()=>parsePublicCalendar(fixture().replace('2025-01-02','2025-01-01')));});
