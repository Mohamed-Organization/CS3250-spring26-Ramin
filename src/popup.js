'use strict';

/**
 * Main logic to load themes from storage and build the UI list.
 */
async function initializePopup() {
    const currentDiv = document.getElementById('popup-content');
    if (!currentDiv) return;

    // 1. Get stored data
    const items = await browser.storage.local.get();

    // 2. Clear old list items to prevent duplicates
    while (currentDiv.firstChild) {
        currentDiv.removeChild(currentDiv.firstChild);
    }

    // 3. Build the user-created "Groups" (like Cats)
    // This section came from the help of Gemini
if (items.userThemes && items.userThemes.length > 0) {
    const groups = {};

    // Sort themes into their groups
    items.userThemes.forEach(theme => {
        const groupName = theme.group || "General";
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(theme);
    });

    // Build the UI for each group
    for (const [groupName, themes] of Object.entries(groups)) {
        const header = document.createElement('h4');
        header.textContent = groupName.toUpperCase();
        header.style.color = '#888';
        header.style.margin = '15px 0 5px 0';
        currentDiv.appendChild(header);

        themes.forEach(theme => {
            currentDiv.appendChild(buildMenuItem(theme));
        });
    }
}

    // 4. Build default themes list if they exist
    if (items.defaultThemes) {
        for (const theme of items.defaultThemes) {
            currentDiv.appendChild(buildMenuItem(theme));
        }
    }
}

/**
 * Creates a theme button for the popup menu.
 */
function buildMenuItem(theme) {
    const newChoice = document.createElement('div');
    newChoice.setAttribute('id', theme.id);
    newChoice.setAttribute('class', 'button');
    newChoice.textContent = theme.name;

    // Changes the theme preview when hovering
    newChoice.addEventListener('mouseenter', (event) => {
        if (event.target.id.startsWith('theme-')) {
            console.log("Previewing custom theme:", event.target.id);
        } else {
            browser.management.setEnabled(event.target.id, true);
        }
    });
    return newChoice;
}

/**
 * Grabs inputs and saves a new theme to storage.
 */
async function saveTheme() {
    const themeName = document.getElementById('theme-name').value;
    const groupName = document.getElementById('group-name').value;
    const fileInput = document.getElementById('image-upload');
    const statusMsg = document.querySelector('.status');

    // Helper to update status without crashing
    const updateStatus = (text) => {
        if (statusMsg) {
            statusMsg.textContent = text;
        } else {
            console.log("Status Update:", text);
        }
    };

    // Validation
    if (!themeName || !fileInput.files[0]) {
        updateStatus("Please name your theme and pick a photo!");
        return;
    }

    updateStatus("Matching colors and saving...");

    const newTheme = {
        id: `theme-${Date.now()}`, 
        name: themeName,
        group: groupName || "General",
        imageName: fileInput.files[0].name 
    };

    // Save to browser storage
    const items = await browser.storage.local.get('userThemes');
    const userThemes = items.userThemes || [];
    userThemes.push(newTheme);

    await browser.storage.local.set({ userThemes });

    // Refresh the UI list immediately
    await initializePopup();
    updateStatus("Theme Saved to Group!");
} // <--- This single bracket now correctly closes the function

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing UI...");
    initializePopup();
});

const saveBtn = document.getElementById('save-btn');
if (saveBtn) {
    saveBtn.addEventListener('click', saveTheme);
}

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('button')) {
        const currentId = event.target.id;
        browser.storage.local.set({ currentid: currentId });
    }
});

const shutdown = document.getElementById('shutdown');
if (shutdown) {
    shutdown.addEventListener('click', () => window.close());
}