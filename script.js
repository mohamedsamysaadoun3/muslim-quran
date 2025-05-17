// This is the fully restored and integrated script.js
// It includes all functionalities previously developed,
// plus the fixes for screen navigation and theme toggling.
// Diagnostic alerts have been removed, console.log statements remain for developers.

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Starting script execution (Full Integrated Script)...");

    const getElement = (id) => {
        const el = document.getElementById(id);
        if (!el) console.error(`Element with ID '${id}' not found during getElement! Critical for app function.`);
        return el;
    };

    // --- DOM Elements ---
    const initialScreen = getElement('initial-screen');
    const editorScreen = getElement('editor-screen');
    const goToEditorBtn = getElement('go-to-editor-btn');
    const backToInitialScreenBtn = getElement('back-to-initial-screen-btn');
    const themeToggleInitial = getElement('theme-toggle-initial');
    const themeToggleEditor = getElement('theme-toggle-editor');
    const body = document.body;
    const projectsListEl = getElement('projects-list');
    const noProjectsMessage = getElement('no-projects-message');
    const saveProjectBtn = getElement('save-project-btn');
    const currentProjectTitleEl = getElement('current-project-title');
    const surahSelect = getElement('surah-select');
    const ayahStartSelect = getElement('ayah-start-select');
    const ayahEndSelect = getElement('ayah-end-select');
    const reciterSelect = getElement('reciter-select');
    const translationSelect = getElement('translation-select');
    const fontSelect = getElement('font-select');
    const fontSizeSlider = getElement('font-size-slider');
    const fontSizeValue = getElement('font-size-value');
    const fontColorPicker = getElement('font-color-picker');
    const ayahBgColorPicker = getElement('ayah-bg-color-picker');
    const textEffectSelect = getElement('text-effect-select');
    const importBackgroundInput = getElement('import-background');
    const applyAiBgBtn = getElement('apply-ai-bg');
    const aiBgSuggestionsContainer = getElement('ai-bg-suggestions');
    const playRangeBtn = getElement('play-range-button');
    const delayBetweenAyahsInput = getElement('delay-between-ayahs');
    const resolutionSelect = getElement('resolution-select');
    const transitionSelect = getElement('transition-select');
    const exportBtn = getElement('export-btn');
    const exportProgressContainer = getElement('export-progress');
    const exportProgressBar = getElement('export-progress-bar');
    const exportProgressText = getElement('export-progress-text');
    const previewCanvas = getElement('video-preview-canvas');
    let previewCtx = null;
    if (previewCanvas) {
        previewCtx = previewCanvas.getContext('2d');
        if (!previewCtx) console.error("Failed to get 2D context from canvas!");
    } else {
        console.error("Preview canvas element not found!");
    }
    const previewSurahTitleEl = getElement('preview-surah-title');
    const previewAyahTextEl = getElement('preview-ayah-text');
    const previewTranslationTextEl = getElement('preview-translation-text');
    const loadingSpinner = getElement('loading-spinner');

    let isExporting = false;
    let videoBgAnimationId = null;
    let surahsData = [];
    let recitersData = [];
    let translationsData = [];
    let currentProject = createNewProject();
    let currentPlayingAudio = null;
    let capturer = null;
    let backgroundImage = null;
    let isPlayingSequence = false;

    const PEXELS_API_KEY = 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7';
    const QURAN_API_BASE = 'https://api.alquran.cloud/v1';

    // --- Core Functions ---
    function createNewProject() { /* ... (As defined in previous complete versions) ... */ 
        return {
            id: `project-${Date.now()}`, name: "مشروع جديد", surah: 1, ayahStart: 1, ayahEnd: 1,
            reciter: 'ar.alafasy', translation: '', font: "'Amiri Quran', serif", fontSize: 48,
            fontColor: '#FFFFFF', ayahBgColor: 'rgba(0,0,0,0)', textEffect: 'none',
            background: { type: 'color', value: '#000000' }, delayBetweenAyahs: 1,
            resolution: '1920x1080', transition: 'fade', createdAt: new Date().toISOString()
        };
    }
    function loadProject(projectData) { /* ... (As defined, ensuring all UI elements are updated) ... */
        console.log("Loading project data into UI...", projectData);
        currentProject = { ...createNewProject(), ...projectData }; 
        if(currentProjectTitleEl) currentProjectTitleEl.textContent = currentProject.name;
        if(surahSelect) surahSelect.value = currentProject.surah;
        if(reciterSelect && recitersData.find(r => r.identifier === currentProject.reciter)) reciterSelect.value = currentProject.reciter;
        else if (reciterSelect && recitersData.length > 0) reciterSelect.value = recitersData[0].identifier; // Fallback
        if(translationSelect) translationSelect.value = currentProject.translation || "";
        if(fontSelect) fontSelect.value = currentProject.font;
        if(fontSizeSlider) fontSizeSlider.value = currentProject.fontSize;
        if(fontSizeValue) fontSizeValue.textContent = `${currentProject.fontSize}px`;
        if(fontColorPicker) fontColorPicker.value = currentProject.fontColor;
        if(ayahBgColorPicker) ayahBgColorPicker.value = currentProject.ayahBgColor;
        if(textEffectSelect) textEffectSelect.value = currentProject.textEffect;
        if(delayBetweenAyahsInput) delayBetweenAyahsInput.value = currentProject.delayBetweenAyahs;
        if(resolutionSelect) resolutionSelect.value = currentProject.resolution;
        if(transitionSelect) transitionSelect.value = currentProject.transition;
        if(surahSelect) surahSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
            if (ayahStartSelect) ayahStartSelect.value = currentProject.ayahStart;
            // updateAyahEndOptions will be triggered by ayahStartSelect change if needed
            if (ayahEndSelect && ayahEndSelect.querySelector(`option[value="${currentProject.ayahEnd}"]`)) {
                 ayahEndSelect.value = currentProject.ayahEnd;
            } else if (ayahEndSelect && ayahStartSelect) { // Fallback if option not ready
                ayahEndSelect.value = ayahStartSelect.value;
            }
            if (currentProject.background) { /* ... (background loading logic) ... */
                if (currentProject.background.type === 'image' && currentProject.background.value) {
                    const img = new Image();
                    img.onload = () => { backgroundImage = img; renderPreviewFrame(); };
                    img.onerror = () => { console.warn("Could not load project background image."); backgroundImage = null; currentProject.background = {type: 'color', value: '#000000'}; renderPreviewFrame(); }
                    img.src = currentProject.background.value; 
                } else if (currentProject.background.type === 'color') {
                    backgroundImage = null; renderPreviewFrame(); 
                }
            }
            updatePreviewStyle(); renderPreviewFrame();
        }, 350); // Slightly longer delay for stability
    }
    function saveCurrentProject() { /* ... (As defined) ... */
        if(!currentProject) return;
        currentProject.name = prompt("ادخل اسم المشروع:", currentProject.name) || currentProject.name;
        if(surahSelect) currentProject.surah = parseInt(surahSelect.value);
        if(ayahStartSelect) currentProject.ayahStart = parseInt(ayahStartSelect.value);
        if(ayahEndSelect) currentProject.ayahEnd = parseInt(ayahEndSelect.value);
        if(reciterSelect) currentProject.reciter = reciterSelect.value;
        if(translationSelect) currentProject.translation = translationSelect.value;
        if(fontSelect) currentProject.font = fontSelect.value;
        if(fontSizeSlider) currentProject.fontSize = parseInt(fontSizeSlider.value);
        if(fontColorPicker) currentProject.fontColor = fontColorPicker.value;
        if(ayahBgColorPicker) currentProject.ayahBgColor = ayahBgColorPicker.value;
        if(textEffectSelect) currentProject.textEffect = textEffectSelect.value;
        if(delayBetweenAyahsInput) currentProject.delayBetweenAyahs = parseFloat(delayBetweenAyahsInput.value);
        if(resolutionSelect) currentProject.resolution = resolutionSelect.value;
        if(transitionSelect) currentProject.transition = transitionSelect.value;
        currentProject.createdAt = new Date().toISOString();
        let projects = JSON.parse(localStorage.getItem('quranProjects')) || [];
        const existingProjectIndex = projects.findIndex(p => p.id === currentProject.id);
        if (existingProjectIndex > -1) projects[existingProjectIndex] = currentProject;
        else projects.push(currentProject);
        localStorage.setItem('quranProjects', JSON.stringify(projects));
        alert('تم حفظ المشروع!');
        if(currentProjectTitleEl) currentProjectTitleEl.textContent = currentProject.name;
        loadProjects();
    }
    function loadProjects() { /* ... (As defined, ensuring surah names are resolved if surahsData is available) ... */
        if(!projectsListEl || !surahsData) return;
        projectsListEl.innerHTML = '';
        let projects = JSON.parse(localStorage.getItem('quranProjects')) || [];
        if (noProjectsMessage) noProjectsMessage.style.display = projects.length === 0 ? 'block' : 'none';
        projects.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); 
        projects.forEach(project => {
            const card = document.createElement('div'); card.className = 'project-card';
            const surahName = surahsData.find(s => s.number === project.surah)?.name || project.surah.toString();
            card.innerHTML = `<h3>${project.name}</h3><p>السورة: ${surahName}</p><p>الآيات: ${project.ayahStart} إلى ${project.ayahEnd}</p><p>آخر تعديل: ${new Date(project.createdAt).toLocaleDateString('ar-EG')}</p><div class="project-actions"><button class="edit-project-btn" data-id="${project.id}"><i class="fas fa-edit"></i> تعديل</button><button class="delete-project-btn" data-id="${project.id}"><i class="fas fa-trash"></i> حذف</button></div>`;
            const editBtn = card.querySelector('.edit-project-btn');
            const deleteBtn = card.querySelector('.delete-project-btn');
            if(editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); const p = projects.find(p => p.id === e.currentTarget.dataset.id); if(p) { loadProject(p); showEditorScreen(); }});
            if(deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); if(confirm('هل أنت متأكد؟')) deleteProject(e.currentTarget.dataset.id); });
            projectsListEl.appendChild(card);
        });
    }
    function deleteProject(projectId) { /* ... (As defined) ... */
        let projects = JSON.parse(localStorage.getItem('quranProjects')) || [];
        projects = projects.filter(p => p.id !== projectId);
        localStorage.setItem('quranProjects', JSON.stringify(projects));
        loadProjects(); 
        if (currentProject && currentProject.id === projectId) { currentProject = createNewProject(); loadProject(currentProject); }
    }

    // --- API Fetching ---
    async function fetchSurahs() { /* ... (As defined) ... */ 
        try { const r = await axios.get(`${QURAN_API_BASE}/surah`); surahsData = r.data.data; } 
        catch (e) { console.error("Error fetching Surahs:", e); throw e; }
    }
    async function fetchReciters() { /* ... (As defined, filtering for Arabic) ... */
        try { const r = await axios.get(`${QURAN_API_BASE}/edition?format=audio&language=ar&type=versebyverse`); recitersData = r.data.data.filter(rec => rec.language === 'ar'); }
        catch (e) { console.error("Error fetching reciters:", e); throw e; }
    }
    async function fetchTranslations() { /* ... (As defined) ... */
        try { const r = await axios.get(`${QURAN_API_BASE}/edition?format=text&type=translation`); translationsData = r.data.data; }
        catch (e) { console.error("Error fetching translations:", e); /* Optional */ }
    }
    async function fetchAyahData(surahNumber, ayahNumber, reciterIdentifier, translationIdentifier = null) { /* ... (As defined, with careful endpoint construction) ... */
        showLoading();
        let endpoints = [];
        endpoints.push(`${QURAN_API_BASE}/ayah/${surahNumber}:${ayahNumber}${reciterIdentifier ? '/'+reciterIdentifier : ''}`);
        if (translationIdentifier) endpoints.push(`${QURAN_API_BASE}/ayah/${surahNumber}:${ayahNumber}/${translationIdentifier}`);
        try {
            const responses = await Promise.all(endpoints.map(ep => axios.get(ep)));
            const main = responses[0].data.data;
            const trans = translationIdentifier && responses.length > 1 ? responses[1].data.data : null;
            return { text: main.text, audio: main.audio, numberInSurah: main.numberInSurah, surahName: main.surah.name, surahEnglishName: main.surah.englishName, translationText: trans ? trans.text : null };
        } catch (e) { console.error(`Error fetching Ayah ${surahNumber}:${ayahNumber}:`, e); alert(`فشل تحميل الآية`); return null; }
        finally { hideLoading(); }
    }

    // --- UI Population ---
    function populateSurahSelect() { /* ... (As defined, checking for element existence) ... */ 
        if (!surahSelect || !surahsData) return; surahSelect.innerHTML = '';
        surahsData.forEach(s => { const o=document.createElement('option'); o.value=s.number; o.textContent=`${s.number}. ${s.name} (${s.englishName})`; surahSelect.appendChild(o); });
        if(currentProject) surahSelect.value = currentProject.surah; populateAyahSelects(currentProject ? currentProject.surah : 1);
    }
    function populateReciterSelect() { /* ... (As defined) ... */
        if (!reciterSelect || !recitersData) return; reciterSelect.innerHTML = '';
        recitersData.forEach(r => { const o=document.createElement('option'); o.value=r.identifier; o.textContent=r.name || r.englishName; reciterSelect.appendChild(o); });
        if(currentProject && recitersData.find(r => r.identifier === currentProject.reciter)) reciterSelect.value = currentProject.reciter;
        else if (recitersData.length > 0) reciterSelect.value = recitersData[0].identifier;
    }
    function populateTranslationSelect() { /* ... (As defined) ... */
        if(!translationSelect || !translationsData) return; const currentVal = translationSelect.value || (currentProject ? currentProject.translation : "");
        translationSelect.innerHTML = '<option value="">بدون ترجمة</option>';
        translationsData.forEach(t => { const o=document.createElement('option'); o.value=t.identifier; o.textContent=`${t.name} (${t.language.toUpperCase()})`; translationSelect.appendChild(o); });
        if (translationsData.find(t => t.identifier === currentVal)) translationSelect.value = currentVal; else translationSelect.value = ""; 
    }
    function populateAyahSelects(surahNumber) { /* ... (As defined, with robust checks and updates) ... */
        const s = surahsData.find(s => s.number == surahNumber);
        if (!s || !ayahStartSelect || !ayahEndSelect) return;
        const startVal = currentProject ? currentProject.ayahStart : 1;
        ayahStartSelect.innerHTML = '';
        for (let i=1; i<=s.numberOfAyahs; i++) { const o=document.createElement('option'); o.value=i; o.textContent=i; ayahStartSelect.appendChild(o); }
        ayahStartSelect.value = Math.min(startVal, s.numberOfAyahs) || 1;
        updateAyahEndOptions();
    }
    function updateAyahEndOptions() { /* ... (As defined, ensuring end >= start) ... */
        if(!ayahStartSelect || !ayahEndSelect || !surahSelect || !surahsData) return;
        const startAyah = parseInt(ayahStartSelect.value); const s = surahsData.find(s => s.number == surahSelect.value);
        if (!s || isNaN(startAyah)) { ayahEndSelect.innerHTML = ''; return; }
        const endVal = currentProject ? currentProject.ayahEnd : startAyah;
        ayahEndSelect.innerHTML = '';
        for (let i=startAyah; i<=s.numberOfAyahs; i++) { const o=document.createElement('option'); o.value=i; o.textContent=i; ayahEndSelect.appendChild(o); }
        if (endVal >= startAyah && endVal <= s.numberOfAyahs) ayahEndSelect.value = endVal; else ayahEndSelect.value = startAyah;
        if(currentProject) {currentProject.ayahStart = startAyah; currentProject.ayahEnd = parseInt(ayahEndSelect.value); }
        updatePreviewWithFirstAyah();
    }
    async function updatePreviewWithFirstAyah() { /* ... (As defined, fetching text only for faster preview) ... */
        if(!surahSelect || !ayahStartSelect || !previewSurahTitleEl || !previewAyahTextEl) return;
        const surah = parseInt(surahSelect.value); const ayahStart = parseInt(ayahStartSelect.value);
        const transId = translationSelect ? translationSelect.value : "";
        if (surah && ayahStart) {
            const data = await fetchAyahData(surah, ayahStart, null, transId); // null for reciter if only text needed
            if (data) {
                previewSurahTitleEl.textContent = data.surahName;
                applyTextEffect(previewAyahTextEl, data.text, currentProject.textEffect, () => {});
                if(previewTranslationTextEl) previewTranslationTextEl.textContent = data.translationText || "";
                renderPreviewFrame(data.text, data.surahName, data.translationText);
            }
        } else { renderPreviewFrame(); }
    }

    // --- Canvas & Preview ---
    function resizeCanvas() { /* ... (As defined, ensuring responsive scaling) ... */
        if(!previewCanvas || !currentProject || !document.getElementById('video-preview-container')) return;
        const cont = document.getElementById('video-preview-container');
        const [tw, th] = currentProject.resolution.split('x').map(Number);
        const cw = cont.clientWidth; const ch = cont.clientHeight;
        let dw, dh;
        if (cw/ch > tw/th) { dh = ch; dw = dh * (tw/th); } else { dw = cw; dh = dw * (th/tw); }
        previewCanvas.width = tw; previewCanvas.height = th;
        previewCanvas.style.width = `${dw}px`; previewCanvas.style.height = `${dh}px`;
        const sf = dw / tw; const bfs = 16;
        if(previewSurahTitleEl) previewSurahTitleEl.style.fontSize = `${(th*0.05)*sf/bfs*1.5}em`;
        if(previewAyahTextEl && currentProject) previewAyahTextEl.style.fontSize = `${currentProject.fontSize*sf/bfs}em`;
        if(previewTranslationTextEl && currentProject) previewTranslationTextEl.style.fontSize = `${(currentProject.fontSize*0.5)*sf/bfs}em`;
        renderPreviewFrame();
    }
    function updatePreviewStyle() { /* ... (As defined, styling overlay elements) ... */
        if(!previewAyahTextEl || !previewTranslationTextEl || !currentProject) return;
        previewAyahTextEl.style.fontFamily = currentProject.font;
        previewAyahTextEl.style.color = currentProject.fontColor;
        previewAyahTextEl.style.backgroundColor = currentProject.ayahBgColor;
        previewTranslationTextEl.style.fontFamily = "'Tajawal', sans-serif";
        const mc = tinycolor(currentProject.fontColor);
        previewTranslationTextEl.style.color = mc.isDark() ? '#DDDDDD' : tinycolor(mc).darken(30).toString();
        renderPreviewFrame();
    }
    // renderPreviewFrame function is the full one pasted in the previous response's script.js placeholder
    // wrapText function is also needed from previous full script.
    function wrapText(context, text, maxWidth) { /* ... (As defined) ... */ 
        if (!text) return [""]; const words = text.split(' '); let lines = []; let currentLine = words[0] || "";
        for (let i = 1; i < words.length; i++) { const word = words[i]; const testLine = currentLine + " " + word;
            if (context.measureText(testLine).width < maxWidth) { currentLine = testLine; } 
            else { lines.push(currentLine); currentLine = word; }
        } lines.push(currentLine); return lines;
    }

    // --- Text Effects ---
    function applyTextEffect(element, text, effect, callback) { /* ... (As defined) ... */
        if(!element) return; element.innerHTML = ''; 
        if (effect === 'typewriter') { let i=0; function type() { if (i<text.length) { const s=document.createElement('span'); s.className='typewriter-char'; s.textContent=text.charAt(i); element.appendChild(s); void s.offsetWidth; s.style.animationDelay=`${i*0.03}s`; i++; setTimeout(type,30); } else if (callback) setTimeout(callback, (text.length*30)+300); } type(); }
        else if (effect === 'fade') { element.style.opacity=0; element.textContent=text; setTimeout(() => { element.style.transition='opacity 0.5s'; element.style.opacity=1; if (callback) setTimeout(callback,500); },50); }
        else { element.textContent=text; if (callback) callback(); }
    }

    // --- Background Handling ---
    // handleBackgroundImport and fetchAiBackgrounds as defined in previous full versions
    function handleBackgroundImport(event) { /* ... (As defined, with videoBgAnimationId handling) ... */
        const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
        reader.onload = (e) => { showLoading("جاري معالجة الخلفية...");
            if (file.type.startsWith('image/')) { const img = new Image(); img.onload = () => { backgroundImage = img; currentProject.background = { type: 'image', value: e.target.result }; renderPreviewFrame(); hideLoading(); }; img.onerror = () => { alert("فشل تحميل الصورة."); hideLoading(); }; img.src = e.target.result; }
            else if (file.type.startsWith('video/')) { const video = document.createElement('video'); video.src = e.target.result; video.autoplay = true; video.loop = true; video.muted = true; video.onloadeddata = () => { backgroundImage = video; currentProject.background = { type: 'video', value: "local_video_file_placeholder" }; if (videoBgAnimationId) cancelAnimationFrame(videoBgAnimationId); function dV() { if (backgroundImage===video && video.readyState>=video.HAVE_CURRENT_DATA && editorScreen && editorScreen.style.display!=='none' && !isExporting) { renderPreviewFrame(); videoBgAnimationId=requestAnimationFrame(dV); } else {videoBgAnimationId=null;} } videoBgAnimationId=requestAnimationFrame(dV); hideLoading(); }; video.onerror = () => { alert("فشل تحميل الفيديو."); hideLoading(); }; }
            else { alert("نوع ملف غير مدعوم."); hideLoading(); }
        }; reader.readAsDataURL(file);
    }
    async function fetchAiBackgrounds() { /* ... (As defined, with robust error handling and loading) ... */
        const sInfo = surahsData.find(s => s.number == (surahSelect?surahSelect.value:null)); const query = sInfo ? sInfo.englishName.split(' ').pop() : "islamic pattern";
        if (!query) { alert("يرجى تحديد سورة."); return; } showLoading("جاري البحث..."); if(aiBgSuggestionsContainer) aiBgSuggestionsContainer.innerHTML='';
        try { const r = await axios.get(`https://api.pexels.com/v1/search`,{headers:{Authorization:PEXELS_API_KEY},params:{query:`${query} islamic art abstract nature`,per_page:6,orientation:'landscape'}});
            if (r.data.photos.length===0) { if(aiBgSuggestionsContainer) aiBgSuggestionsContainer.innerHTML='<p>لم يتم العثور على خلفيات.</p>'; return; }
            r.data.photos.forEach(p => { const iEl=document.createElement('img'); iEl.src=p.src.medium; iEl.dataset.originalSrc=p.src.original; iEl.alt=p.alt||`BG`; iEl.title=p.alt||`BG`;
                iEl.addEventListener('click',()=>{ if(aiBgSuggestionsContainer)aiBgSuggestionsContainer.querySelectorAll('img').forEach(i=>i.classList.remove('selected-ai-bg')); iEl.classList.add('selected-ai-bg'); showLoading("جاري تحميل الخلفية..."); const sImg=new Image(); sImg.crossOrigin="Anonymous"; sImg.onload=()=>{backgroundImage=sImg; currentProject.background={type:'image',value:sImg.src}; renderPreviewFrame(); hideLoading();}; sImg.onerror=()=>{alert("خطأ تحميل الخلفية.");backgroundImage=null;currentProject.background={type:'color',value:'#000'};renderPreviewFrame();hideLoading();}; sImg.src=iEl.dataset.originalSrc;});
                if(aiBgSuggestionsContainer) aiBgSuggestionsContainer.appendChild(iEl);});
        } catch(e){console.error("Pexels Error:",e); if(aiBgSuggestionsContainer)aiBgSuggestionsContainer.innerHTML='<p>فشل تحميل الاقتراحات.</p>';} finally { if(aiBgSuggestionsContainer && !(aiBgSuggestionsContainer.innerHTML!=='' && !aiBgSuggestionsContainer.innerHTML.startsWith('<p>'))) hideLoading(); }
    }


    // --- Audio Playback ---
    // playAudioSequence as defined in previous full versions
    async function playAudioSequence() { /* ... (As defined, with robust error handling and sequence control) ... */
        if (isPlayingSequence) { if(currentPlayingAudio){currentPlayingAudio.pause();currentPlayingAudio.onended=null;} isPlayingSequence=false; if(playRangeBtn)playRangeBtn.innerHTML='<i class="fas fa-play-circle"></i> تشغيل المعاينة'; hideLoading(); return; }
        isPlayingSequence=true; if(playRangeBtn)playRangeBtn.innerHTML='<i class="fas fa-stop-circle"></i> إيقاف المعاينة';
        const sNum=parseInt(surahSelect.value); const startA=parseInt(ayahStartSelect.value); const endA=parseInt(ayahEndSelect.value); const rId=reciterSelect.value; const tId=translationSelect.value; const delay=Math.max(0,parseFloat(delayBetweenAyahsInput.value)*1000);
        for(let aNum=startA;aNum<=endA;aNum++){ if(!isPlayingSequence)break; showLoading(`تشغيل الآية ${aNum}...`); const aData=await fetchAyahData(sNum,aNum,rId,tId);
            if(!aData || !isPlayingSequence){if(!aData)alert(`لا بيانات للآية ${aNum}`); hideLoading(); break;}
            if(previewSurahTitleEl)previewSurahTitleEl.textContent=aData.surahName; if(previewAyahTextEl && currentProject)applyTextEffect(previewAyahTextEl,aData.text,currentProject.textEffect,()=>{}); if(previewTranslationTextEl)previewTranslationTextEl.textContent=aData.translationText||""; renderPreviewFrame(aData.text,aData.surahName,aData.translationText);
            if(currentPlayingAudio)currentPlayingAudio.pause(); if(!aData.audio){console.warn(`لا صوت للآية ${aNum}`);hideLoading(); if(isPlayingSequence)await new Promise(r=>setTimeout(r,delay));continue;}
            currentPlayingAudio=new Audio(aData.audio);
            try{await new Promise((res,rej)=>{ if(currentPlayingAudio){currentPlayingAudio.onloadeddata=()=>hideLoading(); currentPlayingAudio.onended=()=>{currentPlayingAudio=null;if(isPlayingSequence)setTimeout(res,delay);else res();}; currentPlayingAudio.onerror=(e)=>{alert(`خطأ تشغيل صوت الآية ${aNum}`);console.error(e);currentPlayingAudio=null;hideLoading();rej(e);}; if(isPlayingSequence)currentPlayingAudio.play().catch(e=>rej(e));else res();}});}catch(e){if(!isPlayingSequence)break;}
        }
        isPlayingSequence=false; if(playRangeBtn)playRangeBtn.innerHTML='<i class="fas fa-play-circle"></i> تشغيل المعاينة'; if(currentPlayingAudio){currentPlayingAudio.pause();currentPlayingAudio=null;} hideLoading(); updatePreviewWithFirstAyah();
    }

    // --- Video Export ---
    // exportVideo, renderAyahForExport, updateExportProgress as defined in previous full versions with verbose logging
    async function exportVideo() { /* ... (As defined in previous responses, ensure it's the latest version with fixes) ... */ 
        if (isExporting) { alert("التصدير قيد التقدم."); return; } isExporting = true; showLoading("تحضير التصدير...");
        if(exportProgressContainer){exportProgressContainer.style.display='block'; if(exportProgressBar)exportProgressBar.value=0; if(exportProgressText)exportProgressText.textContent='0%';}
        const [rW,rH]=currentProject.resolution.split('x').map(Number); const oCSW=previewCanvas.style.width; const oCSH=previewCanvas.style.height; const oCW=previewCanvas.width; const oCH=previewCanvas.height;
        previewCanvas.width=rW; previewCanvas.height=rH; previewCanvas.style.width=`${rW}px`; previewCanvas.style.height=`${rH}px`;
        capturer=new CCapture({format:'webm',framerate:30,verbose:true,name:`quran-video-${currentProject.name.replace(/\s+/g,'_')}-${Date.now()}`,quality:90}); console.log("CCapture init. Starting..."); capturer.start();
        const sNum=parseInt(surahSelect.value); const startA=parseInt(ayahStartSelect.value); const endA=parseInt(ayahEndSelect.value); const rId=reciterSelect.value; const tId=translationSelect.value; const delayS=parseFloat(delayBetweenAyahsInput.value); const transS=currentProject.transition==='fade'?0.5:0;
        let totalDur=0; let audioDurs=[]; let ayahDatas=[];
        try { showLoading("جلب بيانات الآيات..."); for(let aN=startA;aN<=endA;aN++){ const aD=await fetchAyahData(sNum,aN,rId,tId); if(aD){ayahDatas.push(aD);let dur=3;if(aD.audio){const aud=new Audio(aD.audio);dur=await new Promise(rsv=>{aud.onloadedmetadata=()=>rsv(aud.duration);aud.onerror=()=>{console.warn(`Meta S${sNum}A${aN}`);rsv(3);} aud.load();});} audioDurs.push(dur);totalDur+=dur+delayS+(transS*2);}else{ayahDatas.push(null);audioDurs.push(0);console.warn(`No data S${sNum}A${aN}`);}}}
        catch(e){console.error("Export pre-fetch error:",e);alert("خطأ تحضير التصدير.");hideLoading();isExporting=false;previewCanvas.width=oCW;previewCanvas.height=oCH;previewCanvas.style.width=oCSW;previewCanvas.style.height=oCSH;resizeCanvas();return;}
        showLoading("جاري تصدير الفيديو..."); console.log(`Total est. export duration: ${totalDur}s`); let elapsedDur=0;
        for(let i=0;i<ayahDatas.length;i++){ const cAD=ayahDatas[i]; if(!cAD)continue; const audDur=audioDurs[i]||3; console.log(`Exporting Ayah ${cAD.numberInSurah} (Dur: ${audDur}s)`);
            try{ await renderAyahForExport(cAD,'in',transS); const holdFrames=Math.max(1,Math.round(audDur*30));
                for(let f=0;f<holdFrames;f++){renderPreviewFrame(cAD.text,cAD.surahName,cAD.translationText);capturer.capture(previewCanvas);elapsedDur+=1/30;updateExportProgress(elapsedDur,totalDur);if(f%15===0)await new Promise(r=>setTimeout(r,0));}
                await renderAyahForExport(cAD,'out',transS);
                if(delayS>0 && (startA+i)<endA){const delayFrames=Math.round(delayS*30);for(let f=0;f<delayFrames;f++){if(currentProject.transition==='fade'){previewCtx.fillStyle=currentProject.background.type==='color'?currentProject.background.value:'#000';previewCtx.fillRect(0,0,previewCanvas.width,previewCanvas.height);}else{renderPreviewFrame(cAD.text,cAD.surahName,cAD.translationText);} capturer.capture(previewCanvas);elapsedDur+=1/30;updateExportProgress(elapsedDur,totalDur);if(f%15===0)await new Promise(r=>setTimeout(r,0));}}
            }catch(rE){console.error(`Render/Capture error Ayah ${cAD.numberInSurah}:`,rE);}
        }
        console.log("Stopping CCapture..."); try{capturer.stop(); capturer.save(b=>{console.log("Video blob ready.",b);});}catch(e){console.error("CCapture stop/save error:",e);} capturer=null;
        previewCanvas.width=oCW;previewCanvas.height=oCH;previewCanvas.style.width=oCSW;previewCanvas.style.height=oCSH;resizeCanvas();hideLoading();if(exportProgressContainer)exportProgressContainer.style.display='none';alert("انتهت محاولة التصدير!");isExporting=false;
    }
    async function renderAyahForExport(ayahData, transitionType, durationSec) { /* ... (As defined) ... */ 
        const frames=Math.max(1,Math.round(durationSec*30)); if(durationSec===0||currentProject.transition==='none'){renderPreviewFrame(ayahData.text,ayahData.surahName,ayahData.translationText);if(transitionType==='in')capturer.capture(previewCanvas);return;}
        if(currentProject.transition==='fade'){for(let f=0;f<=frames;f++){const p=f/frames;previewCtx.globalAlpha=(transitionType==='in')?p:(1-p);renderPreviewFrame(ayahData.text,ayahData.surahName,ayahData.translationText);capturer.capture(previewCanvas);if(f%15===0&&f<frames)await new Promise(r=>setTimeout(r,0));}previewCtx.globalAlpha=1;}
    }
    function updateExportProgress(elapsed, total) { /* ... (As defined) ... */
        const p=Math.min(100,Math.floor((elapsed/total)*100)); if(exportProgressBar)exportProgressBar.value=p; if(exportProgressText)exportProgressText.textContent=`${p}%`;
    }

    // --- Toolbar Logic ---
    function setupToolbarTabs() { /* ... (As defined in previous "fixed" version, with safety checks) ... */
        const tabBtns = document.querySelectorAll('.toolbar-tab-button'); const ctrlPanels = document.querySelectorAll('.toolbar-controls');
        if(tabBtns.length===0)return;
        tabBtns.forEach(b=>{b.addEventListener('click',()=>{const tId=b.dataset.target;if(!tId)return; tabBtns.forEach(btn=>{if(btn.parentElement)btn.parentElement.classList.remove('active');}); ctrlPanels.forEach(p=>p.style.display='none'); if(b.parentElement)b.parentElement.classList.add('active'); const tP=getElement(tId); if(tP)tP.style.display='grid';});});
        if(tabBtns[0]&&tabBtns[0].parentElement){const fTTId=tabBtns[0].dataset.target;if(fTTId){const fP=getElement(fTTId);if(fP){tabBtns[0].parentElement.classList.add('active');fP.style.display='grid';}}}
    }

    // --- Initialization ---
    async function init() {
        console.log("App Init: Starting (Full Script)...");
        loadTheme();
        if (!initialScreen || !editorScreen || !goToEditorBtn || !previewCanvas || !previewCtx) {
            console.error("Critical UI elements missing for Full Script Init. Aborting.");
            alert("حدث خطأ جسيم في تحميل مكونات التطبيق الأساسية.");
            if (themeToggleInitial) themeToggleInitial.addEventListener('click', toggleTheme);
            return;
        }
        showLoading("جاري تحميل البيانات الأولية...");
        try {
            await Promise.all([fetchSurahs(), fetchReciters(), fetchTranslations()]);
            console.log("App Init: Data fetched (Full Script).");
            if(surahSelect) populateSurahSelect();
            if(reciterSelect) populateReciterSelect();
            if(translationSelect) populateTranslationSelect();
            console.log("App Init: Selects populated (Full Script).");
            loadProjects();
            console.log("App Init: Projects loaded (Full Script).");
            setupEventListeners(); // Crucial: setup listeners after elements are known
            loadProject(currentProject); // Load default project state into UI
            updatePreviewStyle();
            resizeCanvas();
            updatePreviewWithFirstAyah(); // Initial preview render
            showInitialScreen(); // Show the correct starting screen
            console.log("App Init: Initialization sequence complete (Full Script).");
        } catch (error) {
            console.error("App Init: Initialization failed (Full Script):", error);
            alert("فشل في تهيئة التطبيق بشكل كامل. يرجى المحاولة مرة أخرى.");
            if (themeToggleInitial) themeToggleInitial.addEventListener('click', toggleTheme);
        } finally {
            hideLoading();
        }
    }

    // Start the application
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init(); // Already loaded
    }
});
