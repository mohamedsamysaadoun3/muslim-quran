document.addEventListener('DOMContentLoaded', () => {
  // --- PEXELS API KEY ---
  const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY'; 
  if (PEXELS_API_KEY === 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7') {
    console.warn("الرجاء إضافة مفتاح Pexels API في ملف script.js لتفعيل اقتراحات الخلفيات.");
    const applyAiBgButton = document.getElementById('apply-ai-bg');
    if (applyAiBgButton) {
      applyAiBgButton.disabled = true;
      applyAiBgButton.title = "يتطلب مفتاح PEXELS API";
    }
  }

  // --- DOM Elements ---
  const initialScreen = document.getElementById('initial-screen');
  const editorScreen = document.getElementById('editor-screen');
  const goToEditorBtn = document.getElementById('go-to-editor-btn'); // هذا هو الزر المهم
  
  const editorBackBtn = document.getElementById('editor-back-btn');
  const editorContextTitle = document.getElementById('editor-context-title');
  const editorSaveBtn = document.getElementById('editor-save-btn');

  const ayahStartInput = document.getElementById('ayah-start-input');
  const ayahEndInput = document.getElementById('ayah-end-input');

  const mainActionToolBtns = document.querySelectorAll('.action-tool-btn');
  // const dynamicControlsContainer = document.getElementById('editor-dynamic-controls-container'); // Not directly manipulated often after setup

  const projectsList = document.getElementById('projects-list');
  const noProjectsMessage = document.getElementById('no-projects-message');
  
  const surahSelect = document.getElementById('surah-select');
  const reciterSelect = document.getElementById('reciter-select');
  const translationSelect = document.getElementById('translation-select');

  const fontSelect = document.getElementById('font-select');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const fontColorPicker = document.getElementById('font-color-picker');
  const ayahBgColorPicker = document.getElementById('ayah-bg-color-picker');
  const textEffectSelect = document.getElementById('text-effect-select');

  const importBackground = document.getElementById('import-background');
  const applyAiBgBtn = document.getElementById('apply-ai-bg');
  const aiBgSuggestionsDiv = document.getElementById('ai-bg-suggestions');
  const aiBgSuggestionsLoader = document.getElementById('ai-bg-suggestions-loader');

  const delayBetweenAyahsInput = document.getElementById('delay-between-ayahs');
  const resolutionSelect = document.getElementById('resolution-select');
  const transitionSelect = document.getElementById('transition-select');
  const exportBtn = document.getElementById('export-btn');
  const exportProgressDiv = document.getElementById('export-progress');
  const exportProgressBar = document.getElementById('export-progress-bar');
  const exportProgressText = document.getElementById('export-progress-text');

  const canvas = document.getElementById('video-preview-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null; // Add null check for ctx
  const previewSurahTitle = document.getElementById('preview-surah-title');
  const previewAyahText = document.getElementById('preview-ayah-text');
  const previewTranslationText = document.getElementById('preview-translation-text');

  const loadingSpinner = document.getElementById('loading-spinner');
  const themeToggleInitial = document.getElementById('theme-toggle-initial');

  const playPauseAudioPreviewBtn = document.getElementById('play-pause-audio-preview-btn');
  const stopAudioPreviewBtn = document.getElementById('stop-audio-preview-btn');
  const audioPreviewStatus = document.getElementById('audio-preview-status');
  const ayahAudioPlayer = document.getElementById('ayah-audio-player');


  const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
  const PEXELS_API_BASE = 'https://api.pexels.com/v1';

  let surahsData = [];
  let recitersData = [];
  let translationsData = [];
  let currentProject = createNewProjectState();
  let loadedProjectId = null;
  let backgroundImage = null; 
  let backgroundVideoIsPlaying = false;
  let capturer = null;
  let isRendering = false;

  let audioPreviewState = { 
      isPlaying: false, currentAyahIndex: 0, ayahsToPlay: [], audioObjects: [], currentAudio: null 
  }; // Initialized state

  function init() {
    loadTheme(); 
    setAccentColorRGB(); 
    loadProjects();
    setupEventListeners(); // Crucial for button functionality
    fetchInitialData();
    setDefaultCanvas();
    updatePreview();
  }

  function createNewProjectState() {
    return {
      id: `project_${Date.now()}`, name: "مشروع جديد", surah: '1',
      ayahStart: 1, ayahEnd: 7, reciter: 'ar.alafasy', translation: '',
      font: "'Amiri Quran', serif", fontSize: 48, fontColor: '#FFFFFF',
      ayahBgColor: 'rgba(0,0,0,0.3)', textEffect: 'none', background: null, 
      backgroundType: 'color', delayBetweenAyahs: 1, resolution: '1920x1080',
      transition: 'fade', lastModified: Date.now()
    };
  }
  
  function setDefaultCanvas() {
    if (!canvas || !ctx || !currentProject) return; // Add currentProject check
    const [width, height] = currentProject.resolution.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if(previewSurahTitle) previewSurahTitle.textContent = 'اختر سورة';
    if(previewAyahText) previewAyahText.textContent = 'بسم الله الرحمن الرحيم';
    if(previewTranslationText) previewTranslationText.textContent = '';
  }

  function setupEventListeners() {
    // --- THIS IS THE CRUCIAL PART FOR "إنشاء فيديو جديد" ---
    if (goToEditorBtn) {
        goToEditorBtn.addEventListener('click', () => {
          console.log("[DEBUG] 'إنشاء فيديو جديد' button clicked."); // For mobile debugging via remote inspect
          resetToNewProject(); 
          showScreen('editor');
          // Activate Quran panel by default when going to editor (already in showScreen and resetToNewProject)
        });
    } else {
        console.error("CRITICAL: Button 'go-to-editor-btn' (إنشاء فيديو جديد) not found!");
    }
    // --- END OF CRUCIAL PART ---

    if (editorBackBtn) {
        editorBackBtn.addEventListener('click', () => {
          stopAudioPreview();
          showScreen('initial');
        });
    }
    if (editorSaveBtn) {
        editorSaveBtn.addEventListener('click', saveProject);
    }

    if(themeToggleInitial) themeToggleInitial.addEventListener('click', toggleTheme);

    mainActionToolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const panelId = btn.dataset.panel;
        const panelTitle = btn.dataset.title;
        activateControlPanel(panelId, panelTitle);
      });
    });

    if(surahSelect) surahSelect.addEventListener('change', handleSurahChange);
    if(ayahStartInput) ayahStartInput.addEventListener('change', handleAyahRangeChange);
    if(ayahEndInput) ayahEndInput.addEventListener('change', handleAyahRangeChange);

    [reciterSelect, translationSelect].forEach(el => {
        if(el) el.addEventListener('change', updateProjectFromUIAndPreview)
    });
    if(fontSelect) fontSelect.addEventListener('change', updateProjectFromUIAndPreview);
    if(fontSizeSlider && fontSizeValue) {
        fontSizeSlider.addEventListener('input', () => {
            fontSizeValue.textContent = `${fontSizeSlider.value}px`;
            updateProjectFromUIAndPreview();
        });
    }
    [fontColorPicker, ayahBgColorPicker].forEach(el => {
        if(el) el.addEventListener('input', debounce(updateProjectFromUIAndPreview, 200))
    });
    if(textEffectSelect) textEffectSelect.addEventListener('change', updateProjectFromUIAndPreview);
    if(importBackground) importBackground.addEventListener('change', handleBackgroundImport);
    if(applyAiBgBtn) applyAiBgBtn.addEventListener('click', fetchAiBackgroundSuggestions);
    if(delayBetweenAyahsInput) delayBetweenAyahsInput.addEventListener('change', updateProjectFromUIAndPreview);
    if(resolutionSelect) {
        resolutionSelect.addEventListener('change', () => {
            updateProjectFromUIAndPreview();
            const [width, height] = currentProject.resolution.split('x').map(Number);
            if(canvas) { canvas.width = width; canvas.height = height; }
            updatePreview(); 
        });
    }
    if(transitionSelect) transitionSelect.addEventListener('change', updateProjectFromUIAndPreview);
    if(exportBtn) exportBtn.addEventListener('click', exportVideo);
    if(playPauseAudioPreviewBtn) playPauseAudioPreviewBtn.addEventListener('click', toggleAudioPreview);
    if(stopAudioPreviewBtn) stopAudioPreviewBtn.addEventListener('click', stopAudioPreview);
    if(ayahAudioPlayer) {
        ayahAudioPlayer.addEventListener('ended', handleAudioAyahEnded);
        ayahAudioPlayer.addEventListener('error', handleAudioError);
    }
  }

  function activateControlPanel(panelId, panelTitle) {
    document.querySelectorAll('.control-panel').forEach(p => p.classList.remove('active-panel'));
    const panelToShow = document.getElementById(panelId);
    if (panelToShow) {
      panelToShow.classList.add('active-panel');
    } else {
        console.warn(`Control panel with ID '${panelId}' not found.`);
    }
    if (editorContextTitle) {
      editorContextTitle.textContent = panelTitle || "محرر";
    }
    mainActionToolBtns.forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.action-tool-btn[data-panel="${panelId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  function showScreen(screenName) {
    if (!initialScreen || !editorScreen) {
        console.error("CRITICAL: Initial or Editor screen element not found in showScreen!");
        return;
    }
    console.log(`[DEBUG] showScreen called for: ${screenName}. Current project name: ${currentProject ? currentProject.name : 'undefined'}`);

    initialScreen.style.display = (screenName === 'initial') ? 'flex' : 'none';
    editorScreen.style.display = (screenName === 'editor') ? 'flex' : 'none';
    
    if (screenName === 'editor') {
      // Default to Quran panel being active when editor is shown, especially for a new project
      const quranToolButton = document.querySelector('.action-tool-btn[data-panel="quran-options-panel"]');
      if (quranToolButton) {
          activateControlPanel(quranToolButton.dataset.panel, quranToolButton.dataset.title);
      } else {
          console.warn("Default Quran tool button not found to activate panel.");
      }
      // Update title based on project name if it's not a "new project" or if a tool context isn't more specific
      if (editorContextTitle && currentProject) {
        editorContextTitle.textContent = currentProject.name !== "مشروع جديد" ? currentProject.name : (quranToolButton ? quranToolButton.dataset.title : "محرر");
      }

    } else if (screenName === 'initial') {
      if(projectsList) loadProjects();
    }
  }
  
  function resetToNewProject() {
    console.log("[DEBUG] resetToNewProject called.");
    currentProject = createNewProjectState();
    loadedProjectId = null;
    
    // Call updateUIFromProject *before* setDefaultCanvas if setDefaultCanvas relies on project state
    updateUIFromProject(); 
    setDefaultCanvas(); 
    backgroundImage = null; 
    
    if (aiBgSuggestionsDiv) aiBgSuggestionsDiv.innerHTML = ''; 
    updatePreview();
    
    // Ensure Quran panel is active and title is set accordingly for a new project
    const quranToolButton = document.querySelector('.action-tool-btn[data-panel="quran-options-panel"]');
    if (quranToolButton) {
        activateControlPanel(quranToolButton.dataset.panel, quranToolButton.dataset.title);
    } else if (editorContextTitle) { // Fallback title if button not found (should not happen)
        editorContextTitle.textContent = "القرآن";
    }
  }

  function loadTheme() {
    const theme = localStorage.getItem('quranVideoTheme') || 'dark-theme'; 
    document.body.className = ''; 
    document.body.classList.add(theme);
    updateThemeButtonText(theme);
    // setAccentColorRGB(); // Moved to be called after theme is set in toggleTheme and init
  }

  function toggleTheme() {
    const newTheme = document.body.classList.contains('light-theme') ? 'dark-theme' : 'light-theme';
    document.body.className = ''; 
    document.body.classList.add(newTheme);
    localStorage.setItem('quranVideoTheme', newTheme);
    updateThemeButtonText(newTheme);
    setAccentColorRGB(); 
    updatePreview(); 
  }

  function setAccentColorRGB() {
    const bodyStyles = getComputedStyle(document.body);
    const accentColor = bodyStyles.getPropertyValue('--current-accent-color').trim();
    if (!accentColor) {
        console.warn("Could not get --current-accent-color. Using fallback for --rgb-accent-color.");
        document.body.style.setProperty('--rgb-accent-color', `0, 121, 107`); // Fallback Teal
        return;
    }
    try {
        const rgb = tinycolor(accentColor).toRgb();
        document.body.style.setProperty('--rgb-accent-color', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    } catch (e) {
        console.warn("Could not parse accent color for RGB variable:", accentColor, e);
        document.body.style.setProperty('--rgb-accent-color', `0, 121, 107`); // Fallback
    }
  }
  
  function updateThemeButtonText(theme) {
    const themeIcon = theme === 'light-theme' ? '🌙' : '☀️'; 
    if(themeToggleInitial) themeToggleInitial.textContent = themeIcon;
  }

  async function fetchInitialData() {
    showLoading();
    try {
      const [surahsRes, recitersRes, translationsRes] = await Promise.all([
        axios.get(`${QURAN_API_BASE}/surah`),
        axios.get(`${QURAN_API_BASE}/edition?format=audio&language=ar&type=versebyverse`),
        axios.get(`${QURAN_API_BASE}/edition?format=text&type=translation`)
      ]);
      surahsData = surahsRes.data.data;
      recitersData = recitersRes.data.data;
      translationsData = translationsRes.data.data;

      if(surahSelect) populateSelect(surahSelect, surahsData, 'number', 'name', 'اختر سورة');
      if(reciterSelect) populateSelect(reciterSelect, recitersData, 'identifier', 'englishName', 'اختر قارئ');
      if(translationSelect) populateSelect(translationSelect, translationsData, 'identifier', 'englishName', 'بدون ترجمة', true);
      
      if(surahSelect && currentProject) surahSelect.value = currentProject.surah;
      await handleSurahChange(); 
      if(reciterSelect && currentProject) reciterSelect.value = currentProject.reciter;
      if(translationSelect && currentProject) translationSelect.value = currentProject.translation;

      updateUIFromProject(); 
      
    } catch (error) { 
        console.error("Error fetching initial data:", error);
        alert("حدث خطأ أثناء تحميل البيانات الأساسية. يرجى التحقق من اتصالك بالإنترنت.");
    } 
    finally { hideLoading(); }
  }

  async function handleSurahChange() {
    if (!surahSelect || !currentProject) return;
    // showLoading(); // Might be too frequent, consider removing if UI updates are fast
    currentProject.surah = surahSelect.value;
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
    if (!selectedSurah) { 
        // hideLoading(); 
        return; 
    }

    try {
        const numberOfAyahs = selectedSurah.numberOfAyahs;

        if(ayahStartInput) {
            ayahStartInput.max = numberOfAyahs;
            // Ensure current value is valid after changing surah
            if (parseInt(ayahStartInput.value) > numberOfAyahs || parseInt(ayahStartInput.value) < 1) ayahStartInput.value = 1;
        }
        if(ayahEndInput) {
            ayahEndInput.max = numberOfAyahs;
            if (parseInt(ayahEndInput.value) > numberOfAyahs || parseInt(ayahEndInput.value) < 1) ayahEndInput.value = Math.min(7, numberOfAyahs); // Default to 7 or max if less
        }
        
        currentProject.ayahStart = ayahStartInput ? parseInt(ayahStartInput.value) : 1;
        currentProject.ayahEnd = ayahEndInput ? parseInt(ayahEndInput.value) : (selectedSurah.numberOfAyahs || 7);

        if (currentProject.ayahStart > currentProject.ayahEnd) {
            currentProject.ayahEnd = currentProject.ayahStart;
            if(ayahEndInput) ayahEndInput.value = currentProject.ayahEnd;
        }
        updateProjectFromUIAndPreview();
    } catch (error) { 
        console.error("Error in handleSurahChange (processing numberOfAyahs):", error);
        alert("حدث خطأ أثناء تحديث نطاق الآيات.");
    } 
    // finally { hideLoading(); }
  }
  
  function handleAyahRangeChange() {
    if (!ayahStartInput || !ayahEndInput || !currentProject) return;
    let start = parseInt(ayahStartInput.value);
    let end = parseInt(ayahEndInput.value);
    const maxAyahs = ayahStartInput.max ? parseInt(ayahStartInput.max) : Infinity; 

    start = Math.max(1, Math.min(start, maxAyahs));
    end = Math.max(1, Math.min(end, maxAyahs));
    
    if (start > end) {
      // If start was changed, make end = start. If end was changed, make start = end.
      // A simpler approach: if start is now greater, align end.
      end = start; 
    }
    ayahStartInput.value = start;
    ayahEndInput.value = end;

    currentProject.ayahStart = start;
    currentProject.ayahEnd = end;
    updateProjectFromUIAndPreview();
  }

  function populateSelect(selectElement, data, valueKey, textKey, defaultOptionText = null, addNoneOption = false) {
    if (!selectElement) return;
    selectElement.innerHTML = '';
    if (defaultOptionText) {
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = defaultOptionText;
      if (addNoneOption && defaultOptionText === "بدون ترجمة") defaultOpt.value = ""; 
      else if (addNoneOption) defaultOpt.value = "none";
      selectElement.appendChild(defaultOpt);
    }
    if (addNoneOption && !defaultOptionText) { 
        const noneOpt = document.createElement('option');
        noneOpt.value = '';
        noneOpt.textContent = 'بدون';
        selectElement.appendChild(noneOpt);
    }
    if(data && Array.isArray(data)) { // Add check for data
        data.forEach(item => {
          const option = document.createElement('option');
          option.value = item[valueKey];
          option.textContent = item[textKey] + (item.language ? ` (${item.language})` : '');
          selectElement.appendChild(option);
        });
    } else {
        console.warn("Data for populateSelect is not an array or is undefined", selectElement.id, data);
    }
  }
  
  function updateProjectFromUI() {
    if(!currentProject) currentProject = createNewProjectState();

    if(surahSelect) currentProject.surah = surahSelect.value;
    if(ayahStartInput) currentProject.ayahStart = parseInt(ayahStartInput.value);
    if(ayahEndInput) currentProject.ayahEnd = parseInt(ayahEndInput.value);
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
    currentProject.lastModified = Date.now();
  }

  function updateUIFromProject() {
    if(!currentProject) return;

    if(surahSelect) surahSelect.value = currentProject.surah;    
    if(ayahStartInput) ayahStartInput.value = currentProject.ayahStart;
    if(ayahEndInput) ayahEndInput.value = currentProject.ayahEnd;
    if(reciterSelect) reciterSelect.value = currentProject.reciter;
    if(translationSelect) translationSelect.value = currentProject.translation;
    if(fontSelect) fontSelect.value = currentProject.font;
    if(fontSizeSlider) fontSizeSlider.value = currentProject.fontSize;
    if(fontSizeValue) fontSizeValue.textContent = `${currentProject.fontSize}px`;
    if(fontColorPicker) fontColorPicker.value = currentProject.fontColor;
    if(ayahBgColorPicker) { try { ayahBgColorPicker.value = tinycolor(currentProject.ayahBgColor).toRgbString(); } catch (e) { ayahBgColorPicker.value = 'rgba(0,0,0,0.3)' } }
    if(textEffectSelect) textEffectSelect.value = currentProject.textEffect;
    if(delayBetweenAyahsInput) delayBetweenAyahsInput.value = currentProject.delayBetweenAyahs;
    if(resolutionSelect) resolutionSelect.value = currentProject.resolution;
    if(transitionSelect) transitionSelect.value = currentProject.transition;
    
    // Update title based on project name if it's not a "new project"
    // The active panel's title will be set by activateControlPanel
    if (editorContextTitle && currentProject.name !== "مشروع جديد") {
        editorContextTitle.textContent = currentProject.name;
    } else if (editorContextTitle) {
        const activeToolButton = document.querySelector('.action-tool-btn.active');
        editorContextTitle.textContent = activeToolButton ? activeToolButton.dataset.title : "محرر";
    }


    const selectedSurahData = surahsData.find(s => s.number == currentProject.surah);
    if (selectedSurahData) {
        const maxAyahs = selectedSurahData.numberOfAyahs;
        if(ayahStartInput) ayahStartInput.max = maxAyahs;
        if(ayahEndInput) ayahEndInput.max = maxAyahs;
    }
    
    if (currentProject.background) {
        if (currentProject.backgroundType === 'image' || currentProject.backgroundType === 'pexels') {
            const img = new Image();
            img.onload = () => { backgroundImage = img; updatePreview(); };
            img.onerror = () => { console.error("Error loading background image from project."); backgroundImage = null; updatePreview(); };
            img.src = currentProject.background;
        } else if (currentProject.backgroundType === 'video') {
            const video = document.createElement('video');
            video.src = currentProject.background;
            video.muted = true; video.loop = true;
            video.oncanplay = () => { backgroundImage = video; video.play().then(() => backgroundVideoIsPlaying = true).catch(e => console.warn("Video autoplay prevented:", e)); updatePreview(); };
            video.onerror = () => { console.error("Error loading background video from project."); backgroundImage = null; updatePreview(); };
        }
    } else { backgroundImage = null; }
  }
  
  function updateProjectFromUIAndPreview() {
    updateProjectFromUI();
    updatePreview();
  }

  // --- Background Handling ---
  function handleBackgroundImport(event) { /* ... (same as before, ensure `importBackground` element) ... */ 
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          backgroundImage = img;
          currentProject.background = e.target.result;
          currentProject.backgroundType = 'image';
          updatePreview();
        };
        img.onerror = () => { alert("خطأ في تحميل الصورة."); };
        img.src = e.target.result;
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = e.target.result;
        video.muted = true; video.loop = true;
        video.oncanplay = () => {
          backgroundImage = video;
          currentProject.background = e.target.result;
          currentProject.backgroundType = 'video';
          video.play().then(() => backgroundVideoIsPlaying = true).catch(err => console.warn("Video autoplay prevented:", err));
          updatePreview();
        };
        video.onerror = () => { alert("خطأ في تحميل الفيديو."); };
      }
    };
    reader.readAsDataURL(file);
  }

  async function fetchAiBackgroundSuggestions() { /* ... (same as before, ensure `aiBgSuggestionsDiv`, `aiBgSuggestionsLoader`, `applyAiBgBtn` elements) ... */ 
    if (PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
        alert("يرجى إضافة مفتاح Pexels API في ملف script.js لتفعيل هذه الميزة.");
        return;
    }
    if (!currentProject || !surahSelect) {
        alert("لم يتم تهيئة المشروع أو قائمة السور بشكل صحيح.");
        return;
    }
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
    if (!selectedSurah) {
      alert("يرجى اختيار سورة أولاً.");
      return;
    }
    const query = selectedSurah.englishName.replace("Al-", "").replace("Surat ", "").trim(); 
    
    if(aiBgSuggestionsDiv) aiBgSuggestionsDiv.innerHTML = '';
    if(aiBgSuggestionsLoader) aiBgSuggestionsLoader.style.display = 'block';
    showLoading();

    try {
      const response = await axios.get(`${PEXELS_API_BASE}/search`, {
        headers: { Authorization: PEXELS_API_KEY },
        params: { query: query, per_page: 5, orientation: 'landscape' }
      });
      
      if (response.data.photos.length === 0 && aiBgSuggestionsDiv) {
          aiBgSuggestionsDiv.innerHTML = '<p>لم يتم العثور على خلفيات مقترحة.</p>';
          return;
      }

      response.data.photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo.src.medium;
        img.alt = photo.alt || `Background for ${query}`;
        img.title = photo.alt || `Background for ${query}`;
        img.addEventListener('click', () => {
          document.querySelectorAll('#ai-bg-suggestions img.selected-ai-bg').forEach(el => el.classList.remove('selected-ai-bg'));
          img.classList.add('selected-ai-bg');

          const bgImg = new Image();
          bgImg.crossOrigin = "anonymous"; 
          bgImg.onload = () => {
            backgroundImage = bgImg;
            currentProject.background = photo.src.large2x; 
            currentProject.backgroundType = 'pexels';
            updatePreview();
          };
          bgImg.onerror = () => alert("خطأ في تحميل الصورة المقترحة.");
          bgImg.src = photo.src.large2x; 
        });
        if(aiBgSuggestionsDiv) aiBgSuggestionsDiv.appendChild(img);
      });
    } catch (error) {
      console.error("Error fetching Pexels suggestions:", error);
      if(aiBgSuggestionsDiv) aiBgSuggestionsDiv.innerHTML = '<p>خطأ في جلب الاقتراحات. تحقق من مفتاح API.</p>';
      if (error.response && error.response.status === 401) {
        alert("خطأ في المصادقة مع Pexels. يرجى التحقق من مفتاح API الخاص بك.");
      } else {
        alert("حدث خطأ أثناء البحث عن خلفيات مقترحة.");
      }
    } finally {
      hideLoading();
      if(aiBgSuggestionsLoader) aiBgSuggestionsLoader.style.display = 'none';
    }
  }

  // --- Canvas Drawing ---
  async function updatePreview(ayahOverride = null, translationOverride = null, surahTitleOverride = null) { /* ... (same as before, but ensure all `currentProject` properties are accessed safely with fallbacks) ... */ 
    if (isRendering || !ctx || !canvas || !currentProject) { // Added !currentProject check
        if (!currentProject) console.warn("updatePreview called but currentProject is undefined.");
        return Promise.resolve(); // Return a resolved promise if cannot render
    }
    isRendering = true;

    return new Promise(resolve => {
        requestAnimationFrame(async () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (backgroundImage) { /* ... */ } else { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

            const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
            let currentSurahTitle = surahTitleOverride || (selectedSurah ? selectedSurah.name : (currentProject.surah ? `سورة ${currentProject.surah}`: "اختر سورة"));
            let currentAyahText = ayahOverride || "بسم الله الرحمن الرحيم";
            let currentTranslationText = translationOverride || "";

            if (!ayahOverride && !translationOverride && !surahTitleOverride) { 
                if (selectedSurah && currentProject.ayahStart && currentProject.reciter) {
                     try {
                        const ayahNumGlobal = getGlobalAyahNumber(parseInt(currentProject.surah), parseInt(String(currentProject.ayahStart))); // Ensure ayahStart is string for parseInt
                        if (ayahNumGlobal) {
                            // Fallback to a default reciter if currentProject.reciter is somehow undefined
                            const reciterToUse = currentProject.reciter || 'ar.alafasy';
                            const response = await axios.get(`${QURAN_API_BASE}/ayah/${ayahNumGlobal}/${reciterToUse}`);
                            currentAyahText = response.data.data.text;
                            if (currentProject.translation) {
                                const transResponse = await axios.get(`${QURAN_API_BASE}/ayah/${ayahNumGlobal}/${currentProject.translation}`);
                                currentTranslationText = transResponse.data.data.text;
                            }
                        }
                    } catch (e) {
                        console.warn("Could not fetch specific ayah for preview text:", e.message);
                        currentAyahText = "خطأ في تحميل الآية";
                    }
                }
            }
            
            if(previewSurahTitle) previewSurahTitle.textContent = currentSurahTitle;
            if(previewAyahText) previewAyahText.textContent = currentAyahText;
            if(previewTranslationText) previewTranslationText.textContent = currentTranslationText;
            
            const titleFontSize = Math.min(canvas.width / 20, canvas.height / 15);
            ctx.font = `bold ${titleFontSize}px ${currentProject.font || "'Amiri Quran', serif"}`; 
            const mainFontColor = currentProject.fontColor || '#FFFFFF';
            ctx.fillStyle = mainFontColor; 
            ctx.textAlign = 'center'; ctx.textBaseline = 'top'; 
            const titleYPosition = canvas.height * 0.1;
            if (canvas.width > 0) drawTextWithShadow(currentSurahTitle, canvas.width / 2, titleYPosition, mainFontColor);

            const ayahFontSize = (currentProject.fontSize || 48) * (canvas.width > 0 ? (canvas.width / 1280) : 1); 
            ctx.font = `${ayahFontSize}px ${currentProject.font || "'Amiri Quran', serif"}`;
            ctx.fillStyle = mainFontColor;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            
            const ayahTextX = canvas.width / 2; const ayahTextY = canvas.height / 2; 
            const maxTextWidth = canvas.width * 0.85; 
            
            const ayahBg = currentProject.ayahBgColor || 'rgba(0,0,0,0.3)';
            if (tinycolor(ayahBg).getAlpha() > 0) { /* ... drawing ayahBg ... */ }
            
            if (canvas.width > 0) drawTextWithEffect(currentAyahText, ayahTextX, ayahTextY, maxTextWidth, mainFontColor, currentProject.textEffect || 'none');

            if (currentTranslationText) { /* ... drawing translation ... */ }
            isRendering = false;
            resolve(); 
        });
    });
  }
  function drawTextWithShadow(text, x, y, color, shadowColor = 'rgba(0,0,0,0.7)', shadowBlur = 5, shadowOffsetX = 2, shadowOffsetY = 2) { /* ... (same) ... */ }
  function drawTextWithEffect(text, x, y, maxWidth, color, effect) { /* ... (same, ensure ctx.font is valid) ... */ }
  function wrapText(text, maxWidth, context) { /* ... (same) ... */ }
  function getGlobalAyahNumber(surahNumber, ayahInSurah) { /* ... (same) ... */ }


  // --- Audio Preview ---
  async function toggleAudioPreview() { /* ... (same) ... */ }
  async function startAudioPreview() { /* ... (same, ensure currentProject properties are valid) ... */ }
  function pauseAudioPreview() { /* ... (same) ... */ }
  function stopAudioPreview() { /* ... (same) ... */ }
  async function playCurrentAyahAudio() { /* ... (same) ... */ }
  function handleAudioAyahEnded() { /* ... (same) ... */ }
  function handleAudioError(e) { /* ... (same) ... */ }

  // --- Project Persistence ---
  function saveProject() { /* ... (same) ... */ }
  function loadProjects() { /* ... (same) ... */ }
  async function loadSpecificProject(projectId) { /* ... (same, but ensure activateControlPanel is called correctly) ... */ 
    const projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad) {
      currentProject = { ...createNewProjectState(), ...projectToLoad }; 
      loadedProjectId = projectId;
      showLoading(); 
      try {
        if (surahsData.length === 0 || recitersData.length === 0) { 
            await fetchInitialData(); // This will also call handleSurahChange and updateUIFromProject
        } else {
            // Data exists, ensure UI reflects the loaded project, especially Ayah ranges for the surah
            if(surahSelect) surahSelect.value = currentProject.surah; // Set surah first
            await handleSurahChange(); // Then update ayah ranges based on it
            updateUIFromProject(); // Then update the rest of the UI
        }
        await updatePreview();  
        showScreen('editor');
        // Activate Quran panel as a sensible default when loading a project
        const quranToolButton = document.querySelector('.action-tool-btn[data-panel="quran-options-panel"]');
        if(quranToolButton) {
            activateControlPanel(quranToolButton.dataset.panel, quranToolButton.dataset.title);
        }
      } catch (err) { 
          console.error("Error during project load process:", err);
          alert("خطأ أثناء تحميل المشروع.");
          resetToNewProject(); 
      } 
      finally { hideLoading(); }
    }
  }
  function deleteProject(projectId) { /* ... (same) ... */ }

  // --- Video Export ---
  async function exportVideo() { /* ... (same, ensure all project properties are valid before export) ... */ }
  function updateExportProgress(currentFrame, totalFrames) { /* ... (same) ... */ }

  // --- Utility Functions ---
  function showLoading(message = null) { if(loadingSpinner) loadingSpinner.style.display = 'flex'; }
  function hideLoading() { if(loadingSpinner) loadingSpinner.style.display = 'none'; }
  function debounce(func, delay) { /* ... (same) ... */ }

  // --- Start the app ---
  init();

});
