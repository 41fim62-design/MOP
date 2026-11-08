const audio=document.getElementById('audio');
const input=document.getElementById('fileInput');
const tracksEl=document.getElementById('tracks');
const playBtn=document.getElementById('play');
const cassette=document.getElementById('cassette');
const seek=document.getElementById('seek');
const searchInput=document.getElementById('trackSearch');
const durationEl=document.getElementById('duration'),elapsedEl=document.getElementById('elapsed');
let tracks=[],current=-1,db=null,showFavorites=false,playlists=loadPlaylists(),activePlaylistId='',artistProfile=loadArtistProfile(),sharedArtistProfile=readSharedArtistProfile();
const selectedTrackIds=new Set();
let shuffleEnabled=false,repeatMode='off',shuffleOrder=[],shuffleSignature='',playbackSpeed=1;
try{const playbackPrefs=JSON.parse(localStorage.getItem('mop-playback-options')||'{}');shuffleEnabled=!!playbackPrefs.shuffle;repeatMode=['off','all','one'].includes(playbackPrefs.repeat)?playbackPrefs.repeat:'off';playbackSpeed=[.75,1,1.25,1.5,2].includes(Number(playbackPrefs.speed))?Number(playbackPrefs.speed):1}catch(error){}
function savePlaybackOptions(){try{localStorage.setItem('mop-playback-options',JSON.stringify({shuffle:shuffleEnabled,repeat:repeatMode,speed:playbackSpeed}))}catch(error){}}
function updatePlaybackOptions(){
 const speedSelect=document.getElementById('playbackSpeed');if(speedSelect)speedSelect.value=String(playbackSpeed);
 const shuffle=document.getElementById('shuffleToggle'),repeat=document.getElementById('repeatToggle');
 if(shuffle){shuffle.classList.toggle('active',shuffleEnabled);shuffle.setAttribute('aria-pressed',String(shuffleEnabled));shuffle.textContent=shuffleEnabled?'🔀':'⇄';shuffle.title=shuffleEnabled?'Случайный порядок включён':'Включить случайный порядок';shuffle.setAttribute('aria-label',shuffle.title)}
 if(repeat){const labels={off:'↻',all:'↻',one:'↻¹'};repeat.textContent=labels[repeatMode];repeat.classList.toggle('active',repeatMode!=='off');repeat.title=repeatMode==='off'?'Повтор выключен':repeatMode==='all'?'Повтор всего списка':'Повтор одного трека';repeat.setAttribute('aria-label',repeat.title);repeat.setAttribute('aria-pressed',String(repeatMode!=='off'))}
}
function loadArtistProfile(){try{return JSON.parse(localStorage.getItem('mop-artist-profile'))||{name:'Мой проект',bio:'Независимый исполнитель на MOP'}}catch(e){return {name:'Мой проект',bio:'Независимый исполнитель на MOP'}}}
function readSharedArtistProfile(){
 const params=new URLSearchParams(location.search);
 const name=params.get('artist'),bio=params.get('bio'),accent=params.get('accent');
 if(!name)return null;
 return {name:name.slice(0,50),bio:(bio||'').slice(0,180),accent:/^#[0-9a-f]{6}$/i.test(accent||'')?accent:'#a78bfa'};
}
function saveArtistProfile(){localStorage.setItem('mop-artist-profile',JSON.stringify(artistProfile));renderArtistProfile();}
function renderArtistProfile(){
 const profile=sharedArtistProfile||artistProfile;
 const name=document.getElementById('artistName'),bio=document.getElementById('artistBio');
 if(name)name.textContent=profile.name||'Мой проект';
 if(bio)bio.textContent=profile.bio||'Независимый исполнитель на MOP';
 const count=document.getElementById('artistTrackCount');
 if(count)count.textContent=sharedArtistProfile?'Карточка исполнителя · аудио не опубликовано':tracks.length+' '+trackWord(tracks.length);
 const edit=document.getElementById('editArtistProfile'),share=document.getElementById('shareArtistProfile');
 if(edit)edit.hidden=!!sharedArtistProfile;
 if(share)share.hidden=!!sharedArtistProfile;
 const kicker=document.querySelector('.artist-kicker');
 if(kicker)kicker.textContent=sharedArtistProfile?'КАРТОЧКА ИСПОЛНИТЕЛЯ ПО ССЫЛКЕ':'ПРОФИЛЬ ИСПОЛНИТЕЛЯ';
 const avatar=document.getElementById('artistAvatar');
 if(avatar){avatar.replaceChildren();const photo=sharedArtistProfile?null:artistProfile.photo;if(photo){const image=document.createElement('img');image.src=photo;image.alt='Фото исполнителя';avatar.appendChild(image)}else avatar.textContent=(profile.name||'M').trim().charAt(0).toUpperCase()||'M';avatar.style.setProperty('--artist-accent',sharedArtistProfile?.accent||artistProfile.accent||'#a78bfa');}
 const card=document.getElementById('artistCard');if(card)card.style.setProperty('--artist-accent',sharedArtistProfile?.accent||artistProfile.accent||'#a78bfa');
 const preview=document.getElementById('artistPhotoPreview');if(preview){preview.replaceChildren();if(artistProfile.photo){const image=document.createElement('img');image.src=artistProfile.photo;image.alt='Предпросмотр фото профиля';preview.appendChild(image)}else preview.textContent='Фото не выбрано';}
 const removePhoto=document.getElementById('removeArtistPhoto');if(removePhoto)removePhoto.hidden=!artistProfile.photo;
 const notice=document.getElementById('profileNotice');
 if(notice)notice.hidden=!sharedArtistProfile;
}

async function chooseArtistPhoto(){
 const picker=document.createElement('input');picker.type='file';picker.accept='image/*';picker.hidden=true;document.body.appendChild(picker);
 picker.onchange=async()=>{
  const file=picker.files?.[0];picker.remove();if(!file)return;
  try{
   if(!file.type.startsWith('image/'))throw new Error('Выбери изображение.');
   if(file.size>12*1024*1024)throw new Error('Фото должно быть меньше 12 МБ.');
   const bitmap=await createImageBitmap(file),size=512,scale=Math.min(1,size/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   const photo=canvas.toDataURL('image/jpeg',.82);
   artistProfile={...artistProfile,photo};
   try{saveArtistProfile()}catch(storageError){delete artistProfile.photo;throw new Error('Не хватает места в хранилище браузера. Удали старые данные или уменьши фото.')}
   alert('Фото профиля сохранено на этом устройстве. Для общей публикации потребуется серверное хранилище.');
  }catch(error){alert(error.message||'Не удалось сохранить фото.')}
 };
 picker.click();
}

async function shareArtistProfile(){
 const params=new URLSearchParams({artist:artistProfile.name||'Мой проект',bio:artistProfile.bio||'',accent:artistProfile.accent||'#a78bfa'});
 const url=location.origin+location.pathname+'?'+params.toString();
 const shareData={title:'MOP · '+(artistProfile.name||'Исполнитель'),text:'Карточка исполнителя на MOP. Фото профиля отображается только на устройстве владельца.',url};
 try{
  if(navigator.share){await navigator.share(shareData);return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);alert('Ссылка на карточку скопирована. Отправь её друзьям.');return}
  const field=document.createElement('textarea');field.value=url;field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();
  const copied=document.execCommand('copy');field.remove();
  alert(copied?'Ссылка на карточку скопирована.':'Не удалось скопировать ссылку. Открой MOP через HTTPS и попробуй ещё раз.');
 }catch(error){if(error.name!=='AbortError')alert('Не удалось поделиться карточкой. Попробуй ещё раз.')}
}
function loadPlaylists(){try{const value=JSON.parse(localStorage.getItem('mop-playlists')||'[]');return Array.isArray(value)?value.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Array.isArray(p.trackIds)).map(p=>({...p,trackIds:[...new Set(p.trackIds.filter(id=>Number.isFinite(id)))]})):[]}catch(e){return []}}
function savePlaylists(){localStorage.setItem('mop-playlists',JSON.stringify(playlists))}
function renderPlaylistOptions(){const select=document.getElementById('playlistSelect');if(!select)return;select.replaceChildren(new Option('Все треки',''));playlists.forEach(p=>select.add(new Option(p.name,p.id)));select.value=activePlaylistId;const remove=document.getElementById('deletePlaylist');if(remove)remove.disabled=!activePlaylistId;}
function setLibraryEmpty(message){const box=document.createElement('div');box.className='empty';box.textContent=message;tracksEl.replaceChildren(box);}
function refreshArtistFilter(){
 const select=document.getElementById('artistFilter');if(!select)return;
 const selected=select.value;
 const artists=[...new Set(tracks.map(t=>(t.artist||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru',{sensitivity:'base'}));
 select.replaceChildren(new Option('Все исполнители',''),...artists.map(name=>new Option(name,name)));
 if(artists.includes(selected))select.value=selected;
}
function getVisibleTrackEntries(){
 const query=(searchInput?.value||'').trim().toLocaleLowerCase('ru');
 const playlist=playlists.find(p=>p.id===activePlaylistId);
 const visible=tracks.map((track,index)=>({track,index})).filter(({track})=>{
  const searchable=[track.name,track.artist].filter(Boolean).join(' ').toLocaleLowerCase('ru');
  const artistFilter=document.getElementById('artistFilter')?.value||'';\n  return searchable.includes(query)&&(!artistFilter||(track.artist||'').trim()===artistFilter)&&(!showFavorites||track.favorite)&&(!playlist||playlist.trackIds.includes(track.id));
 });
 const sort=document.getElementById('trackSort')?.value||'newest';
 visible.sort((a,b)=>{
  if(sort==='title')return (a.track.name||'').localeCompare(b.track.name||'','ru',{sensitivity:'base'});
  if(sort==='artist')return (a.track.artist||'').localeCompare(b.track.artist||'','ru',{sensitivity:'base'})||(a.track.name||'').localeCompare(b.track.name||'','ru',{sensitivity:'base'});
  if(sort==='duration'){const da=Number.isFinite(a.track.duration)?a.track.duration:Infinity,db=Number.isFinite(b.track.duration)?b.track.duration:Infinity;return da-db||(Number(b.track.id)||b.index)-(Number(a.track.id)||a.index)}
  return (Number(b.track.id)||b.index)-(Number(a.track.id)||a.index);
 });
 return visible;
}
function playbackQueue(){return getVisibleTrackEntries().map(item=>item.index);}
function getPlaybackOrder(){
 const queue=playbackQueue(),signature=queue.join(',');
 if(!shuffleEnabled)return queue;
 if(signature!==shuffleSignature||!shuffleOrder.length){
  shuffleSignature=signature;shuffleOrder=queue.slice();
  for(let i=shuffleOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffleOrder[i],shuffleOrder[j]]=[shuffleOrder[j],shuffleOrder[i]]}
  const currentPosition=shuffleOrder.indexOf(current);
  if(currentPosition>0)[shuffleOrder[0],shuffleOrder[currentPosition]]=[shuffleOrder[currentPosition],shuffleOrder[0]];
 }
 return shuffleOrder.filter(index=>queue.includes(index));
}
function stepTrack(direction){
 if(repeatMode==='one'&&direction>0){audio.currentTime=0;audio.play().catch(()=>{});return}
 const queue=getPlaybackOrder();if(!queue.length)return;
 let position=queue.indexOf(current);if(position<0)position=direction>0?-1:0;
 let next=position+direction;
 if(next<0||next>=queue.length){
  if(repeatMode==='all')next=direction>0?0:queue.length-1;
  else if(direction<0)next=queue.length-1;
  else{audio.pause();audio.currentTime=0;sync();return}
 }
 load(queue[next],true);
}
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
function formatBytes(bytes){
 if(!Number.isFinite(bytes)||bytes<=0)return '0 Б';
 const units=['Б','КБ','МБ','ГБ'];
 const power=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);
 const value=bytes/Math.pow(1024,power);
 return value.toLocaleString('ru-RU',{maximumFractionDigits:power===0?0:1})+' '+units[power];
}
function updateLibraryStats(){
 const size=tracks.reduce((sum,track)=>sum+(Number(track.blob?.size)||0),0);
 const favorites=tracks.filter(track=>track.favorite).length;
 const values={
  libraryStatTracks:tracks.length,
  libraryStatSize:formatBytes(size),
  libraryStatFavorites:favorites,
  libraryStatPlaylists:playlists.length
 };
 Object.entries(values).forEach(([id,value])=>{
  const node=document.getElementById(id);
  if(node)node.textContent=String(value);
 });
}
function render(){
 refreshArtistFilter();
 updateLibraryStats();
 const selected=playlists.find(p=>p.id===activePlaylistId);
 const countEl=document.getElementById('trackCount');
 if(countEl)countEl.textContent=tracks.length+' '+trackWord(tracks.length)+(selected?' · в «'+selected.name+'»: '+selected.trackIds.length:'');
 updateBulkTools([]);
 if(!tracks.length){selectedTrackIds.clear();setLibraryEmpty('Здесь появятся твои треки. Нажми «Загрузить музыку», чтобы добавить аудио с устройства.');return}
 tracksEl.innerHTML='';
 const query=(searchInput?.value||'').trim().toLocaleLowerCase('ru');
 const activePlaylist=playlists.find(p=>p.id===activePlaylistId);
 const visible=getVisibleTrackEntries();
 if(countEl&&query)countEl.textContent+=' · найдено: '+visible.length;
 updateBulkTools(visible.map(item=>item.track.id));
 if(!visible.length){
  setLibraryEmpty(showFavorites?'В избранном пока пусто. Нажми ☆ у любого трека.':query?'Ничего не найдено. Проверь название или имя исполнителя.':activePlaylist?'В плейлисте «'+activePlaylist.name+'» пока нет треков. Добавь композиции кнопкой ＋.':'В библиотеке пока нет треков.');
  return;
 }
 visible.forEach(({track:t,index:i})=>{
  const row=document.createElement('div');row.className='track'+(i===current?' active':'');
  const selectLabel=document.createElement('label');selectLabel.className='track-select';selectLabel.title='Выбрать трек';
  const selectBox=document.createElement('input');selectBox.type='checkbox';selectBox.checked=selectedTrackIds.has(t.id);selectBox.setAttribute('aria-label','Выбрать '+t.name);selectBox.onclick=e=>e.stopPropagation();selectBox.onchange=()=>{if(selectBox.checked)selectedTrackIds.add(t.id);else selectedTrackIds.delete(t.id);updateBulkTools(visible.map(item=>item.track.id))};
  selectLabel.onclick=e=>e.stopPropagation();selectLabel.appendChild(selectBox);
  const inPlaylist=activePlaylist&&activePlaylist.trackIds.includes(t.id);
  const art=document.createElement('button');art.className='track-art track-cover-button';art.type='button';art.title='Установить обложку';art.setAttribute('aria-label','Изменить обложку: '+t.name);
  if(t.coverUrl){const image=document.createElement('img');image.src=t.coverUrl;image.alt='Обложка '+t.name;art.appendChild(image)}else art.textContent='M';
  art.onclick=e=>{e.stopPropagation();chooseTrackCover(t.id)};
  const info=document.createElement('div');info.className='track-info';
  const title=document.createElement('b');title.textContent=t.name;
  const subtitle=document.createElement('span');subtitle.textContent=(t.artist||artistProfile.name||'Мой проект')+' · '+(inPlaylist?'В плейлисте «'+activePlaylist.name+'»':'На этом устройстве');
  const duration=document.createElement('span');duration.className='track-duration';duration.dataset.trackDuration=String(t.id);duration.textContent=Number.isFinite(t.duration)?fmt(t.duration):'…';
  info.append(title,subtitle,duration);
  const favorite=document.createElement('button');favorite.className='track-favorite';favorite.type='button';favorite.setAttribute('aria-label',t.favorite?'Убрать из избранного':'Добавить в избранное');favorite.title=favorite.getAttribute('aria-label');favorite.textContent=t.favorite?'★':'☆';
  const add=document.createElement('button');add.className='track-add-playlist';add.type='button';add.setAttribute('aria-label','Добавить или убрать из плейлиста');add.title=add.getAttribute('aria-label');add.textContent=inPlaylist?'✓':'＋';
  const play=document.createElement('button');play.className='track-play';play.type='button';play.setAttribute('aria-label','Играть');play.textContent='▶';
  const editBtn=document.createElement('button');editBtn.className='track-edit';editBtn.type='button';editBtn.setAttribute('aria-label','Изменить название и исполнителя');editBtn.title='Изменить данные трека';editBtn.textContent='✎';
  const shareBtn=document.createElement('button');shareBtn.className='track-share';shareBtn.type='button';shareBtn.setAttribute('aria-label','Поделиться аудиофайлом');shareBtn.title='Поделиться треком';shareBtn.textContent='↗';
  const exportBtn=document.createElement('button');exportBtn.className='track-export';exportBtn.type='button';exportBtn.setAttribute('aria-label','Скачать копию трека');exportBtn.title='Скачать копию';exportBtn.textContent='↓';
  const remove=document.createElement('button');remove.className='track-delete';remove.type='button';remove.setAttribute('aria-label','Удалить трек');remove.title='Удалить трек';remove.textContent='×';
  row.append(selectLabel,art,info,favorite,add,editBtn,shareBtn,exportBtn,play,remove);
  row.onclick=()=>load(i,true);
  favorite.onclick=e=>{e.stopPropagation();toggleFavorite(i)};
  add.onclick=e=>{e.stopPropagation();addToPlaylist(i)};
  editBtn.onclick=e=>{e.stopPropagation();editTrackMetadata(i)};
  shareBtn.onclick=e=>{e.stopPropagation();shareTrack(i)};
  exportBtn.onclick=e=>{e.stopPropagation();exportTrack(i)};
  remove.onclick=e=>{e.stopPropagation();removeTrack(i)};
  tracksEl.appendChild(row);
 });
}

function updateBulkTools(visibleIds){
 const bar=document.getElementById('bulkTools');if(!bar)return;
 const count=document.getElementById('bulkSelectedCount');
 const visible=new Set(visibleIds);
 const selectedVisible=visibleIds.filter(id=>selectedTrackIds.has(id)).length;
 if(count)count.textContent='Выбрано: '+selectedTrackIds.size;
 const all=document.getElementById('selectVisibleTracks');
 if(all){all.textContent=visibleIds.length&&selectedVisible===visibleIds.length?'Снять выделение':'Выбрать видимые';all.disabled=!visibleIds.length;all.setAttribute('aria-pressed',String(visibleIds.length>0&&selectedVisible===visibleIds.length));}
 const add=document.getElementById('bulkAddPlaylist'),remove=document.getElementById('bulkDeleteTracks');
 if(add)add.disabled=!selectedTrackIds.size||!activePlaylistId;
 if(remove)remove.disabled=!selectedTrackIds.size;
 bar.hidden=!tracks.length;
}
function toggleVisibleSelection(){
 const query=(searchInput?.value||'').trim().toLocaleLowerCase('ru');
 const playlist=playlists.find(p=>p.id===activePlaylistId);
 const visible=tracks.filter(t=>[t.name,t.artist].filter(Boolean).join(' ').toLocaleLowerCase('ru').includes(query)&&(!showFavorites||t.favorite)&&(!playlist||playlist.trackIds.includes(t.id))).map(t=>t.id);
 const allSelected=visible.length>0&&visible.every(id=>selectedTrackIds.has(id));
 visible.forEach(id=>allSelected?selectedTrackIds.delete(id):selectedTrackIds.add(id));render();
}
function addSelectedToPlaylist(){
 const playlist=playlists.find(p=>p.id===activePlaylistId);
 if(!playlist){alert('Сначала создай или выбери плейлист.');return}
 const ids=tracks.filter(t=>selectedTrackIds.has(t.id)).map(t=>t.id);
 if(!ids.length)return;
 const existing=new Set(playlist.trackIds);ids.forEach(id=>existing.add(id));playlist.trackIds=[...existing];
 savePlaylists();selectedTrackIds.clear();render();
}
async function deleteSelectedTracks(){
 const ids=tracks.filter(t=>selectedTrackIds.has(t.id)).map(t=>t.id);
 if(!ids.length||!db)return;
 if(!confirm('Удалить '+ids.length+' '+trackWord(ids.length)+' из библиотеки этого устройства? Это действие нельзя отменить.'))return;
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks');
   ids.forEach(id=>store.delete(id));
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Операция отменена'));
  });
  const removedCurrent=current>=0&&ids.includes(tracks[current]?.id);
  playlists.forEach(p=>p.trackIds=p.trackIds.filter(id=>!ids.includes(id)));savePlaylists();
  selectedTrackIds.clear();
  if(removedCurrent){audio.pause();audio.removeAttribute('src');audio.load();current=-1}
  await refreshLibrary();
 }catch(error){alert('Не удалось удалить выбранные треки. Попробуй ещё раз.')}
}

async function shareTrack(index){
 const track=tracks[index];if(!track?.blob)return;
 const ext=track.blob.type.split('/')[1]?.replace(/[^a-z0-9]/gi,'')||'audio';
 const safeName=(track.name||'MOP-track').replace(/[\\/:*?"<>|]+/g,'_').slice(0,100);
 try{
  const file=new File([track.blob],safeName+'.'+ext,{type:track.blob.type||'application/octet-stream'});
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   await navigator.share({title:track.name,text:'Трек из MOP · Music of People',files:[file]});
   return;
  }
 }catch(error){if(error.name==='AbortError')return}
 exportTrack(index);
 alert('Прямая отправка файла не поддерживается этим браузером. Трек скачан, его можно прикрепить к сообщению.');
}

async function normalizeCover(file){
 if(!file||!file.type.startsWith('image/'))throw new Error('Выбери файл изображения.');
 if(file.size>15*1024*1024)throw new Error('Изображение должно быть меньше 15 МБ.');
 if(!('createImageBitmap'in window))return file;
 const bitmap=await createImageBitmap(file);
 const max=900,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Не удалось обработать обложку')),'image/jpeg',.84));
}
async function chooseTrackCover(trackId){
 const picker=document.createElement('input');picker.type='file';picker.accept='image/*';picker.hidden=true;document.body.appendChild(picker);
 picker.onchange=async()=>{
  const file=picker.files?.[0];picker.remove();if(!file)return;
  try{
   const cover=await normalizeCover(file);
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks'),req=store.get(trackId);
    req.onsuccess=()=>{if(!req.result){reject(new Error('Трек не найден'));return}req.result.cover=cover;store.put(req.result)};
    req.onerror=()=>reject(req.error);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Операция отменена'));
   });
   await refreshLibrary();
  }catch(error){alert(error.message||'Не удалось сохранить обложку.')}
 };
 picker.click();
}

function exportTrack(index){
 const track=tracks[index];if(!track?.blob)return;
 const url=URL.createObjectURL(track.blob),link=document.createElement('a');
 const safeName=(track.name||'MOP-track').replace(/[\\/:*?"<>|]+/g,'_').slice(0,100);
 link.href=url;link.download=safeName+'.'+(track.blob.type.split('/')[1]?.replace(/[^a-z0-9]/gi,'')||'audio');
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}

function guessAudioMime(name){
 const ext=String(name||'').split('.').pop().toLowerCase();
 return ({mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',flac:'audio/flac',m4a:'audio/mp4',aac:'audio/aac',opus:'audio/ogg'})[ext]||'audio/mpeg';
}
function blobToDataUrl(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(reader.result);
  reader.onerror=()=>reject(reader.error||new Error('Не удалось прочитать аудио'));
  reader.readAsDataURL(blob);
 });
}
function dataUrlToBlob(dataUrl){
 if(typeof dataUrl!=='string'||!/^data:(?:audio|image)\/[a-z0-9.+-]+;base64,/i.test(dataUrl))throw new Error('В резервной копии найден некорректный медиафайл');
 const parts=dataUrl.split(',');
 const mime=parts[0].slice(5).split(';')[0];
 const binary=atob(parts[1]);
 const bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return new Blob([bytes],{type:mime});
}
function downloadJson(data,name){
 const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
}
async function exportBackup(){
 if(!db)await openLibrary();
 const saved=await readTracks();
 if(!saved.length&&!playlists.length){alert('Пока нечего сохранять. Сначала добавь музыку или создай плейлист.');return}
 if(!confirm('Создать полную резервную копию профиля, плейлистов и аудиофайлов? Большая музыкальная библиотека может занять много памяти и времени.'))return;
 const button=document.getElementById('exportBackup');
 if(button){button.disabled=true;button.textContent='Готовим копию…'}
 try{
  const backupTracks=[];
  for(const track of saved){
   const sourceBlob=track.blob?.type?.startsWith('audio/')?track.blob:new Blob([track.blob],{type:guessAudioMime(track.name)});
   backupTracks.push({id:track.id,name:track.name||'Без названия',artist:track.artist||'',type:sourceBlob.type,favorite:!!track.favorite,data:await blobToDataUrl(sourceBlob),cover:track.cover instanceof Blob?await blobToDataUrl(track.cover):null});
  }
  downloadJson({format:'MOP_BACKUP',version:1,createdAt:new Date().toISOString(),artistProfile,playlists,tracks:backupTracks},'MOP-backup-'+new Date().toISOString().slice(0,10)+'.json');
  alert('Резервная копия создана. Сохрани JSON-файл отдельно от телефона, чтобы не потерять музыку.');
 }catch(error){alert('Не удалось создать копию. Возможно, библиотека слишком большая или не хватает памяти устройства.')}
 finally{if(button){button.disabled=false;button.textContent='↓ Резервная копия'}}
}
async function importBackup(file){
 if(!file)return;
 if(file.size>500*1024*1024){alert('Файл копии больше 500 МБ. Для импорта выбери файл меньшего размера.');return}
 try{
  const backup=JSON.parse(await file.text());
  if(!backup||backup.format!=='MOP_BACKUP'||backup.version!==1||!Array.isArray(backup.tracks)||!Array.isArray(backup.playlists)||!backup.artistProfile||typeof backup.artistProfile!=='object')throw new Error('Формат файла не распознан');
  if(!confirm('Импорт заменит текущую музыку, плейлисты и профиль на данные из резервной копии. Продолжить?'))return;
  const restored=backup.tracks.map((t,index)=>{
   const blob=dataUrlToBlob(t.data);
   const record={name:String(t.name||'Без названия').slice(0,180),artist:String(t.artist||'').slice(0,100),blob,type:blob.type||String(t.type||''),favorite:!!t.favorite};
   if(t.cover)record.cover=dataUrlToBlob(t.cover);
   if(Number.isSafeInteger(t.id)&&t.id>0)record.id=t.id;
   return record;
  });
  const restoredIds=new Set(restored.map(t=>t.id).filter(Number.isSafeInteger));
  const cleanPlaylists=backup.playlists.filter(p=>p&&typeof p.name==='string').slice(0,200).map((p,i)=>({
   id:typeof p.id==='string'?p.id:'pl-import-'+i,
   name:p.name.slice(0,60),
   trackIds:Array.isArray(p.trackIds)?[...new Set(p.trackIds.filter(id=>Number.isSafeInteger(id)&&restoredIds.has(id)))]:[]
  }));
  if(!db)await openLibrary();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks');
   store.clear();
   restored.forEach(t=>store.put(t));
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Импорт отменён'));
  });
  artistProfile={name:String(backup.artistProfile.name||'Мой проект').slice(0,50),bio:String(backup.artistProfile.bio||'').slice(0,180),accent:/^#[0-9a-f]{6}$/i.test(backup.artistProfile.accent||'')?backup.artistProfile.accent:'#a78bfa',...(typeof backup.artistProfile.photo==='string'&&backup.artistProfile.photo.startsWith('data:image/')?{photo:backup.artistProfile.photo}:{})};
  localStorage.setItem('mop-artist-profile',JSON.stringify(artistProfile));
  playlists=cleanPlaylists;savePlaylists();activePlaylistId='';
  audio.pause();audio.removeAttribute('src');audio.load();current=-1;
  renderPlaylistOptions();await refreshLibrary();
  alert('Резервная копия восстановлена. Музыка, профиль и плейлисты загружены.');
 }catch(error){alert('Не удалось импортировать копию: '+(error.message||'проверь файл и свободную память'))}
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
async function editTrackMetadata(index){
 const track=tracks[index];if(!track||!db)return;
 const name=prompt('Название трека:',track.name||'');
 if(name===null)return;
 const cleanName=name.trim().slice(0,180);
 if(!cleanName){alert('Название трека не может быть пустым.');return}
 const artist=prompt('Имя исполнителя:',track.artist||artistProfile.name||'');
 if(artist===null)return;
 const cleanArtist=artist.trim().slice(0,100);
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks'),request=store.get(track.id);
   request.onsuccess=()=>{
    if(!request.result){reject(new Error('Трек не найден'));return}
    request.result.name=cleanName;request.result.artist=cleanArtist;store.put(request.result);
   };
   request.onerror=()=>reject(request.error);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Операция отменена'));
  });
  track.name=cleanName;track.artist=cleanArtist;render();
 }catch(error){alert('Не удалось сохранить изменения трека. Попробуй ещё раз.')}
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
  await refreshLibrary();
 }catch(error){alert('Не удалось удалить трек. Попробуй ещё раз.')}
}
function savePlaybackState(){
 if(current<0||!tracks[current])return;
 try{localStorage.setItem('mop-playback-state',JSON.stringify({trackId:tracks[current].id,time:Number.isFinite(audio.currentTime)?audio.currentTime:0}))}catch(error){}
}
function load(i,autoplay){
 if(i<0||i>=tracks.length)return;
 current=i;savePlaybackState();audio.pause();audio.src=tracks[i].url;seek.value=0;elapsedEl.textContent='0:00';durationEl.textContent='0:00';
 const playerCover=document.querySelector('.player .cover');
 if(playerCover){playerCover.replaceChildren();if(tracks[i].coverUrl){const image=document.createElement('img');image.src=tracks[i].coverUrl;image.alt='Обложка '+tracks[i].name;playerCover.appendChild(image)}else playerCover.textContent='M'}
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
 cassette.classList.toggle('playing',active);cassette.style.setProperty('--tape-progress',(progress*100).toFixed(1)+'%');cassette.style.setProperty('--left-reel-speed',(1.15-progress*.43).toFixed(2)+'s');cassette.style.setProperty('--right-reel-speed',(.72+progress*.43).toFixed(2)+'s');playBtn.textContent=active?'Ⅱ':'▶';playBtn.setAttribute('aria-label',active?'Пауза':'Воспроизвести');playBtn.setAttribute('aria-pressed',String(active));
}
searchInput?.addEventListener('input',render);
document.getElementById('trackSort')?.addEventListener('change',render);
document.getElementById('artistFilter')?.addEventListener('change',render);
document.getElementById('playVisibleTracks')?.addEventListener('click',()=>{const queue=getPlaybackOrder();if(queue.length)load(queue[0],true);else alert('В этом разделе пока нет композиций.');});
document.getElementById('shareArtistProfile')?.addEventListener('click',shareArtistProfile);
document.getElementById('artistPhotoButton')?.addEventListener('click',chooseArtistPhoto);
document.getElementById('removeArtistPhoto')?.addEventListener('click',()=>{if(!artistProfile.photo)return;delete artistProfile.photo;saveArtistProfile();});
document.getElementById('saveArtistProfile')?.addEventListener('click',()=>{const name=document.getElementById('artistNameInput').value.trim();const bio=document.getElementById('artistBioInput').value.trim();const accent=document.getElementById('artistAccentInput').value;if(!name){alert('Укажи имя исполнителя.');return}artistProfile={...artistProfile,name,bio,accent};saveArtistProfile();document.getElementById('artistEditor').hidden=true;});
document.getElementById('editArtistProfile')?.addEventListener('click',()=>{if(sharedArtistProfile)return;document.getElementById('artistNameInput').value=artistProfile.name||'';document.getElementById('artistBioInput').value=artistProfile.bio||'';document.getElementById('artistAccentInput').value=artistProfile.accent||'#a78bfa';document.getElementById('artistEditor').hidden=false;document.getElementById('artistNameInput').focus();});
document.getElementById('cancelArtistEdit')?.addEventListener('click',()=>{document.getElementById('artistEditor').hidden=true;});
document.getElementById('createPlaylist')?.addEventListener('click',createPlaylist);
document.getElementById('selectVisibleTracks')?.addEventListener('click',toggleVisibleSelection);
document.getElementById('bulkAddPlaylist')?.addEventListener('click',addSelectedToPlaylist);
document.getElementById('bulkDeleteTracks')?.addEventListener('click',deleteSelectedTracks);
document.getElementById('exportBackup')?.addEventListener('click',exportBackup);
document.getElementById('importBackupInput')?.addEventListener('change',e=>{importBackup(e.target.files?.[0]);e.target.value=''});
document.getElementById('deletePlaylist')?.addEventListener('click',deletePlaylist);
document.getElementById('playlistSelect')?.addEventListener('change',e=>{activePlaylistId=e.target.value;renderPlaylistOptions();render()});
document.getElementById('favoritesFilter')?.addEventListener('click',e=>{
 showFavorites=!showFavorites;
 e.currentTarget.classList.toggle('active',showFavorites);
 e.currentTarget.setAttribute('aria-pressed',String(showFavorites));
 e.currentTarget.textContent=showFavorites?'★ Избранное':'☆ Избранное';
 render();
});
function isAudioFile(file){return !!file&&(file.type.startsWith('audio/')||/\.(mp3|wav|ogg|flac|m4a|aac|opus|aiff|wma)$/i.test(file.name||''))}
async function addAudioFiles(fileList){
 const files=Array.from(fileList||[]).filter(isAudioFile);
 if(!files.length){setUploadStatus('Не нашёл аудиофайлы. Поддерживаются MP3, WAV, OGG, FLAC, M4A и другие аудиоформаты.',true);return}
 const status=document.getElementById('uploadStatus');let added=0,failed=0;
 if(status){status.hidden=false;status.textContent='Подготовка '+files.length+' '+trackWord(files.length)+'…';status.classList.remove('error')}
 try{
  if(!db)await openLibrary();
  for(let index=0;index<files.length;index++){
   const file=files[index];
   if(status)status.textContent='Добавление '+(index+1)+' из '+files.length+': '+file.name;
   try{await storeTrack(file);added++}catch(error){failed++}
  }
  await refreshLibrary();
  const message='Добавлено: '+added+'. Ошибок: '+failed+'.';
  setUploadStatus(message,failed>0);
 }catch(error){setUploadStatus('Не удалось открыть музыкальное хранилище. Проверь разрешение браузера и свободное место.',true)}
}
function setUploadStatus(message,isError){
 const status=document.getElementById('uploadStatus');if(!status)return;
 status.hidden=false;status.textContent=message;status.classList.toggle('error',!!isError);
}
input.addEventListener('change',async e=>{await addAudioFiles(e.target.files);input.value=''});
let fileDragDepth=0;
document.addEventListener('dragenter',event=>{
 if(!Array.from(event.dataTransfer?.types||[]).includes('Files'))return;
 event.preventDefault();fileDragDepth++;document.body.classList.add('file-dragging');
 const zone=document.getElementById('dropOverlay');if(zone)zone.hidden=false;
});
document.addEventListener('dragover',event=>{if(Array.from(event.dataTransfer?.types||[]).includes('Files'))event.preventDefault()});
document.addEventListener('dragleave',event=>{
 if(!Array.from(event.dataTransfer?.types||[]).includes('Files'))return;
 fileDragDepth=Math.max(0,fileDragDepth-1);
 if(fileDragDepth===0){document.body.classList.remove('file-dragging');const zone=document.getElementById('dropOverlay');if(zone)zone.hidden=true}
});
document.addEventListener('drop',async event=>{
 if(!event.dataTransfer?.files?.length)return;
 event.preventDefault();fileDragDepth=0;document.body.classList.remove('file-dragging');
 const zone=document.getElementById('dropOverlay');if(zone)zone.hidden=true;
 await addAudioFiles(event.dataTransfer.files);
});
function saveTrackDuration(id,duration){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks'),request=store.get(id);
  request.onsuccess=()=>{if(request.result){request.result.duration=duration;store.put(request.result)}};
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Не удалось сохранить длительность'));
 });
}
async function scanTrackDurations(){
 const pending=tracks.filter(track=>!Number.isFinite(track.duration));
 let cursor=0;
 const worker=async()=>{
  while(cursor<pending.length){
   const track=pending[cursor++];
   await new Promise(resolve=>{
    const probe=new Audio();let finished=false;
    const done=()=>{if(finished)return;finished=true;clearTimeout(timer);probe.onloadedmetadata=null;probe.onerror=null;probe.removeAttribute('src');probe.load();resolve()};
    const timer=setTimeout(done,5000);
    probe.preload='metadata';
    probe.onloadedmetadata=()=>{
     if(Number.isFinite(probe.duration)&&probe.duration>0){track.duration=probe.duration;saveTrackDuration(track.id,track.duration).catch(()=>{});const badge=document.querySelector('[data-track-duration="'+String(track.id)+'"]');if(badge)badge.textContent=fmt(track.duration)}
     done();
    };
    probe.onerror=done;probe.src=track.url;
   });
  }
 };
 await Promise.all(Array.from({length:Math.min(3,pending.length)},worker));
 if(document.getElementById('trackSort')?.value==='duration')render();
}
async function refreshLibrary(){
 const previousTrack=current>=0?tracks[current]:null;
 const previousTime=audio.currentTime||0;
 const wasPlaying=!!previousTrack&&!audio.paused;
 let remembered=null;
 if(!previousTrack){try{remembered=JSON.parse(localStorage.getItem('mop-playback-state')||'null')}catch(error){}}
 const saved=await readTracks();
 tracks.forEach(t=>URL.revokeObjectURL(t.url));
 tracks=saved.map(t=>({...t,url:URL.createObjectURL(t.blob),coverUrl:t.cover instanceof Blob?URL.createObjectURL(t.cover):''}));
 renderArtistProfile();
 const restoredIndex=previousTrack?tracks.findIndex(t=>t.id===previousTrack.id):-1;
 render();
 if(tracks.length){
  const rememberedIndex=remembered?tracks.findIndex(t=>String(t.id)===String(remembered.trackId)):-1;
  const target=restoredIndex>=0?restoredIndex:rememberedIndex>=0?rememberedIndex:Math.min(Math.max(current,0),tracks.length-1);
  if(restoredIndex>=0||rememberedIndex>=0){
   const restoreTime=restoredIndex>=0?previousTime:Number(remembered.time)||0;
   audio.addEventListener('loadedmetadata',()=>{
    if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Math.min(Math.max(0,restoreTime),Math.max(0,audio.duration-.25));
    if(wasPlaying)audio.play().catch(()=>{});
    savePlaybackState();
   },{once:true});
  }
  load(target,false);
  scanTrackDurations();
 }else{current=-1;audio.removeAttribute('src');audio.load();sync()}
}
playBtn.onclick=()=>{
 if(current<0){const queue=getPlaybackOrder();if(queue.length)load(queue[0],true);return}
 if(audio.paused)audio.play().catch(()=>{});else audio.pause();
};
document.getElementById('next').onclick=()=>stepTrack(1);
document.getElementById('shuffleToggle')?.addEventListener('click',()=>{
 shuffleEnabled=!shuffleEnabled;shuffleOrder=[];shuffleSignature='';savePlaybackOptions();updatePlaybackOptions();
});
document.getElementById('repeatToggle')?.addEventListener('click',()=>{
 repeatMode=repeatMode==='off'?'all':repeatMode==='all'?'one':'off';savePlaybackOptions();updatePlaybackOptions();
});
document.getElementById('prev').onclick=()=>{if(audio.currentTime>3){audio.currentTime=0;return}stepTrack(-1)};
audio.addEventListener('play',sync);audio.addEventListener('pause',sync);
audio.addEventListener('ended',()=>{savePlaybackState();stepTrack(1)});
window.addEventListener('pagehide',savePlaybackState);
audio.addEventListener('error',()=>{if(audio.currentSrc){document.getElementById('currentArtist').textContent='Не удалось воспроизвести файл. Формат может не поддерживаться браузером.';playBtn.textContent='▶';playBtn.setAttribute('aria-pressed','false')}});
audio.addEventListener('loadedmetadata',()=>{durationEl.textContent=fmt(audio.duration);seek.disabled=!Number.isFinite(audio.duration)||audio.duration<=0});
audio.addEventListener('timeupdate',()=>{
 elapsedEl.textContent=fmt(audio.currentTime);
 savePlaybackState();
 if(Number.isFinite(audio.duration)&&audio.duration>0)seek.value=audio.currentTime/audio.duration*1000;
 sync();
});
seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(seek.value)/1000*audio.duration});
document.getElementById('volume').addEventListener('input',e=>audio.volume=Number(e.target.value));
audio.volume=.8;audio.playbackRate=playbackSpeed;
document.getElementById('playbackSpeed')?.addEventListener('change',event=>{const value=Number(event.target.value);if(![.75,1,1.25,1.5,2].includes(value))return;playbackSpeed=value;audio.playbackRate=value;savePlaybackOptions()});
(async()=>{
 renderPlaylistOptions();renderArtistProfile();updatePlaybackOptions();render();
 try{await openLibrary();await refreshLibrary()}
 catch(error){tracksEl.innerHTML='<div class="empty">Локальное хранилище недоступно. Музыку можно добавить после разрешения хранилища браузера.</div>'}
})();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));


/* PWA installation and durable local music storage */
let deferredInstallPrompt=null;
const installButton=document.getElementById('installApp');
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 deferredInstallPrompt=event;
 if(installButton)installButton.hidden=false;
});
installButton?.addEventListener('click',async()=>{
 if(!deferredInstallPrompt)return;
 deferredInstallPrompt.prompt();
 await deferredInstallPrompt.userChoice;
 deferredInstallPrompt=null;
 installButton.hidden=true;
});
window.addEventListener('appinstalled',()=>{
 deferredInstallPrompt=null;
 if(installButton)installButton.hidden=true;
});
if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
