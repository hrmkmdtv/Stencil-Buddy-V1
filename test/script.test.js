import { fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';

describe('Stencil Art Generator', () => {
    beforeEach(() => {
        // Setup test DOM
        document.body.innerHTML = `
            <div class="container">
                <canvas id="originalCanvas"></canvas>
                <canvas id="outputCanvas"></canvas>
                <input type="file" id="imageInput" />
                <select id="effectSelect">
                    <option value="threshold">Threshold</option>
                    <option value="dots">Dots</option>
                </select>
                <div id="activeEffects"></div>
                <div class="color-controls">
                    <input type="radio" name="colorMode" value="single" checked>
                    <input type="radio" name="colorMode" value="multi">
                    <input type="color" id="singleColorPicker" value="#000000">
                    <input type="color" id="darkColorPicker" value="#000000">
                    <input type="color" id="lightColorPicker" value="#ffffff">
                </div>
            </div>
        `;
    });

    describe('Image Upload', () => {
        test('should handle image upload', async () => {
            const file = new File(['test'], 'test.png', { type: 'image/png' });
            const input = document.getElementById('imageInput');
            
            fireEvent.change(input, { target: { files: [file] } });
            
            await waitFor(() => {
                expect(originalImage).not.toBeNull();
            });
        });

        test('should reject invalid file types', async () => {
            const file = new File(['test'], 'test.txt', { type: 'text/plain' });
            const input = document.getElementById('imageInput');
            
            fireEvent.change(input, { target: { files: [file] } });
            
            expect(input.value).toBe('');
        });
    });

    describe('Effect Management', () => {
        test('should add effect to active effects list', () => {
            const select = document.getElementById('effectSelect');
            select.value = 'threshold';
            
            addEffect();
            
            const effectsList = document.getElementById('activeEffects');
            expect(effectsList.children.length).toBe(1);
            expect(activeEffects.length).toBe(1);
        });

        test('should remove effect from list', () => {
            const select = document.getElementById('effectSelect');
            select.value = 'threshold';
            addEffect();
            
            const effectId = activeEffects[0].id;
            removeEffect(effectId);
            
            const effectsList = document.getElementById('activeEffects');
            expect(effectsList.children.length).toBe(0);
            expect(activeEffects.length).toBe(0);
        });

        test('should update effect parameters', () => {
            const select = document.getElementById('effectSelect');
            select.value = 'threshold';
            addEffect();
            
            const effectId = activeEffects[0].id;
            handleSettingChange(effectId, 'thresholdSlider', '128');
            
            expect(activeEffects[0].parameters.thresholdSlider).toBe(128);
        });
    });

    describe('Color Management', () => {
        test('should handle color mode switching', () => {
            const multiColorRadio = document.querySelector('input[value="multi"]');
            fireEvent.click(multiColorRadio);
            
            const colors = getSelectedColors();
            expect(colors.dark).toBe('#000000');
            expect(colors.light).toBe('#ffffff');
        });

        test('should update colors when pickers change', () => {
            const darkPicker = document.getElementById('darkColorPicker');
            fireEvent.input(darkPicker, { target: { value: '#ff0000' } });
            
            const colors = getSelectedColors();
            expect(colors.dark).toBe('#ff0000');
        });
    });

    describe('Effect Processing', () => {
        beforeEach(() => {
            originalImage = new Image();
            originalImage.width = 100;
            originalImage.height = 100;
        });

        test('should apply threshold effect', async () => {
            const select = document.getElementById('effectSelect');
            select.value = 'threshold';
            addEffect();
            
            await applyEffects();
            
            const outputCanvas = document.getElementById('outputCanvas');
            expect(outputCanvas.getContext('2d').putImageData).toHaveBeenCalled();
        });

        test('should handle multiple effects', async () => {
            const select = document.getElementById('effectSelect');
            
            select.value = 'threshold';
            addEffect();
            
            select.value = 'dots';
            addEffect();
            
            await applyEffects();
            
            expect(activeEffects.length).toBe(2);
        });
    });

    describe('History Management', () => {
        test('should track effect changes', () => {
            const select = document.getElementById('effectSelect');
            select.value = 'threshold';
            addEffect();
            
            expect(historyStack.undoStack.length).toBeGreaterThan(0);
        });

        test('should undo effect addition', () => {
            const select = document.getElementById('effectSelect');
            select.value = 'threshold';
            addEffect();
            
            historyStack.undo();
            
            expect(activeEffects.length).toBe(0);
        });
    });

    describe('Performance', () => {
        test('should debounce effect applications', async () => {
            jest.useFakeTimers();
            
            const select = document.getElementById('effectSelect');
            select.value = 'threshold';
            addEffect();
            
            handleSettingChange(activeEffects[0].id, 'thresholdSlider', '128');
            handleSettingChange(activeEffects[0].id, 'thresholdSlider', '129');
            handleSettingChange(activeEffects[0].id, 'thresholdSlider', '130');
            
            jest.runAllTimers();
            
            expect(performanceManager.processWithWorker).toHaveBeenCalledTimes(1);
        });
    });

    describe('PWA Features', () => {
        test('should register service worker', async () => {
            await workboxInit.init();
            expect(navigator.serviceWorker.register).toHaveBeenCalled();
        });

        test('should handle offline mode', async () => {
            const event = new Event('offline');
            window.dispatchEvent(event);
            
            expect(document.querySelector('.status-banner.offline')).toBeTruthy();
        });
    });
});
