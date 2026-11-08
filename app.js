const audio=document.getElementById('audio');
const input=document.getElementById('fileInput');
const tracksEl=document.getElementById('tracks');
const playBtn=document.getElementById('play');
const cassette=document.getElementById('cassette');
const seek=document.getElementById('seek');
const searchInput=document.getElementById('trackSearch');
let tracks=[],current=-1,db=null,showFavorites=false,playlists=loadPlaylists(),activePlaylistId='',artistProfile=loadArtistProfile();
function loadArtistProfile(){try{return JSON.parse(localStorage.getItem('mop-artist-profile'))||{name:'Мой проект',bio:'Независимый исполнитель на MOP'}}catch(e){return {name:'Мой проект',bio:'Независимый исполнитель на MOP'}}}
function saveArtistProfile(){localStorage.setItem('mop-artist-profile',JSON.stringify(artistProfile));renderArtistProfile();}
function renderArtistProfile(){const name=document.getElementById('artistName'),bio=document.getElementById('artistBio');if(name)name.textContent=artistProfile.name||'Мой проект';if(bio)bio.textContent=artistProfile.bio||'Добавь короткое описание своего звучания.';const count=document.getElementById('artistTrackCount');if(count)count.textContent=tracks.length+' '+trackWord(tracks.length);}
function loadPlaylists(){try{return JSON.parse(localStorage.getItem('mop-playlists')||'[]')}catch(e){return []}}
function savePlaylists(){localStorage.setItem('mop-playlists',JSON.stringify(playlists))}
function renderPlaylistOptions(){const select=document.getElementById('playlistSelect');if(!select)return;select.replaceChildren(new Option('Все треки',''));playlists.forEach(p=>select.add(new Option(p.name,p.id)));select.value=activePlaylistId;const remove=document.getElementById('deletePlaylist');if(remove)remove.disabled=!activePlaylistId;}
function setLibraryEmpty(message){const box=document.createElement('div');box.className='empty';box.textContent=message;tracksEl.replaceChildren(box);}
function playbackQueue(){const playlist=playlists.find(p=>p.id===activePlaylistId);if(!playlist)return tracks.map((_,i)=>i);return tracks.map((track,index)=>playlist.trackIds.includes(track.id)?index:-1).filter(index=>index>=0);}
function stepTrack(direction){const queue=playbackQueue();if(!queue.length)return;let position=queue.indexOf(current);if(position<0)position=direction>0?-1:0;const next=position+direction;if(next<0||next>=queue.length){if(direction<0)load(queue[queue.length-1],true);else{audio.pause();audio.currentTime=0;sync()}return}load(queue[next],true);}
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
  tx.objectStore('tracks').add({name:file.name.replace(/\.[^.]+$/,''),artist:artistProfile.name||'Мой проект',blob:file,type:file.type});
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
function trackWord(n){
 const mod10=n%10,mod100=n%100;
 if(mod10===1&&mod100!==11)return 'трек';
 if(mod10>=2&&mod10<=4&&(mod100<12||mod100>14))return 'трека';
 return 'треков';
}
function render(){
 const selected=playlists.find(p=>p.id===activePlaylistId);
 document.getElementById('trackCount').textContent=tracks.length+' '+trackWord(tracks.length)+(selected?' · в «'+selected.name+'»: '+selected.trackIds.length:'');
 if(!tracks.length){setLibraryEmpty('Здесь появятся твои треки. Нажми «Загрузить музыку», чтобы добавить аудио с устройства.');return}
 tracksEl.innerHTML='';
 const query=(searchInput?.value||'').trim().toLocaleLowerCase('ru');
 const activePlaylist=playlists.find(p=>p.id===activePlaylistId);
 const visible=tracks.map((track,index)=>({track,index})).filter(({track})=>track.name.toLocaleLowerCase('ru').includes(query)&&(!showFavorites||track.favorite)&&(!activePlaylist||activePlaylist.trackIds.includes(track.id)));
 if(!visible.length){
  setLibraryEmpty(showFavorites?'В избранном пока пусто. Нажми ☆ у любого трека.':query?'Ничего не найдено. Попробуй другое название.':activePlaylist?'В плейлисте «'+activePlaylist.name+'» пока нет треков. Добавь композиции кнопкой ＋.':'В библиотеке пока нет треков.');
  return;
 }
 visible.forEach(({track:t,index:i})=>{
  const row=document.createElement('div');row.className='track'+(i===current?' active':'');
  const inPlaylist=activePlaylist&&activePlaylist.trackIds.includes(t.id);
  row.innerHTML='<div class="track-art">M</div><div class="track-info"><b></b><span>'+((t.artist||artistProfile.name||'Мой проект')+' · '+(inPlaylist?'В плейлисте «'+activePlaylist.name+'»':'На этом устройстве'))+'</span></div><button class="track-favorite" aria-label="Добавить в избранное" title="Добавить в избранное">'+(t.favorite?'★':'☆')+'</button><button class="track-add-playlist" aria-label="Добавить в плейлист" title="Добавить в выбранный плейлист">'+(inPlaylist?'✓':'＋')+'</button><button class="track-play" aria-label="Играть">▶</button><button class="track-delete" aria-label="Удалить трек" title="Удалить трек">×</button> ';
  row.querySelector('b').textContent=t.name;
  row.onclick=()=>load(i,true);
  row.querySelector('.track-favorite').onclick=e=>{e.stopPropagation();toggleFavorite(i)};
  row.querySelector('.track-add-playlist').onclick=e=>{e.stopPropagation();addToPlaylist(i)};
  row.querySelector('.track-delete').onclick=e=>{e.stopPropagation();removeTrack(i)};
  tracksEl.appendChild(row);
 });
}
function createPlaylist(){const name=prompt('Название нового плейлиста:');if(!name||!name.trim())return;const p={id:'pl-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:name.trim().slice(0,60),trackIds:[]};playlists.push(p);activePlaylistId=p.id;savePlaylists();renderPlaylistOptions();render();}
function deletePlaylist(){const p=playlists.find(x=>x.id===activePlaylistId);if(!p)return;if(!confirm('Удалить плейлист «'+p.name+'»? Сами аудиофайлы останутся в библиотеке.'))return;playlists=playlists.filter(x=>x.id!==p.id);activePlaylistId='';savePlaylists();renderPlaylistOptions();render();}
function addToPlaylist(index){const track=tracks[index];if(!track)return;if(!activePlaylistId){alert('Сначала создай плейлист и выбери его в списке.');return}const p=playlists.find(x=>x.id===activePlaylistId);if(!p)return;if(p.trackIds.includes(track.id))p.trackIds=p.trackIds.filter(id=>id!==track.id);else p.trackIds.push(track.id);savePlaylists();render();}
async function toggleFavorite(index){
 const track=tracks[index];if(!track||!db)return;
 const next=!track.favorite;
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('tracks','readwrite');
   const store=tx.objectStore('tracks');
   const request=store.get(track.id);
   request.onsuccess=()=>{if(request.result){request.result.favorite=next;store.put(request.result)}};
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  track.favorite=next;render();
 }catch(error){alert('Не удалось обновить избранное. Попробуй ещё раз.')}
}
async function removeTrack(index){
 const track=tracks[index];
 if(!track||!db)return;
 if(!confirm('Удалить «'+track.name+'» из библиотеки этого устройства?'))return;
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('tracks','readwrite');
   tx.objectStore('tracks').delete(track.id);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  playlists.forEach(p=>p.trackIds=p.trackIds.filter(id=>id!==track.id));savePlaylists();
  if(index===current){audio.pause();audio.removeAttribute('src');audio.load()}
  else if(index<current)current--;
  await refreshLibrary();
 }catch(error){alert('Не удалось удалить трек. Попробуй ещё раз.')}
}
function load(i,autoplay){
 if(i<0||i>=tracks.length)return;
 current=i;audio.src=tracks[i].url;
 document.getElementById('currentTitle').textContent=tracks[i].name;
 document.getElementById('currentArtist').textContent=tracks[i].artist||artistProfile.name||'Мой проект';
 render();if(autoplay)audio.play().catch(()=>{});sync();
}
function sync(){
 const active=!audio.paused&&!audio.ended;
 const progress=audio.duration?Math.min(1,Math.max(0,audio.currentTime/audio.duration)):0;
 const leftPack=cassette.querySelector('.left-pack'),rightPack=cassette.querySelector('.right-pack');
 if(leftPack&&rightPack){
  const coreRadius=8.5,leftOuter=19-progress*8.5,rightOuter=10.5+progress*8.5;
  [[leftPack,leftOuter],[rightPack,rightOuter]].forEach(([pack,outer])=>{
   const thickness=Math.max(0,outer-coreRadius);
   pack.setAttribute('r',((coreRadius+outer)/2).toFixed(2));
   pack.setAttribute('stroke-width',thickness.toFixed(2));
  });
 }
 cassette.classList.toggle('playing',active);cassette.style.setProperty('--tape-progress',(progress*100).toFixed(1)+'%');cassette.style.setProperty('--left-reel-speed',(1.15-progress*.43).toFixed(2)+'s');cassette.style.setProperty('--right-reel-speed',(.72+progress*.43).toFixed(2)+'s');playBtn.textContent=active?'Ⅱ':'▶';
}
searchInput?.addEventListener('input',render);
document.getElementById('saveArtistProfile')?.addEventListener('click',()=>{const name=document.getElementById('artistNameInput').value.trim();const bio=document.getElementById('artistBioInput').value.trim();if(!name){alert('Укажи имя исполнителя.');return}artistProfile={name,bio};saveArtistProfile();document.getElementById('artistEditor').hidden=true;});
document.getElementById('editArtistProfile')?.addEventListener('click',()=>{document.getElementById('artistNameInput').value=artistProfile.name||'';document.getElementById('artistBioInput').value=artistProfile.bio||'';document.getElementById('artistEditor').hidden=false;document.getElementById('artistNameInput').focus();});
document.getElementById('cancelArtistEdit')?.addEventListener('click',()=>{document.getElementById('artistEditor').hidden=true;});
document.getElementById('createPlaylist')?.addEventListener('click',createPlaylist);
document.getElementById('deletePlaylist')?.addEventListener('click',deletePlaylist);
document.getElementById('playlistSelect')?.addEventListener('change',e=>{activePlaylistId=e.target.value;renderPlaylistOptions();render()});
document.getElementById('favoritesFilter')?.addEventListener('click',e=>{
 showFavorites=!showFavorites;
 e.currentTarget.classList.toggle('active',showFavorites);
 e.currentTarget.setAttribute('aria-pressed',String(showFavorites));
 e.currentTarget.textContent=showFavorites?'★ Избранное':'☆ Избранное';
 render();
});
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
 renderArtistProfile();
 const previous=current;
 current=-1;render();
 if(tracks.length){load(previous>=0&&previous<tracks.length?previous:0,false)}
 else{audio.removeAttribute('src');audio.load()}
}
playBtn.onclick=()=>{
 if(current<0){if(tracks.length)load(0,true);return}
 if(audio.paused)audio.play().catch(()=>{});else audio.pause();
};
document.getElementById('next').onclick=()=>stepTrack(1);
document.getElementById('prev').onclick=()=>{if(audio.currentTime>3){audio.currentTime=0;return}stepTrack(-1)};
audio.addEventListener('play',sync);audio.addEventListener('pause',sync);
audio.addEventListener('ended',()=>stepTrack(1));
audio.addEventListener('error',()=>{if(audio.currentSrc)document.getElementById('currentArtist').textContent='Не удалось воспроизвести файл. Попробуй загрузить его ещё раз.'});
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
 renderPlaylistOptions();renderArtistProfile();render();
 try{await openLibrary();await refreshLibrary()}
 catch(error){tracksEl.innerHTML='<div class="empty">Локальное хранилище недоступно. Музыку можно добавить после разрешения хранилища браузера.</div>'}
})();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
