let originalImage = null;
const originalCanvas = document.getElementById('originalCanvas');
const outputCanvas = document.getElementById('outputCanvas');
const originalCtx = originalCanvas.getContext('2d');
const outputCtx = outputCanvas.getContext('2d');

// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
let isDarkMode = false;

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '🌜' : '🌞';
});

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
    'bgTolerance': 'bgToleranceValue',
    'noiseAmount': 'noiseAmountValue',
    'blurRadius': 'blurRadiusValue',
    'chromaticOffset': 'chromaticOffsetValue',
    'chromaticAngle': 'chromaticAngleValue'
};

// Color palettes
const colorPalettes = {
    custom: null,
    monochrome: { dark: '#000000', light: '#ffffff' },
    vintage: { dark: '#8B4513', light: '#F5DEB3' },
    neon: { dark: '#FF1493', light: '#00FF00' },
    pastel: { dark: '#FFB6C1', light: '#E6E6FA' },
    autumn: { dark: '#8B4513', light: '#DAA520' }
};

// Setup color palette selector
document.getElementById('colorPalette').addEventListener('change', function() {
    const palette = colorPalettes[this.value];
    if (palette) {
        document.getElementById('darkColorPicker').value = palette.dark;
        document.getElementById('lightColorPicker').value = palette.light;
        applyEffects();
    }
});

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
            case 'noiseblur':
                applyNoiseBlur(outputImageData.data, tempCanvas.width, tempCanvas.height,
                             effect.parameters.noiseAmount,
                             effect.parameters.blurRadius, colors);
                break;
            case 'chromatic':
                applyChromaticAberration(outputImageData.data, tempCanvas.width, tempCanvas.height,
                                     effect.parameters.chromaticOffset,
                                     effect.parameters.chromaticAngle, colors);
                break;
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

// Effect Implementations
function applyThreshold(imageData, threshold, colors) {
    for (let i = 0; i < imageData.length; i += 4) {
        const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        const color = brightness > threshold ? colors.light : colors.dark;
        const rgb = hexToRgb(color);
        imageData[i] = rgb.r;
        imageData[i + 1] = rgb.g;
        imageData[i + 2] = rgb.b;
    }
}

function applyEdgeDetection(imageData, width, height, sensitivity, colors) {
    const originalData = new Uint8ClampedArray(imageData);
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const idx = ((y + ky) * width + (x + kx)) * 4;
                    const brightness = (originalData[idx] + originalData[idx + 1] + originalData[idx + 2]) / 3;
                    gx += brightness * sobelX[(ky + 1) * 3 + (kx + 1)];
                    gy += brightness * sobelY[(ky + 1) * 3 + (kx + 1)];
                }
            }
            
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            const idx = (y * width + x) * 4;
            const isEdge = magnitude > sensitivity;
            const color = isEdge ? colors.dark : colors.light;
            const rgb = hexToRgb(color);
            
            imageData[idx] = rgb.r;
            imageData[idx + 1] = rgb.g;
            imageData[idx + 2] = rgb.b;
        }
    }
}

function applyDots(imageData, width, height, dotSize, colors) {
    const tempData = new Uint8ClampedArray(imageData);
    const spacing = dotSize * 2;
    
    // Clear the original image data
    for (let i = 0; i < imageData.length; i += 4) {
        const rgb = hexToRgb(colors.light);
        imageData[i] = rgb.r;
        imageData[i + 1] = rgb.g;
        imageData[i + 2] = rgb.b;
        imageData[i + 3] = 255;
    }
    
    for (let y = spacing; y < height - spacing; y += spacing) {
        for (let x = spacing; x < width - spacing; x += spacing) {
            let brightness = 0;
            
            // Calculate average brightness for the area
            for (let dy = -dotSize; dy < dotSize; dy++) {
                for (let dx = -dotSize; dx < dotSize; dx++) {
                    const idx = ((y + dy) * width + (x + dx)) * 4;
                    brightness += (tempData[idx] + tempData[idx + 1] + tempData[idx + 2]) / 3;
                }
            }
            
            brightness /= (dotSize * 2) * (dotSize * 2);
            const radius = (dotSize * brightness) / 255;
            
            // Draw dot
            if (radius > 0) {
                const rgb = hexToRgb(colors.dark);
                for (let dy = -radius; dy < radius; dy++) {
                    for (let dx = -radius; dx < radius; dx++) {
                        if (dx * dx + dy * dy <= radius * radius) {
                            const idx = ((y + dy) * width + (x + dx)) * 4;
                            imageData[idx] = rgb.r;
                            imageData[idx + 1] = rgb.g;
                            imageData[idx + 2] = rgb.b;
                        }
                    }
                }
            }
        }
    }
}

function applySketch(imageData, contrast, colors) {
    const tempData = new Uint8ClampedArray(imageData);
    
    for (let i = 0; i < imageData.length; i += 4) {
        const brightness = (tempData[i] + tempData[i + 1] + tempData[i + 2]) / 3;
        const adjustedBrightness = Math.pow(brightness / 255, contrast) * 255;
        const threshold = 128;
        
        const color = adjustedBrightness > threshold ? colors.light : colors.dark;
        const rgb = hexToRgb(color);
        
        imageData[i] = rgb.r;
        imageData[i + 1] = rgb.g;
        imageData[i + 2] = rgb.b;
    }
}

function applyAscii(imageData, width, height, resolution, density, colors) {
    const ascii = '@%#*+=-:. ';
    const tempData = new Uint8ClampedArray(imageData);
    const cellSize = Math.max(1, Math.floor(resolution));
    
    // Clear the original image data to light color
    const lightRgb = hexToRgb(colors.light);
    for (let i = 0; i < imageData.length; i += 4) {
        imageData[i] = lightRgb.r;
        imageData[i + 1] = lightRgb.g;
        imageData[i + 2] = lightRgb.b;
    }
    
    const darkRgb = hexToRgb(colors.dark);
    
    for (let y = 0; y < height; y += cellSize) {
        for (let x = 0; x < width; x += cellSize) {
            let brightness = 0;
            let count = 0;
            
            // Calculate average brightness for the cell
            for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
                for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
                    const idx = ((y + dy) * width + (x + dx)) * 4;
                    brightness += (tempData[idx] + tempData[idx + 1] + tempData[idx + 2]) / 3;
                    count++;
                }
            }
            
            brightness = brightness / count;
            const charIndex = Math.floor((brightness / 255) * (ascii.length - 1));
            const char = ascii[charIndex];
            
            // Only draw if the ASCII character is dense enough
            if (char !== ' ' && Math.random() < density) {
                // Draw the character
                for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
                    for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4;
                        imageData[idx] = darkRgb.r;
                        imageData[idx + 1] = darkRgb.g;
                        imageData[idx + 2] = darkRgb.b;
                    }
                }
            }
        }
    }
}

function applyLines(imageData, width, height, spacing, thickness, colors) {
    const tempData = new Uint8ClampedArray(imageData);
    
    // Clear the original image data to light color
    const lightRgb = hexToRgb(colors.light);
    for (let i = 0; i < imageData.length; i += 4) {
        imageData[i] = lightRgb.r;
        imageData[i + 1] = lightRgb.g;
        imageData[i + 2] = lightRgb.b;
    }
    
    const darkRgb = hexToRgb(colors.dark);
    const lineSpacing = Math.max(1, Math.floor(spacing));
    const lineThickness = Math.max(1, Math.floor(thickness));
    
    for (let y = 0; y < height; y += lineSpacing) {
        let lineLength = 0;
        let drawing = false;
        
        for (let x = 0; x < width; x++) {
            const brightness = getBrightnessAt(tempData, x, y, width);
            
            if (brightness < 128 && !drawing) {
                drawing = true;
                lineLength = 0;
            } else if (brightness >= 128 && drawing) {
                if (lineLength > thickness) {
                    drawHorizontalLine(imageData, x - lineLength, y, lineLength, lineThickness, width, height, darkRgb);
                }
                drawing = false;
            }
            
            if (drawing) {
                lineLength++;
            }
        }
        
        if (drawing && lineLength > thickness) {
            drawHorizontalLine(imageData, width - lineLength, y, lineLength, lineThickness, width, height, darkRgb);
        }
    }
}

function drawHorizontalLine(imageData, x, y, length, thickness, width, height, color) {
    for (let dy = 0; dy < thickness && y + dy < height; dy++) {
        for (let dx = 0; dx < length && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            imageData[idx] = color.r;
            imageData[idx + 1] = color.g;
            imageData[idx + 2] = color.b;
        }
    }
}

function applyGlitch(imageData, width, height, intensity, layers, colors) {
    const tempData = new Uint8ClampedArray(imageData);
    
    for (let layer = 0; layer < layers; layer++) {
        const offset = Math.floor(intensity * Math.random() * 20);
        const y1 = Math.floor(Math.random() * height);
        const y2 = Math.min(y1 + Math.floor(Math.random() * 50), height);
        
        for (let y = y1; y < y2; y++) {
            for (let x = 0; x < width; x++) {
                const sourceX = (x + offset) % width;
                const idx = (y * width + x) * 4;
                const sourceIdx = (y * width + sourceX) * 4;
                
                imageData[idx] = tempData[sourceIdx];
                imageData[idx + 1] = tempData[sourceIdx + 1];
                imageData[idx + 2] = tempData[sourceIdx + 2];
            }
        }
    }
    
    // Apply color overlay
    const darkRgb = hexToRgb(colors.dark);
    const lightRgb = hexToRgb(colors.light);
    
    for (let i = 0; i < imageData.length; i += 4) {
        const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        const color = brightness < 128 ? darkRgb : lightRgb;
        
        imageData[i] = color.r;
        imageData[i + 1] = color.g;
        imageData[i + 2] = color.b;
    }
}

function applyHalftone(imageData, width, height, size, angle, colors) {
    const tempData = new Uint8ClampedArray(imageData);
    const dotSpacing = Math.max(1, Math.floor(size));
    const angleRad = (angle * Math.PI) / 180;
    
    // Clear the image with light color
    const lightRgb = hexToRgb(colors.light);
    for (let i = 0; i < imageData.length; i += 4) {
        imageData[i] = lightRgb.r;
        imageData[i + 1] = lightRgb.g;
        imageData[i + 2] = lightRgb.b;
    }
    
    const darkRgb = hexToRgb(colors.dark);
    
    for (let y = 0; y < height; y += dotSpacing) {
        for (let x = 0; x < width; x += dotSpacing) {
            const centerX = x + dotSpacing / 2;
            const centerY = y + dotSpacing / 2;
            
            // Rotate point
            const rotatedX = centerX * Math.cos(angleRad) - centerY * Math.sin(angleRad);
            const rotatedY = centerX * Math.sin(angleRad) + centerY * Math.cos(angleRad);
            
            let brightness = 0;
            let count = 0;
            
            // Calculate average brightness for the dot area
            for (let dy = 0; dy < dotSpacing && y + dy < height; dy++) {
                for (let dx = 0; dx < dotSpacing && x + dx < width; dx++) {
                    const idx = ((y + dy) * width + (x + dx)) * 4;
                    brightness += (tempData[idx] + tempData[idx + 1] + tempData[idx + 2]) / 3;
                    count++;
                }
            }
            
            brightness /= count;
            const radius = (dotSpacing * (255 - brightness)) / (2 * 255);
            
            // Draw dot
            for (let dy = -radius; dy < radius; dy++) {
                for (let dx = -radius; dx < radius; dx++) {
                    if (dx * dx + dy * dy <= radius * radius) {
                        const px = Math.floor(rotatedX + dx);
                        const py = Math.floor(rotatedY + dy);
                        
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const idx = (py * width + px) * 4;
                            imageData[idx] = darkRgb.r;
                            imageData[idx + 1] = darkRgb.g;
                            imageData[idx + 2] = darkRgb.b;
                        }
                    }
                }
            }
        }
    }
}

function applyAirbrush(imageData, width, height, size, density, colors) {
    const tempData = new Uint8ClampedArray(imageData);
    
    // Clear the image with light color
    const lightRgb = hexToRgb(colors.light);
    for (let i = 0; i < imageData.length; i += 4) {
        imageData[i] = lightRgb.r;
        imageData[i + 1] = lightRgb.g;
        imageData[i + 2] = lightRgb.b;
    }
    
    const darkRgb = hexToRgb(colors.dark);
    const spraySize = Math.max(1, Math.floor(size));
    
    for (let y = 0; y < height; y += spraySize) {
        for (let x = 0; x < width; x += spraySize) {
            let brightness = 0;
            let count = 0;
            
            // Calculate average brightness for the spray area
            for (let dy = 0; dy < spraySize && y + dy < height; dy++) {
                for (let dx = 0; dx < spraySize && x + dx < width; dx++) {
                    const idx = ((y + dy) * width + (x + dx)) * 4;
                    brightness += (tempData[idx] + tempData[idx + 1] + tempData[idx + 2]) / 3;
                    count++;
                }
            }
            
            brightness /= count;
            const points = Math.floor((255 - brightness) * density / 255);
            
            // Create spray points
            for (let i = 0; i < points; i++) {
                const dx = Math.floor(Math.random() * spraySize);
                const dy = Math.floor(Math.random() * spraySize);
                
                if (x + dx < width && y + dy < height) {
                    const idx = ((y + dy) * width + (x + dx)) * 4;
                    imageData[idx] = darkRgb.r;
                    imageData[idx + 1] = darkRgb.g;
                    imageData[idx + 2] = darkRgb.b;
                }
            }
        }
    }
}

function applyDepthMap(imageData, contrast, brightness) {
    for (let i = 0; i < imageData.length; i += 4) {
        const avg = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        const adjusted = Math.pow(avg / 255, contrast) * 255 + brightness;
        const value = Math.max(0, Math.min(255, adjusted));
        
        imageData[i] = value;
        imageData[i + 1] = value;
        imageData[i + 2] = value;
    }
}

function applyNormalMap(imageData, width, height, strength, detail) {
    const tempData = new Uint8ClampedArray(imageData);
    const scale = strength / detail;
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // Calculate height differences
            const dX = (getBrightnessAt(tempData, x + 1, y, width) - 
                       getBrightnessAt(tempData, x - 1, y, width)) * scale;
            const dY = (getBrightnessAt(tempData, x, y + 1, width) - 
                       getBrightnessAt(tempData, x, y - 1, width)) * scale;
            
            // Convert to normal
            const normal = normalizeVector(-dX, -dY, 1);
            
            // Convert to RGB (range 0-255)
            imageData[idx] = Math.floor((normal.x + 1) * 127.5);
            imageData[idx + 1] = Math.floor((normal.y + 1) * 127.5);
            imageData[idx + 2] = Math.floor((normal.z + 1) * 127.5);
        }
    }
}

function removeBackground(imageData, width, height, threshold, tolerance) {
    const tempData = new Uint8ClampedArray(imageData);
    
    // Get background color from corners
    const corners = [
        getColorAt(tempData, 0, 0, width),
        getColorAt(tempData, width - 1, 0, width),
        getColorAt(tempData, 0, height - 1, width),
        getColorAt(tempData, width - 1, height - 1, width)
    ];
    
    const avgBackground = {
        r: corners.reduce((sum, c) => sum + c.r, 0) / 4,
        g: corners.reduce((sum, c) => sum + c.g, 0) / 4,
        b: corners.reduce((sum, c) => sum + c.b, 0) / 4
    };
    
    for (let i = 0; i < imageData.length; i += 4) {
        const color = {
            r: tempData[i],
            g: tempData[i + 1],
            b: tempData[i + 2]
        };
        
        const diff = colorDistance(color, avgBackground);
        const alpha = diff < threshold ? 0 : 255;
        
        if (alpha === 0 || diff < threshold + tolerance) {
            imageData[i + 3] = 0;
        }
    }
}

// Utility functions
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function getBrightnessAt(imageData, x, y, width) {
    const idx = (y * width + x) * 4;
    return (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3;
}

function getColorAt(imageData, x, y, width) {
    const idx = (y * width + x) * 4;
    return {
        r: imageData[idx],
        g: imageData[idx + 1],
        b: imageData[idx + 2]
    };
}

function normalizeVector(x, y, z) {
    const length = Math.sqrt(x * x + y * y + z * z);
    return {
        x: x / length,
        y: y / length,
        z: z / length
    };
}

function colorDistance(c1, c2) {
    const rDiff = c1.r - c2.r;
    const gDiff = c1.g - c2.g;
    const bDiff = c1.b - c2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

function applyNoiseBlur(imageData, width, height, noiseAmount, blurRadius, colors) {
    const tempData = new Uint8ClampedArray(imageData);
    
    // Apply noise
    for (let i = 0; i < imageData.length; i += 4) {
        const noise = (Math.random() - 0.5) * 2 * noiseAmount;
        const brightness = (tempData[i] + tempData[i + 1] + tempData[i + 2]) / 3 + noise;
        const color = brightness < 128 ? colors.dark : colors.light;
        const rgb = hexToRgb(color);
        
        imageData[i] = rgb.r;
        imageData[i + 1] = rgb.g;
        imageData[i + 2] = rgb.b;
    }
    
    // Apply Gaussian blur
    const radius = Math.floor(blurRadius);
    const sigma = radius / 3;
    const size = radius * 2 + 1;
    const kernel = [];
    
    // Generate Gaussian kernel
    let sum = 0;
    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            const exponent = -(x * x + y * y) / (2 * sigma * sigma);
            const value = Math.exp(exponent) / (2 * Math.PI * sigma * sigma);
            kernel.push(value);
            sum += value;
        }
    }
    
    // Normalize kernel
    for (let i = 0; i < kernel.length; i++) {
        kernel[i] /= sum;
    }
    
    // Apply convolution
    const blurredData = new Uint8ClampedArray(imageData);
    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            let r = 0, g = 0, b = 0;
            let kernelIndex = 0;
            
            for (let ky = -radius; ky <= radius; ky++) {
                for (let kx = -radius; kx <= radius; kx++) {
                    const idx = ((y + ky) * width + (x + kx)) * 4;
                    r += imageData[idx] * kernel[kernelIndex];
                    g += imageData[idx + 1] * kernel[kernelIndex];
                    b += imageData[idx + 2] * kernel[kernelIndex];
                    kernelIndex++;
                }
            }
            
            const idx = (y * width + x) * 4;
            blurredData[idx] = r;
            blurredData[idx + 1] = g;
            blurredData[idx + 2] = b;
            blurredData[idx + 3] = 255;
        }
    }
    
    // Copy blurred data back to original
    for (let i = 0; i < imageData.length; i++) {
        imageData[i] = blurredData[i];
    }
}

function applyChromaticAberration(imageData, width, height, offset, angle, colors) {
    const tempData = new Uint8ClampedArray(imageData);
    const angleRad = (angle * Math.PI) / 180;
    const offsetX = Math.cos(angleRad) * offset;
    const offsetY = Math.sin(angleRad) * offset;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            // Get RGB channels from different positions
            const rX = Math.floor(x + offsetX);
            const rY = Math.floor(y + offsetY);
            const bX = Math.floor(x - offsetX);
            const bY = Math.floor(y - offsetY);
            
            // Get color values with bounds checking
            const r = rX >= 0 && rX < width && rY >= 0 && rY < height
                ? tempData[(rY * width + rX) * 4]
                : tempData[idx];
            const g = tempData[idx + 1];
            const b = bX >= 0 && bX < width && bY >= 0 && bY < height
                ? tempData[(bY * width + bX) * 4 + 2]
                : tempData[idx + 2];
            
            // Apply color offset
            imageData[idx] = r;
            imageData[idx + 1] = g;
            imageData[idx + 2] = b;
            imageData[idx + 3] = 255;
        }
    }
    
    // Apply final color mapping
    for (let i = 0; i < imageData.length; i += 4) {
        const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        const color = brightness < 128 ? colors.dark : colors.light;
        const rgb = hexToRgb(color);
        const blend = 0.7; // Blend factor between chromatic and final color
        
        imageData[i] = Math.round(imageData[i] * (1 - blend) + rgb.r * blend);
        imageData[i + 1] = Math.round(imageData[i + 1] * (1 - blend) + rgb.g * blend);
        imageData[i + 2] = Math.round(imageData[i + 2] * (1 - blend) + rgb.b * blend);
    }
}

// Download functionality
function downloadImage(format) {
    const link = document.createElement('a');
    let filename = 'stencil-art';
    let dataUrl;

    switch (format) {
        case 'png':
            dataUrl = outputCanvas.toDataURL('image/png');
            filename += '.png';
            break;
        case 'jpg':
            dataUrl = outputCanvas.toDataURL('image/jpeg', 0.9);
            filename += '.jpg';
            break;
        case 'svg':
            // Convert canvas content to SVG
            const svg = convertCanvasToSVG();
            dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
            filename += '.svg';
            break;
        default:
            dataUrl = outputCanvas.toDataURL('image/png');
            filename += '.png';
    }

    link.download = filename;
    link.href = dataUrl;
    link.click();
}

function convertCanvasToSVG() {
    const width = outputCanvas.width;
    const height = outputCanvas.height;
    const imageData = outputCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create SVG string
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Convert pixel data to SVG paths
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            
            if (a > 0) {
                const color = `rgb(${r},${g},${b})`;
                svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}" opacity="${a/255}"/>`;
            }
        }
    }
    
    svg += '</svg>';
    return svg;
}
