// Global constants and configuration
const PEXELS_API_KEY_STORAGE_KEY = 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7';
const ALQURAN_CLOUD_API_BASE = 'https://api.alquran.cloud/v1';
const PEXELS_API_BASE = 'https://api.pexels.com/v1';
const MAX_HISTORY_STATES = 20; // For Undo/Redo

// DOM Elements Cache
const DOMElements = {
    initialScreen: null, editorScreen: null, goToEditorBtn: null, backToInitialScreenBtn: null,
    currentProjectTitleEditor: null, saveProjectBtnEditor: null, projectsList: null, noProjectsMessage: null,
    surahSelect: null, ayahStartSelect: null, ayahEndSelect: null, reciterSelect: null, translationSelect: null,
    fontSelect: null, fontSizeSlider: null, fontSizeValue: null, fontColorPicker: null, ayahBgColorPicker: null, textEffectSelect: null,
    importBackgroundInput: null, applyAiBgBtn: null, aiBgSuggestionsDiv: null, aiBgSuggestionsLoader: null,
    // playPauseAudioPreviewBtn: null, // Replaced by main playback
    // stopAudioPreviewBtn: null,
    audioPreviewStatusText: null, delayBetweenAyahsInput: null,
    resolutionSelect: null, transitionSelect: null, exportBtn: null, exportProgressDiv: null, exportProgressBar: null, exportProgressText: null,
    videoPreviewCanvas: null, previewOverlayContent: null, previewSurahTitleOverlay: null, previewAyahTextOverlay: null, previewTranslationTextOverlay: null,
    mainAudioPlayer: null, loadingSpinner: null, themeToggleInitial: null, themeToggleEditor: null,
    mainBottomTabBar: null, mainTabButtons: null, controlPanels: null, panelCloseButtons: null, panelConfirmButtons: null,
    playPauseMainBtn: null, rewindBtn: null, fastForwardBtn: null, undoBtn: null, redoBtn: null,
    timelineSlider: null, currentTimeDisplay: null, totalTimeDisplay: null,
    voiceSearchQuranBtn: null, voiceSearchStatus: null,
    aspectRatioSelect: null, videoFilterSelect: null,
    extractAudioBtn: null, addSoundBtn: null,
};

function cacheDOMElements() {
    for (const key in DOMElements) {
        DOMElements[key] = document.getElementById(key) || document.querySelector('.' + key) || document.querySelectorAll('.' + key);
        if (DOMElements[key] instanceof NodeList && DOMElements[key].length === 1) {
            DOMElements[key] = DOMElements[key][0]; // Simplify if only one element found by class
        }
    }
}

// State variables
let currentProject = createNewProject();
let projectHistory = [];
let currentHistoryIndex = -1;
let surahData = [];
let recitersData = []; // Curated list
let translationsData = []; // Curated list
let ayahsForPlayback = []; // Array of {text, translation, audioSrc, duration, startAyahNum}
let currentPlaybackAyahIndex = 0;
let isPlaying = false;
let backgroundType = 'color';
let backgroundImage = null;
let backgroundVideo = null;
let backgroundVideoAnimationId = null;
let capturer = null;
let PEXELS_API_KEY = '';
let speechRecognition = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    initApp();
    PEXELS_API_KEY = localStorage.getItem(PEXELS_API_KEY_STORAGE_KEY) || '';
});

async function initApp() {
    loadTheme();
    loadProjects();
    showLoading();
    try {
        await Promise.all([fetchSurahs(), fetchReciters(), fetchTranslations()]);
        setupEventListeners();
        setupSpeechRecognition();
        updatePreview();
        updateUndoRedoButtons();
    } catch (error) {
        console.error("Initialization failed:", error);
        alert("فشل تهيئة التطبيق. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
    } finally {
        hideLoading();
    }
}

function createNewProject(id = Date.now().toString()) {
    return {
        id: id,
        name: "مشروع جديد",
        surah: 1, // Default to Al-Fatiha
        startAyah: 1,
        endAyah: 7, // Default to Al-Fatiha's end
        reciter: "ar.alafasy", // Default reciter
        translation: '',
        font: "'Amiri Quran', serif",
        fontSize: 48,
        fontColor: '#FFFFFF',
        ayahBgColor: 'rgba(0,0,0,0.3)',
        textEffect: 'none',
        background: { type: 'color', value: '#2c3e50' }, // Default nice dark blue
        delayBetweenAyahs: 1,
        resolution: '1920x1080',
        videoTransition: 'fade',
        aspectRatio: '16:9',
        videoFilter: 'none',
        // audio related:
        // backgroundMusic: { src: null, volume: 0.5 },
    };
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    DOMElements.goToEditorBtn.addEventListener('click', () => {
        currentProject = createNewProject();
        projectHistory = [JSON.parse(JSON.stringify(currentProject))]; // Start history
        currentHistoryIndex = 0;
        loadProjectIntoEditor(currentProject); // This also calls updatePreview
        DOMElements.initialScreen.style.display = 'none';
        DOMElements.editorScreen.style.display = 'flex';
        DOMElements.currentProjectTitleEditor.textContent = currentProject.name;
        closeAllPanels();
        updateUndoRedoButtons();
    });

    DOMElements.backToInitialScreenBtn.addEventListener('click', () => {
        // saveCurrentProjectState(); // State is saved on change now
        DOMElements.editorScreen.style.display = 'none';
        DOMElements.initialScreen.style.display = 'block';
        loadProjects();
        if (isPlaying) stopMainPlayback();
    });

    DOMElements.saveProjectBtnEditor.addEventListener('click', () => {
        const projectName = prompt("أدخل اسم المشروع:", currentProject.name);
        if (projectName) {
            currentProject.name = projectName;
            DOMElements.currentProjectTitleEditor.textContent = projectName;
            saveProject(currentProject); // This also saves to localStorage
            addStateToHistory(); // Save this named state
            alert("تم حفظ المشروع!");
        }
    });

    [DOMElements.themeToggleInitial, DOMElements.themeToggleEditor].forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });

    // Quran selection
    DOMElements.surahSelect.addEventListener('change', handleSurahChangeWithState);
    DOMElements.ayahStartSelect.addEventListener('change', () => { validateAyahRange(); updateCurrentProjectSettings(); addStateToHistory(); loadAyahsForPlayback(); });
    DOMElements.ayahEndSelect.addEventListener('change', () => { validateAyahRange(); updateCurrentProjectSettings(); addStateToHistory(); loadAyahsForPlayback(); });
    DOMElements.reciterSelect.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); loadAyahsForPlayback(); });
    DOMElements.translationSelect.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); updatePreview(); /* No need to reload audio */ });
    DOMElements.voiceSearchQuranBtn.addEventListener('click', toggleVoiceSearch);

    // Text styling
    DOMElements.fontSelect.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); updatePreview(); });
    DOMElements.fontSizeSlider.addEventListener('input', (e) => { DOMElements.fontSizeValue.textContent = e.target.value + 'px'; updateCurrentProjectSettings(); updatePreview(); });
    DOMElements.fontSizeSlider.addEventListener('change', addStateToHistory); // Save state on release
    DOMElements.fontColorPicker.addEventListener('input', () => { updateCurrentProjectSettings(); updatePreview(); });
    DOMElements.fontColorPicker.addEventListener('change', addStateToHistory);
    DOMElements.ayahBgColorPicker.addEventListener('input', () => { updateCurrentProjectSettings(); updatePreview(); });
    DOMElements.ayahBgColorPicker.addEventListener('change', addStateToHistory);
    DOMElements.textEffectSelect.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); updatePreview(); });

    // Background
    DOMElements.importBackgroundInput.addEventListener('change', handleBackgroundImportWithState);
    DOMElements.applyAiBgBtn.addEventListener('click', fetchAiBackgroundSuggestions);

    // Audio (Delay only for now)
    DOMElements.delayBetweenAyahsInput.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); });
    // DOMElements.extractAudioBtn.addEventListener('click', () => alert("ميزة استخراج الصوت قيد التطوير."));
    // DOMElements.addSoundBtn.addEventListener('click', () => alert("ميزة إضافة صوت/موسيقى قيد التطوير."));

    // Effects & Dimensions
    DOMElements.aspectRatioSelect.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); updatePreviewAspectRatio(); });
    DOMElements.videoFilterSelect.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); updatePreview(); });
    
    // Export
    DOMElements.resolutionSelect.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); updatePreview(); });
    DOMElements.transitionSelect.addEventListener('change', () => { updateCurrentProjectSettings(); addStateToHistory(); });
    DOMElements.exportBtn.addEventListener('click', exportVideo);

    // Main Tab Bar and Panels
    DOMElements.mainTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanelId = button.dataset.targetPanel;
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel.classList.contains('visible') && button.classList.contains('active')) {
                closePanel(targetPanelId);
            } else {
                openPanel(targetPanelId);
            }
        });
    });
    DOMElements.panelCloseButtons.forEach(button => button.addEventListener('click', () => closePanel(button.dataset.panelid)));
    DOMElements.panelConfirmButtons.forEach(button => {
        button.addEventListener('click', () => {
            // updatePreview(); // Preview should be live already
            closePanel(button.dataset.panelid);
        });
    });

    // Playback Controls
    DOMElements.playPauseMainBtn.addEventListener('click', toggleMainPlayback);
    DOMElements.rewindBtn.addEventListener('click', playPreviousAyah);
    DOMElements.fastForwardBtn.addEventListener('click', playNextAyah);
    DOMElements.timelineSlider.addEventListener('input', handleTimelineScrub);
    DOMElements.undoBtn.addEventListener('click', undoState);
    DOMElements.redoBtn.addEventListener('click', redoState);

    // Update preview on generic input changes if not handled by specific listeners
    const allPanelInputs = document.querySelectorAll('.control-panel select, .control-panel input[type="color"], .control-panel input[type="number"], .control-panel input[type="text"]');
    allPanelInputs.forEach(input => {
        if (!input.id.includes('Slider')) { // Sliders have their own 'input' and 'change'
            input.addEventListener('change', () => {
                updateCurrentProjectSettings(); // Ensure project object is up-to-date
                addStateToHistory();
                updatePreview();
            });
        }
    });
}

// --- Undo/Redo ---
function addStateToHistory() {
    // Debounce or throttle this if called too frequently
    // For simplicity, direct call for now
    const currentStateSnapshot = JSON.parse(JSON.stringify(currentProject));
    
    // If we undid, and now make a new change, cut off the "redo" future
    if (currentHistoryIndex < projectHistory.length - 1) {
        projectHistory = projectHistory.slice(0, currentHistoryIndex + 1);
    }

    projectHistory.push(currentStateSnapshot);
    if (projectHistory.length > MAX_HISTORY_STATES) {
        projectHistory.shift(); // Remove oldest state
    }
    currentHistoryIndex = projectHistory.length - 1;
    updateUndoRedoButtons();
}

function undoState() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        loadStateFromHistory();
    }
}

function redoState() {
    if (currentHistoryIndex < projectHistory.length - 1) {
        currentHistoryIndex++;
        loadStateFromHistory();
    }
}

function loadStateFromHistory() {
    if (projectHistory[currentHistoryIndex]) {
        currentProject = JSON.parse(JSON.stringify(projectHistory[currentHistoryIndex]));
        loadProjectIntoEditor(currentProject); // This re-populates UI and calls updatePreview
        // If audio was playing, state change might affect it.
        if (isPlaying) {
            stopMainPlayback(); // Stop and user can restart if needed
        }
        loadAyahsForPlayback(); // Reload audio based on new state
    }
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    DOMElements.undoBtn.disabled = currentHistoryIndex <= 0;
    DOMElements.redoBtn.disabled = currentHistoryIndex >= projectHistory.length - 1;
}


// --- Panel Management ---
let activePanelId = null;
function openPanel(panelId) {
    closeAllPanels();
    const panel = document.getElementById(panelId);
    const tabButton = DOMElements.mainTabButtons.find(btn => btn.dataset.targetPanel === panelId);
    if (panel) { panel.classList.add('visible'); activePanelId = panelId; }
    if (tabButton) { tabButton.classList.add('active'); }
}
function closePanel(panelId) {
    const panel = document.getElementById(panelId);
    const tabButton = DOMElements.mainTabButtons.find(btn => btn.dataset.targetPanel === panelId);
    if (panel) { panel.classList.remove('visible'); if (activePanelId === panelId) activePanelId = null; }
    if (tabButton) { tabButton.classList.remove('active'); }
}
function closeAllPanels() {
    DOMElements.controlPanels.forEach(panel => panel.classList.remove('visible'));
    DOMElements.mainTabButtons.forEach(btn => btn.classList.remove('active'));
    activePanelId = null;
}

// --- API Fetching (Surahs, Reciters, Translations) ---
async function fetchSurahs() {
    const response = await axios.get(`${ALQURAN_CLOUD_API_BASE}/surah`);
    surahData = response.data.data;
    DOMElements.surahSelect.innerHTML = surahData.map(s => `<option value="${s.number}">${s.number}. ${s.name} (${s.englishName})</option>`).join('');
}
async function fetchReciters() {
    recitersData = [
        { identifier: "ar.abdulsamad", englishName: "Abdul Samad", name: "عبد الباسط عبد الصمد (مرتل)" },
        { identifier: "ar.alafasy", englishName: "Mishary Rashid Alafasy", name: "مشاري راشد العفاسي" },
        { identifier: "ar.minshawi", englishName: "Mohamed Siddiq El-Minshawi", name: "محمد صديق المنشاوي (مرتل)" },
        { identifier: "ar.mahermuaiqly", englishName: "Maher Al Muaiqly", name: "ماهر المعيقلي" },
        { identifier: "ar.sahl_yassin", englishName: "Sahl Yassin", name: "سهل ياسين" },
        { identifier: "ar.sudais", englishName: "Abdurrahman As-Sudais", name: "عبدالرحمن السديس" },
    ];
    DOMElements.reciterSelect.innerHTML = recitersData.map(r => `<option value="${r.identifier}">${r.name}</option>`).join('');
}
async function fetchTranslations() {
    translationsData = [
        { identifier: "en.sahih", englishName: "Sahih International", name: "Sahih International (English)" },
        { identifier: "es.cortes", englishName: "Cortes (Spanish)", name: "Julio Cortes (Español)" },
        { identifier: "fr.hamidullah", englishName: "Hamidullah (French)", name: "Muhammad Hamidullah (Français)" },
        { identifier: "id.indonesian", englishName: "Indonesian Ministry of Religious Affairs", name: "Bahasa Indonesia (Kemenag RI)"},
        { identifier: "tr.diyanet", englishName: "Diyanet Isleri (Turkish)", name: "Diyanet İşleri (Türkçe)"},
        { identifier: "ur.jalandhry", englishName: "Fateh Muhammad Jalandhry (Urdu)", name: " جالندہری (اردو)"},
    ];
    DOMElements.translationSelect.innerHTML = '<option value="">بدون ترجمة</option>' + translationsData.map(t => `<option value="${t.identifier}">${t.name}</option>`).join('');
}

// --- Quran Logic ---
function handleSurahChangeWithState() {
    handleSurahChange();
    addStateToHistory();
    loadAyahsForPlayback(); // Reload audio for new surah/ayah range
}
function handleSurahChange() {
    const surahNumber = DOMElements.surahSelect.value;
    if (!surahNumber || surahData.length === 0) return;
    const selectedSurah = surahData.find(s => s.number == surahNumber);
    if (!selectedSurah) return;

    DOMElements.ayahStartSelect.innerHTML = ''; DOMElements.ayahEndSelect.innerHTML = '';
    for (let i = 1; i <= selectedSurah.numberOfAyahs; i++) {
        DOMElements.ayahStartSelect.innerHTML += `<option value="${i}">${i}</option>`;
        DOMElements.ayahEndSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
    DOMElements.ayahStartSelect.value = 1; // Default to first ayah
    DOMElements.ayahEndSelect.value = selectedSurah.numberOfAyahs; // Default to last ayah
    updateCurrentProjectSettings(); // This will also update project object for start/end
}
function validateAyahRange() {
    let start = parseInt(DOMElements.ayahStartSelect.value);
    let end = parseInt(DOMElements.ayahEndSelect.value);
    if (start > end) {
        DOMElements.ayahEndSelect.value = start; // or DOMElements.ayahStartSelect.value = end;
    }
}

// --- Update Project Object from UI ---
function updateCurrentProjectSettings() {
    currentProject.surah = DOMElements.surahSelect.value ? parseInt(DOMElements.surahSelect.value) : null;
    currentProject.startAyah = DOMElements.ayahStartSelect.value ? parseInt(DOMElements.ayahStartSelect.value) : 1;
    currentProject.endAyah = DOMElements.ayahEndSelect.value ? parseInt(DOMElements.ayahEndSelect.value) : (currentProject.surah ? surahData.find(s=>s.number == currentProject.surah)?.numberOfAyahs : 1);
    currentProject.reciter = DOMElements.reciterSelect.value;
    currentProject.translation = DOMElements.translationSelect.value;
    currentProject.font = DOMElements.fontSelect.value;
    currentProject.fontSize = parseInt(DOMElements.fontSizeSlider.value);
    currentProject.fontColor = DOMElements.fontColorPicker.value;
    currentProject.ayahBgColor = DOMElements.ayahBgColorPicker.value;
    currentProject.textEffect = DOMElements.textEffectSelect.value;
    currentProject.delayBetweenAyahs = parseFloat(DOMElements.delayBetweenAyahsInput.value) || 0;
    currentProject.resolution = DOMElements.resolutionSelect.value;
    currentProject.videoTransition = DOMElements.transitionSelect.value;
    currentProject.aspectRatio = DOMElements.aspectRatioSelect.value;
    currentProject.videoFilter = DOMElements.videoFilterSelect.value;
    // Background is updated in its own handlers
    DOMElements.currentProjectTitleEditor.textContent = currentProject.name;
}

// --- Preview Rendering ---
const ctx = DOMElements.videoPreviewCanvas.getContext('2d');

function updatePreviewAspectRatio() {
    const [aspectW, aspectH] = currentProject.aspectRatio.split(':').map(Number);
    DOMElements.videoPreviewContainer.style.aspectRatio = `${aspectW} / ${aspectH}`;
    // Resolution for canvas should still be from resolutionSelect for export quality
    const [renderW, renderH] = currentProject.resolution.split('x').map(Number);
    DOMElements.videoPreviewCanvas.width = renderW;
    DOMElements.videoPreviewCanvas.height = renderH;
    updatePreview(); // Redraw with new aspect ratio and resolution
}

async function updatePreview(ayahIndexToDisplay = currentPlaybackAyahIndex, animationProgress = 1) {
    if (!DOMElements.videoPreviewCanvas) return; // Not ready

    const [width, height] = currentProject.resolution.split('x').map(Number);
    if(DOMElements.videoPreviewCanvas.width !== width) DOMElements.videoPreviewCanvas.width = width;
    if(DOMElements.videoPreviewCanvas.height !== height) DOMElements.videoPreviewCanvas.height = height;

    // 1. Draw Background
    ctx.clearRect(0, 0, width, height); // Clear previous frame
    ctx.save(); // Save context state
    if (currentProject.videoFilter !== 'none') {
        ctx.filter = currentProject.videoFilter;
    }

    if (backgroundType === 'image' && backgroundImage && backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
    } else if (backgroundType === 'video' && backgroundVideo && backgroundVideo.readyState >= backgroundVideo.HAVE_CURRENT_DATA) {
        try { ctx.drawImage(backgroundVideo, 0, 0, width, height); }
        catch (e) { drawDefaultBackground(width, height); }
    } else {
        drawDefaultBackground(width, height);
    }
    ctx.restore(); // Restore context (removes filter for text)


    // 2. Prepare Text Data
    const ayahData = ayahsForPlayback[ayahIndexToDisplay];
    let textToDisplay = ayahData ? ayahData.text : (currentProject.surah ? "تحميل الآية..." : "اختر سورة وآية");
    let translationToDisplay = ayahData ? ayahData.translation : "";
    const selectedSurahObj = currentProject.surah ? surahData.find(s => s.number == currentProject.surah) : null;
    
    // Draw text on canvas
    drawTextOnCanvasForPreview(ctx, textToDisplay, translationToDisplay, selectedSurahObj ? selectedSurahObj.name : "", width, height, currentProject, animationProgress);

    // Update HTML overlay (optional, can be hidden if canvas text is good enough for preview)
    DOMElements.previewSurahTitleOverlay.textContent = selectedSurahObj ? selectedSurahObj.name : "";
    DOMElements.previewAyahTextOverlay.textContent = textToDisplay;
    // Apply styles to HTML overlay (might be redundant if canvas is primary)
    // ... styling for HTML overlay elements ...
}

function drawDefaultBackground(width, height) {
    ctx.fillStyle = currentProject.background.value || '#2c3e50';
    ctx.fillRect(0, 0, width, height);
}

function drawTextOnCanvasForPreview(targetContext, ayahText, translationText, surahName, canvasWidth, canvasHeight, project, animationProgress = 1) {
    // Clear previous text areas if needed (usually handled by clearRect on whole canvas)
    // Surah Title (Optional on canvas, could be HTML overlay only)
    // targetContext.font = `bold ${project.fontSize * 0.8}px ${project.fontFamilyUi || 'Tajawal, sans-serif'}`;
    // targetContext.fillStyle = project.fontColor; // Or a contrasting title color
    // targetContext.textAlign = 'center';
    // targetContext.fillText(surahName, canvasWidth / 2, canvasHeight * 0.15);

    // Ayah Text
    targetContext.font = `${project.fontSize}px ${project.font}`;
    targetContext.fillStyle = project.fontColor;
    targetContext.textAlign = 'center';
    targetContext.textBaseline = 'middle';

    const ayahLines = wrapText(targetContext, ayahText, canvasWidth * 0.85);
    const ayahTextHeight = ayahLines.length * project.fontSize * 1.2; // Approximate height including line spacing
    const maxAyahLineWidth = Math.max(...ayahLines.map(line => targetContext.measureText(line).width), 0);

    const ayahBgPadding = project.fontSize * 0.2;
    const ayahTextYStart = canvasHeight * 0.45 - ayahTextHeight / 2; // Centered around 45% vertically

    if (project.ayahBgColor && project.ayahBgColor !== 'rgba(0,0,0,0)' && project.ayahBgColor !== '#00000000') {
        targetContext.fillStyle = project.ayahBgColor;
        targetContext.fillRect(
            (canvasWidth - maxAyahLineWidth) / 2 - ayahBgPadding,
            ayahTextYStart - ayahBgPadding,
            maxAyahLineWidth + ayahBgPadding * 2,
            ayahTextHeight + ayahBgPadding * 2
        );
        targetContext.fillStyle = project.fontColor; // Reset for text
    }

    ayahLines.forEach((line, index) => {
        let currentLine = line;
        const lineY = ayahTextYStart + index * project.fontSize * 1.2;
        if (project.textEffect === 'typewriter') {
            const charsToShow = Math.floor(line.length * animationProgress);
            currentLine = line.substring(0, charsToShow);
        } else if (project.textEffect === 'fade') {
            targetContext.globalAlpha = animationProgress;
        }
        targetContext.fillText(currentLine, canvasWidth / 2, lineY);
    });
    targetContext.globalAlpha = 1;

    // Translation Text
    if (translationText) {
        targetContext.font = `${project.fontSize * 0.5}px ${project.fontFamilyUi || 'Tajawal, sans-serif'}`;
        targetContext.fillStyle = tinycolor(project.fontColor).desaturate(10).lighten(10).toString(); // Lighter, less saturated for translation
        const transLines = wrapText(targetContext, translationText, canvasWidth * 0.8);
        const transTextYStart = canvasHeight * 0.7; // Position translation lower

        transLines.forEach((line, index) => {
            let currentLine = line;
            const lineY = transTextYStart + index * (project.fontSize * 0.5) * 1.2;
            if (project.textEffect === 'typewriter' || project.textEffect === 'fade') { // Apply same effect logic
                 if (project.textEffect === 'typewriter') {
                    const charsToShow = Math.floor(line.length * animationProgress);
                    currentLine = line.substring(0, charsToShow);
                } else if (project.textEffect === 'fade') {
                    targetContext.globalAlpha = animationProgress;
                }
            }
            targetContext.fillText(currentLine, canvasWidth / 2, lineY);
        });
        targetContext.globalAlpha = 1;
    }
}

// --- Background Handling ---
function handleBackgroundImportWithState(event) {
    handleBackgroundImport(event);
    // addStateToHistory(); // The onload events will call addStateToHistory
}
function handleBackgroundImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (file.type.startsWith('image/')) {
            if(backgroundImage) URL.revokeObjectURL(backgroundImage.src); // Clean up old one if any
            backgroundImage = new Image();
            backgroundImage.onload = () => {
                backgroundType = 'image';
                currentProject.background = { type: 'image', value: backgroundImage.src };
                updatePreview();
                addStateToHistory();
            };
            backgroundImage.onerror = () => alert("فشل تحميل الصورة.");
            backgroundImage.src = e.target.result; // Using Data URL
        } else if (file.type.startsWith('video/')) {
            if(backgroundVideo) URL.revokeObjectURL(backgroundVideo.src); // Clean up
            if(backgroundVideoAnimationId) cancelAnimationFrame(backgroundVideoAnimationId);
            backgroundVideo = document.createElement('video');
            backgroundVideo.src = e.target.result; // Using Data URL
            backgroundVideo.muted = true;
            backgroundVideo.loop = true;
            backgroundVideo.oncanplay = () => {
                backgroundType = 'video';
                currentProject.background = { type: 'video', value: backgroundVideo.src }; // Store data URL
                backgroundVideo.play();
                function videoPreviewLoop() {
                    if (backgroundType === 'video' && backgroundVideo && !backgroundVideo.paused) {
                        updatePreview(); // Update main preview canvas
                        backgroundVideoAnimationId = requestAnimationFrame(videoPreviewLoop);
                    }
                }
                videoPreviewLoop();
                addStateToHistory();
            };
            backgroundVideo.onerror = () => alert("فشل تحميل الفيديو.");
        } else {
            alert("نوع الملف غير مدعوم. الرجاء اختيار صورة أو فيديو.");
        }
    };
    reader.readAsDataURL(file);
}
async function fetchAiBackgroundSuggestions() {
    if (!PEXELS_API_KEY) { /* ... PEXELS API Key prompt ... */ return; }
    const selectedSurah = currentProject.surah ? surahData.find(s => s.number == currentProject.surah) : null;
    if (!selectedSurah) { alert("يرجى اختيار سورة أولاً."); return; }
    const query = selectedSurah.englishName + " nature landscape";
    DOMElements.aiBgSuggestionsLoader.style.display = 'block'; DOMElements.aiBgSuggestionsDiv.innerHTML = '';
    try {
        const response = await axios.get(`${PEXELS_API_BASE}/search`, {
            headers: { Authorization: PEXELS_API_KEY },
            params: { query: query, per_page: 10, orientation: currentProject.aspectRatio === '9:16' ? 'portrait' : 'landscape' }
        });
        if (response.data.photos.length === 0) { DOMElements.aiBgSuggestionsDiv.innerHTML = '<p>لم يتم العثور على اقتراحات.</p>'; }
        else {
            response.data.photos.forEach(photo => {
                const imgEl = document.createElement('img');
                imgEl.src = photo.src.medium; /* ... */
                imgEl.addEventListener('click', () => {
                    showLoading();
                    const fullImage = new Image();
                    fullImage.crossOrigin = "Anonymous";
                    fullImage.onload = () => {
                        if(backgroundImage) URL.revokeObjectURL(backgroundImage.src); // Clean up
                        backgroundImage = fullImage; // Assign the loaded full image
                        backgroundType = 'image';
                        currentProject.background = { type: 'image', value: fullImage.src }; // Store its src
                        updatePreview();
                        addStateToHistory();
                        hideLoading();
                        document.querySelectorAll('#ai-bg-suggestions img.selected-ai-bg').forEach(el => el.classList.remove('selected-ai-bg'));
                        imgEl.classList.add('selected-ai-bg');
                    };
                    fullImage.onerror = () => { alert("فشل تحميل الصورة المختارة من Pexels."); hideLoading(); };
                    fullImage.src = photo.src.large2x; // Load full res image
                });
                DOMElements.aiBgSuggestionsDiv.appendChild(imgEl);
            });
        }
    } catch (error) { /* ... error handling ... */ }
    finally { DOMElements.aiBgSuggestionsLoader.style.display = 'none'; }
}


// --- Main Playback Logic (Timeline, Audio) ---
async function loadAyahsForPlayback() {
    if (!currentProject.surah || !currentProject.startAyah || !currentProject.endAyah || !currentProject.reciter) {
        ayahsForPlayback = [];
        updateTimelineDisplay(0,0);
        updatePreview(); // Show default text
        return;
    }
    showLoading();
    DOMElements.audioPreviewStatusText.textContent = "تحميل التلاوة...";
    ayahsForPlayback = [];
    let totalDuration = 0;

    try {
        for (let i = currentProject.startAyah; i <= currentProject.endAyah; i++) {
            const currentSurahObj = surahData.find(s => s.number == currentProject.surah);
            if(!currentSurahObj || !currentSurahObj.ayahs || i -1 >= currentSurahObj.ayahs.length) {
                console.warn(`Ayah ${i} not found in surah ${currentProject.surah}`); continue;
            }
            const ayahNumberInQuran = currentSurahObj.ayahs[i-1].number; // Global Ayah Number
            
            const [textAudioResponse, translationResponse] = await Promise.all([
                axios.get(`${ALQURAN_CLOUD_API_BASE}/ayah/${ayahNumberInQuran}/${currentProject.reciter}`),
                currentProject.translation ? axios.get(`${ALQURAN_CLOUD_API_BASE}/ayah/${ayahNumberInQuran}/${currentProject.translation}`) : Promise.resolve(null)
            ]);

            const audioSrc = textAudioResponse.data.data.audio;
            let ayahDuration = 5; // Default duration
            try {
                const audioForDuration = new Audio(audioSrc);
                await new Promise((resolve, reject) => {
                    audioForDuration.onloadedmetadata = () => { ayahDuration = audioForDuration.duration; resolve(); };
                    audioForDuration.onerror = reject;
                    setTimeout(reject, 3000); // 3s timeout for duration loading
                });
            } catch (e) { console.warn(`Could not get duration for ${audioSrc}, using default.`); }
            
            ayahsForPlayback.push({
                text: textAudioResponse.data.data.text,
                translation: translationResponse ? translationResponse.data.data.text : null,
                audioSrc: audioSrc,
                duration: ayahDuration,
                startAyahNum: i // Store the original start ayah number for display
            });
            totalDuration += ayahDuration;
            if (i < currentProject.endAyah) totalDuration += currentProject.delayBetweenAyahs;
        }
        
        updateTimelineDisplay(0, totalDuration);
        DOMElements.timelineSlider.max = totalDuration;
        currentPlaybackAyahIndex = 0;
        if (ayahsForPlayback.length > 0) updatePreview(0); // Show first ayah
        else updatePreview(); // Show default

    } catch (error) {
        console.error("Error fetching ayahs for playback:", error);
        DOMElements.audioPreviewStatusText.textContent = "فشل تحميل التلاوة.";
        ayahsForPlayback = [];
    } finally {
        hideLoading();
        if(ayahsForPlayback.length > 0) DOMElements.audioPreviewStatusText.textContent = "التلاوة جاهزة.";
        else if (currentProject.surah) DOMElements.audioPreviewStatusText.textContent = "لا توجد آيات للمعاينة.";
        else DOMElements.audioPreviewStatusText.textContent = "";
    }
}

function toggleMainPlayback() {
    if (isPlaying) {
        pauseMainPlayback();
    } else {
        playMainPlayback();
    }
}

function playMainPlayback() {
    if (ayahsForPlayback.length === 0) { alert("لا توجد آيات للتشغيل. يرجى تحديد السورة والآيات."); return; }
    isPlaying = true;
    DOMElements.playPauseMainBtn.innerHTML = '<i class="fas fa-pause"></i>';
    DOMElements.mainAudioPlayer.src = ayahsForPlayback[currentPlaybackAyahIndex].audioSrc;
    
    // Seek to correct time if scrubbing occurred while paused
    let cumulativeTime = 0;
    for(let i=0; i < currentPlaybackAyahIndex; i++){
        cumulativeTime += ayahsForPlayback[i].duration + (i < ayahsForPlayback.length -1 ? currentProject.delayBetweenAyahs : 0);
    }
    const currentTimeInAyah = parseFloat(DOMElements.timelineSlider.value) - cumulativeTime;

    DOMElements.mainAudioPlayer.currentTime = Math.max(0, currentTimeInAyah);
    DOMElements.mainAudioPlayer.play();
    animateTextAndTimeline(); // Start animation loop
}

function pauseMainPlayback() {
    isPlaying = false;
    DOMElements.playPauseMainBtn.innerHTML = '<i class="fas fa-play"></i>';
    DOMElements.mainAudioPlayer.pause();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}
function stopMainPlayback() {
    pauseMainPlayback();
    DOMElements.mainAudioPlayer.currentTime = 0;
    currentPlaybackAyahIndex = 0;
    DOMElements.timelineSlider.value = 0;
    if (ayahsForPlayback.length > 0) updatePreview(0);
    updateTimelineDisplay(0, parseFloat(DOMElements.timelineSlider.max));
}

let animationFrameId = null;
function animateTextAndTimeline() {
    if (!isPlaying) return;

    const currentAyahData = ayahsForPlayback[currentPlaybackAyahIndex];
    const audioPlayer = DOMElements.mainAudioPlayer;

    let cumulativeTime = 0;
    for(let i=0; i < currentPlaybackAyahIndex; i++){
        cumulativeTime += ayahsForPlayback[i].duration + (i < ayahsForPlayback.length -1 ? currentProject.delayBetweenAyahs : 0);
    }
    const overallTime = cumulativeTime + audioPlayer.currentTime;
    DOMElements.timelineSlider.value = overallTime;
    updateTimelineDisplay(overallTime, parseFloat(DOMElements.timelineSlider.max));

    let animationProgress = 1;
    if (currentProject.textEffect === 'typewriter' || currentProject.textEffect === 'fade') {
        animationProgress = Math.min(1, audioPlayer.currentTime / (currentAyahData.duration * 0.8)); // Effect completes in 80% of ayah duration
    }
    updatePreview(currentPlaybackAyahIndex, animationProgress);

    if (audioPlayer.ended) {
        // Delay then next ayah
        setTimeout(() => {
            currentPlaybackAyahIndex++;
            if (currentPlaybackAyahIndex < ayahsForPlayback.length) {
                DOMElements.mainAudioPlayer.src = ayahsForPlayback[currentPlaybackAyahIndex].audioSrc;
                DOMElements.mainAudioPlayer.play();
                // No need to call animateTextAndTimeline here, it will be called by requestAnimationFrame
            } else {
                stopMainPlayback(); // End of all ayahs
            }
        }, currentProject.delayBetweenAyahs * 1000);
    }
    animationFrameId = requestAnimationFrame(animateTextAndTimeline);
}

function playNextAyah() {
    if (currentPlaybackAyahIndex < ayahsForPlayback.length - 1) {
        pauseMainPlayback(); // Pause current
        currentPlaybackAyahIndex++;
        DOMElements.mainAudioPlayer.currentTime = 0; // Reset for new ayah
        // Update slider to start of next ayah
        let cumulativeTime = 0;
        for(let i=0; i < currentPlaybackAyahIndex; i++){
            cumulativeTime += ayahsForPlayback[i].duration + (i < ayahsForPlayback.length -1 ? currentProject.delayBetweenAyahs : 0);
        }
        DOMElements.timelineSlider.value = cumulativeTime;
        updateTimelineDisplay(cumulativeTime, parseFloat(DOMElements.timelineSlider.max));
        if (ayahsForPlayback.length > 0) updatePreview(currentPlaybackAyahIndex);
        // User can then press play
    }
}
function playPreviousAyah() {
    if (currentPlaybackAyahIndex > 0) {
        pauseMainPlayback();
        currentPlaybackAyahIndex--;
        DOMElements.mainAudioPlayer.currentTime = 0;
        // Update slider to start of this ayah
        let cumulativeTime = 0;
        for(let i=0; i < currentPlaybackAyahIndex; i++){
            cumulativeTime += ayahsForPlayback[i].duration + (i < ayahsForPlayback.length -1 ? currentProject.delayBetweenAyahs : 0);
        }
        DOMElements.timelineSlider.value = cumulativeTime;
        updateTimelineDisplay(cumulativeTime, parseFloat(DOMElements.timelineSlider.max));
         if (ayahsForPlayback.length > 0) updatePreview(currentPlaybackAyahIndex);
    }
}

function handleTimelineScrub(event) {
    const scrubTime = parseFloat(event.target.value);
    updateTimelineDisplay(scrubTime, parseFloat(DOMElements.timelineSlider.max));

    let cumulativeTime = 0;
    let targetAyahIndex = 0;
    for (let i = 0; i < ayahsForPlayback.length; i++) {
        const ayahSegmentDuration = ayahsForPlayback[i].duration + (i < ayahsForPlayback.length - 1 ? currentProject.delayBetweenAyahs : 0);
        if (scrubTime < cumulativeTime + ayahSegmentDuration) {
            targetAyahIndex = i;
            break;
        }
        cumulativeTime += ayahSegmentDuration;
    }
    
    currentPlaybackAyahIndex = targetAyahIndex;
    const timeIntoCurrentAyah = scrubTime - cumulativeTime;

    if (ayahsForPlayback[currentPlaybackAyahIndex]) {
         DOMElements.mainAudioPlayer.src = ayahsForPlayback[currentPlaybackAyahIndex].audioSrc; // Ensure correct src
         DOMElements.mainAudioPlayer.currentTime = Math.min(timeIntoCurrentAyah, ayahsForPlayback[currentPlaybackAyahIndex].duration - 0.01); // Clamp to avoid ending prematurely
         updatePreview(currentPlaybackAyahIndex, timeIntoCurrentAyah / ayahsForPlayback[currentPlaybackAyahIndex].duration);
    }


    if (isPlaying) { // If was playing, continue from new spot
        DOMElements.mainAudioPlayer.play();
        if (animationFrameId) cancelAnimationFrame(animationFrameId); // Stop old loop
        animateTextAndTimeline(); // Restart with new time
    }
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}
function updateTimelineDisplay(currentTime, totalDuration) {
    DOMElements.currentTimeDisplay.textContent = formatTime(currentTime);
    DOMElements.totalTimeDisplay.textContent = formatTime(totalDuration);
}

// --- Speech Recognition ---
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = false;
        speechRecognition.lang = 'ar-SA';
        speechRecognition.interimResults = false;
        speechRecognition.maxAlternatives = 1;

        speechRecognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript.toLowerCase();
            console.log('Speech result:', speechResult);
            DOMElements.voiceSearchStatus.textContent = `سمعت: ${speechResult}`;
            DOMElements.voiceSearchQuranBtn.classList.remove('listening');
            // Try to match surah or reciter
            matchSpeechToQuranData(speechResult);
        };
        speechRecognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            DOMElements.voiceSearchStatus.textContent = "خطأ في التعرف";
            DOMElements.voiceSearchQuranBtn.classList.remove('listening');
            if(event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                alert("يرجى السماح بالوصول إلى الميكروفون لاستخدام البحث الصوتي.");
            }
        };
        speechRecognition.onend = () => {
            DOMElements.voiceSearchQuranBtn.classList.remove('listening');
            if (DOMElements.voiceSearchStatus.textContent.startsWith("سمعت:") || DOMElements.voiceSearchStatus.textContent === "خطأ في التعرف") {
                // keep message for a bit
            } else {
                 DOMElements.voiceSearchStatus.textContent = "البحث الصوتي";
            }
        };
    } else {
        console.warn('Speech Recognition not supported in this browser.');
        DOMElements.voiceSearchQuranBtn.disabled = true;
        DOMElements.voiceSearchStatus.textContent = "البحث الصوتي غير مدعوم";
    }
}
function toggleVoiceSearch() {
    if (!speechRecognition) return;
    if (DOMElements.voiceSearchQuranBtn.classList.contains('listening')) {
        speechRecognition.stop();
        DOMElements.voiceSearchQuranBtn.classList.remove('listening');
        DOMElements.voiceSearchStatus.textContent = "البحث الصوتي";
    } else {
        try {
            speechRecognition.start();
            DOMElements.voiceSearchQuranBtn.classList.add('listening');
            DOMElements.voiceSearchStatus.textContent = "استمع الآن...";
        } catch (e) {
            console.error("Could not start speech recognition:", e);
            DOMElements.voiceSearchStatus.textContent = "فشل بدء البحث الصوتي";
             DOMElements.voiceSearchQuranBtn.classList.remove('listening');
        }
    }
}
function matchSpeechToQuranData(spokenText) {
    // 1. Match Surah (Arabic name, English name, transliteration)
    for (const surah of surahData) {
        if (spokenText.includes(surah.name.toLowerCase().replace("سورة ", "")) ||
            spokenText.includes(surah.englishName.toLowerCase()) ||
            spokenText.includes(surah.englishNameTranslation.toLowerCase())) {
            DOMElements.surahSelect.value = surah.number;
            handleSurahChangeWithState(); // This will update ayahs & audio
            DOMElements.voiceSearchStatus.textContent = `تم اختيار: ${surah.name}`;
            return;
        }
    }
    // 2. Match Reciter
    for (const reciter of recitersData) {
        if (spokenText.includes(reciter.name.toLowerCase()) || spokenText.includes(reciter.englishName.toLowerCase())) {
            DOMElements.reciterSelect.value = reciter.identifier;
            updateCurrentProjectSettings(); addStateToHistory(); loadAyahsForPlayback();
            DOMElements.voiceSearchStatus.textContent = `تم اختيار القارئ: ${reciter.name}`;
            return;
        }
    }
    DOMElements.voiceSearchStatus.textContent = `لم يتم العثور على تطابق لـ "${spokenText}"`;
}

// --- Video Export (largely same, but uses updated drawTextOnCanvas) ---
async function exportVideo() { /* ... (exportVideo function as previously defined, ensure it uses the updated drawTextOnCanvasForPreview or a dedicated export version) ... */
    // Key change: Use drawTextOnCanvasForPreview for consistency or create a specific export version.
    // The audio concatenation/merging with ffmpeg.wasm is still the missing piece for full export.
    // The rest of frame generation logic using CCapture should be similar.
    alert("التصدير مع دمج الصوت لا يزال قيد التطوير المكثف (يتطلب FFmpeg.wasm). سيتم تصدير إطارات الفيديو فقط حاليًا.");
    // The actual frame rendering loop:
    // ...
    // Inside loop: drawTextOnCanvasForPreview(tempCtx, ayahData.text, ayahData.translation, surahNameForExport, exportWidth, exportHeight, currentProject, animationProgressForExport);
    // ...
}
function wrapText(context, text, maxWidth) { /* ... (wrapText as before) ... */ 
    if (!text) return [""];
    const words = text.split(' ');
    const lines = [];
    if (words.length === 0) return [""];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + " " + word).width;
        if (width < maxWidth || currentLine === "") { // Allow single very long word to exceed on its own line
            currentLine += (currentLine === "" ? "" : " ") + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// --- Project Management (Save/Load from LocalStorage) ---
function saveProject(projectToSave) { /* ... (saveProject as before) ... */ 
    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    const existingIndex = projects.findIndex(p => p.id === projectToSave.id);
    if (existingIndex > -1) {
        projects[existingIndex] = projectToSave;
    } else {
        projects.push(projectToSave);
    }
    localStorage.setItem('quranVideoProjects', JSON.stringify(projects));
}
function loadProjects() { /* ... (loadProjects as before, ensure it uses cached DOMElements.projectsList etc.) ... */ 
    DOMElements.projectsList.innerHTML = '';
    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    if (projects.length === 0) { DOMElements.noProjectsMessage.style.display = 'block'; return; }
    DOMElements.noProjectsMessage.style.display = 'none';
    projects.forEach(proj => { /* ... card creation and event listeners ... */ });
}
function loadProjectIntoEditor(project) {
    currentProject = JSON.parse(JSON.stringify(project)); // Deep copy for editing

    DOMElements.currentProjectTitleEditor.textContent = currentProject.name;
    if (currentProject.surah) DOMElements.surahSelect.value = currentProject.surah;
    
    handleSurahChange(); // Populate ayahs first
    
    // Defer setting ayah selects slightly to ensure options are populated
    setTimeout(() => {
        if (currentProject.startAyah) DOMElements.ayahStartSelect.value = currentProject.startAyah;
        if (currentProject.endAyah) DOMElements.ayahEndSelect.value = currentProject.endAyah;
        validateAyahRange(); // Ensure valid range after loading
        // After ayahs are set, load audio
        loadAyahsForPlayback();
    }, 50);


    if (currentProject.reciter) DOMElements.reciterSelect.value = currentProject.reciter;
    if (currentProject.translation) DOMElements.translationSelect.value = currentProject.translation;

    DOMElements.fontSelect.value = currentProject.font;
    DOMElements.fontSizeSlider.value = currentProject.fontSize;
    DOMElements.fontSizeValue.textContent = currentProject.fontSize + 'px';
    DOMElements.fontColorPicker.value = currentProject.fontColor;
    DOMElements.ayahBgColorPicker.value = currentProject.ayahBgColor;
    DOMElements.textEffectSelect.value = currentProject.textEffect;
    
    DOMElements.aspectRatioSelect.value = currentProject.aspectRatio || '16:9';
    DOMElements.videoFilterSelect.value = currentProject.videoFilter || 'none';
    updatePreviewAspectRatio(); // This calls updatePreview too

    // Load background
    if (currentProject.background.type === 'image' && currentProject.background.value) {
        const img = new Image();
        img.onload = () => { backgroundImage = img; backgroundType = 'image'; updatePreview(); };
        img.onerror = () => { console.warn("Failed to load project background image:", currentProject.background.value); backgroundType = 'color'; updatePreview(); };
        img.src = currentProject.background.value; // Assumes value is a dataURL or accessible URL
    } else if (currentProject.background.type === 'video' && currentProject.background.value) {
        if(backgroundVideoAnimationId) cancelAnimationFrame(backgroundVideoAnimationId);
        backgroundVideo = document.createElement('video');
        backgroundVideo.src = currentProject.background.value;
        backgroundVideo.muted = true; backgroundVideo.loop = true;
        backgroundVideo.oncanplay = () => {
            backgroundType = 'video'; backgroundVideo.play();
            function videoLoop() { if (backgroundType === 'video' && backgroundVideo && !backgroundVideo.paused) { updatePreview(); backgroundVideoAnimationId = requestAnimationFrame(videoLoop); } }
            videoLoop();
        };
        backgroundVideo.onerror = () => { console.warn("Failed to load project background video:", currentProject.background.value); backgroundType = 'color'; updatePreview(); };
    } else {
        backgroundType = 'color'; // Defaults to color if image/video fails or not set
        updatePreview();
    }

    DOMElements.delayBetweenAyahsInput.value = currentProject.delayBetweenAyahs;
    DOMElements.resolutionSelect.value = currentProject.resolution;
    DOMElements.transitionSelect.value = currentProject.videoTransition;

    // updatePreview(); // Called by aspectRatio update or background load
    closeAllPanels();
}
function deleteProject(projectId) { /* ... (deleteProject as before) ... */ }

// --- Theme Management ---
function loadTheme() { /* ... */ } function toggleTheme() { /* ... */ } function updateThemeButtonText(theme) { /* ... */ }
// --- Pexels API Key ---
// function saveLastPexelsKey(key) { localStorage.setItem(PEXELS_API_KEY_STORAGE_KEY, key); }
// function getLastPexelsKey() { return localStorage.getItem(PEXELS_API_KEY_STORAGE_KEY) || ''; }
// --- Loading Spinner ---
function showLoading() { DOMElements.loadingSpinner.style.display = 'flex'; }
function hideLoading() { DOMElements.loadingSpinner.style.display = 'none'; }
