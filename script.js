document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); // للتأكد أن الـ JS بدأ

    // --- DOM Elements ---
    const initialScreen = document.getElementById('initial-screen');
    const editorScreen = document.getElementById('editor-screen');
    const goToEditorBtn = document.getElementById('go-to-editor-btn');
    // ... (باقي تعريفات العناصر كما هي) ...
    const backToInitialScreenBtn = document.getElementById('back-to-initial-screen-btn');
    
    const themeToggleInitial = document.getElementById('theme-toggle-initial');
    const themeToggleEditor = document.getElementById('theme-toggle-editor');
    const body = document.body;

    const projectsListEl = document.getElementById('projects-list');
    const noProjectsMessage = document.getElementById('no-projects-message');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const currentProjectTitleEl = document.getElementById('current-project-title');

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
    const aiBgSuggestionsContainer = document.getElementById('ai-bg-suggestions');
    
    const playRangeBtn = document.getElementById('play-range-button');
    const delayBetweenAyahsInput = document.getElementById('delay-between-ayahs');

    const resolutionSelect = document.getElementById('resolution-select');
    const transitionSelect = document.getElementById('transition-select');
    const exportBtn = document.getElementById('export-btn');
    const exportProgressContainer = document.getElementById('export-progress');
    const exportProgressBar = document.getElementById('export-progress-bar');
    const exportProgressText = document.getElementById('export-progress-text');

    const previewCanvas = document.getElementById('video-preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    const previewSurahTitleEl = document.getElementById('preview-surah-title');
    const previewAyahTextEl = document.getElementById('preview-ayah-text');
    const previewTranslationTextEl = document.getElementById('preview-translation-text');

    const loadingSpinner = document.getElementById('loading-spinner');


    // --- State Variables ---
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

    // --- Initialization ---
    async function init() {
        console.log("Initializing app..."); // تتبع
        loadTheme();
        loadProjects();
        showLoading("جاري تحميل البيانات الأولية...");
        try {
            await Promise.all([fetchSurahs(), fetchReciters(), fetchTranslations()]);
            populateSurahSelect();
            populateReciterSelect();
            populateTranslationSelect();
            setupEventListeners();
            updatePreviewStyle(); 
            resizeCanvas(); 
            renderPreviewFrame(); 
            console.log("App initialized successfully."); // تتبع
        } catch (error) {
            console.error("Initialization failed:", error); // تتبع
            alert("فشل في تهيئة التطبيق. الرجاء تحديث الصفحة.");
        } finally {
            hideLoading();
        }
    }

    function createNewProject() {
        // ... (نفس محتوى الدالة)
        return {
            id: `project-${Date.now()}`,
            name: "مشروع جديد",
            surah: 1,
            ayahStart: 1,
            ayahEnd: 1,
            reciter: 'ar.alafasy',
            translation: '',
            font: "'Amiri Quran', serif",
            fontSize: 48, // Updated default
            fontColor: '#FFFFFF',
            ayahBgColor: 'rgba(0,0,0,0.3)',
            textEffect: 'none',
            background: { type: 'color', value: '#000000' },
            delayBetweenAyahs: 1,
            resolution: '1920x1080',
            transition: 'fade',
            createdAt: new Date().toISOString()
        };
    }

    function loadProject(projectData) {
        // ... (نفس محتوى الدالة مع التأكد من القيم الافتراضية)
        currentProject = { ...createNewProject(), ...projectData }; 
        currentProjectTitleEl.textContent = currentProject.name;

        surahSelect.value = currentProject.surah;
        reciterSelect.value = currentProject.reciter;
        translationSelect.value = currentProject.translation || "";
        fontSelect.value = currentProject.font;
        fontSizeSlider.value = currentProject.fontSize;
        fontSizeValue.textContent = `${currentProject.fontSize}px`;
        fontColorPicker.value = currentProject.fontColor;
        ayahBgColorPicker.value = currentProject.ayahBgColor;
        textEffectSelect.value = currentProject.textEffect;
        delayBetweenAyahsInput.value = currentProject.delayBetweenAyahs;
        resolutionSelect.value = currentProject.resolution;
        transitionSelect.value = currentProject.transition;
        
        surahSelect.dispatchEvent(new Event('change')); 
        
        setTimeout(() => {
            if (ayahStartSelect && ayahEndSelect) { // تحقق من وجود العناصر
                ayahStartSelect.value = currentProject.ayahStart;
                ayahEndSelect.value = currentProject.ayahEnd; // سيتم تحديثه بواسطة updateAyahEndOptions
                if(ayahStartSelect.value) ayahStartSelect.dispatchEvent(new Event('change')); // لتحديث ayahEndOptions
                else updateAyahEndOptions();
            }

            if (currentProject.background) {
                if (currentProject.background.type === 'image' && currentProject.background.value) {
                    const img = new Image();
                    img.onload = () => {
                        backgroundImage = img;
                        renderPreviewFrame();
                    };
                    img.onerror = () => { 
                        console.warn("Could not load project background image from stored data.");
                        backgroundImage = null; 
                        currentProject.background = {type: 'color', value: '#000000'};
                        renderPreviewFrame();
                    }
                    img.src = currentProject.background.value; 
                } else if (currentProject.background.type === 'color') {
                    backgroundImage = null; 
                    renderPreviewFrame(); 
                }
            }
            updatePreviewStyle();
            renderPreviewFrame();
        }, 200); // تقليل المهلة قليلاً
    }

    function saveCurrentProject() {
        // ... (نفس محتوى الدالة)
        currentProject.name = prompt("ادخل اسم المشروع:", currentProject.name) || currentProject.name;
        currentProject.surah = parseInt(surahSelect.value);
        currentProject.ayahStart = parseInt(ayahStartSelect.value);
        currentProject.ayahEnd = parseInt(ayahEndSelect.value);
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
        currentProject.createdAt = new Date().toISOString(); // Update timestamp
        
        let projects = JSON.parse(localStorage.getItem('quranProjects')) || [];
        const existingProjectIndex = projects.findIndex(p => p.id === currentProject.id);
        if (existingProjectIndex > -1) {
            projects[existingProjectIndex] = currentProject;
        } else {
            projects.push(currentProject);
        }
        localStorage.setItem('quranProjects', JSON.stringify(projects));
        alert('تم حفظ المشروع!');
        currentProjectTitleEl.textContent = currentProject.name;
        loadProjects();
    }

    function loadProjects() {
        // ... (نفس محتوى الدالة)
        projectsListEl.innerHTML = '';
        let projects = JSON.parse(localStorage.getItem('quranProjects')) || [];
        if (projects.length === 0) {
            noProjectsMessage.style.display = 'block';
            return;
        }
        noProjectsMessage.style.display = 'none';
        projects.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); 

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            const surahName = surahsData.find(s => s.number === project.surah)?.name || project.surah;
            card.innerHTML = `
                <h3>${project.name}</h3>
                <p>السورة: ${surahName}</p>
                <p>الآيات: ${project.ayahStart} إلى ${project.ayahEnd}</p>
                <p>آخر تعديل: ${new Date(project.createdAt).toLocaleDateString('ar-EG')}</p>
                <div class="project-actions">
                    <button class="edit-project-btn" data-id="${project.id}"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="delete-project-btn" data-id="${project.id}"><i class="fas fa-trash"></i> حذف</button>
                </div>
            `;
            card.querySelector('.edit-project-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = e.currentTarget.dataset.id;
                const projectToLoad = projects.find(p => p.id === projectId);
                if (projectToLoad) {
                    loadProject(projectToLoad);
                    showEditorScreen();
                }
            });
            card.querySelector('.delete-project-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
                    const projectId = e.currentTarget.dataset.id;
                    deleteProject(projectId);
                }
            });
            projectsListEl.appendChild(card);
        });
    }
    
    function deleteProject(projectId) {
        // ... (نفس محتوى الدالة)
        let projects = JSON.parse(localStorage.getItem('quranProjects')) || [];
        projects = projects.filter(p => p.id !== projectId);
        localStorage.setItem('quranProjects', JSON.stringify(projects));
        loadProjects(); 
        if (currentProject.id === projectId) { 
            currentProject = createNewProject();
            loadProject(currentProject); 
        }
    }

    // --- Screen Navigation ---
    function showInitialScreen() {
        console.log("Showing initial screen"); // تتبع
        initialScreen.style.display = 'flex';
        editorScreen.style.display = 'none';
        if (currentPlayingAudio) {
            currentPlayingAudio.pause();
            currentPlayingAudio = null;
        }
        isPlayingSequence = false;
        console.log("Initial screen display:", initialScreen.style.display, "Editor screen display:", editorScreen.style.display); // تتبع
    }

    function showEditorScreen() {
        console.log("Attempting to show editor screen..."); // تتبع
        if (!initialScreen || !editorScreen) {
            console.error("Initial or Editor screen element not found!");
            return;
        }
        initialScreen.style.display = 'none';
        editorScreen.style.display = 'flex'; // التأكد من استخدام flex
        console.log("Initial screen display:", initialScreen.style.display, "Editor screen display:", editorScreen.style.display); // تتبع
        resizeCanvas(); 
        renderPreviewFrame();
        console.log("Editor screen should be visible now."); // تتبع
    }

    // --- Theme ---
    function toggleTheme() {
        // ... (نفس محتوى الدالة)
        body.classList.toggle('dark-theme');
        localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
        renderPreviewFrame();
    }
    function loadTheme() {
        // ... (نفس محتوى الدالة)
        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark-theme');
        }
    }

    // --- API Fetching (fetchSurahs, fetchReciters, fetchTranslations, fetchAyahData) ---
    // ... (نفس محتوى الدوال، مع التأكد من showLoading/hideLoading)
        async function fetchSurahs() {
        // showLoading(); // Moved to init
        try {
            const response = await axios.get(`${QURAN_API_BASE}/surah`);
            surahsData = response.data.data;
        } catch (error) {
            console.error("Error fetching Surahs:", error);
            throw error; // Re-throw to be caught by init
        } /*finally { hideLoading(); }*/
    }

    async function fetchReciters() {
        // showLoading();
        try {
            const response = await axios.get(`${QURAN_API_BASE}/edition?format=audio&language=ar&type=versebyverse`);
            recitersData = response.data.data.filter(r => r.language === 'ar'); // Filter for Arabic reciters explicitly
        } catch (error) {
            console.error("Error fetching reciters:", error);
            throw error;
        } /*finally { hideLoading(); }*/
    }
    
    async function fetchTranslations() {
        // showLoading();
        try {
            const response = await axios.get(`${QURAN_API_BASE}/edition?format=text&type=translation`);
            translationsData = response.data.data;
        } catch (error) {
            console.error("Error fetching translations:", error);
            // Don't throw, translations are optional
        } /*finally { hideLoading(); }*/
    }

    async function fetchAyahData(surahNumber, ayahNumber, reciterIdentifier, translationIdentifier = null) {
        showLoading();
        let endpoints = [];
        if (reciterIdentifier) { // Reciter might not be needed if only fetching text
             endpoints.push(`${QURAN_API_BASE}/ayah/${surahNumber}:${ayahNumber}/${reciterIdentifier}`);
        } else {
             endpoints.push(`${QURAN_API_BASE}/ayah/${surahNumber}:${ayahNumber}`); // Just text
        }

        if (translationIdentifier) {
            endpoints.push(`${QURAN_API_BASE}/ayah/${surahNumber}:${ayahNumber}/${translationIdentifier}`);
        }
        
        try {
            const responses = await Promise.all(endpoints.map(ep => axios.get(ep)));
            const ayahMainData = responses[0].data.data;
            const ayahTranslationData = translationIdentifier && responses.length > 1 ? responses[1].data.data : null;

            return {
                text: ayahMainData.text,
                audio: ayahMainData.audio, // Will be undefined if no reciterId was passed
                numberInSurah: ayahMainData.numberInSurah,
                surahName: ayahMainData.surah.name,
                surahEnglishName: ayahMainData.surah.englishName,
                translationText: ayahTranslationData ? ayahTranslationData.text : null
            };
        } catch (error) {
            console.error(`Error fetching Ayah ${surahNumber}:${ayahNumber}:`, error);
            alert(`فشل تحميل الآية ${surahNumber}:${ayahNumber}`);
            return null;
        } finally {
            hideLoading();
        }
    }


    // --- UI Population (populateSurahSelect, populateReciterSelect, etc.) ---
    // ... (نفس محتوى الدوال، مع التأكد من تحديث القيم بشكل صحيح)
    function populateSurahSelect() {
        if (!surahSelect) return;
        surahSelect.innerHTML = '';
        surahsData.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. ${surah.name} (${surah.englishName})`;
            surahSelect.appendChild(option);
        });
        surahSelect.value = currentProject.surah; 
        populateAyahSelects(currentProject.surah); 
    }

    function populateReciterSelect() {
        if (!reciterSelect) return;
        reciterSelect.innerHTML = '';
        recitersData.forEach(reciter => {
            const option = document.createElement('option');
            option.value = reciter.identifier;
            option.textContent = reciter.name; // Use reciter.name if available and more user-friendly
            reciterSelect.appendChild(option);
        });
        if (recitersData.find(r => r.identifier === currentProject.reciter)) {
             reciterSelect.value = currentProject.reciter;
        } else if (recitersData.length > 0) {
            reciterSelect.value = recitersData[0].identifier; 
            currentProject.reciter = recitersData[0].identifier;
        }
    }

    function populateTranslationSelect() {
        if(!translationSelect) return;
        const currentVal = translationSelect.value || currentProject.translation;
        translationSelect.innerHTML = '<option value="">بدون ترجمة</option>'; // Add default empty option
        translationsData.forEach(trans => {
            const option = document.createElement('option');
            option.value = trans.identifier;
            option.textContent = `${trans.name} (${trans.language.toUpperCase()})`;
            translationSelect.appendChild(option);
        });
        if (translationsData.find(t => t.identifier === currentVal)) {
            translationSelect.value = currentVal;
        } else {
             translationSelect.value = ""; 
        }
    }

    function populateAyahSelects(surahNumber) {
        const selectedSurah = surahsData.find(s => s.number == surahNumber);
        if (!selectedSurah || !ayahStartSelect || !ayahEndSelect) return;

        const currentStart = parseInt(ayahStartSelect.value) || currentProject.ayahStart;
        const currentEnd = parseInt(ayahEndSelect.value) || currentProject.ayahEnd;

        ayahStartSelect.innerHTML = '';
        ayahEndSelect.innerHTML = ''; // Will be repopulated by updateAyahEndOptions

        for (let i = 1; i <= selectedSurah.numberOfAyahs; i++) {
            const optionStart = document.createElement('option');
            optionStart.value = i;
            optionStart.textContent = i;
            ayahStartSelect.appendChild(optionStart);
        }
        
        ayahStartSelect.value = Math.min(currentStart, selectedSurah.numberOfAyahs) || 1;
        updateAyahEndOptions(); // This will populate ayahEndSelect and set its value
        // Ensure endAyah is at least startAyah
        if(parseInt(ayahEndSelect.value) < parseInt(ayahStartSelect.value)) {
            ayahEndSelect.value = ayahStartSelect.value;
        }
        currentProject.ayahStart = parseInt(ayahStartSelect.value);
        currentProject.ayahEnd = parseInt(ayahEndSelect.value);

        updatePreviewWithFirstAyah(); 
    }
    
    function updateAyahEndOptions() {
        const startAyah = parseInt(ayahStartSelect.value);
        const selectedSurah = surahsData.find(s => s.number == surahSelect.value);
        if (!selectedSurah || !ayahEndSelect || isNaN(startAyah)) return;

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
            ayahEndSelect.value = startAyah; // Default to startAyah if current is invalid
        }
        currentProject.ayahEnd = parseInt(ayahEndSelect.value);
        updatePreviewWithFirstAyah();
    }
    
    async function updatePreviewWithFirstAyah() {
        const surah = parseInt(surahSelect.value);
        const ayahStart = parseInt(ayahStartSelect.value);
        // For preview, we don't need reciter for text, but might for surah name context if API changes
        const translationId = translationSelect.value;

        if (surah && ayahStart) {
            // Fetch without reciter ID for text only to speed up preview update
            const ayahData = await fetchAyahData(surah, ayahStart, null, translationId);
            if (ayahData) {
                previewSurahTitleEl.textContent = ayahData.surahName;
                applyTextEffect(previewAyahTextEl, ayahData.text, currentProject.textEffect, () => {});
                previewTranslationTextEl.textContent = ayahData.translationText || "";
                renderPreviewFrame(ayahData.text, ayahData.surahName, ayahData.translationText);
            }
        } else {
             renderPreviewFrame(); // Render blank or default if no selection
        }
    }

    // --- Canvas & Preview (resizeCanvas, updatePreviewStyle, renderPreviewFrame, wrapText) ---
    // ... (نفس محتوى الدوال)
    function resizeCanvas() {
        const container = document.getElementById('video-preview-container');
        if(!container || !previewCanvas) return;
        const [targetWidth, targetHeight] = currentProject.resolution.split('x').map(Number);
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        let canvasDisplayWidth, canvasDisplayHeight;
        if (containerWidth / containerHeight > targetWidth / targetHeight) { 
            canvasDisplayHeight = containerHeight;
            canvasDisplayWidth = canvasDisplayHeight * (targetWidth / targetHeight);
        } else { 
            canvasDisplayWidth = containerWidth;
            canvasDisplayHeight = canvasDisplayWidth * (targetHeight / targetWidth);
        }

        previewCanvas.width = targetWidth; 
        previewCanvas.height = targetHeight;
        
        previewCanvas.style.width = `${canvasDisplayWidth}px`;
        previewCanvas.style.height = `${canvasDisplayHeight}px`;

        const scaleFactor = canvasDisplayWidth / targetWidth; 
        const baseFontSizeForOverlay = 16; // Assuming 1em = 16px for overlay elements not on canvas

        previewSurahTitleEl.style.fontSize = `${(targetHeight * 0.05) * scaleFactor / baseFontSizeForOverlay * 1.5}em`; 
        previewAyahTextEl.style.fontSize = `${currentProject.fontSize * scaleFactor / baseFontSizeForOverlay}em`; 
        previewTranslationTextEl.style.fontSize = `${(currentProject.fontSize * 0.5) * scaleFactor / baseFontSizeForOverlay}em`;
        
        renderPreviewFrame();
    }

    function updatePreviewStyle() {
        // These styles are for the HTML overlay elements, not the canvas drawing directly
        previewAyahTextEl.style.fontFamily = currentProject.font;
        // Font size for overlay is handled by resizeCanvas to be responsive
        previewAyahTextEl.style.color = currentProject.fontColor;
        previewAyahTextEl.style.backgroundColor = currentProject.ayahBgColor;
        
        previewTranslationTextEl.style.fontFamily = "'Tajawal', sans-serif";
        // Use tinycolor to get a contrasting color for translation if fontColor is too light/dark
        const mainColor = tinycolor(currentProject.fontColor);
        previewTranslationTextEl.style.color = mainColor.isDark() ? '#DDDDDD' : tinycolor(mainColor).darken(30).toString();


        renderPreviewFrame();
    }

    function renderPreviewFrame(ayahTextContent = previewAyahTextEl.textContent, surahTitleContent = previewSurahTitleEl.textContent, translationTextContent = previewTranslationTextEl.textContent) {
        if(!previewCtx || !previewCanvas) return;
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // 1. Background
        if (backgroundImage && backgroundImage.tagName === 'IMG' && backgroundImage.complete && backgroundImage.naturalHeight !== 0) {
            const imgAspect = backgroundImage.naturalWidth / backgroundImage.naturalHeight;
            const canvasAspect = previewCanvas.width / previewCanvas.height;
            let sx=0, sy=0, sWidth=backgroundImage.naturalWidth, sHeight=backgroundImage.naturalHeight;
            if (imgAspect > canvasAspect) { 
                sWidth = backgroundImage.naturalHeight * canvasAspect;
                sx = (backgroundImage.naturalWidth - sWidth) / 2;
            } else { 
                sHeight = backgroundImage.naturalWidth / canvasAspect;
                sy = (backgroundImage.naturalHeight - sHeight) / 2;
            }
            previewCtx.drawImage(backgroundImage, sx, sy, sWidth, sHeight, 0, 0, previewCanvas.width, previewCanvas.height);

        } else if (backgroundImage && backgroundImage.tagName === 'VIDEO' && backgroundImage.readyState >= backgroundImage.HAVE_CURRENT_DATA) {
            const vidAspect = backgroundImage.videoWidth / backgroundImage.videoHeight;
            const canvasAspect = previewCanvas.width / previewCanvas.height;
            let sx=0, sy=0, sWidth=backgroundImage.videoWidth, sHeight=backgroundImage.videoHeight;
             if (vidAspect > canvasAspect) {
                sWidth = backgroundImage.videoHeight * canvasAspect;
                sx = (backgroundImage.videoWidth - sWidth) / 2;
            } else {
                sHeight = backgroundImage.videoWidth / canvasAspect;
                sy = (backgroundImage.videoHeight - sHeight) / 2;
            }
            if (sWidth > 0 && sHeight > 0) {
                 previewCtx.drawImage(backgroundImage, sx, sy, sWidth, sHeight, 0, 0, previewCanvas.width, previewCanvas.height);
            }
        } else { 
            previewCtx.fillStyle = currentProject.background.value || '#000000';
            previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        }

        // Common text settings
        previewCtx.textAlign = 'center';
        previewCtx.textBaseline = 'middle'; // Better for vertical centering of lines

        // 2. Surah Title
        previewCtx.fillStyle = currentProject.fontColor; 
        const surahTitleFontSize = previewCanvas.height * 0.06;
        previewCtx.font = `bold ${surahTitleFontSize}px '${currentProject.font}'`; 
        previewCtx.fillText(surahTitleContent, previewCanvas.width / 2, previewCanvas.height * 0.12);

        // Ayah text block positioning
        const ayahTextYPosition = previewCanvas.height * (translationTextContent ? 0.45 : 0.5); // Adjust Y if translation exists

        // 3. Ayah Text Background
        if (currentProject.ayahBgColor && currentProject.ayahBgColor !== 'rgba(0,0,0,0)') { 
            // Estimate background size based on wrapped text later, or use fixed padding
        }

        // 4. Ayah Text
        previewCtx.fillStyle = currentProject.fontColor;
        const ayahFontSize = currentProject.fontSize * (previewCanvas.width / 1920); // Scale font by export resolution base
        previewCtx.font = `${ayahFontSize}px ${currentProject.font}`; 
        
        const maxTextWidth = previewCanvas.width * 0.85;
        const lineHeight = ayahFontSize * 1.6; 
        let lines = wrapText(previewCtx, ayahTextContent, maxTextWidth);
        
        const totalTextHeight = lines.length * lineHeight;
        let startY = ayahTextYPosition - (totalTextHeight / 2) + (lineHeight / 2); // Center block then adjust for first line

        // Draw Ayah Text Background (now that we have lines)
        if (currentProject.ayahBgColor && currentProject.ayahBgColor !== 'rgba(0,0,0,0)') {
            previewCtx.fillStyle = currentProject.ayahBgColor;
            const bgPadding = ayahFontSize * 0.3; // Padding around text
            const textBlockActualWidth = Math.min(maxTextWidth, previewCtx.measureText(lines.reduce((a,b) => a.length > b.length ? a : b, "")).width); // Widest line
            previewCtx.fillRect(
                (previewCanvas.width - textBlockActualWidth) / 2 - bgPadding, 
                startY - lineHeight/2 - bgPadding, // Adjust for textBaseline middle
                textBlockActualWidth + (bgPadding*2), 
                totalTextHeight + (bgPadding*2)
            );
        }
        // Redraw text on top of its background
        previewCtx.fillStyle = currentProject.fontColor; // Reset fillStyle
        lines.forEach((line, index) => {
            previewCtx.fillText(line, previewCanvas.width / 2, startY + (index * lineHeight));
        });

        // 5. Translation Text
        if (translationTextContent) {
            const transColor = tinycolor(currentProject.fontColor);
            previewCtx.fillStyle = transColor.isDark() ? '#E0E0E0' : tinycolor(transColor).darken(40).toString();
            const transFontSize = ayahFontSize * 0.5;
            previewCtx.font = `italic ${transFontSize}px 'Tajawal', sans-serif`;
            const transLines = wrapText(previewCtx, translationTextContent, maxTextWidth * 0.9);
            const transLineHeight = transFontSize * 1.3;
            let transStartY = previewCanvas.height * 0.75 - ((transLines.length * transLineHeight)/2) + (transLineHeight/2);

            transLines.forEach((line, index) => {
                previewCtx.fillText(line, previewCanvas.width / 2, transStartY + (index * transLineHeight));
            });
        }
    }

    function wrapText(context, text, maxWidth) {
        if (!text) return [""];
        const words = text.split(' ');
        let lines = [];
        let currentLine = words[0] || "";

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + " " + word;
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }


    // --- Text Effects (applyTextEffect) ---
    // ... (نفس محتوى الدالة)
    function applyTextEffect(element, text, effect, callback) {
        if(!element) return;
        element.innerHTML = ''; 
        if (effect === 'typewriter') {
            let i = 0;
            function type() {
                if (i < text.length) {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'typewriter-char';
                    charSpan.textContent = text.charAt(i);
                    element.appendChild(charSpan);
                    void charSpan.offsetWidth; 
                    charSpan.style.animationDelay = `${i * 0.03}s`; // CSS animation handles opacity
                    i++;
                    setTimeout(type, 30); 
                } else {
                    if (callback) setTimeout(callback, (text.length * 30) + 300); // Wait for full animation
                }
            }
            type();
        } else if (effect === 'fade') {
            element.style.opacity = 0;
            element.textContent = text;
            setTimeout(() => {
                element.style.transition = 'opacity 0.5s';
                element.style.opacity = 1;
                if (callback) setTimeout(callback, 500);
            }, 50);
        } else { 
            element.textContent = text;
            if (callback) callback();
        }
    }

    // --- Background Handling (handleBackgroundImport, fetchAiBackgrounds) ---
    // ... (نفس محتوى الدوال)
    function handleBackgroundImport(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                showLoading("جاري معالجة الخلفية...");
                if (file.type.startsWith('image/')) {
                    const img = new Image();
                    img.onload = () => {
                        backgroundImage = img;
                        currentProject.background = { type: 'image', value: e.target.result }; 
                        renderPreviewFrame();
                        hideLoading();
                    };
                    img.onerror = () => { alert("فشل تحميل الصورة."); hideLoading(); }
                    img.src = e.target.result;
                } else if (file.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.src = e.target.result;
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true; 
                    video.onloadeddata = () => {
                        backgroundImage = video;
                        currentProject.background = { type: 'video', value: "local_video_file_placeholder" }; 
                         function drawVideoFrameOnCanvas() {
                            if (backgroundImage === video && video.readyState >= video.HAVE_CURRENT_DATA && editorScreen.style.display !== 'none') {
                                renderPreviewFrame();
                                requestAnimationFrame(drawVideoFrameOnCanvas);
                            }
                        }
                        requestAnimationFrame(drawVideoFrameOnCanvas);
                        hideLoading();
                    }
                    video.onerror = () => { alert("فشل تحميل الفيديو."); hideLoading(); }
                } else {
                     alert("نوع ملف غير مدعوم للخلفية.");
                     hideLoading();
                }
            };
            reader.readAsDataURL(file);
        }
    }

    async function fetchAiBackgrounds() {
        const surahInfo = surahsData.find(s => s.number == surahSelect.value);
        const surahNameQuery = surahInfo ? surahInfo.englishName.split(' ').pop() : "islamic pattern";
        if (!surahNameQuery) {
            alert("يرجى تحديد سورة أولاً.");
            return;
        }
        showLoading("جاري البحث عن خلفيات...");
        aiBgSuggestionsContainer.innerHTML = '';

        try {
            const response = await axios.get(`https://api.pexels.com/v1/search`, {
                headers: { Authorization: PEXELS_API_KEY },
                params: { query: `${surahNameQuery} islamic art abstract nature`, per_page: 6, orientation: 'landscape' }
            });
            if (response.data.photos.length === 0) {
                aiBgSuggestionsContainer.innerHTML = '<p>لم يتم العثور على خلفيات مناسبة.</p>';
                return;
            }
            response.data.photos.forEach(photo => {
                const imgEl = document.createElement('img');
                imgEl.src = photo.src.medium; 
                imgEl.dataset.originalSrc = photo.src.original; // Store original for high quality
                imgEl.alt = photo.alt || `Background for ${surahNameQuery}`;
                imgEl.title = photo.alt || `Background for ${surahNameQuery}`;
                imgEl.addEventListener('click', () => {
                    aiBgSuggestionsContainer.querySelectorAll('img').forEach(i => i.classList.remove('selected-ai-bg'));
                    imgEl.classList.add('selected-ai-bg');
                    
                    showLoading("جاري تحميل الخلفية المختارة...");
                    const selectedImg = new Image();
                    selectedImg.crossOrigin = "Anonymous"; 
                    selectedImg.onload = () => {
                        backgroundImage = selectedImg;
                        currentProject.background = { type: 'image', value: selectedImg.src }; 
                        renderPreviewFrame();
                        hideLoading();
                    };
                    selectedImg.onerror = () => {
                        alert("حدث خطأ أثناء تحميل صورة الخلفية المختارة.");
                        backgroundImage = null;
                        currentProject.background = {type: 'color', value: '#000000'};
                        renderPreviewFrame();
                        hideLoading();
                    }
                    selectedImg.src = imgEl.dataset.originalSrc; // Use original source
                });
                aiBgSuggestionsContainer.appendChild(imgEl);
            });
        } catch (error) {
            console.error("Error fetching AI backgrounds from Pexels:", error);
            aiBgSuggestionsContainer.innerHTML = '<p>فشل تحميل اقتراحات الخلفيات.</p>';
        } finally {
            if (aiBgSuggestionsContainer.innerHTML !== '' && !aiBgSuggestionsContainer.innerHTML.startsWith('<p>')) {
                // Only hide if suggestions were loaded, not if an error message is shown
            } else {
                 hideLoading(); // Ensure loading is hidden if no suggestions or error
            }
        }
    }


    // --- Audio Playback (playAudioSequence) ---
    // ... (نفس محتوى الدالة)
    async function playAudioSequence() {
        if (isPlayingSequence) { 
            if (currentPlayingAudio) {
                currentPlayingAudio.pause();
                currentPlayingAudio.onended = null; 
            }
            isPlayingSequence = false;
            playRangeBtn.innerHTML = '<i class="fas fa-play-circle"></i> تشغيل المعاينة';
            hideLoading(); // Ensure loading is hidden if stopped
            return;
        }

        isPlayingSequence = true;
        playRangeBtn.innerHTML = '<i class="fas fa-stop-circle"></i> إيقاف المعاينة';

        const surahNum = parseInt(surahSelect.value);
        const startAyah = parseInt(ayahStartSelect.value);
        const endAyah = parseInt(ayahEndSelect.value);
        const reciterId = reciterSelect.value;
        const translationId = translationSelect.value;
        const delayMs = Math.max(0, parseFloat(delayBetweenAyahsInput.value) * 1000);

        for (let ayahNum = startAyah; ayahNum <= endAyah; ayahNum++) {
            if (!isPlayingSequence) break; 

            showLoading(`تشغيل الآية ${ayahNum}...`);
            const ayahData = await fetchAyahData(surahNum, ayahNum, reciterId, translationId);
            
            if (!ayahData || !isPlayingSequence) {
                if (!ayahData) alert(`لم يتم العثور على بيانات للآية ${ayahNum}`);
                hideLoading();
                break;
            }
            
            previewSurahTitleEl.textContent = ayahData.surahName;
            applyTextEffect(previewAyahTextEl, ayahData.text, currentProject.textEffect, () => {});
            previewTranslationTextEl.textContent = ayahData.translationText || "";
            renderPreviewFrame(ayahData.text, ayahData.surahName, ayahData.translationText);


            if (currentPlayingAudio) {
                currentPlayingAudio.pause();
            }
            
            if (!ayahData.audio) { // If no audio URL (e.g., text-only fetch earlier)
                console.warn(`No audio for Ayah ${ayahNum}, skipping playback for this Ayah.`);
                hideLoading(); // Hide loading for this ayah
                 if (isPlayingSequence) await new Promise(r => setTimeout(r, delayMs)); // Respect delay
                continue; // Go to next ayah
            }

            currentPlayingAudio = new Audio(ayahData.audio);
            
            try {
                await new Promise((resolve, reject) => {
                    currentPlayingAudio.onloadedmetadata = () => hideLoading(); // Hide specific ayah loading once metadata is ready
                    currentPlayingAudio.onended = () => {
                        currentPlayingAudio = null;
                        if (isPlayingSequence) setTimeout(resolve, delayMs); 
                        else resolve(); 
                    };
                    currentPlayingAudio.onerror = (e) => {
                        alert(`خطأ في تشغيل صوت الآية ${ayahNum}`);
                        console.error("Audio playback error:", e);
                        currentPlayingAudio = null;
                        hideLoading();
                        reject(new Error("Audio playback error")); 
                    };
                    if (isPlayingSequence) currentPlayingAudio.play().catch(e => reject(e)); // Catch play() promise rejection
                    else resolve(); 
                });
            } catch (error) {
                // Error handled by onerror or play().catch()
                if (!isPlayingSequence) break; // Stop if sequence was cancelled
                // Optionally, try to continue to next ayah
            }
        }
        
        isPlayingSequence = false;
        playRangeBtn.innerHTML = '<i class="fas fa-play-circle"></i> تشغيل المعاينة';
        if (currentPlayingAudio) {
            currentPlayingAudio.pause(); 
            currentPlayingAudio = null;
        }
        hideLoading(); // Final hide loading
        updatePreviewWithFirstAyah(); // Reset to first ayah after sequence
    }

    // --- Video Export (exportVideo, renderAyahForExport, updateExportProgress) ---
    // ... (نفس محتوى الدوال)
    async function exportVideo() {
        if (capturer) {
            alert("التصدير قيد التقدم بالفعل.");
            return;
        }

        showLoading("تحضير التصدير...");
        exportProgressContainer.style.display = 'block';
        exportProgressBar.value = 0;
        exportProgressText.textContent = '0%';

        const [renderWidth, renderHeight] = currentProject.resolution.split('x').map(Number);
        
        const originalCanvasStyleWidth = previewCanvas.style.width;
        const originalCanvasStyleHeight = previewCanvas.style.height;
        const originalCanvasWidth = previewCanvas.width;
        const originalCanvasHeight = previewCanvas.height;

        // Set canvas to actual export resolution for CCapture
        previewCanvas.width = renderWidth;
        previewCanvas.height = renderHeight;
        // Temporarily remove style constraints if any, for CCapture
        previewCanvas.style.width = `${renderWidth}px`;
        previewCanvas.style.height = `${renderHeight}px`;


        capturer = new CCapture({
            format: 'webm', 
            framerate: 30, 
            verbose: false,
            name: `quran-video-${currentProject.name.replace(/\s+/g, '_')}-${Date.now()}`,
            quality: 90, 
        });

        capturer.start();

        const surahNum = parseInt(surahSelect.value);
        const startAyah = parseInt(ayahStartSelect.value);
        const endAyah = parseInt(ayahEndSelect.value);
        const reciterId = reciterSelect.value; // Need this for audio duration
        const translationId = translationSelect.value;
        const delayBetweenAyahsSec = parseFloat(delayBetweenAyahsInput.value);
        const transitionDurationSec = currentProject.transition === 'fade' ? 0.5 : 0; 

        let totalEstimatedDuration = 0;
        let audioDurations = [];
        let ayahDataArray = []; // Store fetched data to avoid re-fetching

        // Pre-fetch all Ayah data and audio durations
        showLoading("جاري جلب بيانات الآيات ومدد الصوت...");
        for (let ayahNum = startAyah; ayahNum <= endAyah; ayahNum++) {
            const ayahData = await fetchAyahData(surahNum, ayahNum, reciterId, translationId);
            if (ayahData) {
                ayahDataArray.push(ayahData);
                if (ayahData.audio) {
                    const audio = new Audio(ayahData.audio);
                    const duration = await new Promise(resolve => {
                        audio.onloadedmetadata = () => resolve(audio.duration);
                        audio.onerror = () => resolve(3); // Default 3s if audio fails
                        audio.load(); // Start loading metadata
                    });
                    audioDurations.push(duration);
                    totalEstimatedDuration += duration + delayBetweenAyahsSec + (transitionDurationSec * 2);
                } else { // No audio URL
                    audioDurations.push(3); // Default duration for text-only
                    totalEstimatedDuration += 3 + delayBetweenAyahsSec + (transitionDurationSec * 2);
                }
            } else { // Failed to fetch Ayah data
                ayahDataArray.push(null); // Placeholder
                audioDurations.push(0); // No duration
            }
        }
        // hideLoading(); // Will be hidden by the loop's showLoading
        showLoading("جاري تصدير الفيديو...");

        let elapsedDuration = 0;

        for (let i = 0; i < ayahDataArray.length; i++) {
            const currentAyahData = ayahDataArray[i];
            if (!currentAyahData) continue; // Skip if data fetch failed for this ayah

            const ayahNumForDisplay = startAyah + i;
            // showLoading(`تصدير الآية ${ayahNumForDisplay}/${endAyah}...`); // Redundant with main export message

            const audioDuration = audioDurations[i] || 3; 
            
            await renderAyahForExport(currentAyahData, 'in', transitionDurationSec);
            
            const holdStartTime = Date.now();
            const holdDurationFrames = Math.round(audioDuration * 30); // 30 fps

            for(let frame = 0; frame < holdDurationFrames; frame++) {
                renderPreviewFrame(currentAyahData.text, currentAyahData.surahName, currentAyahData.translationText); 
                capturer.capture(previewCanvas);
                // No need for manual setTimeout, CCapture handles timing based on framerate
                elapsedDuration += 1/30;
                updateExportProgress(elapsedDuration, totalEstimatedDuration);
                // Yield to browser to prevent freezing for very long ayahs
                if (frame % 60 === 0) await new Promise(r => setTimeout(r, 0));
            }


            await renderAyahForExport(currentAyahData, 'out', transitionDurationSec);

            if (delayBetweenAyahsSec > 0 && (startAyah + i) < endAyah) {
                const delayFrames = Math.round(delayBetweenAyahsSec * 30);
                for(let frame = 0; frame < delayFrames; frame++) {
                    if(currentProject.transition === 'fade') { // Faded out to black
                         previewCtx.fillStyle = currentProject.background.type === 'color' ? currentProject.background.value : '#000000';
                         previewCtx.fillRect(0,0, previewCanvas.width, previewCanvas.height);
                    } else { // Hold last frame of previous ayah
                         renderPreviewFrame(currentAyahData.text, currentAyahData.surahName, currentAyahData.translationText); // Or blank if preferred
                    }
                    capturer.capture(previewCanvas);
                    elapsedDuration += 1/30;
                    updateExportProgress(elapsedDuration, totalEstimatedDuration);
                    if (frame % 60 === 0) await new Promise(r => setTimeout(r, 0));
                }
            }
        }
        
        capturer.stop();
        capturer.save();
        capturer = null;

        // Restore original canvas display size and style
        previewCanvas.width = originalCanvasWidth;
        previewCanvas.height = originalCanvasHeight;
        previewCanvas.style.width = originalCanvasStyleWidth;
        previewCanvas.style.height = originalCanvasStyleHeight;
        resizeCanvas(); // Re-apply responsive scaling and render

        hideLoading();
        exportProgressContainer.style.display = 'none';
        alert("تم تصدير الفيديو بنجاح! (الفيديو بدون صوت)");
    }

    async function renderAyahForExport(ayahData, transitionType, durationSec) {
        const frames = Math.max(1, Math.round(durationSec * 30)); // At least 1 frame
        
        if (durationSec === 0 || currentProject.transition === 'none') { 
            renderPreviewFrame(ayahData.text, ayahData.surahName, ayahData.translationText);
            if (transitionType === 'in') capturer.capture(previewCanvas); 
            return;
        }

        if (currentProject.transition === 'fade') {
            for (let frame = 0; frame <= frames; frame++) {
                const progress = frame / frames;
                previewCtx.globalAlpha = (transitionType === 'in') ? progress : (1 - progress);
                renderPreviewFrame(ayahData.text, ayahData.surahName, ayahData.translationText);
                capturer.capture(previewCanvas);
                if (frame % 60 === 0 && frame < frames) await new Promise(r => setTimeout(r, 0)); // Yield
            }
            previewCtx.globalAlpha = 1; 
        }
    }

    function updateExportProgress(elapsed, total) {
        // ... (نفس محتوى الدالة)
        const percentage = Math.min(100, Math.floor((elapsed / total) * 100));
        if(exportProgressBar) exportProgressBar.value = percentage;
        if(exportProgressText) exportProgressText.textContent = `${percentage}%`;
    }


    // --- Toolbar Logic (setupToolbarTabs) ---
    // ... (نفس محتوى الدالة)
     function setupToolbarTabs() {
        const tabButtons = document.querySelectorAll('.toolbar-tab-button');
        const controlPanels = document.querySelectorAll('.toolbar-controls');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                
                tabButtons.forEach(btn => btn.parentElement.classList.remove('active'));
                controlPanels.forEach(panel => panel.style.display = 'none');

                button.parentElement.classList.add('active');
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.style.display = 'grid'; 
                }
            });
        });
        if (tabButtons.length > 0 && tabButtons[0].parentElement.classList.contains('active')) {
             // If first tab is already active (e.g. from HTML), ensure its panel is shown
            const firstActivePanelId = tabButtons[0].dataset.target;
            const firstActivePanel = document.getElementById(firstActivePanelId);
            if(firstActivePanel) firstActivePanel.style.display = 'grid';
        } else if (tabButtons.length > 0) {
            tabButtons[0].click(); // Activate the first tab by default if none are active
        }
    }


    // --- Loading Spinner ---
    function showLoading(message = "جاري التحميل...") {
        // ... (نفس محتوى الدالة)
        if(loadingSpinner) loadingSpinner.style.display = 'flex'; 
    }
    function hideLoading() {
        // ... (نفس محتوى الدالة)
        if(loadingSpinner) loadingSpinner.style.display = 'none';
    }
    
    // --- Event Listeners Setup ---
    function setupEventListeners() {
        console.log("Setting up event listeners..."); // تتبع

        if (goToEditorBtn) {
            goToEditorBtn.addEventListener('click', () => {
                console.log("goToEditorBtn clicked!"); // تتبع
                currentProject = createNewProject(); 
                loadProject(currentProject); 
                showEditorScreen();
            });
        } else {
            console.error("goToEditorBtn not found!"); // تتبع
        }

        if(backToInitialScreenBtn) backToInitialScreenBtn.addEventListener('click', showInitialScreen);
        if(themeToggleInitial) themeToggleInitial.addEventListener('click', toggleTheme);
        if(themeToggleEditor) themeToggleEditor.addEventListener('click', toggleTheme);
        if(saveProjectBtn) saveProjectBtn.addEventListener('click', saveCurrentProject);

        if(surahSelect) surahSelect.addEventListener('change', (e) => { currentProject.surah = parseInt(e.target.value); populateAyahSelects(currentProject.surah); });
        if(ayahStartSelect) ayahStartSelect.addEventListener('change', (e) => { currentProject.ayahStart = parseInt(e.target.value); updateAyahEndOptions();});
        if(ayahEndSelect) ayahEndSelect.addEventListener('change', (e) => { currentProject.ayahEnd = parseInt(e.target.value); updatePreviewWithFirstAyah(); }); // Update preview if end ayah changes
        if(reciterSelect) reciterSelect.addEventListener('change', (e) => { currentProject.reciter = e.target.value; updatePreviewWithFirstAyah(); });
        if(translationSelect) translationSelect.addEventListener('change', (e) => { currentProject.translation = e.target.value; updatePreviewWithFirstAyah(); });

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
            applyTextEffect(previewAyahTextEl, previewAyahTextEl.textContent, currentProject.textEffect, () => {});
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
        setupToolbarTabs();
        console.log("Event listeners setup complete."); // تتبع
    }

    // --- Start the application ---
    init();
});
