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
    goToEditorBtn.addEventListener('click', () => showScreen('editor'));
    backToInitialScreenBtn.addEventListener('click', () => {
      stopAudioPreview(); // Stop audio if playing
      showScreen('initial');
      loadProjects(); // Refresh project list
      resetToNewProject();
    });

    [themeToggleInitial, themeToggleEditor].forEach(btn => btn.addEventListener('click', toggleTheme));

    surahSelect.addEventListener('change', handleSurahChange);
    ayahStartSelect.addEventListener('change', handleAyahRangeChange);
    ayahEndSelect.addEventListener('change', handleAyahRangeChange);
    [reciterSelect, translationSelect].forEach(el => el.addEventListener('change', updateProjectFromUIAndPreview));

    fontSelect.addEventListener('change', updateProjectFromUIAndPreview);
    fontSizeSlider.addEventListener('input', () => {
      fontSizeValue.textContent = `${fontSizeSlider.value}px`;
      updateProjectFromUIAndPreview();
    });
    [fontColorPicker, ayahBgColorPicker].forEach(el => el.addEventListener('input', debounce(updateProjectFromUIAndPreview, 200)));
    textEffectSelect.addEventListener('change', updateProjectFromUIAndPreview);
    
    importBackground.addEventListener('change', handleBackgroundImport);
    applyAiBgBtn.addEventListener('click', fetchAiBackgroundSuggestions);
    
    delayBetweenAyahsInput.addEventListener('change', updateProjectFromUIAndPreview);
    resolutionSelect.addEventListener('change', () => {
        updateProjectFromUIAndPreview();
        const [width, height] = currentProject.resolution.split('x').map(Number);
        canvas.width = width;
        canvas.height = height;
        updatePreview(); // Re-render with new resolution
    });
    transitionSelect.addEventListener('change', updateProjectFromUIAndPreview);
    exportBtn.addEventListener('click', exportVideo);

    saveProjectBtn.addEventListener('click', saveProject);

    // Toolbar tabs
    document.querySelectorAll('.toolbar-tab-button').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.toolbar-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.toolbar-controls').forEach(tc => tc.style.display = 'none');
        
        button.parentElement.classList.add('active');
        const targetId = button.dataset.target;
        document.getElementById(targetId).style.display = 'grid'; // Or 'flex' if preferred
      });
    });
     // Activate first tab by default
    document.querySelector('.toolbar-tab-button[data-target="quran-controls"]').click();

    playPauseAudioPreviewBtn.addEventListener('click', toggleAudioPreview);
    stopAudioPreviewBtn.addEventListener('click', stopAudioPreview);
    ayahAudioPlayer.addEventListener('ended', handleAudioAyahEnded);
    ayahAudioPlayer.addEventListener('error', handleAudioError);

  }

  // --- Screen Navigation ---
  function showScreen(screenName) {
    initialScreen.style.display = screenName === 'initial' ? 'flex' : 'none';
    editorScreen.style.display = screenName === 'editor' ? 'flex' : 'none';
    if (screenName === 'editor' && !loadedProjectId) {
        currentProjectTitleElement.textContent = "مشروع جديد";
    }
  }
  
  function resetToNewProject() {
    currentProject = createNewProjectState();
    loadedProjectId = null;
    updateUIFromProject();
    setDefaultCanvas(); // Reset canvas to default state
    backgroundImage = null; // Clear background image/video
    updatePreview();
    currentProjectTitleElement.textContent = "مشروع جديد";
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
    updatePreview(); // Re-render with new theme colors potentially
  }
  
  function updateThemeButtonText(theme) {
    const text = theme === 'light-theme' ? ' darkMode 🌙' : ' lightMode ☀️';
    [themeToggleInitial, themeToggleEditor].forEach(btn => btn.textContent = text.includes('🌙') ? '🌙' : '☀️');
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

      populateSelect(surahSelect, surahsData, 'number', 'name', 'اختر سورة');
      populateSelect(reciterSelect, recitersData, 'identifier', 'englishName', 'اختر قارئ');
      populateSelect(translationSelect, translationsData, 'identifier', 'englishName', 'بدون ترجمة', true);
      
      // Set initial values from currentProject (could be default or loaded)
      surahSelect.value = currentProject.surah;
      await handleSurahChange(); // This will populate Ayah selects and trigger UI update
      reciterSelect.value = currentProject.reciter;
      translationSelect.value = currentProject.translation;

      updateUIFromProject(); // Ensure rest of UI matches project state
      
    } catch (error) {
      console.error("Error fetching initial data:", error);
      alert("حدث خطأ أثناء تحميل البيانات الأساسية. يرجى التحقق من اتصالك بالإنترنت.");
    } finally {
      hideLoading();
    }
  }

  async function handleSurahChange() {
    showLoading();
    currentProject.surah = surahSelect.value;
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
    if (!selectedSurah) {
        hideLoading();
        return;
    }

    try {
        // Fetch the full surah data to get number of ayahs
        const surahDetailRes = await axios.get(`${QURAN_API_BASE}/surah/${currentProject.surah}`);
        const numberOfAyahs = surahDetailRes.data.data.numberOfAyahs;

        const ayahs = Array.from({ length: numberOfAyahs }, (_, i) => ({ id: i + 1, name: `آية ${i + 1}` }));
        populateSelect(ayahStartSelect, ayahs, 'id', 'name');
        populateSelect(ayahEndSelect, ayahs, 'id', 'name');

        // Auto-adjust Ayah range if needed
        if (parseInt(currentProject.ayahStart) > numberOfAyahs) currentProject.ayahStart = '1';
        if (parseInt(currentProject.ayahEnd) > numberOfAyahs) currentProject.ayahEnd = String(numberOfAyahs);
        if (parseInt(currentProject.ayahStart) > parseInt(currentProject.ayahEnd)) currentProject.ayahEnd = currentProject.ayahStart;
        
        ayahStartSelect.value = currentProject.ayahStart;
        ayahEndSelect.value = currentProject.ayahEnd;

        updateProjectFromUIAndPreview();
    } catch (error) {
        console.error("Error fetching surah details:", error);
        alert("حدث خطأ أثناء تحميل تفاصيل السورة.");
    } finally {
        hideLoading();
    }
  }
  
  function handleAyahRangeChange() {
    let start = parseInt(ayahStartSelect.value);
    let end = parseInt(ayahEndSelect.value);
    if (start > end) {
        if (this.id === 'ayah-start-select') { // If start ayah changed and became > end
            ayahEndSelect.value = start;
        } else { // If end ayah changed and became < start
            ayahStartSelect.value = end;
        }
    }
    updateProjectFromUIAndPreview();
  }

  function populateSelect(selectElement, data, valueKey, textKey, defaultOptionText = null, addNoneOption = false) {
    selectElement.innerHTML = '';
    if (defaultOptionText) {
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = defaultOptionText;
      if (addNoneOption && defaultOptionText === "بدون ترجمة") defaultOpt.value = ""; // Specific for translation
      else if (addNoneOption) defaultOpt.value = "none";
      selectElement.appendChild(defaultOpt);
    }
    if (addNoneOption && !defaultOptionText) { // If explicit none option without a default placeholder like "اختر..."
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
    currentProject.surah = surahSelect.value;
    currentProject.ayahStart = ayahStartSelect.value;
    currentProject.ayahEnd = ayahEndSelect.value;
    currentProject.reciter = reciterSelect.value;
    currentProject.translation = translationSelect.value;
    currentProject.font = fontSelect.value;
    currentProject.fontSize = parseInt(fontSizeSlider.value);
    currentProject.fontColor = fontColorPicker.value;
    currentProject.ayahBgColor = ayahBgColorPicker.value;
    currentProject.textEffect = textEffectSelect.value;
    currentProject.delayBetweenAyahs = parseFloat(delayBetweenAyahsInput.value);
    currentProject.resolution = resolutionSelect.value;
    currentProject.transition = transitionSelect.value;
    currentProject.lastModified = Date.now();
  }

  function updateUIFromProject() {
    surahSelect.value = currentProject.surah;
    // Ayah selects are populated dynamically, ensure values are set after population
    // This will be handled by handleSurahChange and then setting values
    
    reciterSelect.value = currentProject.reciter;
    translationSelect.value = currentProject.translation;
    fontSelect.value = currentProject.font;
    fontSizeSlider.value = currentProject.fontSize;
    fontSizeValue.textContent = `${currentProject.fontSize}px`;
    fontColorPicker.value = currentProject.fontColor;
    ayahBgColorPicker.value = currentProject.ayahBgColor; // Needs to handle potential TinyColor object
    
    // Ensure ayahBgColorPicker.value is a hex string if it's a TinyColor object
    try {
        let color = tinycolor(currentProject.ayahBgColor);
        ayahBgColorPicker.value = color.toRgbString(); // Or toHexString() if alpha is not needed
    } catch (e) {
        ayahBgColorPicker.value = 'rgba(0,0,0,0.3)'; // Default fallback
    }


    textEffectSelect.value = currentProject.textEffect;
    delayBetweenAyahsInput.value = currentProject.delayBetweenAyahs;
    resolutionSelect.value = currentProject.resolution;
    transitionSelect.value = currentProject.transition;
    currentProjectTitleElement.textContent = currentProject.name || "مشروع جديد";


    // Load background if it exists
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
    const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
    if (!selectedSurah) {
      alert("يرجى اختيار سورة أولاً.");
      return;
    }
    const query = selectedSurah.englishName.replace("Al-", "").replace("Surat ", "").trim(); // Simple query from Surah name
    
    aiBgSuggestionsDiv.innerHTML = '';
    aiBgSuggestionsLoader.style.display = 'block';
    showLoading();

    try {
      const response = await axios.get(`${PEXELS_API_BASE}/search`, {
        headers: { Authorization: PEXELS_API_KEY },
        params: { query: query, per_page: 5, orientation: 'landscape' }
      });
      
      if (response.data.photos.length === 0) {
          aiBgSuggestionsDiv.innerHTML = '<p>لم يتم العثور على خلفيات مقترحة.</p>';
          return;
      }

      response.data.photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo.src.medium;
        img.alt = photo.alt || `Background for ${query}`;
        img.title = photo.alt || `Background for ${query}`;
        img.addEventListener('click', () => {
          // Remove selection from other AI images
          document.querySelectorAll('#ai-bg-suggestions img.selected-ai-bg').forEach(el => el.classList.remove('selected-ai-bg'));
          img.classList.add('selected-ai-bg');

          const bgImg = new Image();
          bgImg.crossOrigin = "anonymous"; // Important for Pexels
          bgImg.onload = () => {
            backgroundImage = bgImg;
            currentProject.background = photo.src.large2x; // Store high-res for actual use
            currentProject.backgroundType = 'pexels';
            updatePreview();
          };
          bgImg.onerror = () => alert("خطأ في تحميل الصورة المقترحة.");
          bgImg.src = photo.src.large2x; // Use a larger version for the canvas
        });
        aiBgSuggestionsDiv.appendChild(img);
      });
    } catch (error) {
      console.error("Error fetching Pexels suggestions:", error);
      aiBgSuggestionsDiv.innerHTML = '<p>خطأ في جلب الاقتراحات. تحقق من مفتاح API.</p>';
      if (error.response && error.response.status === 401) {
        alert("خطأ في المصادقة مع Pexels. يرجى التحقق من مفتاح API الخاص بك.");
      } else {
        alert("حدث خطأ أثناء البحث عن خلفيات مقترحة.");
      }
    } finally {
      hideLoading();
      aiBgSuggestionsLoader.style.display = 'none';
    }
  }

  // --- Canvas Drawing ---
  function updatePreview(ayahOverride = null, translationOverride = null, surahTitleOverride = null) {
    if (isRendering) return;
    isRendering = true;

    requestAnimationFrame(async () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Background
        if (backgroundImage) {
            if (backgroundImage.tagName === 'VIDEO') {
                if (backgroundVideoIsPlaying && backgroundImage.readyState >= HTMLMediaElement.HAVE_ wystarczająco_DANYCH) { // HAVE_CURRENT_DATA or more
                    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                } else {
                    // Fallback if video not playing or not ready
                    ctx.fillStyle = '#333333';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.textAlign = 'center';
                    ctx.fillText("جاري تحميل الفيديو...", canvas.width / 2, canvas.height / 2);
                }
            } else { // Image
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            }
        } else {
            ctx.fillStyle = '#000000'; // Default black background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 2. Prepare text (can be from project state or overridden for audio preview)
        const selectedSurah = surahsData.find(s => s.number == currentProject.surah);
        let currentSurahTitle = surahTitleOverride || (selectedSurah ? selectedSurah.name : "اختر سورة");
        let currentAyahText = ayahOverride || "بسم الله الرحمن الرحيم";
        let currentTranslationText = translationOverride || "";

        if (!ayahOverride && !translationOverride && !surahTitleOverride) { // Normal preview update (not audio-driven)
            if (selectedSurah && currentProject.ayahStart) {
                // For normal preview, we might want to show the first Ayah of the range
                // Or simply a placeholder if no data is fetched yet.
                // For now, let's assume data for a single Ayah will be fetched if needed for display.
                // This part might need refinement if we want to display *all* ayahs of the range
                // concatenated, or just the first one. Let's keep it simple for now.
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
                    console.warn("Could not fetch specific ayah for preview text:", e);
                }
            }
        }
        
        // Update HTML overlay (for reference, not for export)
        previewSurahTitle.textContent = currentSurahTitle;
        previewAyahText.textContent = currentAyahText;
        previewTranslationText.textContent = currentTranslationText;
        
        // 3. Draw Surah Title on Canvas
        const titleFontSize = Math.min(canvas.width / 20, canvas.height / 15);
        ctx.font = `bold ${titleFontSize}px ${currentProject.font}`; // Use selected font for title too or a UI font
        ctx.fillStyle = currentProject.fontColor; // Use main font color for title or a dedicated one
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top'; // Anchor from top for easier Y positioning
        const titleYPosition = canvas.height * 0.1;
        drawTextWithShadow(currentSurahTitle, canvas.width / 2, titleYPosition, currentProject.fontColor);


        // 4. Draw Ayah Text on Canvas
        const ayahFontSize = currentProject.fontSize * (canvas.width / 1280); // Scale font size with canvas width
        ctx.font = `${ayahFontSize}px ${currentProject.font}`;
        ctx.fillStyle = currentProject.fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const ayahTextX = canvas.width / 2;
        const ayahTextY = canvas.height / 2; // Center Ayah text vertically
        const maxTextWidth = canvas.width * 0.85; // Max width for text block
        
        // Apply Ayah background color
        if (tinycolor(currentProject.ayahBgColor).getAlpha() > 0) {
            const lines = wrapText(currentAyahText, maxTextWidth, ctx);
            if (lines.length > 0) {
                const textMetrics = ctx.measureText(lines[0]); // Use first line for typical height
                const lineHeight = (textMetrics.actualBoundingBoxAscent || ayahFontSize) + (textMetrics.actualBoundingBoxDescent || ayahFontSize * 0.2);
                const totalTextHeight = lineHeight * lines.length;
                const padding = ayahFontSize * 0.2; // Padding around text
                
                ctx.fillStyle = currentProject.ayahBgColor;
                ctx.fillRect(
                    (canvas.width - maxTextWidth) / 2 - padding, 
                    ayahTextY - totalTextHeight / 2 - padding,
                    maxTextWidth + padding * 2,
                    totalTextHeight + padding * 2
                );
            }
        }
        
        // Draw actual Ayah text
        drawTextWithEffect(currentAyahText, ayahTextX, ayahTextY, maxTextWidth, currentProject.fontColor, currentProject.textEffect);


        // 5. Draw Translation Text on Canvas (if any)
        if (currentTranslationText) {
          const translationFontSize = Math.max(18, ayahFontSize * 0.4) * (canvas.width / 1280);
          ctx.font = `${translationFontSize}px ${currentProject.font}`; // Or a dedicated translation font
          ctx.fillStyle = tinycolor(currentProject.fontColor).lighten(20).toString(); // Lighter color for translation
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom'; // Anchor from bottom for easier Y positioning
          const translationYPosition = canvas.height * 0.9; // Position towards bottom
          const maxTranslationWidth = canvas.width * 0.8;
          drawTextWithEffect(currentTranslationText, canvas.width / 2, translationYPosition, maxTranslationWidth, ctx.fillStyle, 'none'); // No effect for translation usually
        }
        isRendering = false;
    });
  }
  
  function drawTextWithShadow(text, x, y, color, shadowColor = 'rgba(0,0,0,0.7)', shadowBlur = 5, shadowOffsetX = 2, shadowOffsetY = 2) {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
  }

  function drawTextWithEffect(text, x, y, maxWidth, color, effect) {
    ctx.fillStyle = color; // Set fillStyle before measuring or drawing
    const lines = wrapText(text, maxWidth, ctx);
    const lineHeight = parseFloat(ctx.font.match(/(\d+)px/)[1]) * 1.5; // Approximate line height
    const totalTextHeight = lines.length * lineHeight;
    let startY = y - totalTextHeight / 2 + lineHeight / 2; // Adjust startY to center block

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;
      if (effect === 'typewriter') {
        // Simple typewriter: draw all at once, but could be animated char by char in export
        drawTextWithShadow(line, x, lineY, color);
      } else if (effect === 'fade') {
        // Simple fade: draw all at once, could be animated in export
         drawTextWithShadow(line, x, lineY, color);
      } else { // none
         drawTextWithShadow(line, x, lineY, color);
      }
    });
  }

  function wrapText(text, maxWidth, context) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = context.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
  
  function getGlobalAyahNumber(surahNumber, ayahInSurah) {
    if (!surahsData || surahsData.length === 0) return null; // Ensure surahsData is loaded
    let globalNumber = 0;
    for (let i = 0; i < surahNumber - 1; i++) {
        if (surahsData[i]) { // Check if surah data exists at this index
            globalNumber += surahsData[i].numberOfAyahs;
        } else {
            console.warn(`Surah data for index ${i} (Surah ${i+1}) not found.`);
            // Decide how to handle this: return null, or skip, or throw error
            // For now, let's assume this might happen if surahsData isn't fully populated yet
            // or if surahNumber is out of expected bounds.
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
    if (!currentProject.surah || !currentProject.ayahStart || !currentProject.ayahEnd || !currentProject.reciter) {
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
        const ayahTextUrl = `${QURAN_API_BASE}/ayah/${ayahGlobalNumber}/quran-uthmani`; // Always use Uthmani for text
        
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
        playPauseAudioPreviewBtn.innerHTML = '<i class="fas fa-pause-circle"></i> إيقاف مؤقت';
        stopAudioPreviewBtn.style.display = 'inline-block';
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
    ayahAudioPlayer.pause();
    playPauseAudioPreviewBtn.innerHTML = '<i class="fas fa-play-circle"></i> متابعة التلاوة';
  }

  function stopAudioPreview() {
    audioPreviewState.isPlaying = false;
    if(audioPreviewState.currentAudio) {
        audioPreviewState.currentAudio.pause();
        audioPreviewState.currentAudio.currentTime = 0;
    }
    ayahAudioPlayer.pause();
    ayahAudioPlayer.src = ""; // Clear source
    audioPreviewState.currentAyahIndex = 0;
    playPauseAudioPreviewBtn.innerHTML = '<i class="fas fa-play-circle"></i> تشغيل معاينة الصوت';
    stopAudioPreviewBtn.style.display = 'none';
    audioPreviewStatus.textContent = "";
    updatePreview(); // Reset preview to default based on selections
  }
  
  function playCurrentAyahAudio() {
    if (!audioPreviewState.isPlaying || audioPreviewState.currentAyahIndex >= audioPreviewState.ayahsToPlay.length) {
      if (audioPreviewState.currentAyahIndex >= audioPreviewState.ayahsToPlay.length && audioPreviewState.ayahsToPlay.length > 0) { // Finished all ayahs
          stopAudioPreview(); // Or some "finished" state
          audioPreviewStatus.textContent = "انتهت التلاوة";
      }
      return;
    }

    const currentAyahData = audioPreviewState.ayahsToPlay[audioPreviewState.currentAyahIndex];
    
    // Update visual preview
    updatePreview(currentAyahData.text, currentAyahData.translation, `${currentAyahData.surahName} - آية ${currentAyahData.ayahInSurah}`);
    
    audioPreviewStatus.textContent = `جاري تشغيل: ${currentAyahData.surahName} - آية ${currentAyahData.ayahInSurah} (${audioPreviewState.currentAyahIndex + 1}/${audioPreviewState.ayahsToPlay.length})`;
    
    ayahAudioPlayer.src = currentAyahData.audioUrl;
    ayahAudioPlayer.play().catch(e => {
        console.error("Error playing audio:", e);
        alert("لا يمكن تشغيل الصوت. قد يتطلب الأمر تفاعلاً من المستخدم أولاً.");
        stopAudioPreview();
    });
  }

  function handleAudioAyahEnded() {
    audioPreviewState.currentAyahIndex++;
    if (audioPreviewState.isPlaying) {
      // Optional: add delay from currentProject.delayBetweenAyahs
      const delay = (currentProject.delayBetweenAyahs || 0.5) * 1000; 
      setTimeout(playCurrentAyahAudio, delay);
    }
  }
  
  function handleAudioError(e) {
      console.error("Audio player error:", e);
      audioPreviewStatus.textContent = `خطأ في تشغيل الصوت للآية ${audioPreviewState.ayahsToPlay[audioPreviewState.currentAyahIndex]?.ayahInSurah}`;
      // Optionally try to skip to next ayah or stop
      // For now, let's just stop to avoid error loops
      stopAudioPreview();
      alert("حدث خطأ أثناء تشغيل الصوت. قد يكون الملف الصوتي غير متوفر أو هناك مشكلة في الشبكة.");
  }

  // --- Project Persistence (LocalStorage) ---
  function saveProject() {
    const projectName = prompt("أدخل اسم المشروع:", currentProject.name || `مشروع ${new Date().toLocaleDateString()}`);
    if (projectName === null) return; // User cancelled

    currentProject.name = projectName.trim() || `مشروع ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    updateProjectFromUI(); // Ensure latest UI changes are in currentProject object

    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    
    if (loadedProjectId) { // Editing an existing project
        const projectIndex = projects.findIndex(p => p.id === loadedProjectId);
        if (projectIndex > -1) {
            projects[projectIndex] = { ...currentProject, id: loadedProjectId }; // Keep original ID
        } else { // ID was set, but not found (edge case, treat as new)
            projects.push(currentProject); // currentProject already has a unique ID
        }
    } else { // New project
        projects.push(currentProject);
    }
    
    localStorage.setItem('quranVideoProjects', JSON.stringify(projects));
    alert(`تم حفظ المشروع "${currentProject.name}"`);
    loadedProjectId = currentProject.id; // Track that this project is now saved
    currentProjectTitleElement.textContent = currentProject.name;
    loadProjects(); // Refresh list on initial screen
  }

  function loadProjects() {
    const projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    projectsList.innerHTML = '';
    if (projects.length === 0) {
      noProjectsMessage.style.display = 'block';
      return;
    }
    noProjectsMessage.style.display = 'none';
    
    projects.sort((a, b) => b.lastModified - a.lastModified); // Show newest first

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

  function loadSpecificProject(projectId) {
    const projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad) {
      currentProject = { ...createNewProjectState(), ...projectToLoad }; // Merge with defaults to ensure all keys exist
      loadedProjectId = projectId;
      showLoading(); // Show spinner while updating UI and fetching data
      // Need to re-fetch surah data for ayah dropdowns before setting UI
      fetchInitialData().then(() => { // fetchInitialData now also calls updateUIFromProject
          // Ensure Ayah selects are populated based on loaded Surah *before* setting their values
          const selectedSurahDetails = surahsData.find(s => s.number == currentProject.surah);
          if (selectedSurahDetails) {
              const ayahs = Array.from({ length: selectedSurahDetails.numberOfAyahs }, (_, i) => ({ id: i + 1, name: `آية ${i + 1}` }));
              populateSelect(ayahStartSelect, ayahs, 'id', 'name');
              populateSelect(ayahEndSelect, ayahs, 'id', 'name');
          }
          ayahStartSelect.value = currentProject.ayahStart; // Now set the values
          ayahEndSelect.value = currentProject.ayahEnd;
          
          updateUIFromProject(); // This will also handle background loading
          updatePreview();
          showScreen('editor');
          currentProjectTitleElement.textContent = currentProject.name;
          hideLoading();
      }).catch(err => {
          console.error("Error during project load process:", err);
          alert("خطأ أثناء تحميل المشروع.");
          hideLoading();
          resetToNewProject(); // Fallback to new project state
      });
    }
  }

  function deleteProject(projectId) {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذا المشروع؟")) return;
    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('quranVideoProjects', JSON.stringify(projects));
    loadProjects(); // Refresh list
    if (loadedProjectId === projectId) { // If deleted project was currently loaded
        resetToNewProject();
    }
  }

  // --- Video Export (CCapture.js) ---
  async function exportVideo() {
    if (!currentProject.surah || !currentProject.ayahStart || !currentProject.ayahEnd) {
      alert("يرجى اختيار السورة ونطاق الآيات أولاً.");
      return;
    }
    
    if (!confirm("سيتم تصدير الفيديو بدون صوت حاليًا. هل ترغب في المتابعة؟")) {
        return;
    }

    showLoading("جاري تجهيز التصدير...");
    exportProgressDiv.style.display = 'block';
    exportProgressBar.value = 0;
    exportProgressText.textContent = '0%';

    const [exportWidth, exportHeight] = currentProject.resolution.split('x').map(Number);
    const originalCanvasWidth = canvas.width;
    const originalCanvasHeight = canvas.height;

    // Resize canvas for export
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    capturer = new CCapture({
      format: 'webm', // or 'png', 'jpg' for image sequence. 'gif' with CCapture.GIFEncoder.js
      framerate: 25, // Adjust as needed
      verbose: false,
      quality: 90, // For webm, affects quality/size
      name: `QuranVideo-${currentProject.name.replace(/\s+/g, '_') || 'project'}`
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

        const textEdition = 'quran-uthmani'; // Standard text
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
      exportProgressDiv.style.display = 'none';
      // Restore original canvas size
      canvas.width = originalCanvasWidth;
      canvas.height = originalCanvasHeight;
      updatePreview();
      return;
    }
    
    if (ayahsToRender.length === 0) {
        alert("لا توجد آيات للتصدير.");
        hideLoading();
        exportProgressDiv.style.display = 'none';
        canvas.width = originalCanvasWidth;
        canvas.height = originalCanvasHeight;
        updatePreview();
        return;
    }

    hideLoading(); // Hide initial "preparing" spinner, show progress bar instead
    capturer.start();

    const delayPerAyah = (currentProject.delayBetweenAyahs + 1) * 1000; // Add 1s for fade/display
    const framesPerAyah = Math.ceil(delayPerAyah / (1000 / capturer.framerate));
    let totalFramesRendered = 0;
    const totalFramesToRender = ayahsToRender.length * framesPerAyah;

    for (let i = 0; i < ayahsToRender.length; i++) {
      const ayahData = ayahsToRender[i];
      const surahTitleForAyah = `${ayahData.surahName} - آية ${ayahData.ayahInSurah}`;
      
      // Render this ayah for its duration
      // For fade effect, we might need more granular frame control
      const fadeInFrames = currentProject.transition === 'fade' ? Math.floor(capturer.framerate / 2) : 0; // 0.5 sec fade
      const holdFrames = framesPerAyah - (2 * fadeInFrames);
      const fadeOutFrames = fadeInFrames;

      // Fade In
      for (let f = 0; f < fadeInFrames; f++) {
        ctx.globalAlpha = f / fadeInFrames;
        await updatePreview(ayahData.text, ayahData.translation, surahTitleForAyah); // Ensure preview updates canvas
        capturer.capture(canvas);
        totalFramesRendered++;
        updateExportProgress(totalFramesRendered, totalFramesToRender);
      }
      ctx.globalAlpha = 1; // Ensure full opacity after fade in

      // Hold
      for (let f = 0; f < holdFrames; f++) {
        await updatePreview(ayahData.text, ayahData.translation, surahTitleForAyah);
        capturer.capture(canvas);
        totalFramesRendered++;
        updateExportProgress(totalFramesRendered, totalFramesToRender);
      }
      
      // Fade Out (if not last ayah or if transition is fade)
      if (currentProject.transition === 'fade' && (i < ayahsToRender.length -1 || ayahsToRender.length === 1)) {
          for (let f = 0; f < fadeOutFrames; f++) {
            ctx.globalAlpha = 1 - (f / fadeOutFrames);
            await updatePreview(ayahData.text, ayahData.translation, surahTitleForAyah);
            capturer.capture(canvas);
            totalFramesRendered++;
            updateExportProgress(totalFramesRendered, totalFramesToRender);
          }
      }
       ctx.globalAlpha = 1; // Reset global alpha
    }

    capturer.stop();
    capturer.save();

    exportProgressText.textContent = 'اكتمل التصدير!';
    setTimeout(() => {
        exportProgressDiv.style.display = 'none';
    }, 3000);
    
    // Restore original canvas size and preview
    canvas.width = originalCanvasWidth;
    canvas.height = originalCanvasHeight;
    updatePreview();
  }
  
  function updateExportProgress(currentFrame, totalFrames) {
    const percent = Math.round((currentFrame / totalFrames) * 100);
    exportProgressBar.value = percent;
    exportProgressText.textContent = `${percent}%`;
  }

  // --- Utility Functions ---
  function showLoading(message = null) {
    if (message) {
        // Could add a message to the spinner if design allows
        console.log("Loading:", message);
    }
    loadingSpinner.style.display = 'flex';
  }

  function hideLoading() {
    loadingSpinner.style.display = 'none';
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
