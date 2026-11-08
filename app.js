const audio=document.getElementById('audio');
const input=document.getElementById('fileInput');
const tracksEl=document.getElementById('tracks');
const playBtn=document.getElementById('play');
const cassette=document.getElementById('cassette');
const seek=document.getElementById('seek');
let tracks=[],current=-1,db=null;
const fmt=s=>!Number.isFinite(s)?'0:00':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
function openLibrary(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('Хранилище недоступно'));return}
  const request=indexedDB.open('mop-library',1);
  request.onupgradeneeded=()=>{const d=request.result;if(!d.objectStoreNames.contains('tracks'))d.createObjectStore('tracks',{keyPath:'id',autoIncrement:true})};
  request.onsuccess=()=>{db=request.result;resolve(db)};
  request.onerror=()=>reject(request.error);
 });
}
function storeTrack(file){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('tracks','readwrite');
  tx.objectStore('tracks').add({name:file.name.replace(/\.[^.]+$/,''),blob:file,type:file.type});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
function readTracks(){
 return new Promise((resolve,reject)=>{
  const request=db.transaction('tracks','readonly').objectStore('tracks').getAll();
  request.onsuccess=()=>resolve(request.result||[]);
  request.onerror=()=>reject(request.error);
 });
}
function render(){
 document.getElementById('trackCount').textContent=tracks.length+' треков';
 if(!tracks.length){tracksEl.innerHTML='<div class="empty">Здесь появятся твои треки.<br>Нажми «Загрузить музыку», чтобы добавить аудио с устройства.</div>';return}
 tracksEl.innerHTML='';
 tracks.forEach((t,i)=>{
  const row=document.createElement('div');row.className='track'+(i===current?' active':'');
  row.innerHTML='<div class="track-art">M</div><div class="track-info"><b></b><span>Сохранено на устройстве</span></div><button aria-label="Играть">▶</button>';
  row.querySelector('b').textContent=t.name;row.onclick=()=>load(i,true);tracksEl.appendChild(row);
 });
}
function load(i,autoplay){
 if(i<0||i>=tracks.length)return;
 current=i;audio.src=tracks[i].url;
 document.getElementById('currentTitle').textContent=tracks[i].name;
 document.getElementById('currentArtist').textContent='Моя библиотека';
 render();if(autoplay)audio.play().catch(()=>{});sync();
}
function sync(){
 const active=!audio.paused&&!audio.ended;
 const progress=audio.duration?Math.min(1,Math.max(0,audio.currentTime/audio.duration)):0;
 const leftPack=cassette.querySelector('.left-pack'),rightPack=cassette.querySelector('.right-pack');
 if(leftPack&&rightPack){
  const coreRadius=9,leftOuter=19-progress*10,rightOuter=9+progress*10;
  [[leftPack,leftOuter],[rightPack,rightOuter]].forEach(([pack,outer])=>{
   const thickness=Math.max(0,outer-coreRadius);
   pack.setAttribute('r',((coreRadius+outer)/2).toFixed(2));
   pack.setAttribute('stroke-width',thickness.toFixed(2));
  });
 }
 cassette.classList.toggle('playing',active);playBtn.textContent=active?'Ⅱ':'▶';
}
input.addEventListener('change',async e=>{
 const files=Array.from(e.target.files||[]).filter(file=>file.type.startsWith('audio/')||/\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i.test(file.name));
 if(!files.length){input.value='';return}
 try{
  if(!db)await openLibrary();
  for(const file of files)await storeTrack(file);
  await refreshLibrary();
 }catch(error){
  alert('Не удалось сохранить музыку на устройстве. Проверь свободное место и разрешение браузера.');
 }
 input.value='';
});
async function refreshLibrary(){
 const saved=await readTracks();
 tracks.forEach(t=>URL.revokeObjectURL(t.url));
 tracks=saved.map(t=>({...t,url:URL.createObjectURL(t.blob)}));
 const previous=current;
 current=-1;render();
 if(tracks.length){load(previous>=0&&previous<tracks.length?previous:0,false)}
 else{audio.removeAttribute('src');audio.load()}
}
playBtn.onclick=()=>{
 if(current<0){if(tracks.length)load(0,true);return}
 if(audio.paused)audio.play().catch(()=>{});else audio.pause();
};
document.getElementById('next').onclick=()=>{if(tracks.length)load((current+1)%tracks.length,true)};
document.getElementById('prev').onclick=()=>{if(audio.currentTime>3){audio.currentTime=0;return}if(tracks.length)load((current-1+tracks.length)%tracks.length,true)};
audio.addEventListener('play',sync);audio.addEventListener('pause',sync);
audio.addEventListener('ended',()=>{if(tracks.length&&current<tracks.length-1)load(current+1,true);else{audio.currentTime=0;seek.value=0;sync()}});
audio.addEventListener('loadedmetadata',()=>document.getElementById('duration').textContent=fmt(audio.duration));
audio.addEventListener('timeupdate',()=>{
 document.getElementById('elapsed').textContent=fmt(audio.currentTime);
 if(audio.duration)seek.value=audio.currentTime/audio.duration*1000;
 sync();
});
seek.addEventListener('input',()=>{if(audio.duration)audio.currentTime=seek.value/1000*audio.duration});
document.getElementById('volume').addEventListener('input',e=>audio.volume=Number(e.target.value));
audio.volume=.8;
(async()=>{
 render();
 try{await openLibrary();await refreshLibrary()}
 catch(error){tracksEl.innerHTML='<div class="empty">Локальное хранилище недоступно. Музыку можно добавить после разрешения хранилища браузера.</div>'}
})();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
