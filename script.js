// Config
const QURAN_API_BASE = 'https://api.alquran.cloud/v1';

// State
let surahsData = [], ayahsFullData = [];
let currentSurah=1, currentStart=1, currentEnd=1;
let edition='quran-uthmani', reciter='ar.alafasy', translation='none', tafsir='none';
let audioQueue=[], currentIndex=0, isPlaying=false;

// DOM
const spinner = document.getElementById('loading-spinner');
const surahSel = document.getElementById('surah-select');
const startSel = document.getElementById('ayah-start-select');
const endSel   = document.getElementById('ayah-end-select');
const recSel   = document.getElementById('reciter-select');
const transSel = document.getElementById('translation-select');
const tafsirSel= document.getElementById('tafsir-select');
const fontSel  = document.getElementById('font-select');
const previewText = document.getElementById('preview-ayah-text');
const prevTitle   = document.getElementById('preview-surah-title');
const preview     = document.getElementById('video-preview');
const playBtn     = document.getElementById('play-range-button');
const exportBtn   = document.getElementById('export-btn');
const aiBgBtn     = document.getElementById('apply-ai-bg');
const audioPlayer = new Audio();

// Helpers
async function withSpinner(promise) {
  spinner.style.display='flex';
  try { return await promise; }
  finally { spinner.style.display='none'; }
}

// Init
document.addEventListener('DOMContentLoaded', async ()=>{
  bindEvents();
  await loadSurahs();
  await loadReciters();
  await loadTranslations();
  await loadTafsirs();
  await updateAyahs();
});

function bindEvents() {
  document.getElementById('create-video-btn').onclick = ()=>{
    const ed = document.getElementById('editor-area');
    ed.style.display = ed.style.display==='none'?'block':'none';
  };
  surahSel.onchange = async ()=>{ currentSurah=+surahSel.value; await updateAyahs(); stopAudio(); };
  startSel.onchange=()=>{ currentStart=+startSel.value; adjustEnd(); };
  endSel.onchange=()=>{ currentEnd=+endSel.value; };
  recSel.onchange=()=>{ reciter=recSel.value; stopAudio(); };
  transSel.onchange=()=>{ translation=transSel.value; fetchPreview(); };
  tafsirSel.onchange=()=>{ tafsir=tafsirSel.value; fetchPreview(); };
  fontSel.onchange=e=> previewText.style.fontFamily=e.target.value;
  aiBgBtn.onclick=fetchAiBg;
  playBtn.onclick=playRange;
  exportBtn.onclick=exportVideo;
  audioPlayer.onended = playNext;
}

async function loadSurahs(){
  const res = await withSpinner(axios.get(`${QURAN_API_BASE}/surah`));
  surahsData = res.data.data;
  surahSel.innerHTML='';
  surahsData.forEach(s=>surahSel.add(new Option(`${s.number}. ${s.englishName}`,s.number)));
}

async function updateAyahs(){
  const s = surahsData.find(s=>s.number===currentSurah);
  startSel.innerHTML=endSel.innerHTML='';
  for(let i=1;i<=s.numberOfAyahs;i++){
    startSel.add(new Option(i,i)); endSel.add(new Option(i,i));
  }
  currentStart=1; currentEnd=s.numberOfAyahs;
  adjustEnd();
  await fetchPreview();
}

function adjustEnd(){ if(+endSel.value<+startSel.value) endSel.value=startSel.value; }

async function fetchPreview(){
  const title = surahsData.find(s=>s.number===currentSurah).englishName;
  prevTitle.textContent=`${title} | ${currentStart}-${currentEnd}`;
  const res = await withSpinner(axios.get(`${QURAN_API_BASE}/surah/${currentSurah}/${edition}`));
  ayahsFullData = res.data.data.ayahs;
  let html = ayahsFullData.filter(a=>a.numberInSurah>=currentStart&&a.numberInSurah<=currentEnd)
    .map(a=>`<span class="ayah-segment" id="ayah-${a.numberInSurah}">${a.text}</span>`).join('<br>');
  if(translation!=='none'){
    const tr = await axios.get(`${QURAN_API_BASE}/surah/${currentSurah}/${translation}`);
    const ta=tr.data.data.ayahs.filter(a=>a.numberInSurah>=currentStart&&a.numberInSurah<=currentEnd)
      .map(a=>`<p class="translation-text">${a.text}</p>`).join('');
    html+=`<hr class="separator"><div class="translation-block"><strong>ترجمة:</strong>${ta}</div>`;
  }
  if(tafsir!=='none'){
    const tf=await axios.get(`${QURAN_API_BASE}/surah/${currentSurah}/${tafsir}`);
    const tb=tf.data.data.ayahs.filter(a=>a.numberInSurah>=currentStart&&a.numberInSurah<=currentEnd)
      .map(a=>`<p class="tafsir-text">${a.text}</p>`).join('');
    html+=`<hr class="separator"><div class="tafsir-block"><strong>تفسير:</strong>${tb}</div>`;
  }
  previewText.innerHTML=html;
}

async function loadReciters(){
  const r = await axios.get(`${QURAN_API_BASE}/edition?format=audio&type=versebyverse&language=ar`);
  recSel.innerHTML=''; r.data.data.forEach(ed=>recSel.add(new Option(ed.name,ed.identifier)));
}

async function loadTranslations(){
  const r = await axios.get(`${QURAN_API_BASE}/edition?format=text&type=translation`);
  transSel.innerHTML='<option value="none">بدون ترجمة</option>';
  r.data.data.forEach(ed=>transSel.add(new Option(ed.name,ed.identifier)));
}

async function loadTafsirs(){
  const r = await axios.get(`${QURAN_API_BASE}/edition?format=text&type=tafsir&language=ar`);
  tafsirSel.innerHTML='<option value="none">بدون تفسير</option>';
  r.data.data.forEach(ed=>tafsirSel.add(new Option(ed.name||ed.englishName,ed.identifier)));
}

async function fetchAiBg(){
  const q = `islamic art nature ${surahsData.find(s=>s.number===currentSurah).englishName}`;
  const res = await withSpinner(axios.get(`/api/backgrounds?q=${encodeURIComponent(q)}`));
  if(res.data.photos.length){
    preview.style.backgroundImage=`url(${res.data.photos[Math.floor(Math.random()*res.data.photos.length)].src.landscape})`;
  } else alert('لم يتم العثور على خلفيات');
}

async function playRange(){
  if(isPlaying) return stopAudio();
  audioQueue = (await Promise.all(
    Array.from({length:currentEnd-currentStart+1},(_,i)=>
      axios.get(`${QURAN_API_BASE}/ayah/${currentSurah}:${currentStart+i}/${reciter}`)
        .then(r=>r.data.data.audio).catch(()=>null)
    )
  )).filter(u=>u).map((u,i)=>({url:u,ayah:currentStart+i}));
  if(!audioQueue.length) return alert('لا ملفات صوتية');
  isPlaying=true; currentIndex=0; playBtn.textContent='إيقاف الصوت'; playNext();
}

function playNext(){
  if(currentIndex>=audioQueue.length) return stopAudio();
  const {url,ayah} = audioQueue[currentIndex++];
  audioPlayer.src=url; audioPlayer.play();
  document.querySelectorAll('.ayah-segment.playing').forEach(e=>e.classList.remove('playing'));
  const el = document.getElementById(`ayah-${ayah}`);
  if(el){ el.classList.add('playing'); el.scrollIntoView({behavior:'smooth',block:'center'}); }
}

function stopAudio(){
  isPlaying=false; audioPlayer.pause(); playBtn.textContent=' تشغيل الصوت';
  document.querySelectorAll('.ayah-segment.playing').forEach(e=>e.classList.remove('playing'));
}

function exportVideo(){ alert(`تصدير ${document.getElementById('resolution-select').value} مع ${document.getElementById('filter-select').value} قيد التطوير`); }
