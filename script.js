document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Starting script execution...");

    // --- DOM Element Getters (Safer) ---
    // It's crucial these are correct and elements exist in HTML
    const getElement = (id) => {
        const el = document.getElementById(id);
        if (!el) console.error(`Element with ID '${id}' not found!`);
        return el;
    };

    const initialScreen = getElement('initial-screen');
    const editorScreen = getElement('editor-screen');
    const goToEditorBtn = getElement('go-to-editor-btn');
    const backToInitialScreenBtn = getElement('back-to-initial-screen-btn');
    
    const themeToggleInitial = getElement('theme-toggle-initial');
    const themeToggleEditor = getElement('theme-toggle-editor');
    const body = document.body; // body will always exist

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
    let previewCtx = null; // Initialize later after check
    if (previewCanvas) {
        previewCtx = previewCanvas.getContext('2d');
        if (!previewCtx) console.error("Failed to get 2D context from canvas!");
    }
    
    const previewSurahTitleEl = getElement('preview-surah-title');
    const previewAyahTextEl = getElement('preview-ayah-text');
    const previewTranslationTextEl = getElement('preview-translation-text');

    const loadingSpinner = getElement('loading-spinner');

    let isExporting = false;
    let videoBgAnimationId = null;

    // --- State Variables ---
    let surahsData = [];
    let recitersData = [];
    let translationsData = [];
    let currentProject = createNewProject(); // Initialize with a default project
    let currentPlayingAudio = null;
    let capturer = null;
    let backgroundImage = null; 
    let isPlayingSequence = false;

    const PEXELS_API_KEY = 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7'; 
    const QURAN_API_BASE = 'https://api.alquran.cloud/v1';

    // --- Core Functions (createNewProject, renderPreviewFrame, etc. as before but with checks) ---
    // ... (محتوى الدوال السابقة مع إضافة المزيد من التحققات من وجود العناصر قبل استخدامها)

    function createNewProject() {
        console.log("Creating new project state...");
        return {
            id: `project-${Date.now()}`,
            name: "مشروع جديد",
            surah: 1,
            ayahStart: 1,
            ayahEnd: 1,
            reciter: 'ar.alafasy',
            translation: '',
            font: "'Amiri Quran', serif",
            fontSize: 48,
            fontColor: '#FFFFFF', 
            ayahBgColor: 'rgba(0,0,0,0)', 
            textEffect: 'none',
            background: { type: 'color', value: '#000000' },
            delayBetweenAyahs: 1,
            resolution: '1920x1080',
            transition: 'fade',
            createdAt: new Date().toISOString()
        };
    }
    
    // --- Screen Navigation ---
    function showInitialScreen() {
        console.log("Attempting to show initial screen...");
        if (initialScreen) initialScreen.style.display = 'flex'; else console.error("'initialScreen' not found for showInitialScreen");
        if (editorScreen) editorScreen.style.display = 'none'; else console.error("'editorScreen' not found for showInitialScreen");
        
        if (currentPlayingAudio) {
            currentPlayingAudio.pause();
            currentPlayingAudio = null;
        }
        isPlayingSequence = false;
        console.log("Initial screen display should be flex, editor none.");
    }

    function showEditorScreen() {
        console.log("Attempting to show editor screen...");
        if (initialScreen) initialScreen.style.display = 'none'; else console.error("'initialScreen' not found for showEditorScreen");
        if (editorScreen) editorScreen.style.display = 'flex'; else console.error("'editorScreen' not found for showEditorScreen");
        
        resizeCanvas(); 
        renderPreviewFrame(); // Render once screen is visible
        console.log("Editor screen display should be flex, initial none.");
    }

    // --- Theme ---
    function toggleTheme() {
        console.log("Toggling theme...");
        if (!body) { console.error("Body element not found for theme toggle!"); return; }
        body.classList.toggle('dark-theme');
        localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
        console.log("Theme is now:", localStorage.getItem('theme'));
        renderPreviewFrame(); // Re-render if theme affects canvas
    }

    function loadTheme() {
        console.log("Loading theme...");
        if (!body) { console.error("Body element not found for loading theme!"); return; }
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme'); // Ensure it's light if not dark
        }
        console.log("Loaded theme:", currentTheme || 'light');
    }
    
    // --- Loading Spinner ---
    function showLoading(message = "جاري التحميل...") {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'flex';
            console.log("Loading spinner shown:", message);
        } else {
            console.warn("Loading spinner element not found, cannot show.");
        }
    }
    function hideLoading() {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
            console.log("Loading spinner hidden.");
        } else {
            console.warn("Loading spinner element not found, cannot hide.");
        }
    }

    // --- Event Listeners Setup (CRUCIAL) ---
    function setupEventListeners() {
        console.log("Setting up event listeners...");

        if (goToEditorBtn) {
            goToEditorBtn.addEventListener('click', () => {
                console.log("Create Video button clicked!");
                currentProject = createNewProject(); 
                loadProject(currentProject); 
                showEditorScreen();
            });
        } else {
            console.error("goToEditorBtn (إنشاء فيديو) not found!");
        }

        if (backToInitialScreenBtn) {
            backToInitialScreenBtn.addEventListener('click', showInitialScreen);
        } else {
            console.error("backToInitialScreenBtn not found!");
        }

        if (themeToggleInitial) {
            themeToggleInitial.addEventListener('click', toggleTheme);
        } else {
            console.error("themeToggleInitial not found!");
        }

        if (themeToggleEditor) {
            themeToggleEditor.addEventListener('click', toggleTheme);
        } else {
            console.error("themeToggleEditor not found!");
        }
        
        // ... (باقي الـ event listeners كما كانت، مع التحقق من وجود العنصر قبل إضافة الـ listener)
        // مثال:
        if(saveProjectBtn) saveProjectBtn.addEventListener('click', saveCurrentProject);
        if(surahSelect) surahSelect.addEventListener('change', (e) => { currentProject.surah = parseInt(e.target.value); populateAyahSelects(currentProject.surah); });
        // وهكذا لباقي العناصر...

        if(fontSelect) fontSelect.addEventListener('change', (e) => { currentProject.font = e.target.value; updatePreviewStyle(); });
        if(fontSizeSlider) fontSizeSlider.addEventListener('input', (e) => {
            currentProject.fontSize = parseInt(e.target.value);
            if(fontSizeValue) fontSizeValue.textContent = `${currentProject.fontSize}px`;
            updatePreviewStyle();
        });
        if(fontColorPicker) fontColorPicker.addEventListener('input', (e) => { currentProject.fontColor = e.target.value; updatePreviewStyle(); });
        if(ayahBgColorPicker) ayahBgColorPicker.addEventListener('input', (e) => { currentProject.ayahBgColor = e.target.value; updatePreviewStyle(); });
        if(textEffectSelect) textEffectSelect.addEventListener('change', (e) => { 
            currentProject.textEffect = e.target.value;
            if(previewAyahTextEl) applyTextEffect(previewAyahTextEl, previewAyahTextEl.textContent, currentProject.textEffect, () => {});
        });
        
        if(importBackgroundInput) importBackgroundInput.addEventListener('change', handleBackgroundImport);
        if(applyAiBgBtn) applyAiBgBtn.addEventListener('click', fetchAiBackgrounds);
        if(playRangeBtn) playRangeBtn.addEventListener('click', playAudioSequence);
        
        if(resolutionSelect) resolutionSelect.addEventListener('change', (e) => {
            currentProject.resolution = e.target.value;
            resizeCanvas(); 
        });
        if(transitionSelect) transitionSelect.addEventListener('change', (e) => { currentProject.transition = e.target.value; });
        if(exportBtn) exportBtn.addEventListener('click', exportVideo);

        if(delayBetweenAyahsInput) delayBetweenAyahsInput.addEventListener('change', e => {
            currentProject.delayBetweenAyahs = parseFloat(e.target.value)
        });
        

        window.addEventListener('resize', resizeCanvas); 
        setupToolbarTabs(); // Make sure this is also safe
        console.log("Event listeners setup complete.");
    }
    
    // --- Toolbar Logic (Make sure it's safe) ---
    function setupToolbarTabs() {
        const tabButtons = document.querySelectorAll('.toolbar-tab-button');
        const controlPanels = document.querySelectorAll('.toolbar-controls');

        if (tabButtons.length === 0) {
            console.warn("No toolbar tab buttons found.");
            return;
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                if (!targetId) {
                    console.warn("Toolbar button has no data-target:", button);
                    return;
                }
                
                tabButtons.forEach(btn => {
                    if(btn.parentElement) btn.parentElement.classList.remove('active');
                });
                controlPanels.forEach(panel => panel.style.display = 'none');

                if(button.parentElement) button.parentElement.classList.add('active');
                const targetPanel = getElement(targetId); // Use safe getter
                if (targetPanel) {
                    targetPanel.style.display = 'grid'; 
                } else {
                    console.warn(`Target panel with ID '${targetId}' not found for toolbar.`);
                }
            });
        });
        // Activate the first tab by default if its elements exist
        if (tabButtons[0] && tabButtons[0].parentElement) {
            const firstTabTargetId = tabButtons[0].dataset.target;
            if (firstTabTargetId) {
                const firstPanel = getElement(firstTabTargetId);
                if(firstPanel) {
                    tabButtons[0].parentElement.classList.add('active');
                    firstPanel.style.display = 'grid';
                }
            }
        }
    }


    // --- Initialization ---
    async function init() {
        console.log("App Init: Starting...");
        loadTheme(); // Load theme first as it affects base styles

        // Ensure crucial UI elements for initial screen are present
        if (!initialScreen || !editorScreen || !goToEditorBtn) {
            console.error("Critical UI elements missing. Aborting full initialization.");
            alert("حدث خطأ في تحميل واجهة التطبيق. يرجى تحديث الصفحة.");
            // Try to set up at least theme toggle if it exists
            if (themeToggleInitial) themeToggleInitial.addEventListener('click', toggleTheme);
            return;
        }
        
        showLoading("جاري تحميل البيانات الأولية...");
        try {
            // Fetch data
            await Promise.all([fetchSurahs(), fetchReciters(), fetchTranslations()]);
            console.log("App Init: Data fetched.");

            // Populate selects - ensure elements exist
            if(surahSelect) populateSurahSelect();
            if(reciterSelect) populateReciterSelect();
            if(translationSelect) populateTranslationSelect();
            console.log("App Init: Selects populated.");

            loadProjects(); // Load projects after data is available for name resolution
            console.log("App Init: Projects loaded.");
            
            setupEventListeners(); // Setup all event listeners
            
            // Initial UI state for the editor (though it's hidden)
            loadProject(currentProject); // Load default/new project into editor state
            updatePreviewStyle(); 
            resizeCanvas(); 
            updatePreviewWithFirstAyah(); // This will also call renderPreviewFrame

            showInitialScreen(); // Explicitly show initial screen AFTER everything is set up
            
            console.log("App Init: Initialization sequence complete.");
        } catch (error) {
            console.error("App Init: Initialization failed:", error);
            alert("فشل في تهيئة التطبيق. يرجى تحديث الصفحة أو التحقق من اتصال الإنترنت.");
            // Fallback: at least ensure theme toggle works if UI is partially broken
            if (themeToggleInitial) themeToggleInitial.addEventListener('click', toggleTheme);
        } finally {
            hideLoading();
        }
    }
    
    // --- All other functions (loadProject, API fetches, rendering, export etc. as in previous complete script) ---
    // Make sure to include the complete versions of these functions from the previous good script,
    // applying the same safety checks for element existence before using them.
    // For brevity, I am not re-pasting all of them here, but they are crucial.
    // Example of a check within a function:
    function populateAyahSelects(surahNumber) {
        const selectedSurah = surahsData.find(s => s.number == surahNumber);
        if (!selectedSurah || !ayahStartSelect || !ayahEndSelect) { // Check elements
            console.warn("Cannot populate Ayah selects: Surah data or select elements missing.");
            return;
        }
        // ... rest of the function
        const currentStart = parseInt(ayahStartSelect.value) || currentProject.ayahStart;
        const currentEnd = parseInt(ayahEndSelect.value) || currentProject.ayahEnd;

        ayahStartSelect.innerHTML = '';
        // ayahEndSelect.innerHTML = ''; // Will be repopulated by updateAyahEndOptions

        for (let i = 1; i <= selectedSurah.numberOfAyahs; i++) {
            const optionStart = document.createElement('option');
            optionStart.value = i;
            optionStart.textContent = i;
            ayahStartSelect.appendChild(optionStart);
        }
        
        ayahStartSelect.value = Math.min(currentStart, selectedSurah.numberOfAyahs) || 1;
        updateAyahEndOptions(); 
        if(ayahEndSelect.value && parseInt(ayahEndSelect.value) < parseInt(ayahStartSelect.value)) {
            ayahEndSelect.value = ayahStartSelect.value;
        }
        currentProject.ayahStart = parseInt(ayahStartSelect.value);
        currentProject.ayahEnd = parseInt(ayahEndSelect.value || ayahStartSelect.value); // Ensure ayahEnd has a value

        updatePreviewWithFirstAyah(); 
    }

    function updateAyahEndOptions() {
        if(!ayahStartSelect || !ayahEndSelect || !surahSelect) return; // Safety check
        const startAyah = parseInt(ayahStartSelect.value);
        const selectedSurah = surahsData.find(s => s.number == surahSelect.value);

        if (!selectedSurah || isNaN(startAyah)) {
            if(ayahEndSelect) ayahEndSelect.innerHTML = ''; // Clear if invalid state
            return;
        }
        
        const currentEndVal = parseInt(ayahEndSelect.value) || currentProject.ayahEnd;
        
        ayahEndSelect.innerHTML = ''; 
        for (let i = startAyah; i <= selectedSurah.numberOfAyahs; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            ayahEndSelect.appendChild(option);
        }
        
        if (currentEndVal >= startAyah && currentEndVal <= selectedSurah.numberOfAyahs) {
            ayahEndSelect.value = currentEndVal;
        } else {
            ayahEndSelect.value = startAyah; 
        }
        currentProject.ayahEnd = parseInt(ayahEndSelect.value);
        // updatePreviewWithFirstAyah(); // Avoid calling this again here to prevent loop if called from populateAyahSelects
    }

    async function updatePreviewWithFirstAyah() {
        if(!surahSelect || !ayahStartSelect || !previewSurahTitleEl || !previewAyahTextEl) return;

        const surah = parseInt(surahSelect.value);
        const ayahStart = parseInt(ayahStartSelect.value);
        const translationId = translationSelect ? translationSelect.value : "";

        if (surah && ayahStart) {
            const ayahData = await fetchAyahData(surah, ayahStart, null, translationId);
            if (ayahData) {
                previewSurahTitleEl.textContent = ayahData.surahName;
                applyTextEffect(previewAyahTextEl, ayahData.text, currentProject.textEffect, () => {});
                if(previewTranslationTextEl) previewTranslationTextEl.textContent = ayahData.translationText || "";
                renderPreviewFrame(ayahData.text, ayahData.surahName, ayahData.translationText);
            }
        } else {
             renderPreviewFrame(); 
        }
    }

    // --- (Include ALL other helper functions: API fetches, renderPreviewFrame, wrapText, text effects, background handling, audio, export logic etc. from the previous full working script here)
    // --- MAKE SURE THEY ARE COMPLETE AND CORRECT. The script was truncated for this response focusing on fixes.

    // Re-paste the complete, previously working functions like:
    // fetchSurahs, fetchReciters, fetchTranslations, fetchAyahData (ensure safe)
    // loadProject, saveCurrentProject, loadProjects, deleteProject (ensure safe)
    // resizeCanvas, updatePreviewStyle, renderPreviewFrame (ensure safe and use previewCtx safely)
    // wrapText, applyTextEffect (ensure safe)
    // handleBackgroundImport, fetchAiBackgrounds (ensure safe)
    // playAudioSequence (ensure safe)
    // exportVideo, renderAyahForExport, updateExportProgress (ensure safe)


    // --- Start the application ---
    if (document.readyState === 'loading') { // 경우에 따라 DOMContentLoaded가 이미 발생했을 수 있습니다.
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init(); // DOM이 이미 로드된 경우 즉시 실행
    }
});
