// Run against the local development server; uses an isolated browser profile.
const assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/Users/hugh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const baseUrl = process.env.MUFFIN_KNIGHT_TEST_URL || 'http://localhost:3000';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1150}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(`${baseUrl}/muffin-knight`);await page.getByRole('heading',{name:'今天，和誰一起搶漢堡？'}).waitFor();await page.screenshot({path:'/tmp/knight-mode-menu.png',fullPage:true});
 await page.getByRole('button',{name:/01 \/ SOLO/}).click();await page.getByRole('button',{name:'開始挑戰',exact:true}).click({timeout:60000});await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.phase==='draft');assert.equal(await page.getByTestId('p2-health').count(),0);
 await page.locator('[data-blessing]').first().click();await page.getByRole('button',{name:'切換模式',exact:true}).click();
 await page.getByRole('button',{name:/02 \/ LOCAL CO-OP/}).click();
 await page.getByRole('navigation',{name:'選擇關卡'}).getByRole('button',{name:/發條遊樂場/}).click();assert.equal(await page.getByRole('region',{name:'拼裝關卡'}).count(),0);
 await page.getByRole('button',{name:'開始挑戰',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.phase==='playing');
 await page.waitForTimeout(4200);await page.locator('canvas').screenshot({path:'/tmp/knight-workshop-fixed.png'});
 await page.getByRole('button',{name:'切換模式',exact:true}).click();await page.getByRole('button',{name:/03 \/ CPU PARTNER/}).click();
 await page.getByRole('button',{name:'開始挑戰',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('[data-testid="p2-muffins"]')?.textContent)>0,{},{timeout:30000});
 assert.equal(await page.getByTestId('p1-muffins').innerText(),'0');await page.keyboard.press('p');await page.getByRole('button',{name:'回到準備畫面'}).click();
 await page.getByRole('navigation',{name:'選擇關卡'}).getByRole('button',{name:/發條遊樂場/}).click();assert.equal(await page.getByRole('button',{name:'開始挑戰',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'開始挑戰',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.phase==='playing');
 await page.keyboard.press('p');await page.getByRole('button',{name:'回到準備畫面'}).click();
 await page.setViewportSize({width:393,height:852});await page.screenshot({path:'/tmp/knight-workshop-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'切換模式',exact:true}).click();await page.screenshot({path:'/tmp/knight-mode-menu-mobile.png',fullPage:true});assert.equal(await page.getByRole('button',{name:/03 \/ CPU PARTNER/}).isVisible(),true);
 assert.deepEqual(errors,[]);console.log('PASS: all three mode entries; solo draft; duo fixed workshop immediate play; autonomous CPU collection; CPU immediate workshop entry; reset/menu; desktop/mobile; no page errors.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
