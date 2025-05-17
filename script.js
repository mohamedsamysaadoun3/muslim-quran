alert("Script loaded and executing!"); // هل هذا الـ Alert يظهر؟

document.addEventListener('DOMContentLoaded', () => {
    alert("DOM Content Loaded event fired!"); // هل هذا الـ Alert يظهر؟

    const initialScreen = document.getElementById('initial-screen');
    const editorScreen = document.getElementById('editor-screen');
    const goToEditorBtn = document.getElementById('go-to-editor-btn');
    const backToInitialScreenBtn = document.getElementById('back-to-initial-screen-btn');
    const themeToggleInitial = document.getElementById('theme-toggle-initial');
    const themeToggleEditor = document.getElementById('theme-toggle-editor');
    const body = document.body;

    // التحقق من وجود العناصر الأساسية جدًا
    if (!initialScreen) alert("ERROR: initial-screen not found!");
    if (!editorScreen) alert("ERROR: editor-screen not found!");
    if (!goToEditorBtn) alert("ERROR: go-to-editor-btn not found!");
    if (!body) alert("ERROR: body element not found!");


    function showEditorScreen() {
        alert("goToEditorBtn clicked! Attempting to show editor screen...");
        if (initialScreen) {
            initialScreen.style.display = 'none';
        } else {
            alert("Cannot hide initialScreen, it's not found!");
        }
        if (editorScreen) {
            editorScreen.style.display = 'flex'; // أو 'block' إذا كانت flex تسبب مشاكل في التبسيط
        } else {
            alert("Cannot show editorScreen, it's not found!");
        }
    }

    function showInitialScreen() {
        alert("backToInitialScreenBtn clicked! Attempting to show initial screen...");
        if (editorScreen) {
            editorScreen.style.display = 'none';
        }
        if (initialScreen) {
            initialScreen.style.display = 'flex'; // أو 'block'
        }
    }

    function toggleTheme() {
        alert("Theme button clicked!");
        if (body) {
            body.classList.toggle('dark-theme');
            localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
            alert("Theme toggled. Current class list on body: " + body.classList);
        } else {
            alert("Cannot toggle theme, body element not found!");
        }
    }

    function loadTheme() {
        const currentTheme = localStorage.getItem('theme');
        alert("Loading theme: " + currentTheme);
        if (body) {
            if (currentTheme === 'dark') {
                body.classList.add('dark-theme');
            } else {
                body.classList.remove('dark-theme');
            }
        } else {
            alert("Cannot load theme, body element not found!");
        }
    }

    // ربط الـ Event Listeners
    if (goToEditorBtn) {
        goToEditorBtn.addEventListener('click', showEditorScreen);
        alert("Event listener for goToEditorBtn attached.");
    } else {
        alert("Could NOT attach listener to goToEditorBtn because it was not found.");
    }

    if (backToInitialScreenBtn) {
        backToInitialScreenBtn.addEventListener('click', showInitialScreen);
    }

    if (themeToggleInitial) {
        themeToggleInitial.addEventListener('click', toggleTheme);
        alert("Event listener for themeToggleInitial attached.");
    } else {
        alert("Could NOT attach listener to themeToggleInitial.");
    }
     if (themeToggleEditor) {
        themeToggleEditor.addEventListener('click', toggleTheme);
    }


    // تحميل الثيم عند البداية
    loadTheme();
    alert("Initial theme loaded. App basic setup finished.");

});

// للتأكد أن الملف نفسه تم تحميله حتى لو DOMContentLoaded لم يطلق
console.log("End of script.js file reached.");
