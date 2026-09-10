import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {SnackSession,SNACK_GUESTS,makeSnackQueue,snackSpeed} from '../src/data/AnimalSnackData.js';
import {MINI_GAME_CATALOG,getMiniGamesByCategory} from '../src/data/MiniGameCatalog.js';

test('12 unique jobs, four visits per species, three teaching guests',()=>{
    for(const r of [0,0.25,0.5,0.999]){
        const q=makeSnackQueue(()=>r);
        assert.equal(q.length,12);
        assert.equal(new Set(q.map(x=>x.id)).size,12);
        assert.deepEqual(q.slice(0,3).map(x=>x.animal),[0,1,2]);
        for(let i=0;i<3;i++)assert.equal(q.filter(x=>x.animal===i).length,4);
    }
});
test('wrong snack never completes a guest and reveals helpful clue',()=>{
    const s=new SnackSession();
    assert.equal(s.deliver('banana'),'wrong');
    assert.equal(s.served,0);assert.equal(s.wrong,1);assert.equal(s.showHint,true);
    assert.equal(s.deliver('carrot'),'correct');
    assert.equal(s.served,1);assert.equal(s.cleanDeliveries,0);
    assert.equal(s.deliver('carrot'),'ignored');assert.equal(s.served,1);
});
test('missed guest is requeued and does not earn first-time credit',()=>{
    const s=new SnackSession(()=>0.5), first=s.current.id;
    s.miss();
    assert.equal(s.queue.at(-1).id,first);assert.equal(s.queue.at(-1).retries,1);
    assert.equal(s.miss(),false);
    while(!s.done){s.next();assert.ok(s.current);s.deliver(s.guest.food);}
    assert.equal(s.served,12);assert.equal(s.cleanDeliveries,11);assert.equal(s.missed,1);
});
test('full perfect route terminates exactly once after 12 deliveries',()=>{
    const s=new SnackSession();
    for(let i=0;i<12;i++){assert.equal(s.deliver(s.guest.food),'correct');if(i<11)s.next();}
    assert.equal(s.done,true);assert.equal(s.attempts,12);assert.equal(s.cleanDeliveries,12);
    s.next();assert.equal(s.current,null);assert.equal(s.deliver('carrot'),'ignored');
});
test('later guests hide automatic clues; requesting hints is idempotent',()=>{
    const s=new SnackSession();
    for(let i=0;i<3;i++){s.deliver(s.guest.food);s.next();}
    assert.equal(s.showHint,false);assert.equal(s.hint(),true);assert.equal(s.hint(),false);assert.equal(s.hints,1);
});
test('gradual speed and invalid input guards',()=>{
    assert.deepEqual([0,4,8].map(snackSpeed),[22,28,34]);
    const s=new SnackSession();assert.equal(s.deliver('bad'),'ignored');assert.equal(s.attempts,0);
});
test('hub registers scene, keeps existing entries and filters correctly',()=>{
    const g=MINI_GAME_CATALOG.find(x=>x.id==='animal_snack');assert.ok(g);
    assert.equal(g.scene,'AnimalSnackGame');assert.ok(getMiniGamesByCategory('rhythm').includes(g));
    assert.equal(MINI_GAME_CATALOG.length,9);assert.equal(new Set(MINI_GAME_CATALOG.map(x=>x.id)).size,9);
    const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
    assert.match(main,/import AnimalSnackGame/);assert.match(main,/\n\s+AnimalSnackGame,/);
});
test('all new image assets exist; no reward or persistent storage writes',()=>{
    for(const id of [...SNACK_GUESTS.flatMap(g=>[g.id,g.food]),'airship']){
        assert.ok(existsSync(new URL(`../assets/animal-snack/${id}.png`,import.meta.url)),id);
    }
    const scene=readFileSync(new URL('../src/scenes/AnimalSnackGame.js',import.meta.url),'utf8');
    assert.doesNotMatch(scene,/localStorage|registry\.set|SaveSystem|grantReward/);
});
