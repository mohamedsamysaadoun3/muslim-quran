document.addEventListener('DOMContentLoaded', () => {
  // --- PEXELS API KEY ---
  // !! ضع مفتاح PEXELS API الخاص بك هنا !!
  // !! للحصول على مفتاح: https://www.pexels.com/api/
  // !! هام: هذا المفتاح سيكون ظاهرًا في كود العميل. للتطبيقات الإنتاجية،
  // !! يُفضل استخدام وسيط (backend proxy) لإخفاء المفتاح وحمايته.
  const PEXELS_API_KEY = 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7'; // <--- استبدل هذا بمفتاحك

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
  const goToEditorBtn = document.getElementById('go-to-editor-btn');
  const backToInitialScreenBtn = document.getElementById('back-to-initial-screen-btn');
  const projectsList = document.getElementById('projects-list');
  const noProjectsMessage = document.getElementById('no-projects-message');
  const saveProjectBtn = document.getElementById('save-project-btn');
  const currentProjectTitleElement = document.getElementById('current-project-title');

  const surahSelect = document.getElementById('surah-select');
  const ayahStartSelect = document.getElementById('ayah-start-select');
  const ayahEndSelect = document.getElementById('ayah-end-select');
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
  const ctx = canvas.getContext('2d');
  const previewSurahTitle = document.getElementById('preview-surah-title');
  const previewAyahText = document.getElementById('preview-ayah-text');
  const previewTranslationText = document.getElementById('preview-translation-text');

  const loadingSpinner = document.getElementById('loading-spinner');
  const themeToggleInitial = document.getElementById('theme-toggle-initial');
  const themeToggleEditor = document.getElementById('theme-toggle-editor');

  const playPauseAudioPreviewBtn = document.getElementById('play-pause-audio-preview-btn');
  const stopAudioPreviewBtn = document.getElementById('stop-audio-preview-btn');
  const audioPreviewStatus = document.getElementById('audio-preview-status');
  const ayahAudioPlayer = document.getElementById('ayah-audio-player');


  // --- API Endpoints ---
  const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
  const PEXELS_API_BASE = 'https://api.pexels.com/v1';

  // --- State Variables ---
  let surahsData = [];
  let recitersData = [];
  let translationsData = [];
  let currentProject = createNewProjectState();
  let loadedProjectId = null;
  let backgroundImage = null; // Can be Image or HTMLVideoElement
  let backgroundVideoIsPlaying = false;
  let capturer = null;
  let isRendering = false; // Flag to prevent multiple rendering calls

  let audioPreviewState = {
    isPlaying: false,
    currentAyahIndex: 0,
    ayahsToPlay: [], // { text: '', audioUrl: '', translation: '' }
    audioObjects: [],
    currentAudio: null,
  };

  // --- Initialization ---
  function init() {
    loadTheme();
    loadProjects();
    setupEventListeners();
    fetchInitialData();
    setDefaultCanvas();
    updatePreview(); // Initial preview update
  }

  function createNewProjectState() {
    return {
      id: `project_${Date.now()}`,
      name: "مشروع جديد",
      surah: '1',
      ayahStart: '1',
      ayahEnd: '7',
      reciter: 'ar.alafasy',
      translation: '',
      font: "'Amiri Quran', serif",
      fontSize: 48,
      fontColor: '#FFFFFF',
      ayahBgColor: 'rgba(0,0,0,0.3)',
      textEffect: 'none',
      background: null, // Stores dataURL or Pexels URL
      backgroundType: 'color', // 'color', 'image', 'video', 'pexels'
      delayBetweenAyahs: 1,
      resolution: '1920x1080',
      transition: 'fade',
      lastModified: Date.now()
    };
  }

  function setDefaultCanvas() {
    const [width, height] = currentProject.resolution.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    previewSurahTitle.textContent = 'اختر سورة';
    previewAyahText.textContent = 'بسم الله الرحمن الرحيم';
    previewTranslationText.textContent = '';
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    if (goToEditorBtn) {
        goToEditorBtn.addEventListener('click', () => {
          resetToNewProject(); 
          showScreen('editor');
        });
    } else {
        console.error("Button 'go-to-editor-btn' not found!");
    }

    if (backToInitialScreenBtn) {
        backToInitialScreenBtn.addEventListener('click', () => {
          stopAudioPreview(); // Stop audio if playing
          showScreen('initial');
          // resetToNewProject(); // لا نريد إعادة تعيين المشروع عند العودة، بل فقط عرضه
        });
    } else {
        console.error("Button 'back-to-initial-screen-btn' not found!");
    }


    [themeToggleInitial, themeToggleEditor].forEach(btn => {
        if(btn) btn.addEventListener('click', toggleTheme)
    });

    if(surahSelect) surahSelect.addEventListener('change', handleSurahChange);
    if(ayahStartSelect) ayahStartSelect.addEventListener('change', handleAyahRangeChange);
    if(ayahEndSelect) ayahEndSelect.addEventListener('change', handleAyahRangeChange);
    [reciterSelect, translationSelect].forEach(el => {
        if(el) el.addEventListener('change', updateProjectFromUIAndPreview)
    });

    if(fontSelect) fontSelect.addEventListener('change', updateProjectFromUIAndPreview);
    if(fontSizeSlider) {
        fontSizeSlider.addEventListener('input', () => {
            if(fontSizeValue) fontSizeValue.textContent = `${fontSizeSlider.value}px`;
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
            if(canvas) {
                canvas.width = width;
                canvas.height = height;
            }
            updatePreview(); 
        });
    }
    if(transitionSelect) transitionSelect.addEventListener('change', updateProjectFromUIAndPreview);
    if(exportBtn) exportBtn.addEventListener('click', exportVideo);

    if(saveProjectBtn) saveProjectBtn.addEventListener('click', saveProject);

    // Toolbar tabs
    document.querySelectorAll('.toolbar-tab-button').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.toolbar-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.toolbar-controls').forEach(tc => tc.style.display = 'none');
        
        button.parentElement.classList.add('active');
        const targetId = button.dataset.target;
        const targetControls = document.getElementById(targetId);
        if(targetControls) targetControls.style.display = 'grid'; 
      });
    });
    
    const firstTabToActivate = document.querySelector('.toolbar-tab-button[data-target="quran-controls"]');
    if (firstTabToActivate) {
        firstTabToActivate.click();
    } else {
        console.warn("Could not find the first tab button (quran-controls) to activate by default.");
    }

    if(playPauseAudioPreviewBtn) playPauseAudioPreviewBtn.addEventListener('click', toggleAudioPreview);
    if(stopAudioPreviewBtn) stopAudioPreviewBtn.addEventListener('click', stopAudioPreview);
    if(ayahAudioPlayer) {
        ayahAudioPlayer.addEventListener('ended', handleAudioAyahEnded);
        ayahAudioPlayer.addEventListener('error', handleAudioError);
    }
  }

  // --- Screen Navigation ---
  function showScreen(screenName) {
    if (!initialScreen || !editorScreen) {
      console.error("Initial or Editor screen element not found in showScreen!");
      return;
    }

    initialScreen.style.display = (screenName === 'initial') ? 'flex' : 'none';
    editorScreen.style.display = (screenName === 'editor') ? 'flex' : 'none';
    
    if (screenName === 'editor') {
      if (currentProjectTitleElement && currentProject) {
          currentProjectTitleElement.textContent = currentProject.name || "مشروع جديد";
      }

      let activeTabFound = false;
      document.querySelectorAll('.toolbar-section.active').forEach(section => {
          activeTabFound = true;
          const activeControlsId = section.querySelector('.toolbar-tab-button').dataset.target;
          const activeControlsPanel = document.getElementById(activeControlsId);
          if (activeControlsPanel && activeControlsPanel.style.display === 'none') {
              activeControlsPanel.style.display = 'grid';
          }
      });

      if (!activeTabFound) {
        const quranControlsTabButton = document.querySelector('.toolbar-tab-button[data-target="quran-controls"]');
        if (quranControlsTabButton) {
          quranControlsTabButton.click(); 
        } else {
            console.warn("Quran controls tab button not found to activate as default in editor.")
        }
      }

    } else if (screenName === 'initial') {
      if(projectsList) loadProjects();
    }
  }
  
  function resetToNewProject() {
    currentProject = createNewProjectState();
    loadedProjectId = null;
    updateUIFromProject(); // هذا سيقوم بتحديث كل عناصر الواجهة لتعكس المشروع الجديد
    setDefaultCanvas(); 
    backgroundImage = null; 
    if (currentProjectTitleElement) {
        currentProjectTitleElement.textContent = "مشروع جديد";
    }
    // تأكد من أن اقتراحات الخلفيات فارغة عند إنشاء مشروع جديد
    if (aiBgSuggestionsDiv) aiBgSuggestionsDiv.innerHTML = ''; 
    updatePreview();
  }

  // --- Theme Management ---
  function loadTheme() {
    const theme = localStorage.getItem('quranVideoTheme') || 'light-theme';
    document.body.className = theme;
    updateThemeButtonText(theme);
  }

  function toggleTheme() {
    const newTheme = document.body.classList.contains('light-theme') ? 'dark-theme' : 'light-theme';
    document.body.className = newTheme;
    localStorage.setItem('quranVideoTheme', newTheme);
    updateThemeButtonText(newTheme);
    updatePreview(); 
  }
  
  function updateThemeButtonText(theme) {
    const themeIcon = theme === 'light-theme' ? '🌙' : '☀️';
    [themeToggleInitial, themeToggleEditor].forEach(btn => {
        if(btn) btn.textContent = themeIcon;
    });
  }

  // --- API Fetching ---
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
    } finally {
      hideLoading();
    }
  }

  async function handleSurahChange() {
    if (!surahSelect || !currentProject) return;
    showLoading();
    currentProject.surah = surahSelect.value;
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
    if (!selectedSurah) {
        hideLoading();
        return;
    }

    try {
        const surahDetailRes = await axios.get(`${QURAN_API_BASE}/surah/${currentProject.surah}`);
        const numberOfAyahs = surahDetailRes.data.data.numberOfAyahs;

        const ayahs = Array.from({ length: numberOfAyahs }, (_, i) => ({ id: i + 1, name: `آية ${i + 1}` }));
        if(ayahStartSelect) populateSelect(ayahStartSelect, ayahs, 'id', 'name');
        if(ayahEndSelect) populateSelect(ayahEndSelect, ayahs, 'id', 'name');

        if (parseInt(currentProject.ayahStart) > numberOfAyahs) currentProject.ayahStart = '1';
        if (parseInt(currentProject.ayahEnd) > numberOfAyahs) currentProject.ayahEnd = String(numberOfAyahs);
        if (parseInt(currentProject.ayahStart) > parseInt(currentProject.ayahEnd)) currentProject.ayahEnd = currentProject.ayahStart;
        
        if(ayahStartSelect) ayahStartSelect.value = currentProject.ayahStart;
        if(ayahEndSelect) ayahEndSelect.value = currentProject.ayahEnd;

        updateProjectFromUIAndPreview();
    } catch (error) {
        console.error("Error fetching surah details:", error);
        alert("حدث خطأ أثناء تحميل تفاصيل السورة.");
    } finally {
        hideLoading();
    }
  }
  
  function handleAyahRangeChange() {
    if (!ayahStartSelect || !ayahEndSelect) return;
    let start = parseInt(ayahStartSelect.value);
    let end = parseInt(ayahEndSelect.value);
    if (start > end) {
        if (this.id === 'ayah-start-select') { 
            ayahEndSelect.value = start;
        } else { 
            ayahStartSelect.value = end;
        }
    }
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
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item[valueKey];
      option.textContent = item[textKey] + (item.language ? ` (${item.language})` : '');
      selectElement.appendChild(option);
    });
  }
  
  // --- Project State & UI Sync ---
  function updateProjectFromUI() {
    if(!currentProject) currentProject = createNewProjectState(); // Safety check

    if(surahSelect) currentProject.surah = surahSelect.value;
    if(ayahStartSelect) currentProject.ayahStart = ayahStartSelect.value;
    if(ayahEndSelect) currentProject.ayahEnd = ayahEndSelect.value;
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
    if(reciterSelect) reciterSelect.value = currentProject.reciter;
    if(translationSelect) translationSelect.value = currentProject.translation;
    if(fontSelect) fontSelect.value = currentProject.font;
    if(fontSizeSlider) fontSizeSlider.value = currentProject.fontSize;
    if(fontSizeValue) fontSizeValue.textContent = `${currentProject.fontSize}px`;
    if(fontColorPicker) fontColorPicker.value = currentProject.fontColor;
    
    if(ayahBgColorPicker) {
        try {
            let color = tinycolor(currentProject.ayahBgColor);
            ayahBgColorPicker.value = color.toRgbString(); 
        } catch (e) {
            ayahBgColorPicker.value = 'rgba(0,0,0,0.3)'; 
        }
    }

    if(textEffectSelect) textEffectSelect.value = currentProject.textEffect;
    if(delayBetweenAyahsInput) delayBetweenAyahsInput.value = currentProject.delayBetweenAyahs;
    if(resolutionSelect) resolutionSelect.value = currentProject.resolution;
    if(transitionSelect) transitionSelect.value = currentProject.transition;
    if(currentProjectTitleElement) currentProjectTitleElement.textContent = currentProject.name || "مشروع جديد";

    if (currentProject.background) {
        if (currentProject.backgroundType === 'image' || currentProject.backgroundType === 'pexels') {
            const img = new Image();
            img.onload = () => {
                backgroundImage = img;
                updatePreview();
            };
            img.onerror = () => { console.error("Error loading background image from project."); backgroundImage = null; updatePreview(); };
            img.src = currentProject.background;
        } else if (currentProject.backgroundType === 'video') {
            const video = document.createElement('video');
            video.src = currentProject.background;
            video.muted = true;
            video.loop = true;
            video.oncanplay = () => {
                backgroundImage = video;
                video.play().then(() => backgroundVideoIsPlaying = true).catch(e => console.warn("Video autoplay prevented:", e));
                updatePreview();
            };
            video.onerror = () => { console.error("Error loading background video from project."); backgroundImage = null; updatePreview(); };
        }
    } else {
        backgroundImage = null;
    }
    // Ensure Ayah selects are correctly set if surah has changed during load.
    // This is typically handled by fetchInitialData -> handleSurahChange -> updateUIFromProject.
    // But if project is loaded directly, ensure ayahs are populated and selected.
    if (ayahStartSelect && currentProject.surah && currentProject.ayahStart) { // Check if ayahs need re-populating
        const selectedSurahDetails = surahsData.find(s => s.number == currentProject.surah);
        if (selectedSurahDetails && ayahStartSelect.options.length <= 1) { // Options not populated yet or only default
             const ayahs = Array.from({ length: selectedSurahDetails.numberOfAyahs }, (_, i) => ({ id: i + 1, name: `آية ${i + 1}` }));
             populateSelect(ayahStartSelect, ayahs, 'id', 'name');
             populateSelect(ayahEndSelect, ayahs, 'id', 'name');
        }
        ayahStartSelect.value = currentProject.ayahStart;
    }
    if (ayahEndSelect && currentProject.ayahEnd) {
        ayahEndSelect.value = currentProject.ayahEnd;
    }
  }
  
  function updateProjectFromUIAndPreview() {
    updateProjectFromUI();
    updatePreview();
  }

  // --- Background Handling ---
  function handleBackgroundImport(event) {
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
        video.muted = true;
        video.loop = true;
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

  async function fetchAiBackgroundSuggestions() {
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
  async function updatePreview(ayahOverride = null, translationOverride = null, surahTitleOverride = null) {
    if (isRendering || !ctx || !canvas) return;
    isRendering = true;

    // Wrapped in requestAnimationFrame for smoother rendering
    return new Promise(resolve => {
        requestAnimationFrame(async () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (backgroundImage) {
                if (backgroundImage.tagName === 'VIDEO') {
                    if (backgroundVideoIsPlaying && backgroundImage.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) { 
                        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.fillStyle = '#333333';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.textAlign = 'center';
                        if (canvas.width > 0) ctx.fillText("جاري تحميل الفيديو...", canvas.width / 2, canvas.height / 2);
                    }
                } else { 
                    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                }
            } else {
                ctx.fillStyle = '#000000'; 
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
            let currentSurahTitle = surahTitleOverride || (selectedSurah ? selectedSurah.name : (currentProject.surah ? `سورة ${currentProject.surah}`: "اختر سورة"));
            let currentAyahText = ayahOverride || "بسم الله الرحمن الرحيم";
            let currentTranslationText = translationOverride || "";

            if (!ayahOverride && !translationOverride && !surahTitleOverride) { 
                if (selectedSurah && currentProject.ayahStart && currentProject.reciter) {
                     try {
                        const ayahNumGlobal = getGlobalAyahNumber(parseInt(currentProject.surah), parseInt(currentProject.ayahStart));
                        if (ayahNumGlobal) {
                            const response = await axios.get(`${QURAN_API_BASE}/ayah/${ayahNumGlobal}/${currentProject.reciter}`);
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
            ctx.fillStyle = currentProject.fontColor || '#FFFFFF'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top'; 
            const titleYPosition = canvas.height * 0.1;
            if (canvas.width > 0) drawTextWithShadow(currentSurahTitle, canvas.width / 2, titleYPosition, currentProject.fontColor || '#FFFFFF');

            const ayahFontSize = (currentProject.fontSize || 48) * (canvas.width > 0 ? (canvas.width / 1280) : 1); 
            ctx.font = `${ayahFontSize}px ${currentProject.font || "'Amiri Quran', serif"}`;
            ctx.fillStyle = currentProject.fontColor || '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const ayahTextX = canvas.width / 2;
            const ayahTextY = canvas.height / 2; 
            const maxTextWidth = canvas.width * 0.85; 
            
            const ayahBg = currentProject.ayahBgColor || 'rgba(0,0,0,0.3)';
            if (tinycolor(ayahBg).getAlpha() > 0) {
                const lines = wrapText(currentAyahText, maxTextWidth, ctx);
                if (lines.length > 0) {
                    const textMetrics = ctx.measureText(lines[0]); 
                    const lineHeight = (textMetrics.actualBoundingBoxAscent || ayahFontSize) + (textMetrics.actualBoundingBoxDescent || ayahFontSize * 0.2);
                    const totalTextHeight = lineHeight * lines.length;
                    const padding = ayahFontSize * 0.2; 
                    
                    ctx.fillStyle = ayahBg;
                    if (canvas.width > 0) {
                        ctx.fillRect(
                            (canvas.width - maxTextWidth) / 2 - padding, 
                            ayahTextY - totalTextHeight / 2 - padding,
                            maxTextWidth + padding * 2,
                            totalTextHeight + padding * 2
                        );
                    }
                }
            }
            
            if (canvas.width > 0) drawTextWithEffect(currentAyahText, ayahTextX, ayahTextY, maxTextWidth, currentProject.fontColor || '#FFFFFF', currentProject.textEffect || 'none');

            if (currentTranslationText) {
              const translationFontSize = Math.max(18, ayahFontSize * 0.4) * (canvas.width > 0 ? (canvas.width / 1280) : 1);
              ctx.font = `${translationFontSize}px ${currentProject.font || "'Tajawal', sans-serif"}`; 
              ctx.fillStyle = tinycolor(currentProject.fontColor || '#FFFFFF').lighten(20).toString(); 
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom'; 
              const translationYPosition = canvas.height * 0.9; 
              const maxTranslationWidth = canvas.width * 0.8;
              if (canvas.width > 0) drawTextWithEffect(currentTranslationText, canvas.width / 2, translationYPosition, maxTranslationWidth, ctx.fillStyle, 'none'); 
            }
            isRendering = false;
            resolve(); // Resolve the promise after rendering is complete
        });
    });
  }
  
  function drawTextWithShadow(text, x, y, color, shadowColor = 'rgba(0,0,0,0.7)', shadowBlur = 5, shadowOffsetX = 2, shadowOffsetY = 2) {
      if (!ctx || !text) return;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
  }

  function drawTextWithEffect(text, x, y, maxWidth, color, effect) {
    if (!ctx || !text) return;
    ctx.fillStyle = color; 
    const lines = wrapText(text, maxWidth, ctx);
    const fontMatch = ctx.font.match(/(\d+)px/);
    const currentFontSize = fontMatch ? parseFloat(fontMatch[1]) : 20; // Default if not found
    const lineHeight = currentFontSize * 1.5; 
    const totalTextHeight = lines.length * lineHeight;
    let startY = y - totalTextHeight / 2 + lineHeight / 2; 

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;
      drawTextWithShadow(line, x, lineY, color); // Effects like typewriter/fade handled during export for now
    });
  }

  function wrapText(text, maxWidth, context) {
    if (!text || !context || maxWidth <=0) return [];
    // Ensure font is set on context before measuring
    if (!context.font) context.font = "20px sans-serif"; // Default if not set

    const words = String(text).split(' '); // Ensure text is a string
    const lines = [];
    if (words.length === 0) return [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      if (!word) continue; // Skip empty strings if any
      const testLine = currentLine + " " + word;
      try {
          const width = context.measureText(testLine).width;
          if (width < maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
      } catch (e) {
          console.error("Error measuring text in wrapText. Current font:", context.font, "Text:", testLine, e);
          // Fallback: push current line and word, or handle error differently
          lines.push(currentLine);
          currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
  
  function getGlobalAyahNumber(surahNumber, ayahInSurah) {
    if (!surahsData || surahsData.length === 0) return null; 
    let globalNumber = 0;
    for (let i = 0; i < surahNumber - 1; i++) {
        if (surahsData[i]) { 
            globalNumber += surahsData[i].numberOfAyahs;
        } else {
            console.warn(`Surah data for index ${i} (Surah ${i+1}) not found.`);
            return null; 
        }
    }
    return globalNumber + ayahInSurah;
  }

  // --- Audio Preview ---
  async function toggleAudioPreview() {
    if (audioPreviewState.isPlaying) {
      pauseAudioPreview();
    } else {
      await startAudioPreview();
    }
  }

  async function startAudioPreview() {
    if (!currentProject || !currentProject.surah || !currentProject.ayahStart || !currentProject.ayahEnd || !currentProject.reciter) {
      alert("يرجى اختيار السورة ونطاق الآيات والقارئ أولاً.");
      return;
    }

    showLoading();
    audioPreviewState.ayahsToPlay = [];
    const start = parseInt(currentProject.ayahStart);
    const end = parseInt(currentProject.ayahEnd);
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
    const surahName = selectedSurah ? selectedSurah.name : "";

    try {
      for (let i = start; i <= end; i++) {
        const ayahGlobalNumber = getGlobalAyahNumber(parseInt(currentProject.surah), i);
        if (!ayahGlobalNumber) {
            console.error(`Could not get global ayah number for Surah ${currentProject.surah}, Ayah ${i}`);
            continue;
        }

        const ayahAudioUrl = `${QURAN_API_BASE}/ayah/${ayahGlobalNumber}/${currentProject.reciter}`;
        const ayahTextUrl = `${QURAN_API_BASE}/ayah/${ayahGlobalNumber}/quran-uthmani`; 
        
        let translationText = "";
        if (currentProject.translation) {
          const ayahTranslationUrl = `${QURAN_API_BASE}/ayah/${ayahGlobalNumber}/${currentProject.translation}`;
          try {
            const transRes = await axios.get(ayahTranslationUrl);
            translationText = transRes.data.data.text;
          } catch (err) {
            console.warn(`Could not fetch translation for ayah ${ayahGlobalNumber}: ${err}`);
          }
        }
        
        const [audioRes, textRes] = await Promise.all([
            axios.get(ayahAudioUrl),
            axios.get(ayahTextUrl)
        ]);

        audioPreviewState.ayahsToPlay.push({
          text: textRes.data.data.text,
          audioUrl: audioRes.data.data.audio,
          translation: translationText,
          surahName: surahName,
          ayahInSurah: i
        });
      }

      if (audioPreviewState.ayahsToPlay.length > 0) {
        audioPreviewState.currentAyahIndex = 0;
        audioPreviewState.isPlaying = true;
        if(playPauseAudioPreviewBtn) playPauseAudioPreviewBtn.innerHTML = '<i class="fas fa-pause-circle"></i> إيقاف مؤقت';
        if(stopAudioPreviewBtn) stopAudioPreviewBtn.style.display = 'inline-block';
        playCurrentAyahAudio();
      } else {
        alert("لم يتم العثور على آيات لتشغيلها.");
        audioPreviewState.isPlaying = false;
      }
    } catch (error) {
      console.error("Error preparing audio preview:", error);
      alert("حدث خطأ أثناء تجهيز معاينة الصوت.");
      audioPreviewState.isPlaying = false;
    } finally {
      hideLoading();
    }
  }

  function pauseAudioPreview() {
    audioPreviewState.isPlaying = false;
    if(ayahAudioPlayer) ayahAudioPlayer.pause();
    if(playPauseAudioPreviewBtn) playPauseAudioPreviewBtn.innerHTML = '<i class="fas fa-play-circle"></i> متابعة التلاوة';
  }

  function stopAudioPreview() {
    audioPreviewState.isPlaying = false;
    if(audioPreviewState.currentAudio) { // This was never used, ayahAudioPlayer is the one
        audioPreviewState.currentAudio.pause();
        audioPreviewState.currentAudio.currentTime = 0;
    }
    if(ayahAudioPlayer) {
        ayahAudioPlayer.pause();
        ayahAudioPlayer.src = ""; 
    }
    audioPreviewState.currentAyahIndex = 0;
    if(playPauseAudioPreviewBtn) playPauseAudioPreviewBtn.innerHTML = '<i class="fas fa-play-circle"></i> تشغيل معاينة الصوت';
    if(stopAudioPreviewBtn) stopAudioPreviewBtn.style.display = 'none';
    if(audioPreviewStatus) audioPreviewStatus.textContent = "";
    updatePreview(); 
  }
  
  async function playCurrentAyahAudio() {
    if (!audioPreviewState.isPlaying || audioPreviewState.currentAyahIndex >= audioPreviewState.ayahsToPlay.length) {
      if (audioPreviewState.currentAyahIndex >= audioPreviewState.ayahsToPlay.length && audioPreviewState.ayahsToPlay.length > 0) { 
          stopAudioPreview(); 
          if(audioPreviewStatus) audioPreviewStatus.textContent = "انتهت التلاوة";
      }
      return;
    }

    const currentAyahData = audioPreviewState.ayahsToPlay[audioPreviewState.currentAyahIndex];
    
    await updatePreview(currentAyahData.text, currentAyahData.translation, `${currentAyahData.surahName} - آية ${currentAyahData.ayahInSurah}`);
    
    if(audioPreviewStatus) audioPreviewStatus.textContent = `جاري تشغيل: ${currentAyahData.surahName} - آية ${currentAyahData.ayahInSurah} (${audioPreviewState.currentAyahIndex + 1}/${audioPreviewState.ayahsToPlay.length})`;
    
    if(ayahAudioPlayer) {
        ayahAudioPlayer.src = currentAyahData.audioUrl;
        ayahAudioPlayer.play().catch(e => {
            console.error("Error playing audio:", e);
            alert("لا يمكن تشغيل الصوت. قد يتطلب الأمر تفاعلاً من المستخدم أولاً.");
            stopAudioPreview();
        });
    }
  }

  function handleAudioAyahEnded() {
    audioPreviewState.currentAyahIndex++;
    if (audioPreviewState.isPlaying) {
      const delay = (currentProject.delayBetweenAyahs || 0.5) * 1000; 
      setTimeout(playCurrentAyahAudio, delay);
    }
  }
  
  function handleAudioError(e) {
      console.error("Audio player error:", e);
      if(audioPreviewStatus && audioPreviewState.ayahsToPlay[audioPreviewState.currentAyahIndex]) {
        audioPreviewStatus.textContent = `خطأ في تشغيل الصوت للآية ${audioPreviewState.ayahsToPlay[audioPreviewState.currentAyahIndex]?.ayahInSurah}`;
      }
      stopAudioPreview();
      alert("حدث خطأ أثناء تشغيل الصوت. قد يكون الملف الصوتي غير متوفر أو هناك مشكلة في الشبكة.");
  }

  // --- Project Persistence (LocalStorage) ---
  function saveProject() {
    if (!currentProject) {
        alert("لا يوجد مشروع حالي لحفظه.");
        return;
    }
    const projectName = prompt("أدخل اسم المشروع:", currentProject.name || `مشروع ${new Date().toLocaleDateString()}`);
    if (projectName === null) return; 

    currentProject.name = projectName.trim() || `مشروع ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    updateProjectFromUI(); 

    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    
    if (loadedProjectId) { 
        const projectIndex = projects.findIndex(p => p.id === loadedProjectId);
        if (projectIndex > -1) {
            projects[projectIndex] = { ...currentProject, id: loadedProjectId }; 
        } else { 
            projects.push(currentProject); 
        }
    } else { 
        projects.push(currentProject);
    }
    
    localStorage.setItem('quranVideoProjects', JSON.stringify(projects));
    alert(`تم حفظ المشروع "${currentProject.name}"`);
    loadedProjectId = currentProject.id; 
    if(currentProjectTitleElement) currentProjectTitleElement.textContent = currentProject.name;
    loadProjects(); 
  }

  function loadProjects() {
    if (!projectsList || !noProjectsMessage) return;
    const projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    projectsList.innerHTML = '';
    if (projects.length === 0) {
      noProjectsMessage.style.display = 'block';
      return;
    }
    noProjectsMessage.style.display = 'none';
    
    projects.sort((a, b) => b.lastModified - a.lastModified); 

    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.dataset.projectId = project.id;

      const surahName = surahsData.find(s => s.number == project.surah)?.name || `سورة ${project.surah}`;
      const reciterName = recitersData.find(r => r.identifier === project.reciter)?.englishName || project.reciter;

      card.innerHTML = `
        <h3>${project.name || 'مشروع بدون اسم'}</h3>
        <div class="project-meta">
          <p><strong>السورة:</strong> ${surahName}</p>
          <p><strong>الآيات:</strong> ${project.ayahStart} إلى ${project.ayahEnd}</p>
          <p><strong>القارئ:</strong> ${reciterName}</p>
          <p><small>آخر تعديل: ${new Date(project.lastModified).toLocaleString()}</small></p>
        </div>
        <div class="project-actions">
          <button class="load-btn"><i class="fas fa-folder-open"></i> فتح</button>
          <button class="delete-btn"><i class="fas fa-trash-alt"></i> حذف</button>
        </div>
      `;
      card.querySelector('.load-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        loadSpecificProject(project.id);
      });
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProject(project.id);
      });
      projectsList.appendChild(card);
    });
  }

  async function loadSpecificProject(projectId) {
    const projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad) {
      currentProject = { ...createNewProjectState(), ...projectToLoad }; 
      loadedProjectId = projectId;
      showLoading(); 
      try {
        await fetchInitialData(); // This now correctly waits and then updates UI
        // Ensure UI reflects the loaded project fully, especially dynamic parts like Ayah selects
        updateUIFromProject(); // Call again to ensure everything is synced after data load
        await updatePreview();  // updatePreview is async now
        showScreen('editor');
        if(currentProjectTitleElement) currentProjectTitleElement.textContent = currentProject.name;
      } catch (err) {
          console.error("Error during project load process:", err);
          alert("خطأ أثناء تحميل المشروع.");
          resetToNewProject(); 
      } finally {
          hideLoading();
      }
    }
  }

  function deleteProject(projectId) {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذا المشروع؟")) return;
    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('quranVideoProjects', JSON.stringify(projects));
    loadProjects(); 
    if (loadedProjectId === projectId) { 
        resetToNewProject();
    }
  }

  // --- Video Export (CCapture.js) ---
  async function exportVideo() {
    if (!currentProject || !currentProject.surah || !currentProject.ayahStart || !currentProject.ayahEnd) {
      alert("يرجى اختيار السورة ونطاق الآيات أولاً.");
      return;
    }
    
    if (!confirm("سيتم تصدير الفيديو بدون صوت حاليًا. هل ترغب في المتابعة؟")) {
        return;
    }

    showLoading("جاري تجهيز التصدير...");
    if(exportProgressDiv) exportProgressDiv.style.display = 'block';
    if(exportProgressBar) exportProgressBar.value = 0;
    if(exportProgressText) exportProgressText.textContent = '0%';

    const [exportWidth, exportHeight] = currentProject.resolution.split('x').map(Number);
    const originalCanvasWidth = canvas ? canvas.width : 1280; // Fallback
    const originalCanvasHeight = canvas ? canvas.height : 720; // Fallback

    if(canvas) {
        canvas.width = exportWidth;
        canvas.height = exportHeight;
    } else {
        console.error("Canvas element not found for export.");
        hideLoading();
        if(exportProgressDiv) exportProgressDiv.style.display = 'none';
        return;
    }


    capturer = new CCapture({
      format: 'webm', 
      framerate: 25, 
      verbose: false,
      quality: 90, 
      name: `QuranVideo-${(currentProject.name || 'project').replace(/\s+/g, '_')}`
    });

    const ayahsToRender = [];
    const startAyah = parseInt(currentProject.ayahStart);
    const endAyah = parseInt(currentProject.ayahEnd);
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
    const surahName = selectedSurah ? selectedSurah.name : "";

    try {
      for (let i = startAyah; i <= endAyah; i++) {
        const ayahGlobalNum = getGlobalAyahNumber(parseInt(currentProject.surah), i);
        if (!ayahGlobalNum) continue;

        const textEdition = 'quran-uthmani'; 
        const ayahTextUrl = `${QURAN_API_BASE}/ayah/${ayahGlobalNum}/${textEdition}`;
        const textRes = await axios.get(ayahTextUrl);
        let translationText = "";
        if (currentProject.translation) {
          const transRes = await axios.get(`${QURAN_API_BASE}/ayah/${ayahGlobalNum}/${currentProject.translation}`);
          translationText = transRes.data.data.text;
        }
        ayahsToRender.push({ 
            text: textRes.data.data.text, 
            translation: translationText, 
            surahName: surahName,
            ayahInSurah: i 
        });
      }
    } catch (error) {
      console.error("Error fetching Ayah data for export:", error);
      alert("حدث خطأ أثناء جلب بيانات الآيات للتصدير.");
      hideLoading();
      if(exportProgressDiv) exportProgressDiv.style.display = 'none';
      if(canvas) {
        canvas.width = originalCanvasWidth;
        canvas.height = originalCanvasHeight;
      }
      await updatePreview();
      return;
    }
    
    if (ayahsToRender.length === 0) {
        alert("لا توجد آيات للتصدير.");
        hideLoading();
        if(exportProgressDiv) exportProgressDiv.style.display = 'none';
        if(canvas) {
            canvas.width = originalCanvasWidth;
            canvas.height = originalCanvasHeight;
        }
        await updatePreview();
        return;
    }

    hideLoading(); 
    capturer.start();

    const delayPerAyah = (currentProject.delayBetweenAyahs + 1) * 1000; 
    const framesPerAyah = Math.ceil(delayPerAyah / (1000 / capturer.framerate));
    let totalFramesRendered = 0;
    const totalFramesToRender = ayahsToRender.length * framesPerAyah;

    for (let i = 0; i < ayahsToRender.length; i++) {
      const ayahData = ayahsToRender[i];
      const surahTitleForAyah = `${ayahData.surahName} - آية ${ayahData.ayahInSurah}`;
      
      const fadeInFrames = currentProject.transition === 'fade' ? Math.floor(capturer.framerate / 2) : 0; 
      const holdFrames = framesPerAyah - (2 * fadeInFrames);
      const fadeOutFrames = fadeInFrames;

      for (let f = 0; f < fadeInFrames; f++) {
        ctx.globalAlpha = f / fadeInFrames;
        await updatePreview(ayahData.text, ayahData.translation, surahTitleForAyah); 
        capturer.capture(canvas);
        totalFramesRendered++;
        updateExportProgress(totalFramesRendered, totalFramesToRender);
      }
      ctx.globalAlpha = 1; 

      for (let f = 0; f < holdFrames; f++) {
        await updatePreview(ayahData.text, ayahData.translation, surahTitleForAyah);
        capturer.capture(canvas);
        totalFramesRendered++;
        updateExportProgress(totalFramesRendered, totalFramesToRender);
      }
      
      if (currentProject.transition === 'fade' && (i < ayahsToRender.length -1 || ayahsToRender.length === 1)) {
          for (let f = 0; f < fadeOutFrames; f++) {
            ctx.globalAlpha = 1 - (f / fadeOutFrames);
            await updatePreview(ayahData.text, ayahData.translation, surahTitleForAyah);
            capturer.capture(canvas);
            totalFramesRendered++;
            updateExportProgress(totalFramesRendered, totalFramesToRender);
          }
      }
       ctx.globalAlpha = 1; 
    }

    capturer.stop();
    capturer.save();

    if(exportProgressText) exportProgressText.textContent = 'اكتمل التصدير!';
    setTimeout(() => {
        if(exportProgressDiv) exportProgressDiv.style.display = 'none';
    }, 3000);
    
    if(canvas) {
        canvas.width = originalCanvasWidth;
        canvas.height = originalCanvasHeight;
    }
    await updatePreview();
  }
  
  function updateExportProgress(currentFrame, totalFrames) {
    const percent = Math.round((currentFrame / totalFrames) * 100);
    if(exportProgressBar) exportProgressBar.value = percent;
    if(exportProgressText) exportProgressText.textContent = `${percent}%`;
  }

  // --- Utility Functions ---
  function showLoading(message = null) {
    if (message) {
        // console.log("Loading:", message); // Removed for mobile focus
    }
    if(loadingSpinner) loadingSpinner.style.display = 'flex';
  }

  function hideLoading() {
    if(loadingSpinner) loadingSpinner.style.display = 'none';
  }

  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // --- Start the app ---
  init();
});
