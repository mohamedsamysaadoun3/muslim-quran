document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); 

    // --- DOM Elements ---
    // ... (نفس تعريفات العناصر) ...
    const initialScreen = document.getElementById('initial-screen');
    const editorScreen = document.getElementById('editor-screen');
    const goToEditorBtn = document.getElementById('go-to-editor-btn');
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

    let isExporting = false; // Flag to prevent re-entrancy or UI interference
    let videoBgAnimationId = null; // To control video background animation loop

    // --- State Variables ---
    // ... (نفس متغيرات الحالة) ...
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


    function createNewProject() {
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
            fontColor: '#FFFFFF', // لون النص الافتراضي أبيض
            ayahBgColor: 'rgba(0,0,0,0)', // خلفية الآية الافتراضية شفافة
            textEffect: 'none',
            background: { type: 'color', value: '#000000' },
            delayBetweenAyahs: 1,
            resolution: '1920x1080',
            transition: 'fade',
            createdAt: new Date().toISOString()
        };
    }

    // --- renderPreviewFrame تعديلات رئيسية في ---
    function renderPreviewFrame(ayahTextContent = previewAyahTextEl.textContent, surahTitleContent = previewSurahTitleEl.textContent, translationTextContent = previewTranslationTextEl.textContent) {
        if(!previewCtx || !previewCanvas) return;
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // 1. Background
        try {
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
                // Video drawing logic as before
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
        } catch (e) {
            console.error("Error drawing background on canvas:", e);
            previewCtx.fillStyle = '#111111'; // Fallback background on error
            previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        }


        // Common text settings
        previewCtx.textAlign = 'center';
        previewCtx.textBaseline = 'middle'; 
        previewCtx.shadowColor = "transparent"; // No shadow by default on canvas
        previewCtx.shadowBlur = 0;
        previewCtx.shadowOffsetX = 0;
        previewCtx.shadowOffsetY = 0;

        // 2. Surah Title
        try {
            previewCtx.fillStyle = currentProject.fontColor; 
            const surahTitleFontSize = previewCanvas.height * 0.06;
            previewCtx.font = `bold ${surahTitleFontSize}px '${currentProject.font}'`; 
            previewCtx.fillText(surahTitleContent, previewCanvas.width / 2, previewCanvas.height * 0.12);
        } catch (e) { console.error("Error drawing Surah title:", e); }


        const ayahTextYPosition = previewCanvas.height * (translationTextContent && translationTextContent.trim() !== "" ? 0.45 : 0.5);

        // 4. Ayah Text
        try {
            const ayahFontSize = currentProject.fontSize * (previewCanvas.width / 1920); 
            previewCtx.font = `${ayahFontSize}px ${currentProject.font}`; 
            
            const maxTextWidth = previewCanvas.width * 0.85;
            const lineHeight = ayahFontSize * 1.6; 
            let lines = wrapText(previewCtx, ayahTextContent, maxTextWidth);
            
            const totalTextHeight = lines.length * lineHeight;
            let startY = ayahTextYPosition - (totalTextHeight / 2) + (lineHeight / 2); 

            // Draw Ayah Text Background (if chosen by user)
            if (currentProject.ayahBgColor && currentProject.ayahBgColor !== 'rgba(0,0,0,0)') {
                previewCtx.fillStyle = currentProject.ayahBgColor;
                const bgPaddingVertical = ayahFontSize * 0.2; 
                const bgPaddingHorizontal = ayahFontSize * 0.3;
                
                let widestLineWidth = 0;
                for(const line of lines) {
                    const lineWidth = previewCtx.measureText(line).width;
                    if (lineWidth > widestLineWidth) widestLineWidth = lineWidth;
                }
                if (widestLineWidth > maxTextWidth) widestLineWidth = maxTextWidth;


                previewCtx.fillRect(
                    (previewCanvas.width - widestLineWidth) / 2 - bgPaddingHorizontal, 
                    startY - (lineHeight/2) - bgPaddingVertical, 
                    widestLineWidth + (bgPaddingHorizontal*2), 
                    totalTextHeight + (bgPaddingVertical*2)
                );
            }
            
            previewCtx.fillStyle = currentProject.fontColor; 
            lines.forEach((line, index) => {
                previewCtx.fillText(line, previewCanvas.width / 2, startY + (index * lineHeight));
            });
        } catch (e) { console.error("Error drawing Ayah text:", e); }

        // 5. Translation Text
        try {
            if (translationTextContent && translationTextContent.trim() !== "") {
                const transColor = tinycolor(currentProject.fontColor);
                previewCtx.fillStyle = transColor.isDark() ? '#E0E0E0' : tinycolor(transColor).darken(40).toString();
                const transFontSize = currentProject.fontSize * 0.5 * (previewCanvas.width / 1920);
                previewCtx.font = `italic ${transFontSize}px 'Tajawal', sans-serif`;
                const transLines = wrapText(previewCtx, translationTextContent, previewCanvas.width * 0.8); // Slightly less width
                const transLineHeight = transFontSize * 1.3;
                let transStartY = previewCanvas.height * 0.78 - ((transLines.length * transLineHeight)/2) + (transLineHeight/2); // Positioned lower

                transLines.forEach((line, index) => {
                    previewCtx.fillText(line, previewCanvas.width / 2, transStartY + (index * transLineHeight));
                });
            }
        } catch (e) { console.error("Error drawing Translation text:", e); }
    }

    // --- handleBackgroundImport ---
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
                        
                        // Cancel any previous video animation loop
                        if (videoBgAnimationId) cancelAnimationFrame(videoBgAnimationId);

                        function drawVideoFrameOnCanvas() {
                            if (backgroundImage === video && video.readyState >= video.HAVE_CURRENT_DATA && editorScreen.style.display !== 'none' && !isExporting) {
                                renderPreviewFrame();
                                videoBgAnimationId = requestAnimationFrame(drawVideoFrameOnCanvas);
                            } else {
                                videoBgAnimationId = null; // Stop loop if conditions not met
                            }
                        }
                        videoBgAnimationId = requestAnimationFrame(drawVideoFrameOnCanvas);
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

    // --- exportVideo تعديلات رئيسية في ---
    async function exportVideo() {
        if (isExporting) {
            alert("التصدير قيد التقدم بالفعل.");
            return;
        }
        isExporting = true;
        showLoading("تحضير التصدير...");
        if (exportProgressContainer) {
            exportProgressContainer.style.display = 'block';
            if(exportProgressBar) exportProgressBar.value = 0;
            if(exportProgressText) exportProgressText.textContent = '0%';
        }


        const [renderWidth, renderHeight] = currentProject.resolution.split('x').map(Number);
        
        const originalCanvasStyleWidth = previewCanvas.style.width;
        const originalCanvasStyleHeight = previewCanvas.style.height;
        const originalCanvasWidth = previewCanvas.width;
        const originalCanvasHeight = previewCanvas.height;

        previewCanvas.width = renderWidth;
        previewCanvas.height = renderHeight;
        previewCanvas.style.width = `${renderWidth}px`;
        previewCanvas.style.height = `${renderHeight}px`;


        capturer = new CCapture({
            format: 'webm', 
            framerate: 30, 
            verbose: true, // Enable verbose for more logs from CCapture itself
            name: `quran-video-${currentProject.name.replace(/\s+/g, '_')}-${Date.now()}`,
            quality: 90, 
            // workersPath: 'js/' // If using CCapture with workers, specify path
        });
        console.log("CCapture initialized. Starting capture...");
        capturer.start();

        const surahNum = parseInt(surahSelect.value);
        const startAyah = parseInt(ayahStartSelect.value);
        const endAyah = parseInt(ayahEndSelect.value);
        const reciterId = reciterSelect.value; 
        const translationId = translationSelect.value;
        const delayBetweenAyahsSec = parseFloat(delayBetweenAyahsInput.value);
        const transitionDurationSec = currentProject.transition === 'fade' ? 0.5 : 0; 

        let totalEstimatedDuration = 0;
        let audioDurations = [];
        let ayahDataArray = []; 

        try { // Wrap pre-fetching in try-catch
            showLoading("جاري جلب بيانات الآيات...");
            for (let ayahNum = startAyah; ayahNum <= endAyah; ayahNum++) {
                const ayahData = await fetchAyahData(surahNum, ayahNum, reciterId, translationId);
                if (ayahData) {
                    ayahDataArray.push(ayahData);
                    let duration = 3; // Default if no audio
                    if (ayahData.audio) {
                        const audio = new Audio(ayahData.audio);
                        duration = await new Promise(resolve => {
                            audio.onloadedmetadata = () => resolve(audio.duration);
                            audio.onerror = () => { console.warn(`Failed to load audio metadata for S${surahNum}A${ayahNum}`); resolve(3); }
                            audio.load(); 
                        });
                    }
                    audioDurations.push(duration);
                    totalEstimatedDuration += duration + delayBetweenAyahsSec + (transitionDurationSec * 2);
                } else { 
                    ayahDataArray.push(null); 
                    audioDurations.push(0); 
                    console.warn(`Failed to fetch data for Surah ${surahNum} Ayah ${ayahNum}`);
                }
            }
        } catch (error) {
            console.error("Error during pre-fetching ayah data for export:", error);
            alert("حدث خطأ أثناء تحضير بيانات الآيات للتصدير. يرجى المحاولة مرة أخرى.");
            hideLoading();
            isExporting = false;
            // Restore canvas original size
            previewCanvas.width = originalCanvasWidth;
            previewCanvas.height = originalCanvasHeight;
            previewCanvas.style.width = originalCanvasStyleWidth;
            previewCanvas.style.height = originalCanvasStyleHeight;
            resizeCanvas();
            return;
        }
        
        showLoading("جاري تصدير الفيديو (قد يستغرق بعض الوقت)...");
        console.log(`Total estimated duration for export: ${totalEstimatedDuration}s`);

        let elapsedDuration = 0;

        for (let i = 0; i < ayahDataArray.length; i++) {
            const currentAyahData = ayahDataArray[i];
            if (!currentAyahData) {
                console.warn(`Skipping ayah index ${i} due to missing data.`);
                continue;
            }

            const audioDuration = audioDurations[i] || 3; 
            console.log(`Exporting Ayah ${currentAyahData.numberInSurah} (Duration: ${audioDuration}s)`);
            
            try {
                await renderAyahForExport(currentAyahData, 'in', transitionDurationSec);
                
                const holdDurationFrames = Math.max(1, Math.round(audioDuration * 30)); 

                for(let frame = 0; frame < holdDurationFrames; frame++) {
                    renderPreviewFrame(currentAyahData.text, currentAyahData.surahName, currentAyahData.translationText); 
                    capturer.capture(previewCanvas);
                    elapsedDuration += 1/30;
                    updateExportProgress(elapsedDuration, totalEstimatedDuration);
                    if (frame % 15 === 0) await new Promise(r => setTimeout(r, 0)); // Yield more often
                }

                await renderAyahForExport(currentAyahData, 'out', transitionDurationSec);

                if (delayBetweenAyahsSec > 0 && (startAyah + i) < endAyah) {
                    const delayFrames = Math.round(delayBetweenAyahsSec * 30);
                    for(let frame = 0; frame < delayFrames; frame++) {
                        if(currentProject.transition === 'fade') { 
                             previewCtx.fillStyle = currentProject.background.type === 'color' ? currentProject.background.value : '#000000';
                             previewCtx.fillRect(0,0, previewCanvas.width, previewCanvas.height);
                        } else { 
                             // For 'none' transition, render the last frame of the previous ayah during delay, or clear to background
                             renderPreviewFrame(currentAyahData.text, currentAyahData.surahName, currentAyahData.translationText); 
                        }
                        capturer.capture(previewCanvas);
                        elapsedDuration += 1/30;
                        updateExportProgress(elapsedDuration, totalEstimatedDuration);
                         if (frame % 15 === 0) await new Promise(r => setTimeout(r, 0));
                    }
                }
            } catch (renderError) {
                console.error(`Error rendering/capturing frame for Ayah ${currentAyahData.numberInSurah}:`, renderError);
                // Optionally, decide if you want to stop the whole export or try to continue
            }
        }
        
        console.log("Stopping CCapture and saving...");
        try {
            capturer.stop();
            capturer.save(blob => { // CCapture.js save often takes a callback for when the blob is ready
                console.log("Video blob ready, download should start.", blob);
                 // If it doesn't auto-download, you might need to create a link and click it:
                // const url = URL.createObjectURL(blob);
                // const a = document.createElement('a');
                // a.style.display = 'none';
                // a.href = url;
                // a.download = capturer.name + '.' + capturer.format; // Use capturer properties
                // document.body.appendChild(a);
                // a.click();
                // window.URL.revokeObjectURL(url);
                // document.body.removeChild(a);
            });
        } catch (e) {
            console.error("Error stopping/saving CCapture:", e);
        }
        
        capturer = null;

        previewCanvas.width = originalCanvasWidth;
        previewCanvas.height = originalCanvasHeight;
        previewCanvas.style.width = originalCanvasStyleWidth;
        previewCanvas.style.height = originalCanvasStyleHeight;
        resizeCanvas(); 

        hideLoading();
        if (exportProgressContainer) exportProgressContainer.style.display = 'none';
        alert("تم الانتهاء من محاولة تصدير الفيديو! (الفيديو بدون صوت)");
        isExporting = false;
    }

    async function renderAyahForExport(ayahData, transitionType, durationSec) {
        // ... (نفس محتوى الدالة مع التأكد من الـ yield)
        const frames = Math.max(1, Math.round(durationSec * 30)); 
        
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
                if (frame % 15 === 0 && frame < frames) await new Promise(r => setTimeout(r, 0)); 
            }
            previewCtx.globalAlpha = 1; 
        }
    }


    // --- باقي الدوال (init, loadProject, saveCurrentProject, etc.) كما هي أو مع تعديلات طفيفة مذكورة سابقًا ---
    // Ensure all selectors and event listeners are correctly set up in init and setupEventListeners

    // --- Initialization ---
    async function init() {
        console.log("Initializing app...");
        loadTheme();
        loadProjects(); // Load projects before fetching data so surah names can be resolved
        showLoading("جاري تحميل البيانات الأولية...");
        try {
            await Promise.all([fetchSurahs(), fetchReciters(), fetchTranslations()]);
            populateSurahSelect(); // Depends on surahsData
            loadProjects(); // Reload projects to display Surah names correctly if they weren't available before
            populateReciterSelect(); // Depends on recitersData
            populateTranslationSelect(); // Depends on translationsData
            
            setupEventListeners();
            updatePreviewStyle(); 
            resizeCanvas(); 
            // renderPreviewFrame(); // updatePreviewWithFirstAyah will handle initial render
            updatePreviewWithFirstAyah(); // Ensure preview is updated after all selects are populated
            console.log("App initialized successfully.");
        } catch (error) {
            console.error("Initialization failed:", error);
            alert("فشل في تهيئة التطبيق. الرجاء تحديث الصفحة أو التحقق من اتصال الإنترنت.");
        } finally {
            hideLoading();
        }
    }
    
    // ... (باقي الدوال كما هي من الرد السابق، مع التأكد من أن `setupEventListeners` و `init` سليمة)

    // --- Start the application ---
    init();
});
