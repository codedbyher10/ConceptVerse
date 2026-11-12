// --- DOM Element Selection ---
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

const capturedText = document.getElementById('captured-text');
const buildBtn = document.getElementById('build-btn');
const resultsStack = document.getElementById('results-stack');

const explanation = document.getElementById('res-explanation');
const analogy = document.getElementById('res-analogy');
const mnemonic = document.getElementById('res-mnemonic');
const examAnswer = document.getElementById('res-exam');

const analogyType = document.getElementById('res-analogy-type');
const difficultySlider = document.getElementById('difficulty-slider');

const themeToggle = document.getElementById('theme-toggle');
const closeBtn = document.getElementById('close-widget-btn');

// Default state variables
let selectedStyle = 'cooking';

// Maps numerical slider values (1, 2, 3) to API expected strings
function getDifficulty() {
    const value = Number(difficultySlider.value);

    if (value === 1) return 'beginner';
    if (value === 3) return 'advanced';

    return 'intermediate';
}

// Retrieves captured text from Chrome local storage
function loadCapturedText() {
    chrome.storage.local.get(['capturedText'], (result) => {
        if (result.capturedText) {
            capturedText.textContent = result.capturedText;
        } else {
            capturedText.textContent =
                'Highlight text on a webpage and click the blue bubble...';
        }
    });
}

// Handles smooth loading screen transition when opening widget
function startOpeningAnimation() {
    loadingScreen.style.display = 'flex';
    mainContent.style.display = 'none';

    setTimeout(() => {
        loadingScreen.classList.add('hide');

        setTimeout(() => {
            loadingScreen.style.display = 'none';
            loadingScreen.classList.remove('hide');
            mainContent.style.display = 'flex';

            loadCapturedText();
            sendResize();
        }, 350);
    }, 900);
}

// Sends height back to parent content script to adjust iframe dynamically
function sendResize() {
    setTimeout(() => {
        window.parent.postMessage(
            {
                type: 'CV_RESIZE',
                height: document.body.scrollHeight
            },
            '*'
        );
    }, 50);
}

// Listen for message from parent page when widget is toggled open
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CV_OPEN') {
        startOpeningAnimation();
    }
});

// Update text in real-time if local storage changes while open
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.capturedText) {
        const newText = changes.capturedText.newValue;

        if (newText) {
            capturedText.textContent = newText;
        }
    }
});

// Style category button selector logic
document.querySelectorAll('.style-btn').forEach((button) => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.style-btn').forEach((btn) => {
            btn.classList.remove('active');
        });

        button.classList.add('active');
        selectedStyle = button.dataset.style;

        analogyType.textContent = selectedStyle.toUpperCase();
    });
});

// Adjust container size on difficulty slider change
difficultySlider.addEventListener('input', sendResize);

// Toggle dark/light theme on body
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

// Send close command to parent content script
closeBtn.addEventListener('click', () => {
    window.parent.postMessage('CLOSE_CV_WIDGET', '*');
});

// --- API Request & Results Rendering ---
buildBtn.addEventListener('click', async () => {
    const text = capturedText.textContent.trim();

    if (
        !text ||
        text === 'Highlight text on a webpage and click the blue bubble...'
    ) {
        capturedText.textContent =
            'Please select some text first.';
        return;
    }

    buildBtn.disabled = true;
    buildBtn.textContent = 'BUILDING...';

    try {
        const response = await fetch(
            'http://127.0.0.1:8000/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    analogy_style: selectedStyle,
                    difficulty: getDifficulty()
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Backend error');
        }

        // Render returned concept generation results
        explanation.textContent = data.simple_explanation || '';
        analogy.textContent = data.analogy || '';
        mnemonic.textContent = data.mnemonic || '';
        examAnswer.textContent = data.exam_answer || '';

        analogyType.textContent = (
            selectedStyle
        ).toUpperCase();

        resultsStack.style.display = 'grid';

        sendResize();

    } catch (error) {
        console.error(error);

        explanation.textContent =
            'Unable to generate the concept. Please make sure the backend is running.';
        analogy.textContent = '';
        mnemonic.textContent = '';
        examAnswer.textContent = '';

        resultsStack.style.display = 'grid';

        sendResize();

    } finally {
        buildBtn.disabled = false;
        buildBtn.textContent = 'BUILD MY CONCEPT';
    }
});

// Initial load on script execution
loadCapturedText();