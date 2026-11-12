// --- Selection Bubble Logic ---
let selectionBubble = null;
let cvLauncher = null;
let cvIframe = null;

// Show selection bubble when user selects text on the page
document.addEventListener('mouseup', (e) => {
    if (selectionBubble && selectionBubble.contains(e.target)) return;

    const selectedText = window.getSelection().toString().trim();

    if (selectionBubble) {
        selectionBubble.remove();
        selectionBubble = null;
    }

    if (selectedText.length > 0) {
        createSelectionBubble(e.pageX, e.pageY, selectedText);
    }
});

// Creates and positions the floating "Send to ConceptVerse" bubble
function createSelectionBubble(x, y, text) {
    selectionBubble = document.createElement('div');

    selectionBubble.style.cssText = `
        position:absolute;
        top:${y - 40}px;
        left:${x + 10}px;
        z-index:999999;
        background:#3B82F6;
        color:#FFFFFF;
        padding:8px 12px;
        border-radius:8px;
        cursor:pointer;
        font-family:sans-serif;
        font-size:12px;
        font-weight:bold;
        box-shadow:0 4px 15px rgba(59,130,246,0.6);
    `;

    selectionBubble.innerText = '💡 Send to ConceptVerse';

    selectionBubble.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    // Save selected text to local storage and give user visual feedback
    selectionBubble.addEventListener('click', (e) => {
        e.stopPropagation();

        chrome.storage.local.set({
            capturedText: text
        }, () => {
            selectionBubble.innerText = '✅ Saved!';
            selectionBubble.style.background = '#10B981';

            setTimeout(() => {
                if (selectionBubble) {
                    selectionBubble.remove();
                    selectionBubble = null;
                }
            }, 1000);
        });
    });

    document.body.appendChild(selectionBubble);
}

// Dismiss selection bubble when clicking outside
document.addEventListener('mousedown', (e) => {
    if (selectionBubble && !selectionBubble.contains(e.target)) {
        selectionBubble.remove();
        selectionBubble = null;
    }
});

// --- Floating Widget & Launcher Setup ---
function setupWidget() {
    if (document.getElementById('cv-launcher-bubble')) return;

    // Create floating launcher button
    cvLauncher = document.createElement('div');
    cvLauncher.id = 'cv-launcher-bubble';

    cvLauncher.innerHTML = `
        <img src="${chrome.runtime.getURL('assets/concept verse icon.png')}"
             style="width:100%;height:100%;object-fit:contain;">
    `;

    cvLauncher.style.cssText = `
        position:fixed;
        bottom:20px;
        right:20px;
        width:55px;
        height:55px;
        background:#131B2F;
        border:2px solid #3B82F6;
        border-radius:50%;
        cursor:pointer;
        z-index:999998;
        display:none;
        box-shadow:0 4px 15px rgba(0,0,0,0.4);
        padding:8px;
        box-sizing:border-box;
        transition:transform 0.2s;
    `;

    cvLauncher.onmouseover = () => {
        cvLauncher.style.transform = 'scale(1.1)';
    };

    cvLauncher.onmouseout = () => {
        cvLauncher.style.transform = 'scale(1)';
    };

    // Create iframe container for popup interface
    cvIframe = document.createElement('iframe');
    cvIframe.id = 'cv-widget-iframe';
    cvIframe.src = chrome.runtime.getURL('popup.html');

    cvIframe.style.cssText = `
        position:fixed;
        bottom:85px;
        right:40px;
        width:420px;
        height:480px;
        max-height:80vh;
        border:none;
        border-radius:12px;
        z-index:999999;
        display:none;
        box-shadow:0 10px 40px rgba(0,0,0,0.6);
        overflow:hidden;
        background:transparent;
        color-scheme:normal;
    `;

    document.body.appendChild(cvLauncher);
    document.body.appendChild(cvIframe);

    // Toggle iframe visibility and signal iframe when opened
    cvLauncher.addEventListener('click', () => {
        const opening = cvIframe.style.display === 'none';

        if (opening) {
            cvIframe.style.display = 'block';

            setTimeout(() => {
                cvIframe.contentWindow.postMessage(
                    { type: 'CV_OPEN' },
                    '*'
                );
            }, 50);
        } else {
            cvIframe.style.display = 'none';
        }
    });
}

// --- Communication & Extension Messaging ---
// Listen for background script triggers to show/hide the launcher
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'TOGGLE_LAUNCHER') {
        setupWidget();

        cvLauncher.style.display =
            cvLauncher.style.display === 'none' ? 'block' : 'none';

        if (cvLauncher.style.display === 'none') {
            cvIframe.style.display = 'none';
        }
    }
});

// Close widget iframe when requested by iframe inner postMessage
window.addEventListener('message', (event) => {
    if (event.data === 'CLOSE_CV_WIDGET' && cvIframe) {
        cvIframe.style.display = 'none';

        // Clear old text when widget is closed
        chrome.storage.local.remove('capturedText');
    }
});

// Dynamically resize iframe height based on content messages
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CV_RESIZE' && cvIframe) {
        const height = Math.min(
            event.data.height,
            window.innerHeight * 0.8
        );

        cvIframe.style.height = `${height}px`;
    }
});