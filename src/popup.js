'use strict';

/**
 * Main logic to load themes from storage and build the UI list.
 */
// used gemini to assist with this function
async function initializePopup() {
    const currentDiv = document.getElementById('popup-content');
    if (!currentDiv) return;

    // 1. Get ALL installed addons from Firefox
    const allAddons = await browser.management.getAll();
    
    // 2. Filter for only the themes
    const installedThemes = allAddons.filter(addon => addon.type === 'theme');

    // 3. Clear the old list
    while (currentDiv.firstChild) {
        currentDiv.removeChild(currentDiv.firstChild);
    }

    // 4. Build the list of real Firefox themes
    if (installedThemes.length > 0) {
        installedThemes.forEach(theme => {
            // We'll reuse your buildMenuItem to create the buttons
            currentDiv.appendChild(buildMenuItem(theme));
        });
    } else {
        const msg = document.createElement('p');
        msg.textContent = "No themes found! Install one from Firefox Add-ons.";
        currentDiv.appendChild(msg);
    }
}

/**
 * Creates a theme button for the popup menu.
 */
// This variable stays outside the function so it doesn't get "forgotten"
let originalThemeId = null;

function buildMenuItem(theme) {
    const btn = document.createElement('button');
    btn.textContent = theme.name;
    btn.className = 'theme-button';

    // 1. MOUSE ENTER: Just a preview
    btn.addEventListener('mouseenter', async () => {
        // Find out what the REAL active theme is before we start hovering
        const allAddons = await browser.management.getAll();
        const currentActive = allAddons.find(a => a.type === 'theme' && a.enabled);
        
        // Save it so we can go back to it later
        if (currentActive && currentActive.id !== theme.id) {
            originalThemeId = currentActive.id;
        }

        // Show the preview
        await browser.management.setEnabled(theme.id, true);
    });

    // 2. MOUSE LEAVE: The "Undo" button
    btn.addEventListener('mouseleave', async () => {
        // If we have a saved original theme, put it back
        if (originalThemeId) {
            await browser.management.setEnabled(originalThemeId, true);
        }
    });

    // 3. CLICK: The "Lock In" button
    btn.addEventListener('click', async () => {
        // Clear the memory so the 'mouseleave' doesn't undo our click!
        originalThemeId = null; 
        
        await browser.management.setEnabled(theme.id, true);
        
        // Add a simple visual "Success" feedback
        btn.style.backgroundColor = "#2e7d32"; // "Jungle" green success color
        setTimeout(() => btn.style.backgroundColor = "", 1000);
    });

    return btn;
}
/**
 * Grabs inputs and saves a new theme to storage.
 */
// used Gemini to help with this function
async function saveTheme() {
    const customName = document.getElementById('theme-name').value;
    const groupName = document.getElementById('group-name').value;
    const statusMsg = document.querySelector('.status');

    // 1. Find which theme is currently enabled in Firefox
    const allAddons = await browser.management.getAll();
    const activeTheme = allAddons.find(addon => addon.type === 'theme' && addon.enabled);

    if (!activeTheme) {
        statusMsg.textContent = "No active theme found to save!";
        return;
    }

    // 2. Create the entry for your custom list
    const themeToSave = {
        id: activeTheme.id, 
        name: customName || activeTheme.name, // Use your custom name or the original
        group: groupName || "General",
        originalName: activeTheme.name
    };

    // 3. Save to local storage
    const items = await browser.storage.local.get('userThemes');
    const userThemes = items.userThemes || [];
    
    // Prevent duplicates of the same theme in the same group
    if (!userThemes.some(t => t.id === themeToSave.id && t.group === themeToSave.group)) {
        userThemes.push(themeToSave);
        await browser.storage.local.set({ userThemes });
        statusMsg.textContent = `Saved to ${themeToSave.group}!`;
        initializePopup(); // Refresh the list to show the new group
    } else {
        statusMsg.textContent = "Theme already in this group!";
    }
}
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