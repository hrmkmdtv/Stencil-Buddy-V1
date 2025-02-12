let originalImage = null;
const originalCanvas = document.getElementById('originalCanvas');
const outputCanvas = document.getElementById('outputCanvas');
const originalCtx = originalCanvas.getContext('2d');
const outputCtx = outputCanvas.getContext('2d');

// Initialize controls
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage = new Image();
            originalImage.onload = function() {
                originalCanvas.width = originalImage.width;
                originalCanvas.height = originalImage.height;
                outputCanvas.width = originalImage.width;
                outputCanvas.height = originalImage.height;
                originalCtx.drawImage(originalImage, 0, 0);
                outputCtx.drawImage(originalImage, 0, 0);
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle color mode switching
document.querySelectorAll('input[name="colorMode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const singleColor = document.querySelector('.single-color');
        const multiColor = document.querySelector('.multi-color');
        if (this.value === 'single') {
            singleColor.style.display = 'flex';
            multiColor.style.display = 'none';
        } else {
            singleColor.style.display = 'none';
            multiColor.style.display = 'flex';
        }
        applyEffects();
    });
});

// Auto-apply when color pickers change
document.getElementById('singleColorPicker').addEventListener('input', applyEffects);
document.getElementById('darkColorPicker').addEventListener('input', applyEffects);
document.getElementById('lightColorPicker').addEventListener('input', applyEffects);

// Setup slider events
const sliders = {
    'thresholdSlider': 'thresholdValue',
    'edgeSensitivity': 'edgeValue',
    'dotSizeSlider': 'dotSizeValue',
    'sketchContrast': 'sketchValue',
    'asciiResolution': 'asciiValue',
    'asciiDensity': 'asciiDensityValue',
    'lineSpacing': 'lineSpacingValue',
    'lineThickness': 'lineThicknessValue',
    'glitchIntensity': 'glitchIntensityValue',
    'glitchLayers': 'glitchLayersValue',
    'halftoneSize': 'halftoneValue',
    'halftoneAngle': 'halftoneAngleValue',
    'spraySize': 'sprayValue',
    'sprayDensity': 'sprayDensityValue',
    'depthContrast': 'depthContrastValue',
    'depthBrightness': 'depthBrightnessValue',
    'normalStrength': 'normalStrengthValue',
    'normalDetail': 'normalDetailValue',
    'bgThreshold': 'bgThresholdValue',
    'bgTolerance': 'bgToleranceValue'
};

// Update slider value displays
function updateSliderValue(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const value = document.getElementById(valueId);
    if (slider && value) {
        value.textContent = slider.value;
    }
}

// Initialize slider events and values
Object.entries(sliders).forEach(([sliderId, valueId]) => {
    const slider = document.getElementById(sliderId);
    if (slider) {
        slider.addEventListener('input', () => {
            updateSliderValue(sliderId, valueId);
        });
    }
});

// Effect management
let activeEffects = [];

function updateControls() {
    const effect = document.getElementById('effectSelect').value;
    document.querySelectorAll('.slider-group').forEach(group => {
        group.style.display = 'none';
    });
    document.querySelector(`.${effect}-controls`).style.display = 'block';
}

function getSelectedColors() {
    const colorMode = document.querySelector('input[name="colorMode"]:checked').value;
    if (colorMode === 'single') {
        const color = document.getElementById('singleColorPicker').value;
        return { dark: color, light: '#ffffff' };
    } else {
        return {
            dark: document.getElementById('darkColorPicker').value,
            light: document.getElementById('lightColorPicker').value
        };
    }
}

function handleSettingChange(effectId, parameterId, value) {
    const effect = activeEffects.find(e => e.id === effectId);
    if (effect) {
        effect.parameters[parameterId] = parseFloat(value);
        // Update the value display
        const valueSpanId = sliders[parameterId];
        const valueSpan = document.querySelector(`#settings-${effectId} #${valueSpanId}`);
        if (valueSpan) {
            valueSpan.textContent = value;
        }
        // Add visual feedback while processing
        const effectItem = document.querySelector(`[data-effect-id="${effectId}"]`);
        if (effectItem) {
            effectItem.classList.add('processing');
            applyEffects();
            setTimeout(() => effectItem.classList.remove('processing'), 150);
        } else {
            applyEffects();
        }
    }
}

function renderEffectSettings(effect) {
    const controls = document.querySelector(`.${effect.name}-controls`).cloneNode(true);
    const sliders = controls.querySelectorAll('input[type="range"]');
    
    sliders.forEach(slider => {
        // Update slider value
        slider.value = effect.parameters[slider.id];
        
        // Find and update the value display span
        const valueSpanId = sliders[slider.id];
        const valueSpan = controls.querySelector(`#${valueSpanId}`);
        if (valueSpan) {
            valueSpan.textContent = slider.value;
        }

        // Set up the event handlers
        slider.setAttribute('oninput', `
            handleSettingChange(${effect.id}, '${slider.id}', this.value);
            document.querySelector('#settings-${effect.id} #${valueSpanId}').textContent = this.value;
        `);
    });
    
    return controls.innerHTML;
}


function addEffect() {
    const select = document.getElementById('effectSelect');
    const effectName = select.value;
    const effectLabel = select.options[select.selectedIndex].text;
    
    const parameters = {};
    const controls = document.querySelector(`.${effectName}-controls`);
    controls.querySelectorAll('input[type="range"]').forEach(slider => {
        parameters[slider.id] = parseFloat(slider.value);
    });

    const effect = {
        name: effectName,
        label: effectLabel,
        parameters: parameters,
        id: Date.now()
    };

    activeEffects.push(effect);
    renderEffectsList();
    applyEffects();
}

function removeEffect(effectId) {
    activeEffects = activeEffects.filter(effect => effect.id !== effectId);
    renderEffectsList();
    applyEffects();
}

function toggleEffectSettings(effectId) {
    const settingsDiv = document.getElementById(`settings-${effectId}`);
    const effectItem = settingsDiv.closest('.effect-item');
    const wasHidden = settingsDiv.style.display === 'none' || !settingsDiv.style.display;
    
    document.querySelectorAll('.effect-settings').forEach(el => {
        el.style.display = 'none';
        el.closest('.effect-item').classList.remove('expanded');
    });
    
    if (wasHidden) {
        settingsDiv.style.display = 'block';
        effectItem.classList.add('expanded');
    } else {
        settingsDiv.style.display = 'none';
        effectItem.classList.remove('expanded');
    }
}

function renderEffectsList() {
    const list = document.getElementById('activeEffects');
    list.innerHTML = activeEffects.map((effect, index) => `
        <div class="effect-item" draggable="true" data-effect-id="${effect.id}">
            <div class="effect-header">
                <div class="drag-handle">☰</div>
                <span class="effect-name" onclick="toggleEffectSettings(${effect.id})">${effect.label}</span>
                <div class="controls">
                    <button onclick="removeEffect(${effect.id})" class="remove-effect">Remove</button>
                </div>
            </div>
            <div class="effect-settings" id="settings-${effect.id}">
                ${renderEffectSettings(effect)}
            </div>
        </div>
    `).join('');

    const items = list.querySelectorAll('.effect-item');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = e.target;
    e.target.style.opacity = '0.4';
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.target.closest('.effect-item')?.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.closest('.effect-item')?.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const dropTarget = e.target.closest('.effect-item');
    if (dropTarget && draggedItem !== dropTarget) {
        const allItems = [...document.querySelectorAll('.effect-item')];
        const draggedIdx = allItems.indexOf(draggedItem);
        const droppedIdx = allItems.indexOf(dropTarget);

        const [movedEffect] = activeEffects.splice(draggedIdx, 1);
        activeEffects.splice(droppedIdx, 0, movedEffect);

        renderEffectsList();
        applyEffects();
    }
    draggedItem.style.opacity = '1';
    document.querySelectorAll('.effect-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

async function applyEffects() {
    if (!originalImage) return;
    
    // Show loading overlay for heavy processing
    const overlay = document.createElement('div');
    overlay.className = 'processing-overlay';
    overlay.innerHTML = '<div class="processing-spinner"></div>';
    document.body.appendChild(overlay);
    
    // Delay to allow overlay to appear
    await new Promise(resolve => setTimeout(resolve, 0));
    overlay.classList.add('active');
    document.body.classList.add('processing');
    const colors = getSelectedColors();
    
    const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    const outputImageData = new ImageData(
        new Uint8ClampedArray(imageData.data), 
        originalCanvas.width, 
        originalCanvas.height
    );
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalCanvas.width;
    tempCanvas.height = originalCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(originalImage, 0, 0);

    for (const effect of activeEffects) {
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const outputImageData = new ImageData(
            new Uint8ClampedArray(imageData.data), 
            tempCanvas.width, 
            tempCanvas.height
        );

        switch (effect.name) {
            case 'threshold':
                applyThreshold(outputImageData.data, effect.parameters.thresholdSlider, colors);
                break;
            case 'edge':
                applyEdgeDetection(outputImageData.data, tempCanvas.width, tempCanvas.height, 
                                 effect.parameters.edgeSensitivity, colors);
                break;
            case 'dots':
                applyDots(outputImageData.data, tempCanvas.width, tempCanvas.height, 
                         effect.parameters.dotSizeSlider, colors);
                break;
            case 'sketch':
                applySketch(outputImageData.data, effect.parameters.sketchContrast, colors);
                break;
            case 'ascii':
                applyAscii(outputImageData.data, tempCanvas.width, tempCanvas.height, 
                          effect.parameters.asciiResolution,
                          effect.parameters.asciiDensity, colors);
                break;
            case 'lines':
                applyLines(outputImageData.data, tempCanvas.width, tempCanvas.height,
                          effect.parameters.lineSpacing,
                          effect.parameters.lineThickness, colors);
                break;
            case 'glitch':
                applyGlitch(outputImageData.data, tempCanvas.width, tempCanvas.height,
                           effect.parameters.glitchIntensity,
                           effect.parameters.glitchLayers, colors);
                break;
            case 'halftone':
                applyHalftone(outputImageData.data, tempCanvas.width, tempCanvas.height,
                             effect.parameters.halftoneSize,
                             effect.parameters.halftoneAngle, colors);
                break;
            case 'airbrush':
                applyAirbrush(outputImageData.data, tempCanvas.width, tempCanvas.height,
                             effect.parameters.spraySize,
                             effect.parameters.sprayDensity, colors);
                break;
            case 'depthmap':
                applyDepthMap(outputImageData.data,
                             effect.parameters.depthContrast,
                             effect.parameters.depthBrightness);
                break;
            case 'normalmap':
                applyNormalMap(outputImageData.data, tempCanvas.width, tempCanvas.height,
                              effect.parameters.normalStrength,
                              effect.parameters.normalDetail);
                break;
            case 'removebg':
                removeBackground(outputImageData.data, tempCanvas.width, tempCanvas.height,
                               effect.parameters.bgThreshold,
                               effect.parameters.bgTolerance);
                break;
        }

        tempCtx.putImageData(outputImageData, 0, 0);
    }

    try {
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        outputCtx.drawImage(tempCanvas, 0, 0);
    } finally {
        // Remove loading overlay
        overlay.classList.remove('active');
        document.body.classList.remove('processing');
        setTimeout(() => overlay.remove(), 300);
    }
}

// Initialize controls
updateControls();

// Download functionality
function downloadImage() {
    const link = document.createElement('a');
    link.download = 'stencil-art.png';
    link.href = outputCanvas.toDataURL('image/png');
    link.click();
}
