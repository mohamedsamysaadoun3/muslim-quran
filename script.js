// ... (بداية الملف كما هي) ...

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Starting script execution...");

    // --- DOM Element Getters (Safer) ---
    const getElement = (id) => {
        const el = document.getElementById(id);
        // هنضيف alert هنا عشان لو عنصر مهم مش موجود، نعرف فورًا
        if (!el && (id === 'initial-screen' || id === 'editor-screen' || id === 'go-to-editor-btn')) {
            alert(`Critical element with ID '${id}' NOT FOUND! App might not work correctly.`);
        }
        if (!el) console.error(`Element with ID '${id}' not found!`);
        return el;
    };

    // ... (باقي تعريفات العناصر كما هي) ...
    const initialScreen = getElement('initial-screen');
    const editorScreen = getElement('editor-screen');
    const goToEditorBtn = getElement('go-to-editor-btn'); // مهم نتأكد من ده

    // ... (باقي الدوال كما هي حتى نصل إلى setupEventListeners) ...

    // --- Screen Navigation ---
    function showInitialScreen() {
        // ... (محتوى الدالة كما هو)
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
        alert("Inside showEditorScreen function! Attempting to switch screens."); // <-- الـ Alert الجديد هنا
        console.log("Attempting to show editor screen...");
        if (initialScreen) initialScreen.style.display = 'none'; else console.error("'initialScreen' not found for showEditorScreen");
        if (editorScreen) editorScreen.style.display = 'flex'; else console.error("'editorScreen' not found for showEditorScreen");
        
        resizeCanvas(); 
        renderPreviewFrame(); 
        console.log("Editor screen display should be flex, initial none.");
    }


    // --- Event Listeners Setup (CRUCIAL) ---
    function setupEventListeners() {
        console.log("Setting up event listeners...");

        if (goToEditorBtn) {
            goToEditorBtn.addEventListener('click', () => {
                alert("Create Video button (goToEditorBtn) CLICKED!"); // <-- الـ Alert الجديد هنا
                console.log("Create Video button clicked!");
                currentProject = createNewProject(); 
                loadProject(currentProject); 
                showEditorScreen();
            });
        } else {
            // لو goToEditorBtn مش موجود، هيظهر الـ alert من دالة getElement فوق
            console.error("goToEditorBtn (إنشاء فيديو) not found! Cannot attach listener.");
        }

        // ... (باقي الـ event listeners كما هي) ...
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
        
        if(saveProjectBtn) saveProjectBtn.addEventListener('click', saveCurrentProject);
        if(surahSelect) surahSelect.addEventListener('change', (e) => { currentProject.surah = parseInt(e.target.value); populateAyahSelects(currentProject.surah); });
        
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
        setupToolbarTabs(); 
        console.log("Event listeners setup complete.");
    }

    // --- (باقي دوال الـ init, loadProject, API fetches, rendering, export logic, etc. كما هي من الرد السابق الكامل) ---
    // ... تأكد من أنك تستخدم النسخة الكاملة والصحيحة من باقي الدوال ...
    // --- Initialization ---
    async function init() {
        console.log("App Init: Starting...");
        loadTheme(); 

        if (!initialScreen || !editorScreen || !goToEditorBtn) {
            console.error("Critical UI elements missing. Aborting full initialization.");
            // alert("حدث خطأ في تحميل واجهة التطبيق. يرجى تحديث الصفحة."); // الـ alert ده هيظهر من getElement لو فيه مشكلة
            if (themeToggleInitial) themeToggleInitial.addEventListener('click', toggleTheme);
            return;
        }
        
        showLoading("جاري تحميل البيانات الأولية...");
        try {
            await Promise.all([fetchSurahs(), fetchReciters(), fetchTranslations()]);
            console.log("App Init: Data fetched.");

            if(surahSelect) populateSurahSelect();
            if(reciterSelect) populateReciterSelect();
            if(translationSelect) populateTranslationSelect();
            console.log("App Init: Selects populated.");

            loadProjects(); 
            console.log("App Init: Projects loaded.");
            
            setupEventListeners(); 
            
            loadProject(currentProject); 
            updatePreviewStyle(); 
            resizeCanvas(); 
            updatePreviewWithFirstAyah(); 

            showInitialScreen(); 
            
            console.log("App Init: Initialization sequence complete.");
        } catch (error) {
            console.error("App Init: Initialization failed:", error);
            alert("فشل في تهيئة التطبيق. يرجى تحديث الصفحة أو التحقق من اتصال الإنترنت.");
            if (themeToggleInitial) themeToggleInitial.addEventListener('click', toggleTheme);
        } finally {
            hideLoading();
        }
    }
    
    // (Include ALL other helper functions: API fetches, renderPreviewFrame, wrapText, text effects, background handling, audio, export logic etc. from the previous full working script here)
    // MAKE SURE THEY ARE COMPLETE AND CORRECT.
    function loadProject(projectData) {
        console.log("Loading project data into UI...");
        currentProject = { ...createNewProject(), ...projectData }; 
        if(currentProjectTitleEl) currentProjectTitleEl.textContent = currentProject.name;

        if(surahSelect) surahSelect.value = currentProject.surah;
        if(reciterSelect) reciterSelect.value = currentProject.reciter;
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
        
        if(surahSelect) surahSelect.dispatchEvent(new Event('change')); // To trigger populateAyahSelects
        
        // Delay might still be needed if populateAyahSelects is async or has internal delays
        setTimeout(() => {
            if (ayahStartSelect && ayahEndSelect) { 
                ayahStartSelect.value = currentProject.ayahStart;
                // updateAyahEndOptions will be called by the 'change' event on surahSelect, then ayahStartSelect
                // We might need to ensure it correctly sets ayahEndSelect.value here if not triggered.
                if (ayahEndSelect.querySelector(`option[value="${currentProject.ayahEnd}"]`)) {
                     ayahEndSelect.value = currentProject.ayahEnd;
                } else {
                    // If the option doesn't exist yet (e.g. populateAyahSelects hasn't fully run and set end options)
                    // then updateAyahEndOptions should handle setting it correctly based on start.
                    console.warn(`Ayah end option ${currentProject.ayahEnd} not immediately available, will be set by updateAyahEndOptions.`);
                }
            }

            if (currentProject.background) {
                if (currentProject.background.type === 'image' && currentProject.background.value) {
                    const img = new Image();
                    img.onload = () => { backgroundImage = img; renderPreviewFrame(); };
                    img.onerror = () => { console.warn("Could not load project background image from stored data."); backgroundImage = null; currentProject.background = {type: 'color', value: '#000000'}; renderPreviewFrame(); }
                    img.src = currentProject.background.value; 
                } else if (currentProject.background.type === 'color') {
                    backgroundImage = null; renderPreviewFrame(); 
                }
            }
            updatePreviewStyle(); // Apply styles like font size for overlay
            renderPreviewFrame(); // Final render
        }, 300); // Slightly increased delay to ensure selects are populated
    }

    // Include all other functions like populateSurahSelect, populateAyahSelects, API fetches, rendering logic, etc.
    // Ensure they have safety checks for element existence if they manipulate DOM elements directly.
    // For example:
    function populateSurahSelect() {
        if (!surahSelect) return; // Safety first
        surahSelect.innerHTML = '';
        surahsData.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. ${surah.name} (${surah.englishName})`;
            surahSelect.appendChild(option);
        });
        surahSelect.value = currentProject.surah; 
        // populateAyahSelects(currentProject.surah); // This will be triggered by surahSelect.dispatchEvent in loadProject
    }

    // ... (Paste the REST of your functions here, ensuring they are complete from the last known good state)
    // fetchSurahs, fetchReciters, fetchTranslations, fetchAyahData
    // saveCurrentProject, loadProjects, deleteProject
    // populateAyahSelects, updateAyahEndOptions, updatePreviewWithFirstAyah
    // resizeCanvas, updatePreviewStyle, renderPreviewFrame (the full one), wrapText
    // applyTextEffect
    // handleBackgroundImport, fetchAiBackgrounds
    // playAudioSequence
    // exportVideo, renderAyahForExport, updateExportProgress
    // setupToolbarTabs


    // --- Start the application ---
    if (document.readyState === 'loading') { 
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init(); 
    }
});
