/* Zeltbuch Service Worker: App startet schneller und funktioniert offline.
   Seite: zuerst Netz (immer aktuell), bei Funkloch aus dem Cache. Eigene Dateien & Schriften: aus dem Cache, im Hintergrund aktualisiert.
   Supabase-Anfragen und Unsplash-Bilder laufen am Service Worker vorbei. */
const V='zeltbuch-v8';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-512-maskable.png','vendor/supabase-2.117.2.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  const same=u.origin===self.location.origin,font=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!same&&!font)return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(ca=>ca.put('index.html',c));return res;}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.open(V).then(async ca=>{
    const hit=await ca.match(r);
    const net=fetch(r).then(res=>{if(res.ok)ca.put(r,res.clone());return res;}).catch(()=>hit);
    return hit||net;
  }));
});
