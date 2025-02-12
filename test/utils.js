// Test utilities for Stencil Art Generator

/**
 * Creates test image data with specific pattern
 */
export function createTestImageData(width, height, pattern = 'solid') {
    const data = new Uint8ClampedArray(width * height * 4);
    
    switch (pattern) {
        case 'gradient':
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const value = Math.floor((x / width) * 255);
                    data[idx] = value;     // R
                    data[idx + 1] = value; // G
                    data[idx + 2] = value; // B
                    data[idx + 3] = 255;   // A
                }
            }
            break;

        case 'checkerboard':
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const value = (x + y) % 2 === 0 ? 255 : 0;
                    data[idx] = value;     // R
                    data[idx + 1] = value; // G
                    data[idx + 2] = value; // B
                    data[idx + 3] = 255;   // A
                }
            }
            break;

        case 'edge':
            // Create a vertical line for edge detection testing
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const value = x === width/2 ? 255 : 0;
                    data[idx] = value;     // R
                    data[idx + 1] = value; // G
                    data[idx + 2] = value; // B
                    data[idx + 3] = 255;   // A
                }
            }
            break;

        default: // solid
            data.fill(128); // Mid-gray
            for (let i = 3; i < data.length; i += 4) {
                data[i] = 255; // Alpha channel
            }
    }

    return {
        data,
        width,
        height
    };
}

/**
 * Compares two ImageData objects for similarity
 */
export function compareImageData(imageData1, imageData2, tolerance = 0) {
    if (imageData1.width !== imageData2.width || 
        imageData1.height !== imageData2.height) {
        return false;
    }

    const data1 = imageData1.data;
    const data2 = imageData2.data;

    for (let i = 0; i < data1.length; i++) {
        if (Math.abs(data1[i] - data2[i]) > tolerance) {
            return false;
        }
    }

    return true;
}

/**
 * Creates a mock effect for testing
 */
export function createMockEffect(name, parameters = {}) {
    return {
        id: Date.now(),
        name,
        parameters,
        label: name.charAt(0).toUpperCase() + name.slice(1)
    };
}

/**
 * Simulates worker processing
 */
export function mockWorkerProcessing(imageData, effect) {
    return new Promise(resolve => {
        setTimeout(() => {
            // Simulate processing by modifying image data
            const processedData = new Uint8ClampedArray(imageData.data);
            for (let i = 0; i < processedData.length; i += 4) {
                processedData[i] = effect.name === 'threshold' ? 
                    (processedData[i] > effect.parameters.threshold ? 255 : 0) :
                    processedData[i];
            }
            resolve(new ImageData(processedData, imageData.width, imageData.height));
        }, 10);
    });
}

/**
 * Creates a test DOM environment
 */
export function setupTestDOM() {
    document.body.innerHTML = `
        <div class="container">
            <div class="canvas-wrapper">
                <canvas id="originalCanvas"></canvas>
                <canvas id="outputCanvas"></canvas>
            </div>
            <div class="controls">
                <input type="file" id="imageInput" accept="image/*" />
                <select id="effectSelect">
                    <option value="threshold">Threshold</option>
                    <option value="dots">Dots</option>
                    <option value="edge">Edge Detection</option>
                </select>
                <div id="activeEffects"></div>
            </div>
            <div class="color-controls">
                <div class="color-mode">
                    <input type="radio" name="colorMode" value="single" checked>
                    <input type="radio" name="colorMode" value="multi">
                </div>
                <div class="single-color">
                    <input type="color" id="singleColorPicker" value="#000000">
                </div>
                <div class="multi-color">
                    <input type="color" id="darkColorPicker" value="#000000">
                    <input type="color" id="lightColorPicker" value="#ffffff">
                </div>
            </div>
        </div>
    `;
}

/**
 * Creates mock event with custom data
 */
export function createMockEvent(type, data) {
    return {
        type,
        data,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
    };
}

/**
 * Simulates touch events for testing
 */
export function simulateTouchEvents(element, eventSequence) {
    eventSequence.forEach(({type, x, y, identifier = 0}) => {
        const touch = new Touch({
            identifier,
            target: element,
            clientX: x,
            clientY: y,
            radiusX: 2.5,
            radiusY: 2.5,
            rotationAngle: 10,
            force: 0.5,
        });

        const touchEvent = new TouchEvent(type, {
            cancelable: true,
            bubbles: true,
            touches: [touch],
            targetTouches: [touch],
            changedTouches: [touch],
        });

        element.dispatchEvent(touchEvent);
    });
}
