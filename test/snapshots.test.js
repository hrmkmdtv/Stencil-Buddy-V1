import { setupTestDOM, createTestImageData } from './utils';

describe('Stencil Art Generator Snapshots', () => {
    beforeEach(() => {
        setupTestDOM();
    });

    describe('Effect Output Snapshots', () => {
        const testPatterns = ['solid', 'gradient', 'checkerboard', 'edge'];
        const testSizes = [10, 50];

        testPatterns.forEach(pattern => {
            testSizes.forEach(size => {
                test(`${pattern} pattern at ${size}x${size}`, () => {
                    const imageData = createTestImageData(size, size, pattern);
                    const colors = {
                        dark: '#000000',
                        light: '#ffffff'
                    };

                    // Test threshold effect
                    const thresholdData = new ImageData(
                        new Uint8ClampedArray(imageData.data),
                        size,
                        size
                    );
                    applyThreshold(thresholdData.data, 127, colors);
                    expect(thresholdData).toMatchSnapshot(`threshold_${pattern}_${size}`);

                    // Test edge detection
                    const edgeData = new ImageData(
                        new Uint8ClampedArray(imageData.data),
                        size,
                        size
                    );
                    applyEdgeDetection(edgeData.data, size, size, 30, colors);
                    expect(edgeData).toMatchSnapshot(`edge_${pattern}_${size}`);

                    // Test dot pattern
                    const dotData = new ImageData(
                        new Uint8ClampedArray(imageData.data),
                        size,
                        size
                    );
                    applyDots(dotData, size, size, 4, colors);
                    expect(dotData).toMatchSnapshot(`dots_${pattern}_${size}`);
                });
            });
        });
    });

    describe('UI Component Snapshots', () => {
        test('effect controls layout', () => {
            // Add multiple effects
            const effects = [
                { name: 'threshold', parameters: { thresholdSlider: 128 } },
                { name: 'dots', parameters: { dotSizeSlider: 4 } }
            ];

            effects.forEach(effect => {
                const select = document.getElementById('effectSelect');
                select.value = effect.name;
                addEffect();
            });

            const activeEffectsList = document.getElementById('activeEffects');
            expect(activeEffectsList.innerHTML).toMatchSnapshot('effects_list');
        });

        test('notification styles', () => {
            ['success', 'error', 'info'].forEach(type => {
                showNotification(`Test ${type} notification`, type);
                const notification = document.querySelector('.notification');
                expect(notification.outerHTML).toMatchSnapshot(`notification_${type}`);
            });
        });

        test('color controls', () => {
            const colorControls = document.querySelector('.color-controls');
            
            // Test single color mode
            expect(colorControls.outerHTML).toMatchSnapshot('color_controls_single');
            
            // Switch to multi color mode
            const multiColorRadio = document.querySelector('input[value="multi"]');
            fireEvent.click(multiColorRadio);
            expect(colorControls.outerHTML).toMatchSnapshot('color_controls_multi');
        });

        test('loading states', () => {
            document.body.classList.add('processing');
            const processingState = document.body.outerHTML;
            document.body.classList.remove('processing');
            expect(processingState).toMatchSnapshot('processing_state');
        });
    });

    describe('Template Snapshots', () => {
        const testTemplates = ['pop-art', 'street-art', 'vintage'];

        testTemplates.forEach(template => {
            test(`${template} template output`, async () => {
                // Setup test image
                const imageData = createTestImageData(100, 100, 'gradient');
                originalImage = {
                    width: 100,
                    height: 100
                };
                originalCtx.putImageData(imageData, 0, 0);

                // Apply template
                await shareManager.applyTemplate(template);
                
                // Capture output
                const outputData = outputCtx.getImageData(0, 0, 100, 100);
                expect(outputData).toMatchSnapshot(`template_${template}`);
            });
        });
    });

    describe('PWA Component Snapshots', () => {
        test('install prompt', () => {
            workboxInit.showInstallPrompt();
            const prompt = document.querySelector('.install-prompt');
            expect(prompt.outerHTML).toMatchSnapshot('install_prompt');
        });

        test('offline banner', () => {
            window.dispatchEvent(new Event('offline'));
            const banner = document.querySelector('.status-banner');
            expect(banner.outerHTML).toMatchSnapshot('offline_banner');
        });

        test('update notification', () => {
            workboxInit.showUpdateAvailable();
            const notification = document.querySelector('.update-banner');
            expect(notification.outerHTML).toMatchSnapshot('update_notification');
        });
    });

    describe('Effect Parameter Controls', () => {
        const effectTypes = ['threshold', 'dots', 'edge'];

        effectTypes.forEach(effectType => {
            test(`${effectType} effect controls`, () => {
                const select = document.getElementById('effectSelect');
                select.value = effectType;
                addEffect();

                const effectItem = document.querySelector('.effect-item');
                expect(effectItem.outerHTML).toMatchSnapshot(`${effectType}_controls`);
            });
        });

        test('expanded effect settings', () => {
            const select = document.getElementById('effectSelect');
            select.value = 'threshold';
            addEffect();

            const effectId = activeEffects[0].id;
            toggleEffectSettings(effectId);

            const effectItem = document.querySelector('.effect-item.expanded');
            expect(effectItem.outerHTML).toMatchSnapshot('expanded_settings');
        });
    });

    describe('Responsive Layout Snapshots', () => {
        const viewports = [
            { width: 320, height: 480, name: 'mobile' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 1920, height: 1080, name: 'desktop' }
        ];

        viewports.forEach(viewport => {
            test(`layout at ${viewport.name} size`, () => {
                // Mock viewport size
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: viewport.width
                });
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: viewport.height
                });

                // Trigger resize event
                window.dispatchEvent(new Event('resize'));

                // Capture layout
                const container = document.querySelector('.container');
                expect(container.outerHTML).toMatchSnapshot(`layout_${viewport.name}`);
            });
        });
    });
});
