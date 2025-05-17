document.addEventListener('DOMContentLoaded', () => {
  // --- PEXELS API KEY ---
  const PEXELS_API_KEY = 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7';
  if (PEXELS_API_KEY === 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7') {
    console.warn("PEXELS API KEY is missing in script.js");
    const applyAiBgButton = document.getElementById('apply-ai-bg');
    if (applyAiBgButton) { applyAiBgButton.disabled = true; applyAiBgButton.title = "يتطلب مفتاح PEXELS API"; }
  }

  // --- DOM Elements Cache ---
  const DOMElements = {
    initialScreen: document.getElementById('initial-screen'),
    editorScreen: document.getElementById('editor-screen'),
    goToEditorBtn: document.getElementById('go-to-editor-btn'),
    editorBackBtn: document.getElementById('editor-back-btn'),
    editorContextTitle: document.getElementById('editor-context-title'),
    editorSaveBtn: document.getElementById('editor-save-btn'),
    projectsList: document.getElementById('projects-list'),
    noProjectsMessage: document.getElementById('no-projects-message'),
    surahSelect: document.getElementById('surah-select'),
    ayahStartInput: document.getElementById('ayah-start-input'),
    ayahEndInput: document.getElementById('ayah-end-input'),
    reciterSelect: document.getElementById('reciter-select'),
    translationSelect: document.getElementById('translation-select'),
    fontSelect: document.getElementById('font-select'),
    fontSizeSlider: document.getElementById('font-size-slider'),
    fontSizeValue: document.getElementById('font-size-value'),
    fontColorPicker: document.getElementById('font-color-picker'),
    ayahBgColorPicker: document.getElementById('ayah-bg-color-picker'),
    textEffectSelect: document.getElementById('text-effect-select'),
    importBackground: document.getElementById('import-background'),
    applyAiBgBtn: document.getElementById('apply-ai-bg'),
    aiBgSuggestionsDiv: document.getElementById('ai-bg-suggestions'),
    aiBgSuggestionsLoader: document.getElementById('ai-bg-suggestions-loader'),
    delayBetweenAyahsInput: document.getElementById('delay-between-ayahs'),
    resolutionSelect: document.getElementById('resolution-select'),
    transitionSelect: document.getElementById('transition-select'),
    exportBtn: document.getElementById('export-btn'),
    exportProgressDiv: document.getElementById('export-progress'),
    exportProgressBar: document.getElementById('export-progress-bar'),
    exportProgressText: document.getElementById('export-progress-text'),
    canvas: document.getElementById('video-preview-canvas'),
    previewSurahTitle: document.getElementById('preview-surah-title'),
    previewAyahText: document.getElementById('preview-ayah-text'),
    previewTranslationText: document.getElementById('preview-translation-text'),
    loadingSpinner: document.getElementById('loading-spinner'),
    themeToggleInitial: document.getElementById('theme-toggle-initial'),
    playPauseAudioPreviewBtn: document.getElementById('play-pause-audio-preview-btn'),
    stopAudioPreviewBtn: document.getElementById('stop-audio-preview-btn'),
    audioPreviewStatus: document.getElementById('audio-preview-status'),
    ayahAudioPlayer: document.getElementById('ayah-audio-player'),
    mainActionToolBtns: document.querySelectorAll('.action-tool-btn'), // NodeList
    controlPanels: document.querySelectorAll('.control-panel') // NodeList
  };
  const ctx = DOMElements.canvas ? DOMElements.canvas.getContext('2d') : null;

  // --- API Endpoints ---
  const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
  const PEXELS_API_BASE = 'https://api.pexels.com/v1';

  // --- State Variables ---
  let surahsData = [];
  let recitersData = [];
  let translationsData = [];
  let currentProject = createNewProjectState();
  let loadedProjectId = null;
  let backgroundImage = null;
  let backgroundVideoIsPlaying = false;
  let capturer = null;
  let isRendering = false;
  let audioPreviewState = { isPlaying: false, currentAyahIndex: 0, ayahsToPlay: [], audioObjects: [], currentAudio: null };

  // --- Initialization ---
  function init() {
    if (!ctx) { console.error("Canvas context could not be initialized. Aborting."); return; }
    loadTheme();
    setAccentColorRGB();
    loadProjects();
    setupEventListeners();
    fetchInitialData();
    setDefaultCanvas();
    updatePreview();
  }

  function createNewProjectState() { /* ... (same as before) ... */ 
    return {
        id: `project_${Date.now()}`, name: "مشروع جديد", surah: '1',
        ayahStart: 1, ayahEnd: 7, reciter: 'ar.alafasy', translation: '',
        font: "'Amiri Quran', serif", fontSize: 48, fontColor: '#FFFFFF',
        ayahBgColor: 'rgba(0,0,0,0.3)', textEffect: 'none', background: null, 
        backgroundType: 'color', delayBetweenAyahs: 1, resolution: '1920x1080',
        transition: 'fade', lastModified: Date.now()
      };
  }

  function setDefaultCanvas() { /* ... (same as before, uses DOMElements.canvas, ctx, currentProject) ... */ 
    if (!DOMElements.canvas || !ctx || !currentProject) return; 
    const [width, height] = currentProject.resolution.split('x').map(Number);
    DOMElements.canvas.width = width; DOMElements.canvas.height = height;
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, DOMElements.canvas.width, DOMElements.canvas.height);
    if(DOMElements.previewSurahTitle) DOMElements.previewSurahTitle.textContent = 'اختر سورة';
    if(DOMElements.previewAyahText) DOMElements.previewAyahText.textContent = 'بسم الله الرحمن الرحيم';
    if(DOMElements.previewTranslationText) DOMElements.previewTranslationText.textContent = '';
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Helper to add event listener if element exists
    const addSafeListener = (element, event, handler, options = false) => {
      if (element) {
        element.addEventListener(event, handler, options);
      } else {
        // Attempt to find the element again if it was a selector string
        let elName = "Unknown Element";
        for (const key in DOMElements) {
            if (DOMElements[key] === element) {
                elName = key;
                break;
            }
        }
        console.warn(`Event listener for '${event}' not added: Element '${elName}' not found.`);
      }
    };

    addSafeListener(DOMElements.goToEditorBtn, 'click', () => {
      resetToNewProject();
      showScreen('editor');
    });
    addSafeListener(DOMElements.editorBackBtn, 'click', () => {
      stopAudioPreview();
      showScreen('initial');
    });
    addSafeListener(DOMElements.editorSaveBtn, 'click', saveProject);
    addSafeListener(DOMElements.themeToggleInitial, 'click', toggleTheme);

    DOMElements.mainActionToolBtns.forEach(btn => {
      addSafeListener(btn, 'click', () => {
        activateControlPanel(btn.dataset.panel, btn.dataset.title);
      });
    });

    addSafeListener(DOMElements.surahSelect, 'change', handleSurahChange);
    addSafeListener(DOMElements.ayahStartInput, 'change', handleAyahRangeChange);
    addSafeListener(DOMElements.ayahEndInput, 'change', handleAyahRangeChange);
    addSafeListener(DOMElements.reciterSelect, 'change', updateProjectFromUIAndPreview);
    addSafeListener(DOMElements.translationSelect, 'change', updateProjectFromUIAndPreview);
    addSafeListener(DOMElements.fontSelect, 'change', updateProjectFromUIAndPreview);
    addSafeListener(DOMElements.fontSizeSlider, 'input', () => {
      if (DOMElements.fontSizeValue) DOMElements.fontSizeValue.textContent = `${DOMElements.fontSizeSlider.value}px`;
      updateProjectFromUIAndPreview();
    });
    addSafeListener(DOMElements.fontColorPicker, 'input', debounce(updateProjectFromUIAndPreview, 200));
    addSafeListener(DOMElements.ayahBgColorPicker, 'input', debounce(updateProjectFromUIAndPreview, 200));
    addSafeListener(DOMElements.textEffectSelect, 'change', updateProjectFromUIAndPreview);
    addSafeListener(DOMElements.importBackground, 'change', handleBackgroundImport);
    addSafeListener(DOMElements.applyAiBgBtn, 'click', fetchAiBackgroundSuggestions);
    addSafeListener(DOMElements.delayBetweenAyahsInput, 'change', updateProjectFromUIAndPreview);
    addSafeListener(DOMElements.resolutionSelect, 'change', () => {
      updateProjectFromUI(); // Update project first
      const [width, height] = currentProject.resolution.split('x').map(Number);
      if (DOMElements.canvas) { DOMElements.canvas.width = width; DOMElements.canvas.height = height; }
      updatePreview(); // Then update preview with new dimensions
    });
    addSafeListener(DOMElements.transitionSelect, 'change', updateProjectFromUIAndPreview);
    addSafeListener(DOMElements.exportBtn, 'click', exportVideo);
    addSafeListener(DOMElements.playPauseAudioPreviewBtn, 'click', toggleAudioPreview);
    addSafeListener(DOMElements.stopAudioPreviewBtn, 'click', stopAudioPreview);
    addSafeListener(DOMElements.ayahAudioPlayer, 'ended', handleAudioAyahEnded);
    addSafeListener(DOMElements.ayahAudioPlayer, 'error', handleAudioError);
  }

  function activateControlPanel(panelId, panelTitle) {
    if (!panelId || !panelTitle) {
        console.warn("activateControlPanel called with invalid panelId or panelTitle", panelId, panelTitle);
        return;
    }
    DOMElements.controlPanels.forEach(p => p.classList.remove('active-panel'));
    const panelToShow = document.getElementById(panelId);
    if (panelToShow) {
      panelToShow.classList.add('active-panel');
    } else {
      console.warn(`Control panel with ID '${panelId}' not found to activate.`);
    }
    if (DOMElements.editorContextTitle) {
      DOMElements.editorContextTitle.textContent = panelTitle;
    }
    DOMElements.mainActionToolBtns.forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.action-tool-btn[data-panel="${panelId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  function showScreen(screenName) {
    if (!DOMElements.initialScreen || !DOMElements.editorScreen) {
      console.error("CRITICAL: Initial or Editor screen element not found in showScreen!");
      return;
    }
    DOMElements.initialScreen.style.display = (screenName === 'initial') ? 'flex' : 'none';
    DOMElements.editorScreen.style.display = (screenName === 'editor') ? 'flex' : 'none';

    if (screenName === 'editor') {
      const quranToolButton = document.querySelector('.action-tool-btn[data-panel="quran-options-panel"]');
      if (quranToolButton) {
        activateControlPanel(quranToolButton.dataset.panel, quranToolButton.dataset.title);
      }
      if (DOMElements.editorContextTitle && currentProject) {
        DOMElements.editorContextTitle.textContent = currentProject.name !== "مشروع جديد" ? currentProject.name : (quranToolButton ? quranToolButton.dataset.title : "محرر");
      }
    } else if (screenName === 'initial') {
      if (DOMElements.projectsList) loadProjects();
    }
  }

  function resetToNewProject() {
    currentProject = createNewProjectState();
    loadedProjectId = null;
    updateUIFromProject();
    setDefaultCanvas();
    backgroundImage = null;
    if (DOMElements.aiBgSuggestionsDiv) DOMElements.aiBgSuggestionsDiv.innerHTML = '';
    updatePreview();

    const quranToolButton = document.querySelector('.action-tool-btn[data-panel="quran-options-panel"]');
    if (quranToolButton) {
      activateControlPanel(quranToolButton.dataset.panel, quranToolButton.dataset.title);
    } else if (DOMElements.editorContextTitle) {
      DOMElements.editorContextTitle.textContent = "القرآن";
    }
  }

  // --- Theme Management ---
  function loadTheme() { /* ... (same, uses DOMElements.themeToggleInitial) ... */ 
    const theme = localStorage.getItem('quranVideoTheme') || 'dark-theme'; 
    document.body.className = ''; 
    document.body.classList.add(theme);
    updateThemeButtonText(theme);
  }
  function toggleTheme() { /* ... (same, uses DOMElements.themeToggleInitial) ... */ 
    const newTheme = document.body.classList.contains('light-theme') ? 'dark-theme' : 'light-theme';
    document.body.className = ''; 
    document.body.classList.add(newTheme);
    localStorage.setItem('quranVideoTheme', newTheme);
    updateThemeButtonText(newTheme);
    setAccentColorRGB(); 
    updatePreview(); 
  }
  function setAccentColorRGB() { /* ... (same) ... */ 
    const bodyStyles = getComputedStyle(document.body);
    const accentColor = bodyStyles.getPropertyValue('--current-accent-color').trim();
    if (!accentColor) { document.body.style.setProperty('--rgb-accent-color', `0, 121, 107`); return; }
    try { const rgb = tinycolor(accentColor).toRgb(); document.body.style.setProperty('--rgb-accent-color', `${rgb.r}, ${rgb.g}, ${rgb.b}`); } 
    catch (e) { document.body.style.setProperty('--rgb-accent-color', `0, 121, 107`); }
  }
  function updateThemeButtonText(theme) { /* ... (same, uses DOMElements.themeToggleInitial) ... */ 
    const themeIcon = theme === 'light-theme' ? '🌙' : '☀️'; 
    if(DOMElements.themeToggleInitial) DOMElements.themeToggleInitial.textContent = themeIcon;
  }

  // --- API Fetching ---
  async function fetchInitialData() { /* ... (same, uses DOMElements.surahSelect etc.) ... */ 
    showLoading();
    try {
      const [surahsRes, recitersRes, translationsRes] = await Promise.all([
        axios.get(`${QURAN_API_BASE}/surah`),
        axios.get(`${QURAN_API_BASE}/edition?format=audio&language=ar&type=versebyverse`),
        axios.get(`${QURAN_API_BASE}/edition?format=text&type=translation`)
      ]);
      surahsData = surahsRes.data.data; recitersData = recitersRes.data.data; translationsData = translationsRes.data.data;
      populateSelect(DOMElements.surahSelect, surahsData, 'number', 'name', 'اختر سورة');
      populateSelect(DOMElements.reciterSelect, recitersData, 'identifier', 'englishName', 'اختر قارئ');
      populateSelect(DOMElements.translationSelect, translationsData, 'identifier', 'englishName', 'بدون ترجمة', true);
      if(DOMElements.surahSelect && currentProject) DOMElements.surahSelect.value = currentProject.surah;
      await handleSurahChange(); 
      if(DOMElements.reciterSelect && currentProject) DOMElements.reciterSelect.value = currentProject.reciter;
      if(DOMElements.translationSelect && currentProject) DOMElements.translationSelect.value = currentProject.translation;
      updateUIFromProject(); 
    } catch (error) { console.error("Error fetching initial data:", error); alert("حدث خطأ أثناء تحميل البيانات الأساسية."); } 
    finally { hideLoading(); }
  }
  async function handleSurahChange() { /* ... (same, uses DOMElements.surahSelect, ayahStartInput, ayahEndInput) ... */
    if (!DOMElements.surahSelect || !currentProject) return;
    currentProject.surah = DOMElements.surahSelect.value;
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
    if (!selectedSurah) return; 
    try {
        const numberOfAyahs = selectedSurah.numberOfAyahs;
        if(DOMElements.ayahStartInput) { DOMElements.ayahStartInput.max = numberOfAyahs; if (parseInt(DOMElements.ayahStartInput.value) > numberOfAyahs || parseInt(DOMElements.ayahStartInput.value) < 1) DOMElements.ayahStartInput.value = 1; }
        if(DOMElements.ayahEndInput) { DOMElements.ayahEndInput.max = numberOfAyahs; if (parseInt(DOMElements.ayahEndInput.value) > numberOfAyahs || parseInt(DOMElements.ayahEndInput.value) < 1) DOMElements.ayahEndInput.value = Math.min(7, numberOfAyahs); }
        currentProject.ayahStart = DOMElements.ayahStartInput ? parseInt(DOMElements.ayahStartInput.value) : 1;
        currentProject.ayahEnd = DOMElements.ayahEndInput ? parseInt(DOMElements.ayahEndInput.value) : (numberOfAyahs || 7);
        if (currentProject.ayahStart > currentProject.ayahEnd) { currentProject.ayahEnd = currentProject.ayahStart; if(DOMElements.ayahEndInput) DOMElements.ayahEndInput.value = currentProject.ayahEnd; }
        updateProjectFromUIAndPreview();
    } catch (error) { console.error("Error in handleSurahChange:", error); alert("حدث خطأ أثناء تحديث نطاق الآيات."); } 
  }
  function handleAyahRangeChange() { /* ... (same, uses DOMElements.ayahStartInput, ayahEndInput) ... */ 
    if (!DOMElements.ayahStartInput || !DOMElements.ayahEndInput || !currentProject) return;
    let start = parseInt(DOMElements.ayahStartInput.value); let end = parseInt(DOMElements.ayahEndInput.value);
    const maxAyahs = DOMElements.ayahStartInput.max ? parseInt(DOMElements.ayahStartInput.max) : Infinity; 
    start = Math.max(1, Math.min(start, maxAyahs)); end = Math.max(1, Math.min(end, maxAyahs));
    if (start > end) { end = start; }
    DOMElements.ayahStartInput.value = start; DOMElements.ayahEndInput.value = end;
    currentProject.ayahStart = start; currentProject.ayahEnd = end;
    updateProjectFromUIAndPreview();
  }
  function populateSelect(selectElement, data, valueKey, textKey, defaultOptionText = null, addNoneOption = false) { /* ... (same) ... */ 
    if (!selectElement) return; selectElement.innerHTML = '';
    if (defaultOptionText) { const opt = document.createElement('option'); opt.value = ''; opt.textContent = defaultOptionText; if (addNoneOption && defaultOptionText === "بدون ترجمة") opt.value = ""; else if (addNoneOption) opt.value = "none"; selectElement.appendChild(opt); }
    if (addNoneOption && !defaultOptionText) { const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'بدون'; selectElement.appendChild(opt); }
    if(data && Array.isArray(data)) { data.forEach(item => { const opt = document.createElement('option'); opt.value = item[valueKey]; opt.textContent = item[textKey] + (item.language ? ` (${item.language})` : ''); selectElement.appendChild(opt); });
    } else { console.warn("Data for populateSelect is invalid for:", selectElement.id); }
  }

  // --- Project State & UI Sync ---
  function updateProjectFromUI() { /* ... (same, uses DOMElements) ... */ 
    if(!currentProject) currentProject = createNewProjectState();
    if(DOMElements.surahSelect) currentProject.surah = DOMElements.surahSelect.value;
    if(DOMElements.ayahStartInput) currentProject.ayahStart = parseInt(DOMElements.ayahStartInput.value);
    if(DOMElements.ayahEndInput) currentProject.ayahEnd = parseInt(DOMElements.ayahEndInput.value);
    if(DOMElements.reciterSelect) currentProject.reciter = DOMElements.reciterSelect.value;
    // ... (and so on for all DOMElements used to update currentProject)
    if(DOMElements.translationSelect) currentProject.translation = DOMElements.translationSelect.value;
    if(DOMElements.fontSelect) currentProject.font = DOMElements.fontSelect.value;
    if(DOMElements.fontSizeSlider) currentProject.fontSize = parseInt(DOMElements.fontSizeSlider.value);
    if(DOMElements.fontColorPicker) currentProject.fontColor = DOMElements.fontColorPicker.value;
    if(DOMElements.ayahBgColorPicker) currentProject.ayahBgColor = DOMElements.ayahBgColorPicker.value;
    if(DOMElements.textEffectSelect) currentProject.textEffect = DOMElements.textEffectSelect.value;
    if(DOMElements.delayBetweenAyahsInput) currentProject.delayBetweenAyahs = parseFloat(DOMElements.delayBetweenAyahsInput.value);
    if(DOMElements.resolutionSelect) currentProject.resolution = DOMElements.resolutionSelect.value;
    if(DOMElements.transitionSelect) currentProject.transition = DOMElements.transitionSelect.value;
    currentProject.lastModified = Date.now();
  }
  function updateUIFromProject() { /* ... (same, updates DOMElements from currentProject) ... */
    if(!currentProject) return;
    if(DOMElements.surahSelect) DOMElements.surahSelect.value = currentProject.surah;    
    if(DOMElements.ayahStartInput) DOMElements.ayahStartInput.value = currentProject.ayahStart;
    if(DOMElements.ayahEndInput) DOMElements.ayahEndInput.value = currentProject.ayahEnd;
    // ... (and so on for all DOMElements)
    if(DOMElements.reciterSelect) DOMElements.reciterSelect.value = currentProject.reciter;
    if(DOMElements.translationSelect) DOMElements.translationSelect.value = currentProject.translation;
    if(DOMElements.fontSelect) DOMElements.fontSelect.value = currentProject.font;
    if(DOMElements.fontSizeSlider) DOMElements.fontSizeSlider.value = currentProject.fontSize;
    if(DOMElements.fontSizeValue) DOMElements.fontSizeValue.textContent = `${currentProject.fontSize}px`;
    if(DOMElements.fontColorPicker) DOMElements.fontColorPicker.value = currentProject.fontColor;
    if(DOMElements.ayahBgColorPicker) { try { DOMElements.ayahBgColorPicker.value = tinycolor(currentProject.ayahBgColor).toRgbString(); } catch (e) { DOMElements.ayahBgColorPicker.value = 'rgba(0,0,0,0.3)' } }
    if(DOMElements.textEffectSelect) DOMElements.textEffectSelect.value = currentProject.textEffect;
    if(DOMElements.delayBetweenAyahsInput) DOMElements.delayBetweenAyahsInput.value = currentProject.delayBetweenAyahs;
    if(DOMElements.resolutionSelect) DOMElements.resolutionSelect.value = currentProject.resolution;
    if(DOMElements.transitionSelect) DOMElements.transitionSelect.value = currentProject.transition;
    if (DOMElements.editorContextTitle && currentProject.name !== "مشروع جديد") { DOMElements.editorContextTitle.textContent = currentProject.name; } 
    else if (DOMElements.editorContextTitle) { const activeBtn = document.querySelector('.action-tool-btn.active'); DOMElements.editorContextTitle.textContent = activeBtn ? activeBtn.dataset.title : "محرر"; }
    const selectedSurahData = surahsData.find(s => s.number == currentProject.surah);
    if (selectedSurahData) { const max = selectedSurahData.numberOfAyahs; if(DOMElements.ayahStartInput) DOMElements.ayahStartInput.max = max; if(DOMElements.ayahEndInput) DOMElements.ayahEndInput.max = max; }
    if (currentProject.background) { /* background loading logic */ } else { backgroundImage = null; }
   }
  function updateProjectFromUIAndPreview() { updateProjectFromUI(); updatePreview(); }

  // --- Background Handling ---
  function handleBackgroundImport(event) { /* ... (same, uses DOMElements.importBackground) ... */ 
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith('image/')) { const img = new Image(); img.onload = () => { backgroundImage = img; currentProject.background = e.target.result; currentProject.backgroundType = 'image'; updatePreview(); }; img.onerror = () => alert("خطأ تحميل الصورة."); img.src = e.target.result; } 
      else if (file.type.startsWith('video/')) { const video = document.createElement('video'); video.src = e.target.result; video.muted = true; video.loop = true; video.oncanplay = () => { backgroundImage = video; currentProject.background = e.target.result; currentProject.backgroundType = 'video'; video.play().then(() => backgroundVideoIsPlaying = true).catch(err=>console.warn("Video autoplay error:",err)); updatePreview(); }; video.onerror = () => alert("خطأ تحميل الفيديو."); }
    }; reader.readAsDataURL(file);
  }
  async function fetchAiBackgroundSuggestions() { /* ... (same, uses DOMElements.applyAiBgBtn, aiBgSuggestionsDiv, aiBgSuggestionsLoader) ... */ 
    if (PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') { alert("PEXELS API KEY مطلوب."); return; }
    if (!currentProject || !DOMElements.surahSelect) { alert("خطأ تهيئة المشروع/السور."); return; }
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah); if (!selectedSurah) { alert("اختر سورة أولاً."); return; }
    const query = selectedSurah.englishName.replace("Al-", "").replace("Surat ", "").trim(); 
    if(DOMElements.aiBgSuggestionsDiv) DOMElements.aiBgSuggestionsDiv.innerHTML = ''; if(DOMElements.aiBgSuggestionsLoader) DOMElements.aiBgSuggestionsLoader.style.display = 'block'; showLoading();
    try { /* ... Pexels API call ... */ } catch (error) { /* ... error handling ... */ } 
    finally { hideLoading(); if(DOMElements.aiBgSuggestionsLoader) DOMElements.aiBgSuggestionsLoader.style.display = 'none'; }
  }

  // --- Canvas Drawing ---
  async function updatePreview(ayahOverride = null, translationOverride = null, surahTitleOverride = null) { /* ... (same, uses DOMElements.canvas, ctx, preview elements, currentProject) ... */ 
    if (isRendering || !ctx || !DOMElements.canvas || !currentProject) { if (!currentProject) console.warn("updatePreview: currentProject undefined."); return Promise.resolve(); }
    isRendering = true;
    return new Promise(resolve => {
        requestAnimationFrame(async () => {
            ctx.clearRect(0, 0, DOMElements.canvas.width, DOMElements.canvas.height);
            if (backgroundImage) { if (backgroundImage.tagName === 'VIDEO') { /* video bg */ } else { /* image bg */ } } else { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, DOMElements.canvas.width, DOMElements.canvas.height); }
            const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
            let cSurahTitle = surahTitleOverride || (selectedSurah ? selectedSurah.name : (currentProject.surah ? `سورة ${currentProject.surah}`: "اختر سورة"));
            let cAyahText = ayahOverride || "بسم الله الرحمن الرحيم"; let cTransText = translationOverride || "";
            if (!ayahOverride && !surahTitleOverride) { if (selectedSurah && currentProject.ayahStart && currentProject.reciter) { try { /* fetch ayah text */ } catch (e) { /* ... */ } } }
            if(DOMElements.previewSurahTitle) DOMElements.previewSurahTitle.textContent = cSurahTitle; /* ... set other preview texts ... */
            const titleFontSize = Math.min(DOMElements.canvas.width / 20, DOMElements.canvas.height / 15);
            ctx.font = `bold ${titleFontSize}px ${currentProject.font || "'Amiri Quran', serif"}`; const mainFontClr = currentProject.fontColor || '#FFFFFF';
            /* ... rest of drawing logic using mainFontClr and other currentProject properties safely ... */
            isRendering = false; resolve(); 
        });
    });
  }
  function drawTextWithShadow(text, x, y, color, shadowC = 'rgba(0,0,0,0.7)', shadowB = 5, shadowOX = 2, shadowOY = 2) { /* ... (same) ... */ }
  function drawTextWithEffect(text, x, y, maxWidth, color, effect) { /* ... (same) ... */ }
  function wrapText(text, maxWidth, context) { /* ... (same) ... */ }
  function getGlobalAyahNumber(surahNumber, ayahInSurah) { /* ... (same) ... */ }

  // --- Audio Preview ---
  async function toggleAudioPreview() { /* ... (same, uses DOMElements.playPauseAudioPreviewBtn, ayahAudioPlayer) ... */ }
  async function startAudioPreview() { /* ... (same, uses DOMElements.playPauseAudioPreviewBtn, stopAudioPreviewBtn, audioPreviewStatus, ayahAudioPlayer) ... */ }
  function pauseAudioPreview() { /* ... (same, uses DOMElements.playPauseAudioPreviewBtn, ayahAudioPlayer) ... */ }
  function stopAudioPreview() { /* ... (same, uses DOMElements.playPauseAudioPreviewBtn, stopAudioPreviewBtn, audioPreviewStatus, ayahAudioPlayer) ... */ }
  async function playCurrentAyahAudio() { /* ... (same, uses DOMElements.audioPreviewStatus, ayahAudioPlayer) ... */ }
  function handleAudioAyahEnded() { /* ... (same) ... */ }
  function handleAudioError(e) { /* ... (same, uses DOMElements.audioPreviewStatus) ... */ }

  // --- Project Persistence ---
  function saveProject() { /* ... (same, uses DOMElements.editorContextTitle) ... */ }
  function loadProjects() { /* ... (same, uses DOMElements.projectsList, noProjectsMessage) ... */ }
  async function loadSpecificProject(projectId) { /* ... (same, ensures activateControlPanel called) ... */ 
    const projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad) {
      currentProject = { ...createNewProjectState(), ...projectToLoad }; loadedProjectId = projectId; showLoading(); 
      try {
        if (surahsData.length === 0 || recitersData.length === 0) { await fetchInitialData(); } 
        else { if(DOMElements.surahSelect) DOMElements.surahSelect.value = currentProject.surah; await handleSurahChange(); updateUIFromProject(); }
        await updatePreview(); showScreen('editor');
        const quranBtn = document.querySelector('.action-tool-btn[data-panel="quran-options-panel"]'); if(quranBtn) activateControlPanel(quranBtn.dataset.panel, quranBtn.dataset.title);
      } catch (err) { console.error("Error loading project:", err); alert("خطأ تحميل المشروع."); resetToNewProject(); } 
      finally { hideLoading(); }
    }
  }
  function deleteProject(projectId) { /* ... (same) ... */ }

  // --- Video Export ---
  async function exportVideo() { /* ... (same, uses DOMElements.exportBtn, exportProgressDiv etc.) ... */ }
  function updateExportProgress(currentFrame, totalFrames) { /* ... (same, uses DOMElements.exportProgressBar, exportProgressText) ... */ }

  // --- Utility Functions ---
  function showLoading(message = null) { if(DOMElements.loadingSpinner) DOMElements.loadingSpinner.style.display = 'flex'; }
  function hideLoading() { if(DOMElements.loadingSpinner) DOMElements.loadingSpinner.style.display = 'none'; }
  function debounce(func, delay) { let timeout; return function(...args) { const context = this; clearTimeout(timeout); timeout = setTimeout(() => func.apply(context, args), delay); }; }

  // --- Start the app ---
  init();
});
