// Self-contained Leaflet + OpenStreetMap center-pin picker, rendered inside a
// WebView (native) or an <iframe> (web). No API key. It posts the chosen
// { lat, lng, label } back to the host via ReactNativeWebView / window.parent.
export function leafletHtml(lat = 13.0827, lng = 80.2707): string {
  return `<!doctype html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html,body{margin:0;height:100%;font-family:-apple-system,system-ui,sans-serif}
  #map{position:absolute;inset:0}
  #pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);z-index:600;pointer-events:none;font-size:34px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))}
  #search{position:absolute;top:12px;left:12px;right:12px;z-index:700;display:flex;gap:8px}
  #q{flex:1;border:0;border-radius:12px;padding:12px 14px;font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,.15);outline:none}
  #results{position:absolute;top:56px;left:12px;right:12px;z-index:700;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.18)}
  #results div{padding:11px 14px;border-bottom:1px solid #eee;font-size:14px}
  #confirm{position:absolute;left:12px;right:12px;bottom:14px;z-index:700;background:#17171a;color:#ffd93d;border:0;border-radius:16px;padding:16px;font-size:16px;font-weight:800}
</style></head><body>
<div id="map"></div>
<div id="pin">📍</div>
<div id="search"><input id="q" placeholder="Search area, locality, landmark…" autocomplete="off"/></div>
<div id="results"></div>
<button id="confirm">Use this location</button>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  // Init only once Leaflet has actually loaded (external <script> ordering is
  // not guaranteed inside a srcdoc iframe on some browsers).
  function boot(){
    if (typeof L === 'undefined') { return setTimeout(boot, 60); }
    window._go(L);
  }
  window._go = function(L){
  var map = L.map('map',{zoomControl:false}).setView([${lat}, ${lng}], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
  setTimeout(function(){ map.invalidateSize(); }, 120);
  function send(m){ var s=JSON.stringify(m);
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if(window.parent) window.parent.postMessage(s,'*'); }
  var q=document.getElementById('q'), results=document.getElementById('results'), t;
  function shortLabel(a){ if(!a) return ''; var p=[a.suburb||a.neighbourhood||a.road||a.village||a.town, a.city||a.state_district||a.state]; return p.filter(Boolean).join(', '); }
  q.addEventListener('input', function(){ clearTimeout(t); var v=q.value.trim(); if(v.length<3){results.innerHTML='';return;}
    t=setTimeout(function(){ fetch('https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q='+encodeURIComponent(v))
      .then(function(r){return r.json()}).then(function(list){
        results.innerHTML=''; list.forEach(function(it){ var d=document.createElement('div');
          d.textContent=it.display_name; d.onclick=function(){ results.innerHTML=''; q.value=it.display_name.split(',')[0];
            map.setView([parseFloat(it.lat),parseFloat(it.lon)],15); };
          results.appendChild(d); }); }).catch(function(){}); },350); });
  document.getElementById('confirm').addEventListener('click', function(){
    var c=map.getCenter();
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat='+c.lat+'&lon='+c.lng)
      .then(function(r){return r.json()}).then(function(j){ send({type:'select',lat:c.lat,lng:c.lng,label:shortLabel(j.address)||'Pinned location'}); })
      .catch(function(){ send({type:'select',lat:c.lat,lng:c.lng,label:'Pinned location'}); }); });
  };
  boot();
</script></body></html>`;
}
