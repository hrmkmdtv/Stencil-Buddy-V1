import { fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { setupTestDOM, createTestImageData, createMockEvent } from './utils';

describe('Stencil Art Generator Integration Tests', () => {
    beforeEach(() => {
        setupTestDOM();
        // Mock canvas methods
        const mockCtx = {
            drawImage: jest.fn(),
            getImageData: jest.fn(() => createTestImageData(100, 100)),
            putImageData: jest.fn(),
            clearRect: jest.fn()
        };
        HTMLCanvasElement.prototype.getContext = () => mockCtx;
    });

    describe('End-to-End Workflows', () => {
        test('complete workflow from upload to export', async () => {
            // 1. Upload image
            const file = new File(['test'], 'test.png', { type: 'image/png' });
            const input = document.getElementById('imageInput');
            fireEvent.change(input, { target: { files: [file] } });
            
            await waitFor(() => expect(originalImage).toBeTruthy());

            // 2. Add multiple effects
            const effectSelect = document.getElementById('effectSelect');
            
            // Add threshold effect
            effectSelect.value = 'threshold';
            addEffect();
            expect(activeEffects.length).toBe(1);
            
            // Configure threshold effect
            const thresholdEffect = activeEffects[0];
            handleSettingChange(thresholdEffect.id, 'thresholdSlider', '128');
            
            // Add dots effect
            effectSelect.value = 'dots';
            addEffect();
            expect(activeEffects.length).toBe(2);

            // 3. Adjust colors
            const multiColorRadio = document.querySelector('input[value="multi"]');
            fireEvent.click(multiColorRadio);
            
            const darkColorPicker = document.getElementById('darkColorPicker');
            fireEvent.input(darkColorPicker, { target: { value: '#ff0000' } });

            // 4. Apply effects
            await applyEffects();
            
            // 5. Test undo/redo
            historyStack.undo();
            expect(activeEffects.length).toBe(1);
            
            historyStack.redo();
            expect(activeEffects.length).toBe(2);
            
            // 6. Export image
            const exportData = await performExport();
            expect(exportData).toContain('data:image');
        });

        test('offline workflow with sync', async () => {
            // 1. Simulate going offline
            window.dispatchEvent(new Event('offline'));
            
            // 2. Perform operations
            const file = new File(['test'], 'test.png', { type: 'image/png' });
            const input = document.getElementById('imageInput');
            fireEvent.change(input, { target: { files: [file] } });
            
            await waitFor(() => expect(originalImage).toBeTruthy());
            
            effectSelect.value = 'threshold';
            addEffect();
            
            // 3. Save project offline
            await sessionManager.saveProject({
                id: 'test-project',
                effects: activeEffects
            });
            
            // 4. Simulate going online
            window.dispatchEvent(new Event('online'));
            
            // 5. Verify sync
            await waitFor(() => {
                expect(document.querySelector('.status-banner.online')).toBeTruthy();
            });
        });

        test('PWA installation flow', async () => {
            // 1. Simulate beforeinstallprompt
            const installPrompt = createMockEvent('beforeinstallprompt');
            window.dispatchEvent(installPrompt);
            
            // 2. Verify prompt appears
            expect(document.querySelector('.install-prompt')).toBeTruthy();
            
            // 3. Accept installation
            const installButton = document.querySelector('.install-prompt .install-btn');
            fireEvent.click(installButton);
            
            // 4. Verify prompt handled
            await waitFor(() => {
                expect(document.querySelector('.install-prompt')).toBeFalsy();
            });
        });

        test('effect parameter updates with preview', async () => {
            // 1. Setup initial state
            const file = new File(['test'], 'test.png', { type: 'image/png' });
            const input = document.getElementById('imageInput');
            fireEvent.change(input, { target: { files: [file] } });
            
            await waitFor(() => expect(originalImage).toBeTruthy());
            
            // 2. Add effect
            effectSelect.value = 'threshold';
            addEffect();
            
            // 3. Enable preview
            const previewToggle = document.getElementById('previewToggle');
            fireEvent.click(previewToggle);
            
            // 4. Adjust parameters
            const effect = activeEffects[0];
            handleSettingChange(effect.id, 'thresholdSlider', '128');
            
            // 5. Verify preview updates
            await waitFor(() => {
                const previewCanvas = document.querySelector('.preview-canvas');
                expect(previewCanvas.style.display).toBe('block');
            });
        });

        test('template application and customization', async () => {
            // 1. Load image
            const file = new File(['test'], 'test.png', { type: 'image/png' });
            const input = document.getElementById('imageInput');
            fireEvent.change(input, { target: { files: [file] } });
            
            await waitFor(() => expect(originalImage).toBeTruthy());
            
            // 2. Apply template
            await shareManager.applyTemplate('pop-art');
            
            // 3. Verify template effects
            expect(activeEffects.length).toBeGreaterThan(0);
            
            // 4. Modify template
            const effect = activeEffects[0];
            handleSettingChange(effect.id, Object.keys(effect.parameters)[0], '150');
            
            // 5. Save as new preset
            await presetManager.saveCurrentAsPreset('custom-template');
            
            // 6. Verify preset saved
            const savedPresets = JSON.parse(localStorage.getItem('stencilArtPresets'));
            expect(savedPresets['custom-template']).toBeTruthy();
        });
    });

    describe('Error Handling and Recovery', () => {
        test('handles failed image upload gracefully', async () => {
            const file = new File(['invalid'], 'test.txt', { type: 'text/plain' });
            const input = document.getElementById('imageInput');
            
            fireEvent.change(input, { target: { files: [file] } });
            
            await waitFor(() => {
                expect(document.querySelector('.notification.error')).toBeTruthy();
            });
        });

        test('recovers from processing errors', async () => {
            // 1. Setup error condition
            const mockError = new Error('Processing failed');
            jest.spyOn(performanceManager, 'processWithWorker')
                .mockRejectedValueOnce(mockError);
            
            // 2. Trigger processing
            const file = new File(['test'], 'test.png', { type: 'image/png' });
            const input = document.getElementById('imageInput');
            fireEvent.change(input, { target: { files: [file] } });
            
            await waitFor(() => expect(originalImage).toBeTruthy());
            
            effectSelect.value = 'threshold';
            addEffect();
            
            // 3. Verify error handling
            await waitFor(() => {
                expect(document.querySelector('.notification.error')).toBeTruthy();
                expect(document.body.classList.contains('processing')).toBeFalsy();
            });
        });

        test('handles service worker updates', async () => {
            // 1. Simulate service worker update
            const registration = { waiting: { postMessage: jest.fn() } };
            workboxInit.registration = registration;
            
            // 2. Trigger update flow
            workboxInit.showUpdateAvailable();
            
            // 3. Accept update
            const updateButton = document.querySelector('.update-banner button');
            fireEvent.click(updateButton);
            
            // 4. Verify update handling
            expect(registration.waiting.postMessage)
                .toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
        });
    });

    describe('Performance', () => {
        test('debounces rapid parameter changes', async () => {
            jest.useFakeTimers();
            
            // 1. Setup effect
            effectSelect.value = 'threshold';
            addEffect();
            const effect = activeEffects[0];
            
            // 2. Rapid parameter changes
            for (let i = 0; i < 10; i++) {
                handleSettingChange(effect.id, 'thresholdSlider', String(i * 10));
            }
            
            // 3. Verify debouncing
            jest.runAllTimers();
            
            expect(performanceManager.processWithWorker)
                .toHaveBeenCalledTimes(1);
        });

        test('handles large images efficiently', async () => {
            // 1. Setup large image
            const largeImageData = createTestImageData(2000, 2000);
            HTMLCanvasElement.prototype.getContext = () => ({
                ...mockCtx,
                getImageData: () => largeImageData
            });
            
            // 2. Process image
            const startTime = performance.now();
            
            effectSelect.value = 'threshold';
            addEffect();
            await applyEffects();
            
            const endTime = performance.now();
            
            // 3. Verify processing time
            expect(endTime - startTime).toBeLessThan(5000);
        });
    });
});
