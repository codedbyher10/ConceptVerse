chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Capture the CURRENT selection before opening ConceptVerse.
        // This prevents old text from chrome.storage.local
        // from being displayed.
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                return window.getSelection().toString().trim();
            }
        });

        const selectedText = results?.[0]?.result || "";

        // Always overwrite the previous captured text.
        // If nothing is selected, clear it.
        await chrome.storage.local.set({
            capturedText: selectedText
        });

        // Tell content.js to show/hide ConceptVerse.
        await chrome.tabs.sendMessage(tab.id, {
            action: "TOGGLE_LAUNCHER"
        });

    } catch (error) {
        console.error("ConceptVerse error:", error);

        console.log(
            "Please refresh the webpage and try again."
        );
    }
});