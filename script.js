// ... (بداية الملف كما هي: global variables, helper functions) ...
let PEXELS_API_KEY = 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7'; // Initialize, will be set by user or hardcoded for dev
const ALQURAN_CLOUD_API_BASE = 'https://api.alquran.cloud/v1';
const PEXELS_API_BASE = 'https://api.pexels.com/v1';

// DOM Elements
const initialScreen = document.getElementById('initial-screen');
const editorScreen = document.getElementById('editor-screen');
const goToEditorBtn = document.getElementById('go-to-editor-btn');
const backToInitialScreenBtn = document.getElementById('back-to-initial-screen-btn');
const currentProjectTitleDisplay = document.getElementById('current-project-title'); // In new top bar
const saveProjectBtnEditor = document.getElementById('save-project-btn-editor'); // New save button in editor

const projectsList = document.getElementById('projects-list');
const noProjectsMessage = document.getElementById('no-projects-message');

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

const importBackgroundInput = document.getElementById('import-background');
const applyAiBgBtn = document.getElementById('apply-ai-bg');
const aiBgSuggestionsDiv = document.getElementById('ai-bg-suggestions');
const aiBgSuggestionsLoader = document.getElementById('ai-bg-suggestions-loader');

const playPauseAudioPreviewBtn = document.getElementById('play-pause-audio-preview-btn');
const stopAudioPreviewBtn = document.getElementById('stop-audio-preview-btn');
const audioPreviewStatus = document.getElementById('audio-preview-status');
const delayBetweenAyahsInput = document.getElementById('delay-between-ayahs');

const resolutionSelect = document.getElementById('resolution-select');
const transitionSelect = document.getElementById('transition-select');
const exportBtn = document.getElementById('export-btn');
const exportProgressDiv = document.getElementById('export-progress');
const exportProgressBar = document.getElementById('export-progress-bar');
const exportProgressText = document.getElementById('export-progress-text');

const videoPreviewCanvas = document.getElementById('video-preview-canvas');
const previewSurahTitle = document.getElementById('preview-surah-title');
const previewAyahText = document.getElementById('preview-ayah-text');
const previewTranslationText = document.getElementById('preview-translation-text');
const ayahAudioPlayer = document.getElementById('ayah-audio-player');

const loadingSpinner = document.getElementById('loading-spinner');
const themeToggleInitial = document.getElementById('theme-toggle-initial');
const themeToggleEditor = document.getElementById('theme-toggle-editor');

// New Editor UI Elements
const mainBottomTabBar = document.getElementById('main-bottom-tab-bar');
const mainTabButtons = document.querySelectorAll('.main-tab-button');
const controlPanels = document.querySelectorAll('.control-panel');
const panelCloseButtons = document.querySelectorAll('.panel-action-button.close-panel-btn');
const panelConfirmButtons = document.querySelectorAll('.panel-action-button.confirm-panel-btn');


// Playback Controls (New)
const playPauseMainBtn = document.getElementById('play-pause-main-btn');
const rewindBtn = document.getElementById('rewind-btn');
const fastForwardBtn = document.getElementById('fast-forward-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const timelineSlider = document.getElementById('timeline-slider');
const currentTimeDisplay = document.getElementById('current-time-display');
const totalTimeDisplay = document.getElementById('total-time-display');

// State variables
let currentProject = createNewProject();
let surahData = [];
let recitersData = [];
let translationsData = [];
let currentAyahIndex = 0;
let ayahsForPreview = [];
let audioObjects = [];
let capturer = null;
let backgroundType = 'color'; // 'color', 'image', 'video'
let backgroundImage = null;
let backgroundVideo = null;
let isAudioPreviewPlaying = false;
let currentPlayingAudio = null;
let lastUsedPexelsKey = '';


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    // PEXELS_API_KEY = prompt("الرجاء إدخال مفتاح Pexels API الخاص بك (اختياري):", getLastPexelsKey()) || '';
    // if (PEXELS_API_KEY) saveLastPexelsKey(PEXELS_API_KEY);
    // else alert("بدون مفتاح Pexels API، لن تعمل خاصية اقتراح الخلفيات بالذكاء الاصطناعي.");
});

function initApp() {
    loadTheme();
    loadProjects();
    fetchSurahs();
    fetchReciters();
    fetchTranslations();
    setupEventListeners();
    updatePreview(); // Initial preview update
    // Default to Quran panel open? Or none? Let's start with none.
    // openPanel('quran-selection-panel'); // Example: open Quran panel by default
}

function createNewProject(id = Date.now().toString()) {
    return {
        id: id,
        name: "مشروع جديد",
        surah: null,
        startAyah: null,
        endAyah: null,
        reciter: null,
        translation: '',
        font: "'Amiri Quran', serif",
        fontSize: 48,
        fontColor: '#FFFFFF',
        ayahBgColor: 'rgba(0,0,0,0.3)',
        textEffect: 'none',
        background: { type: 'color', value: '#333333' }, // Default dark bg for preview
        delayBetweenAyahs: 1,
        resolution: '1920x1080',
        videoTransition: 'fade',
        // Add more project-specific settings as needed
    };
}


function setupEventListeners() {
    goToEditorBtn.addEventListener('click', () => {
        currentProject = createNewProject();
        loadProjectIntoEditor(currentProject);
        initialScreen.style.display = 'none';
        editorScreen.style.display = 'flex'; // Changed to flex
        currentProjectTitleDisplay.textContent = currentProject.name;
        // closeAllPanels(); // Ensure all panels are closed initially
        // openPanel('quran-selection-panel'); // Optionally open a default panel
    });

    backToInitialScreenBtn.addEventListener('click', () => {
        saveCurrentProjectState(); // Save before going back
        editorScreen.style.display = 'none';
        initialScreen.style.display = 'block'; // or 'flex' if it's flex
        loadProjects(); // Refresh project list
    });
    
    saveProjectBtnEditor.addEventListener('click', () => {
        const projectName = prompt("أدخل اسم المشروع:", currentProject.name);
        if (projectName) {
            currentProject.name = projectName;
            currentProjectTitleDisplay.textContent = projectName;
            saveCurrentProjectState();
            saveProject(currentProject);
            alert("تم حفظ المشروع!");
        }
    });

    // Theme toggles
    [themeToggleInitial, themeToggleEditor].forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });

    // Quran selection
    surahSelect.addEventListener('change', handleSurahChange);
    ayahStartSelect.addEventListener('change', updateCurrentProjectSettings);
    ayahEndSelect.addEventListener('change', updateCurrentProjectSettings);
    reciterSelect.addEventListener('change', updateCurrentProjectSettings);
    translationSelect.addEventListener('change', updateCurrentProjectSettings);

    // Text styling
    fontSelect.addEventListener('change', updateCurrentProjectSettings);
    fontSizeSlider.addEventListener('input', (e) => {
        fontSizeValue.textContent = e.target.value + 'px';
        updateCurrentProjectSettings();
    });
    fontColorPicker.addEventListener('input', updateCurrentProjectSettings);
    ayahBgColorPicker.addEventListener('input', updateCurrentProjectSettings);
    textEffectSelect.addEventListener('change', updateCurrentProjectSettings);

    // Background
    importBackgroundInput.addEventListener('change', handleBackgroundImport);
    applyAiBgBtn.addEventListener('click', fetchAiBackgroundSuggestions);

    // Audio Preview
    playPauseAudioPreviewBtn.addEventListener('click', toggleAyahAudioPreview);
    stopAudioPreviewBtn.addEventListener('click', stopAyahAudioPreview);
    delayBetweenAyahsInput.addEventListener('change', updateCurrentProjectSettings);
    
    // Export
    resolutionSelect.addEventListener('change', updateCurrentProjectSettings);
    transitionSelect.addEventListener('change', updateCurrentProjectSettings);
    exportBtn.addEventListener('click', exportVideo);

    // NEW UI Event Listeners
    mainTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanelId = button.dataset.targetPanel;
            // Toggle panel: if it's already open and clicked again, close it. Otherwise, open it.
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel.classList.contains('visible') && button.classList.contains('active')) {
                closePanel(targetPanelId);
            } else {
                openPanel(targetPanelId);
            }
        });
    });

    panelCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            closePanel(button.dataset.panelid);
        });
    });
    panelConfirmButtons.forEach(button => { // For buttons like "Confirm" on Quran panel
        button.addEventListener('click', () => {
            // Potentially do validation or specific actions before closing
            updatePreview(); // Make sure preview updates on confirm
            closePanel(button.dataset.panelid);
        });
    });


    // Placeholder for new playback controls
    playPauseMainBtn.addEventListener('click', () => { console.log('Play/Pause Main Video'); /* Implement me */ });
    rewindBtn.addEventListener('click', () => { console.log('Rewind'); /* Implement me */ });
    fastForwardBtn.addEventListener('click', () => { console.log('Fast Forward'); /* Implement me */ });
    undoBtn.addEventListener('click', () => { console.log('Undo'); /* Implement me */ });
    redoBtn.addEventListener('click', () => { console.log('Redo'); /* Implement me */ });
    timelineSlider.addEventListener('input', (e) => {
        console.log('Timeline scrub to:', e.target.value);
        // Update current time display if needed
        // Seek video/audio preview
    });

    // Update preview on any relevant input change within panels
    const allPanelInputs = document.querySelectorAll('.control-panel select, .control-panel input');
    allPanelInputs.forEach(input => {
        if (input.id !== 'import-background' && input.type !== 'file') { // Avoid re-triggering file import
             input.addEventListener('change', () => {
                // updateCurrentProjectSettings(); // This is already called for many
                updatePreview();
            });
        }
    });
}

// --- New Panel Management ---
let activePanelId = null;

function openPanel(panelId) {
    closeAllPanels(); // Close any currently open panel

    const panel = document.getElementById(panelId);
    const correspondingTabButton = document.querySelector(`.main-tab-button[data-target-panel="${panelId}"]`);

    if (panel) {
        panel.classList.add('visible');
        activePanelId = panelId;
    }
    if (correspondingTabButton) {
        mainTabButtons.forEach(btn => btn.classList.remove('active'));
        correspondingTabButton.classList.add('active');
    }
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId);
    const correspondingTabButton = document.querySelector(`.main-tab-button[data-target-panel="${panelId}"]`);

    if (panel) {
        panel.classList.remove('visible');
        if (activePanelId === panelId) {
            activePanelId = null;
        }
    }
    if (correspondingTabButton) {
        correspondingTabButton.classList.remove('active');
    }
}

function closeAllPanels() {
    controlPanels.forEach(panel => {
        panel.classList.remove('visible');
    });
    mainTabButtons.forEach(btn => btn.classList.remove('active'));
    activePanelId = null;
}


// --- API Fetching (Surahs, Reciters, Translations) ---
async function fetchSurahs() {
    try {
        showLoading();
        const response = await axios.get(`${ALQURAN_CLOUD_API_BASE}/surah`);
        surahData = response.data.data;
        surahSelect.innerHTML = surahData.map(s => `<option value="${s.number}">${s.number}. ${s.name} (${s.englishName})</option>`).join('');
        if (currentProject.surah) surahSelect.value = currentProject.surah;
        handleSurahChange(); // Populate ayahs for the default/loaded surah
    } catch (error) {
        console.error("Error fetching surahs:", error);
        alert("فشل تحميل قائمة السور. يرجى التحقق من اتصالك بالإنترنت.");
    } finally {
        hideLoading();
    }
}

async function fetchReciters() {
    try {
        // Opting for a curated list for better quality and less API calls if the full list is too large/varied
        // const response = await axios.get(`${ALQURAN_CLOUD_API_BASE}/edition/format/audio`);
        // recitersData = response.data.data;
        recitersData = [ // Example curated list
            { identifier: "ar.abdulsamad", englishName: "Abdul Samad", name: "عبد الباسط عبد الصمد (مرتل)"},
            { identifier: "ar.alafasy", englishName: "Mishary Rashid Alafasy", name: "مشاري راشد العفاسي"},
            { identifier: "ar.minshawi", englishName: "Mohamed Siddiq El-Minshawi", name: "محمد صديق المنشاوي (مرتل)"},
            { identifier: "ar.mahermuaiqly", englishName: "Maher Al Muaiqly", name: "ماهر المعيقلي"},
            // Add more as needed
        ];
        reciterSelect.innerHTML = recitersData.map(r => `<option value="${r.identifier}">${r.name}</option>`).join('');
        if (currentProject.reciter) reciterSelect.value = currentProject.reciter;
        else if(recitersData.length > 0) { // Select first reciter by default
            reciterSelect.value = recitersData[0].identifier;
            currentProject.reciter = recitersData[0].identifier;
        }

    } catch (error) {
        console.error("Error fetching reciters:", error);
        // alert("فشل تحميل قائمة القراء."); // Can be noisy if API is down
    }
}

async function fetchTranslations() {
     try {
        // Fetching editions that are quran text type (for translation)
        // const response = await axios.get(`${ALQURAN_CLOUD_API_BASE}/edition/type/translation`);
        // translationsData = response.data.data;
         translationsData = [ // Example curated list of translations
            { identifier: "en.sahih", englishName: "Sahih International", name: "Sahih International (English)"},
            { identifier: "es.cortes", englishName: "Cortes (Spanish)", name: "Julio Cortes (Español)"},
            { identifier: "fr.hamidullah", englishName: "Hamidullah (French)", name: "Muhammad Hamidullah (Français)"},
            // Add more common translations
        ];
        translationSelect.innerHTML += translationsData.map(t => `<option value="${t.identifier}">${t.name}</option>`).join('');
        if (currentProject.translation) translationSelect.value = currentProject.translation;
    } catch (error)
    {
        console.error("Error fetching translations:", error);
    }
}


function handleSurahChange() {
    const surahNumber = surahSelect.value;
    if (!surahNumber) return;

    const selectedSurah = surahData.find(s => s.number == surahNumber);
    if (!selectedSurah) return;

    ayahStartSelect.innerHTML = '';
    ayahEndSelect.innerHTML = '';
    for (let i = 1; i <= selectedSurah.numberOfAyahs; i++) {
        ayahStartSelect.innerHTML += `<option value="${i}">${i}</option>`;
        ayahEndSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
    // Sensible defaults or load from project
    ayahStartSelect.value = currentProject.startAyah || 1;
    ayahEndSelect.value = currentProject.endAyah || selectedSurah.numberOfAyahs;
    
    updateCurrentProjectSettings();
}


function updateCurrentProjectSettings() {
    // This function should be robustly collecting all settings from the UI
    // and updating the currentProject object.
    currentProject.surah = surahSelect.value ? parseInt(surahSelect.value) : null;
    currentProject.startAyah = ayahStartSelect.value ? parseInt(ayahStartSelect.value) : null;
    currentProject.endAyah = ayahEndSelect.value ? parseInt(ayahEndSelect.value) : null;
    currentProject.reciter = reciterSelect.value;
    currentProject.translation = translationSelect.value;

    currentProject.font = fontSelect.value;
    currentProject.fontSize = parseInt(fontSizeSlider.value);
    currentProject.fontColor = fontColorPicker.value;
    currentProject.ayahBgColor = ayahBgColorPicker.value;
    currentProject.textEffect = textEffectSelect.value;
    
    // Background is handled by handleBackgroundImport and applyAiBackground
    // currentProject.background remains as set by those functions

    currentProject.delayBetweenAyahs = parseFloat(delayBetweenAyahsInput.value);
    currentProject.resolution = resolutionSelect.value;
    currentProject.videoTransition = transitionSelect.value;
    
    currentProjectTitleDisplay.textContent = currentProject.name; // Keep title updated if name changes via prompt

    updatePreview();
}


// --- Preview Rendering ---
const ctx = videoPreviewCanvas.getContext('2d');

async function updatePreview(ayahContent = null, translationContent = null) {
    const [width, height] = currentProject.resolution.split('x').map(Number);
    videoPreviewCanvas.width = width; // Use actual export resolution for canvas
    videoPreviewCanvas.height = height; // This might make preview large, consider scaling CSS
    
    // For display, scale canvas via CSS to fit #video-preview-container
    // The #video-preview-container has aspect-ratio and max-width to control its visual size.
    // The canvas itself should maintain its target resolution.

    // 1. Draw Background
    if (backgroundType === 'image' && backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
    } else if (backgroundType === 'video' && backgroundVideo) {
        try {
            ctx.drawImage(backgroundVideo, 0, 0, width, height);
        } catch (e) { // Video might not be ready or might have failed
            console.warn("Could not draw video background frame:", e);
            drawDefaultBackground(width, height);
        }
    } else { // color or default
        ctx.fillStyle = currentProject.background.value || '#333333';
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Prepare Text
    let textToDisplay = ayahContent ? ayahContent.text : "الآية هنا";
    let translationToDisplay = translationContent ? translationContent.text : (currentProject.translation ? "الترجمة هنا" : "");
    
    const selectedSurah = currentProject.surah ? surahData.find(s => s.number == currentProject.surah) : null;
    previewSurahTitle.textContent = selectedSurah ? selectedSurah.name : "اختر سورة";
    previewSurahTitle.style.display = selectedSurah ? 'block' : 'none'; // Show/hide based on selection

    // These elements are HTML overlays, not drawn on canvas directly for live preview
    // For export, they WILL be drawn on canvas
    previewAyahText.textContent = textToDisplay;
    previewAyahText.style.fontFamily = currentProject.font;
    previewAyahText.style.fontSize = `${currentProject.fontSize}px`; // Adjust for canvas scale if needed
    previewAyahText.style.color = currentProject.fontColor;
    previewAyahText.style.backgroundColor = currentProject.ayahBgColor;
    // Adjust text overlay size relative to canvas resolution for better scaling
    const overlayScaleFactor = videoPreviewCanvas.clientWidth / width; // How much CSS scales canvas
    previewAyahText.style.fontSize = `${currentProject.fontSize * overlayScaleFactor * 0.6}px`; // Adjust for typical preview size

    previewTranslationText.textContent = translationToDisplay;
    previewTranslationText.style.display = translationToDisplay ? 'block' : 'none';
    previewTranslationText.style.fontSize = `${currentProject.fontSize * 0.5 * overlayScaleFactor * 0.6}px`;


    // If we were drawing text directly on canvas (e.g., for export frame generation):
    // drawTextOnCanvas(ctx, textToDisplay, translationToDisplay, width, height, currentProject);
}

function drawDefaultBackground(width, height) {
    ctx.fillStyle = currentProject.background.value || '#333333';
    ctx.fillRect(0, 0, width, height);
}


// --- Background Handling ---
function handleBackgroundImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        if (file.type.startsWith('image/')) {
            backgroundImage = new Image();
            backgroundImage.onload = () => {
                backgroundType = 'image';
                currentProject.background = { type: 'image', value: backgroundImage.src }; // Store src for project save
                updatePreview();
            };
            backgroundImage.onerror = () => alert("فشل تحميل الصورة.");
            backgroundImage.src = e.target.result;
        } else if (file.type.startsWith('video/')) {
            backgroundVideo = document.createElement('video');
            backgroundVideo.src = e.target.result;
            backgroundVideo.muted = true;
            backgroundVideo.loop = true;
            backgroundVideo.oncanplay = () => {
                backgroundType = 'video';
                currentProject.background = { type: 'video', value: backgroundVideo.src }; // Store src
                backgroundVideo.play(); // Start playing for preview
                updatePreview(); // Initial frame
                // Need a loop to continuously update preview if video is playing
                // This is simplified; for export, CCapture will handle frame-by-frame
                function videoPreviewLoop() {
                    if (backgroundType === 'video' && backgroundVideo && !backgroundVideo.paused) {
                        updatePreview();
                        requestAnimationFrame(videoPreviewLoop);
                    }
                }
                requestAnimationFrame(videoPreviewLoop);
            };
            backgroundVideo.onerror = () => alert("فشل تحميل الفيديو.");
        } else {
            alert("نوع الملف غير مدعوم. الرجاء اختيار صورة أو فيديو.");
        }
    };
    reader.readAsDataURL(file);
}

async function fetchAiBackgroundSuggestions() {
    // ... (PEXELS API Key check remains the same)
    if (!PEXELS_API_KEY) {
        PEXELS_API_KEY = prompt("لاستخدام اقتراحات الخلفيات، يرجى إدخال مفتاح Pexels API الخاص بك:", getLastPexelsKey()) || '';
        if (PEXELS_API_KEY) saveLastPexelsKey(PEXELS_API_KEY);
        else {
            alert("بدون مفتاح Pexels API، لن تعمل هذه الخاصية.");
            return;
        }
    }

    const selectedSurah = currentProject.surah ? surahData.find(s => s.number == currentProject.surah) : null;
    if (!selectedSurah) {
        alert("يرجى اختيار سورة أولاً.");
        return;
    }
    const query = selectedSurah.englishName.split(' ')[0] + " nature"; // Simple query
    aiBgSuggestionsLoader.style.display = 'block';
    aiBgSuggestionsDiv.innerHTML = '';

    try {
        const response = await axios.get(`${PEXELS_API_BASE}/search`, {
            headers: { Authorization: PEXELS_API_KEY },
            params: { query: query, per_page: 10, orientation: 'landscape' }
        });
        if (response.data.photos.length === 0) {
            aiBgSuggestionsDiv.innerHTML = '<p>لم يتم العثور على اقتراحات.</p>';
        } else {
            response.data.photos.forEach(photo => {
                const imgEl = document.createElement('img');
                imgEl.src = photo.src.medium;
                imgEl.alt = photo.alt || 'AI Suggested Background';
                imgEl.title = photo.alt || 'AI Suggested Background';
                imgEl.addEventListener('click', () => {
                    backgroundImage = new Image();
                    backgroundImage.crossOrigin = "Anonymous"; // For canvas if needed later
                    backgroundImage.onload = () => {
                        backgroundType = 'image';
                        currentProject.background = { type: 'image', value: backgroundImage.src };
                        updatePreview();
                         // Remove selection from other AI images
                        document.querySelectorAll('#ai-bg-suggestions img.selected-ai-bg').forEach(el => el.classList.remove('selected-ai-bg'));
                        imgEl.classList.add('selected-ai-bg'); // Mark as selected
                    };
                    backgroundImage.onerror = () => alert("فشل تحميل الصورة المختارة من Pexels.");
                    backgroundImage.src = photo.src.large2x; // Use a larger version for the actual background
                });
                aiBgSuggestionsDiv.appendChild(imgEl);
            });
        }
    } catch (error) {
        console.error("Error fetching from Pexels:", error);
        if (error.response && error.response.status === 401) {
             alert("خطأ في مفتاح Pexels API. يرجى التحقق منه.");
             PEXELS_API_KEY = ''; // Reset key to force re-prompt
             saveLastPexelsKey('');
        } else {
            aiBgSuggestionsDiv.innerHTML = '<p>فشل تحميل الاقتراحات. تحقق من الاتصال أو مفتاح API.</p>';
        }
    } finally {
        aiBgSuggestionsLoader.style.display = 'none';
    }
}


// --- Audio Preview (for individual ayahs or selections) ---
async function toggleAyahAudioPreview() {
    if (isAudioPreviewPlaying) {
        stopAyahAudioPreview();
        return;
    }
    if (!currentProject.surah || !currentProject.startAyah || !currentProject.endAyah || !currentProject.reciter) {
        alert("يرجى تحديد السورة، نطاق الآيات، والقارئ أولاً.");
        return;
    }

    showLoading();
    audioPreviewStatus.textContent = "جاري تحميل الصوت...";
    isAudioPreviewPlaying = true;
    playPauseAudioPreviewBtn.innerHTML = '<i class="fas fa-pause-circle"></i> إيقاف مؤقت';
    stopAudioPreviewBtn.style.display = 'inline-block';

    ayahsForPreview = [];
    audioObjects = []; // Clear previous audio objects

    try {
        // Fetch all ayahs in range (text and audio)
        // For simplicity, let's fetch audio for each ayah one by one for preview
        // A more robust solution would fetch a combined audio segment if API supports it, or use an audio sprite sheet.
        let ayahCounter = 0;
        for (let i = currentProject.startAyah; i <= currentProject.endAyah; i++) {
            const ayahNumberInQuran = surahData.find(s => s.number == currentProject.surah).ayahs[i-1].number; // Get global ayah number
            const ayahResponse = await axios.get(`${ALQURAN_CLOUD_API_BASE}/ayah/${ayahNumberInQuran}/${currentProject.reciter}`);
            const textResponse = await axios.get(`${ALQURAN_CLOUD_API_BASE}/ayah/${ayahNumberInQuran}${currentProject.translation ? '/' + currentProject.translation : ''}`);
            
            ayahsForPreview.push({
                text: textResponse.data.data.text,
                translation: currentProject.translation ? textResponse.data.data.translation.text : null, // Adjust based on actual API response for translation
                audio: ayahResponse.data.data.audio,
                duration: ayahResponse.data.data.audioSecondary ? (ayahResponse.data.data.audioSecondary.duration / 1000) : 5 // Estimate duration
            });
            
            const audio = new Audio(ayahResponse.data.data.audio);
            audioObjects.push(audio);
            
            if (ayahCounter === 0) { // First ayah
                 updatePreview(ayahsForPreview[0], ayahsForPreview[0]); // Show first ayah text
            }
            ayahCounter++;
        }
        
        currentAyahIndex = 0;
        playNextAyahInPreview();

    } catch (error) {
        console.error("Error fetching ayahs for preview:", error);
        alert("فشل تحميل بيانات الآيات للمعاينة الصوتية.");
        stopAyahAudioPreview(); // Reset state
    } finally {
        hideLoading();
    }
}

function playNextAyahInPreview() {
    if (currentAyahIndex < audioObjects.length && isAudioPreviewPlaying) {
        currentPlayingAudio = audioObjects[currentAyahIndex];
        const currentAyahData = ayahsForPreview[currentAyahIndex];
        
        audioPreviewStatus.textContent = `تشغيل الآية ${currentProject.startAyah + currentAyahIndex}...`;
        updatePreview(currentAyahData, currentAyahData); // Update text to current ayah

        currentPlayingAudio.play();
        currentPlayingAudio.onended = () => {
            currentAyahIndex++;
            setTimeout(playNextAyahInPreview, currentProject.delayBetweenAyahs * 1000); // Apply delay
        };
        currentPlayingAudio.onerror = () => {
            console.error("Error playing audio for ayah:", currentAyahData);
            audioPreviewStatus.textContent = `خطأ في تشغيل صوت الآية ${currentProject.startAyah + currentAyahIndex}.`;
            // Optionally, try to skip to next or stop
            currentAyahIndex++;
            setTimeout(playNextAyahInPreview, currentProject.delayBetweenAyahs * 1000);
        };
    } else {
        stopAyahAudioPreview(); // All ayahs played or preview stopped
    }
}

function stopAyahAudioPreview() {
    isAudioPreviewPlaying = false;
    if (currentPlayingAudio) {
        currentPlayingAudio.pause();
        currentPlayingAudio.currentTime = 0;
    }
    audioObjects.forEach(audio => { audio.pause(); audio.currentTime = 0; }); // Stop all
    audioObjects = [];
    playPauseAudioPreviewBtn.innerHTML = '<i class="fas fa-play-circle"></i> تشغيل معاينة الصوت';
    stopAudioPreviewBtn.style.display = 'none';
    audioPreviewStatus.textContent = "";
    currentAyahIndex = 0;
    updatePreview(); // Reset preview to default or first ayah if needed
}


// --- Video Export ---
// ... (exportVideo, drawTextOnCanvas, applyTextEffect functions remain the same for now)
// Note: drawTextOnCanvas will need to be called by exportVideo now, not by updatePreview for live view.
// updatePreview is for the HTML overlays.

async function exportVideo() {
    if (!currentProject.surah || !currentProject.startAyah || !currentProject.endAyah || !currentProject.reciter) {
        alert("يرجى تحديد السورة، نطاق الآيات، والقارئ أولاً.");
        return;
    }

    showLoading();
    exportProgressDiv.style.display = 'block';
    exportProgressBar.value = 0;
    exportProgressText.textContent = '0%';

    const [exportWidth, exportHeight] = currentProject.resolution.split('x').map(Number);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportWidth;
    tempCanvas.height = exportHeight;
    const tempCtx = tempCanvas.getContext('2d');

    capturer = new CCapture({
        format: 'webm', // or 'png' for image sequence, 'gif'
        framerate: 25,
        verbose: false,
        name: `QuranVideo_${currentProject.name.replace(/\s+/g, '_')}_${Date.now()}`,
        quality: 90, // For webm, lower might be needed for performance/size
    });

    let exportAyahsData = [];
    let exportAudioUrls = []; // URLs for FFmpeg or direct download

    try {
        // 1. Fetch all Ayah data (text, translation, audio) for export
        for (let i = currentProject.startAyah; i <= currentProject.endAyah; i++) {
            const ayahNumberInQuran = surahData.find(s => s.number == currentProject.surah).ayahs[i-1].number;
            const ayahTextEdition = currentProject.translation ? `${ayahNumberInQuran}/${currentProject.translation}` : `${ayahNumberInQuran}`;
            
            const [ayahResponse, audioResponse] = await Promise.all([
                axios.get(`${ALQURAN_CLOUD_API_BASE}/ayah/${ayahTextEdition}`),
                axios.get(`${ALQURAN_CLOUD_API_BASE}/ayah/${ayahNumberInQuran}/${currentProject.reciter}`)
            ]);

            exportAyahsData.push({
                text: ayahResponse.data.data.text,
                translation: currentProject.translation ? ayahResponse.data.data.translation.text : null,
                audioUrl: audioResponse.data.data.audio,
                // Attempt to get duration. This is tricky without loading audio.
                // For now, we'll estimate or rely on playback to determine frame counts.
                // A better approach would be to load all audio first, get durations, then render.
            });
            exportAudioUrls.push(audioResponse.data.data.audio);
        }
    } catch (error) {
        console.error("Error fetching data for export:", error);
        alert("فشل في تحميل بيانات الآيات للتصدير.");
        hideLoading();
        exportProgressDiv.style.display = 'none';
        return;
    }

    capturer.start();
    let totalFramesRendered = 0;

    // 2. Render frames for each Ayah
    for (let idx = 0; idx < exportAyahsData.length; idx++) {
        const ayahData = exportAyahsData[idx];
        
        // Load audio to get its duration for frame calculation
        const audio = new Audio(ayahData.audioUrl);
        let audioDuration = currentProject.delayBetweenAyahs * 2; // Default if audio fails to load
        try {
            await new Promise((resolve, reject) => {
                audio.onloadedmetadata = () => {
                    audioDuration = audio.duration;
                    resolve();
                };
                audio.onerror = () => {
                    console.warn(`Could not load audio for ayah ${idx + currentProject.startAyah}, using default duration.`);
                    resolve(); // Resolve anyway to not block export
                };
                // Timeout for audio load
                setTimeout(() => {
                    if(audio.readyState < 2) { // HAVE_METADATA or higher
                        console.warn(`Audio load timeout for ayah ${idx + currentProject.startAyah}`);
                        resolve();
                    }
                }, 5000); // 5 second timeout
            });
        } catch(e) { /* Already handled in promise */ }


        const numFramesForAyah = Math.max(1, Math.ceil(audioDuration * capturer.framerate));
        const numFramesForDelay = Math.ceil(currentProject.delayBetweenAyahs * capturer.framerate);

        // Render Ayah frames
        for (let frame = 0; frame < numFramesForAyah; frame++) {
            // Clear canvas
            tempCtx.clearRect(0, 0, exportWidth, exportHeight);

            // A. Draw Background (image, video, or color)
            if (currentProject.background.type === 'image') {
                const bgImg = new Image();
                bgImg.src = currentProject.background.value; // Assumes value is a dataURL or accessible URL
                 try { await bgImg.decode(); tempCtx.drawImage(bgImg, 0, 0, exportWidth, exportHeight); }
                 catch (e) { drawDefaultBackgroundExport(tempCtx, exportWidth, exportHeight); }
            } else if (currentProject.background.type === 'video') {
                // This is complex: need to seek video to current time if background is a video
                // For simplicity, if backgroundVideo element is available and playing, use its current frame.
                // This assumes backgroundVideo is already loaded and playing.
                if (backgroundVideo && backgroundVideo.readyState >= backgroundVideo.HAVE_CURRENT_DATA) {
                    try { tempCtx.drawImage(backgroundVideo, 0, 0, exportWidth, exportHeight); }
                    catch(e) { drawDefaultBackgroundExport(tempCtx, exportWidth, exportHeight); }
                } else {
                    drawDefaultBackgroundExport(tempCtx, exportWidth, exportHeight);
                }
            } else { // Color
                 drawDefaultBackgroundExport(tempCtx, exportWidth, exportHeight);
            }

            // B. Draw Text (Ayah & Translation)
            drawTextOnCanvas(tempCtx, ayahData.text, ayahData.translation, exportWidth, exportHeight, currentProject, frame / numFramesForAyah);
            
            capturer.capture(tempCanvas);
            totalFramesRendered++;
            exportProgressBar.value = (totalFramesRendered / ((numFramesForAyah + numFramesForDelay) * exportAyahsData.length)) * 100;
            exportProgressText.textContent = `${Math.round(exportProgressBar.value)}%`;
        }

        // Render Delay frames (if any, and not the last ayah)
        if (currentProject.delayBetweenAyahs > 0 && idx < exportAyahsData.length - 1) {
            for (let frame = 0; frame < numFramesForDelay; frame++) {
                // Clear canvas
                tempCtx.clearRect(0, 0, exportWidth, exportHeight);
                 // A. Draw Background (same as above)
                if (currentProject.background.type === 'image') {
                    const bgImg = new Image(); bgImg.src = currentProject.background.value;
                    try { await bgImg.decode(); tempCtx.drawImage(bgImg, 0, 0, exportWidth, exportHeight); }
                    catch (e) { drawDefaultBackgroundExport(tempCtx, exportWidth, exportHeight); }
                } else if (currentProject.background.type === 'video' && backgroundVideo && backgroundVideo.readyState >= backgroundVideo.HAVE_CURRENT_DATA) {
                    try {tempCtx.drawImage(backgroundVideo, 0, 0, exportWidth, exportHeight); } catch(e) {drawDefaultBackgroundExport(tempCtx, exportWidth, exportHeight);}
                } else {
                    drawDefaultBackgroundExport(tempCtx, exportWidth, exportHeight);
                }
                // No text during delay, or a transition effect could be applied here
                capturer.capture(tempCanvas);
                totalFramesRendered++;
                exportProgressBar.value = (totalFramesRendered / ((numFramesForAyah + numFramesForDelay) * exportAyahsData.length)) * 100;
                exportProgressText.textContent = `${Math.round(exportProgressBar.value)}%`;
            }
        }
    }

    capturer.stop();
    capturer.save();
    
    // Provide audio files for manual merging or prepare for ffmpeg.wasm
    console.log("Video frames exported. Audio URLs for merging:", exportAudioUrls);
    alert("تم تصدير إطارات الفيديو بنجاح (بدون صوت حاليًا). يمكنك دمج الصوت يدويًا باستخدام الصوتيات المسجلة في الكونسول.");


    hideLoading();
    exportProgressDiv.style.display = 'none';
}


function drawDefaultBackgroundExport(targetContext, width, height) {
    targetContext.fillStyle = currentProject.background.value || '#333333';
    targetContext.fillRect(0, 0, width, height);
}


function drawTextOnCanvas(targetContext, ayahText, translationText, canvasWidth, canvasHeight, project, animationProgress = 1) {
    // 1. Ayah Text
    targetContext.font = `${project.fontSize}px ${project.font}`;
    targetContext.fillStyle = project.fontColor;
    targetContext.textAlign = 'center';
    targetContext.textBaseline = 'middle';

    // Apply background color for ayah text
    if (project.ayahBgColor && project.ayahBgColor !== 'rgba(0,0,0,0)') {
        const lines = wrapText(targetContext, ayahText, canvasWidth * 0.85); // Max width 85%
        const textHeight = lines.length * project.fontSize * 1.2; // Approximate height
        const totalTextWidth = Math.max(...lines.map(line => targetContext.measureText(line).width));
        
        const bgPadding = project.fontSize * 0.2; // Padding around text for background
        targetContext.fillStyle = project.ayahBgColor;
        targetContext.fillRect(
            (canvasWidth - totalTextWidth) / 2 - bgPadding,
            canvasHeight * 0.4 - textHeight / 2 - bgPadding, // Centered vertically around 40%
            totalTextWidth + bgPadding * 2,
            textHeight + bgPadding * 2
        );
        targetContext.fillStyle = project.fontColor; // Reset for text
    }
    
    let yPos = canvasHeight * 0.4; // Center text around 40% from top
    const lines = wrapText(targetContext, ayahText, canvasWidth * 0.85);
    lines.forEach((line, index) => {
        let currentLine = line;
        if (project.textEffect === 'typewriter') {
            const charsToShow = Math.floor(line.length * animationProgress);
            currentLine = line.substring(0, charsToShow);
        } else if (project.textEffect === 'fade') {
            targetContext.globalAlpha = animationProgress;
        }
        targetContext.fillText(currentLine, canvasWidth / 2, yPos + index * project.fontSize * 1.2 - (lines.length -1) * project.fontSize * 0.6);
    });
    targetContext.globalAlpha = 1; // Reset alpha

    // 2. Translation Text (if any)
    if (translationText) {
        targetContext.font = `${project.fontSize * 0.5}px ${project.fontFamilyUi || 'Tajawal, sans-serif'}`; // Smaller font for translation
        targetContext.fillStyle = tinycolor(project.fontColor).darken(15).toString() || '#DDDDDD'; // Slightly darker or default
        yPos = canvasHeight * 0.65; // Position translation lower
        
        const transLines = wrapText(targetContext, translationText, canvasWidth * 0.8);
        transLines.forEach((line, index) => {
            let currentLine = line;
             if (project.textEffect === 'typewriter') {
                const charsToShow = Math.floor(line.length * animationProgress);
                currentLine = line.substring(0, charsToShow);
            } else if (project.textEffect === 'fade') {
                targetContext.globalAlpha = animationProgress;
            }
            targetContext.fillText(currentLine, canvasWidth / 2, yPos + index * (project.fontSize * 0.5) * 1.2 - (transLines.length-1)*(project.fontSize * 0.5)*0.6);
        });
        targetContext.globalAlpha = 1; // Reset alpha
    }
}

function wrapText(context, text, maxWidth) {
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


// --- Project Management (Save/Load from LocalStorage) ---
function saveCurrentProjectState() {
    // This function is called frequently, ensure it has the latest from UI before saving
    // It's implicitly called before switching screens or saving explicitly
    // currentProject object should already be up-to-date via updateCurrentProjectSettings
}

function saveProject(projectToSave) {
    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    const existingIndex = projects.findIndex(p => p.id === projectToSave.id);
    if (existingIndex > -1) {
        projects[existingIndex] = projectToSave;
    } else {
        projects.push(projectToSave);
    }
    localStorage.setItem('quranVideoProjects', JSON.stringify(projects));
}

function loadProjects() {
    // ... (loadProjects function remains the same)
     projectsList.innerHTML = '';
    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    if (projects.length === 0) {
        noProjectsMessage.style.display = 'block';
        return;
    }
    noProjectsMessage.style.display = 'none';

    projects.forEach(proj => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.projectId = proj.id;

        const surahName = proj.surah && surahData.length > 0 ? (surahData.find(s=>s.number == proj.surah)?.name || 'سورة غير محددة') : 'سورة غير محددة';
        const ayahsRange = proj.startAyah && proj.endAyah ? `آيات: ${proj.startAyah}-${proj.endAyah}` : 'آيات غير محددة';

        card.innerHTML = `
            <h3>${proj.name || 'مشروع بدون اسم'}</h3>
            <div class="project-meta">
                <span>السورة: ${surahName}</span>
                <span>${ayahsRange}</span>
            </div>
            <div class="project-actions">
                <button class="edit-project-btn"><i class="fas fa-edit"></i> تعديل</button>
                <button class="delete-project-btn"><i class="fas fa-trash"></i> حذف</button>
            </div>
        `;
        card.querySelector('.edit-project-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            loadProjectIntoEditor(proj);
            initialScreen.style.display = 'none';
            editorScreen.style.display = 'flex';
        });
        card.querySelector('.delete-project-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`هل أنت متأكد أنك تريد حذف مشروع "${proj.name}"؟`)) {
                deleteProject(proj.id);
            }
        });
        projectsList.appendChild(card);
    });
}

function loadProjectIntoEditor(project) {
    currentProject = JSON.parse(JSON.stringify(project)); // Deep copy

    currentProjectTitleDisplay.textContent = currentProject.name;
    if (currentProject.surah) surahSelect.value = currentProject.surah;
    // Need to trigger surah change to populate ayahs if not already populated
    if (surahData.length > 0) handleSurahChange(); // Ensure ayahs are populated before setting values
    
    // Defer setting ayah selects until handleSurahChange has populated them
    setTimeout(() => {
        if (currentProject.startAyah) ayahStartSelect.value = currentProject.startAyah;
        if (currentProject.endAyah) ayahEndSelect.value = currentProject.endAyah;
    }, 0);


    if (currentProject.reciter) reciterSelect.value = currentProject.reciter;
    if (currentProject.translation) translationSelect.value = currentProject.translation;

    fontSelect.value = currentProject.font;
    fontSizeSlider.value = currentProject.fontSize;
    fontSizeValue.textContent = currentProject.fontSize + 'px';
    fontColorPicker.value = currentProject.fontColor;
    ayahBgColorPicker.value = currentProject.ayahBgColor;
    textEffectSelect.value = currentProject.textEffect;

    // Load background (this is simplified, assumes background.value is a URL or color string)
    if (currentProject.background.type === 'image') {
        backgroundImage = new Image();
        backgroundImage.onload = () => { backgroundType = 'image'; updatePreview(); };
        backgroundImage.src = currentProject.background.value;
    } else if (currentProject.background.type === 'video') {
        // For video, you'd ideally re-create the video element and set its src
        // For now, just set type and expect manual re-import if it's a local file.
        backgroundType = 'video';
        // If backgroundVideo src was stored, you could try to load it.
        // backgroundVideo.src = currentProject.background.value;
        updatePreview();
    } else { // color
        backgroundType = 'color';
        // currentProject.background.value should be the color string
        updatePreview();
    }


    delayBetweenAyahsInput.value = currentProject.delayBetweenAyahs;
    resolutionSelect.value = currentProject.resolution;
    transitionSelect.value = currentProject.videoTransition;

    updatePreview(); // Final preview update
    closeAllPanels(); // Start with all panels closed
}

function deleteProject(projectId) {
    let projects = JSON.parse(localStorage.getItem('quranVideoProjects')) || [];
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('quranVideoProjects', JSON.stringify(projects));
    loadProjects(); // Refresh list
}

// --- Theme Management ---
function loadTheme() {
    const theme = localStorage.getItem('quranTheme') || 'light-theme';
    document.body.className = theme;
    updateThemeButtonText(theme);
}
function toggleTheme() {
    const newTheme = document.body.classList.contains('light-theme') ? 'dark-theme' : 'light-theme';
    document.body.className = newTheme;
    localStorage.setItem('quranTheme', newTheme);
    updateThemeButtonText(newTheme);
}
function updateThemeButtonText(theme) {
    const text = theme === 'light-theme' ? 'DarkMode 🌙' : 'LightMode ☀️'; // Or just icons
    [themeToggleInitial, themeToggleEditor].forEach(btn => btn.textContent = theme === 'light-theme' ? '🌓' : '☀️');
}

// --- Pexels API Key ---
function saveLastPexelsKey(key) { localStorage.setItem('pexelsApiKey', key); }
function getLastPexelsKey() { return localStorage.getItem('pexelsApiKey') || ''; }

// --- Loading Spinner ---
function showLoading() { loadingSpinner.style.display = 'flex'; }
function hideLoading() { loadingSpinner.style.display = 'none'; }

// --- Init Call (already at top in DOMContentLoaded)
