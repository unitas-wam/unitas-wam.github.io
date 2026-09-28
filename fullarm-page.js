/* A single hero decoder; gallery media loads on intent, WebGL loads near its section. */
(()=>{const $=s=>document.querySelector(s),hero=$('#hero-mosaic'),reduce=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:600px)');let enabled=!reduce.matches,visible=true;function sync(){hero.defaultPlaybackRate=1.15;hero.playbackRate=1.15;if(enabled&&visible&&!document.hidden)hero.play().catch(()=>{});else hero.pause()}function wall(){const kind=mobile.matches?'mobile':'desktop';hero.src=`${document.body.dataset.heroRoot||document.body.dataset.assetRoot}/wall-${kind}.mp4`;hero.poster=`${document.body.dataset.heroRoot||document.body.dataset.assetRoot}/wall-${kind}.jpg`;sync()}mobile.addEventListener('change',wall);reduce.addEventListener('change',()=>{enabled=!reduce.matches;sync()});new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync()},{threshold:.03}).observe(hero);wall();document.addEventListener('visibilitychange',()=>{sync();if(document.hidden)document.querySelectorAll('.film-grid video').forEach(v=>v.pause())});
let scenes=[],filter='all',limit=12;const observer=new IntersectionObserver(es=>{for(const e of es)if(!e.isIntersecting)e.target.pause()},{threshold:.05});function render(){const grid=$('#study-grid');grid.querySelectorAll('video').forEach(v=>v.pause());observer.disconnect();grid.replaceChildren();const list=scenes.filter(s=>filter==='all'||(filter==='real'?s.real:s.domain===filter));$('#study-count').textContent=`${list.length} interactions`;for(const s of list.slice(0,limit)){const f=document.createElement('figure'),v=document.createElement('video');f.dataset.sample=s.key;v.controls=true;v.muted=true;v.loop=true;v.playsInline=true;v.preload='none';v.poster=s.base+'poster.jpg';v.src=s.base+'scene.mp4';v.defaultPlaybackRate=1.5;v.playbackRate=1.5;v.addEventListener('loadedmetadata',()=>{v.defaultPlaybackRate=v.playbackRate=Math.max(1.5,v.duration/4.8)});v.setAttribute('aria-label',s.title+' — predicted action and scene, full-arm IK');v.onplay=()=>document.querySelectorAll('.film-grid video').forEach(o=>{if(o!==v)o.pause()});const caption=document.createElement('figcaption');caption.textContent=s.title;const line=document.createElement('div');line.className='study-meta';const tag=document.createElement('span');tag.textContent=s.domain+' / '+(s.real?'REAL WORLD':'SIMULATION');const a=document.createElement('a');a.href='#interactive';a.textContent='Explore in 3D';a.onclick=()=>window.dispatchEvent(new CustomEvent('select-conditional-scene',{detail:s.key}));line.append(tag);if(s.interactive)line.append(a);caption.append(line);f.append(v,caption);grid.append(f);observer.observe(v)}$('#study-more').hidden=limit>=list.length;$('#study-more').textContent=`Show ${Math.min(9,list.length-limit)} more interactions ＋`}
fetch('public-studies.json?v=paymentsign').then(r=>{if(!r.ok)throw Error('manifest');return r.json()}).then(data=>{scenes=data;render()}).catch(()=>$('#study-count').textContent='Studies could not load. Please reload.');$('#study-filters').onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;limit=12;$('#study-filters').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()};$('#study-more').onclick=()=>{limit+=9;render()};})();

// Lightweight playback counters used by browser QA (decode drops, not model errors).
setInterval(()=>{for(const video of document.querySelectorAll('video')){const q=video.getVideoPlaybackQuality?.();if(q){video.dataset.decodedFrames=q.totalVideoFrames;video.dataset.droppedFrames=q.droppedVideoFrames}}},2000);


// Keep the masthead unobstructed; reveal navigation once the cover has passed.
(()=>{
 const nav=document.querySelector('header.nav'),cover=document.querySelector('#cover');
 if(!nav||!cover)return;
 let scheduled=false;
 const update=()=>{
  scheduled=false;
  const visible=cover.getBoundingClientRect().bottom<=nav.getBoundingClientRect().height;
  nav.classList.toggle('is-visible',visible);
  nav.inert=!visible;
  nav.setAttribute('aria-hidden',String(!visible));
 };
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}};
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule);
 new ResizeObserver(schedule).observe(cover);
 update();
})();
