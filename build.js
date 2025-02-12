const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const workboxBuild = require('workbox-build');
const { minify } = require('terser');
const csso = require('csso');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminSvgo = require('imagemin-svgo');

async function build() {
    try {
        console.log('🚀 Starting build process...');

        // Create dist directory
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir);
        }

        // Generate service worker
        console.log('📦 Generating service worker...');
        const { count, size, warnings } = await workboxBuild.injectManifest({
            swSrc: 'sw-template.js',
            swDest: 'dist/sw.js',
            globDirectory: '.',
            globPatterns: [
                'index.html',
                'style.css',
                'script.js',
                'manifest.json',
                'offline.html',
                'icons/**/*.{png,jpg,svg}',
                'locales/*.json'
            ],
            globIgnores: ['dist/**/*', 'node_modules/**/*']
        });

        if (warnings.length > 0) {
            console.warn('⚠️ Workbox warnings:', warnings);
        }

        console.log(`Service worker generated with ${count} files, totaling ${size} bytes`);

        // Optimize JavaScript files
        console.log('🔧 Optimizing JavaScript...');
        const jsFiles = [
            'script.js',
            'workbox-init.js',
            'dist/sw.js'
        ];

        for (const file of jsFiles) {
            const source = fs.readFileSync(file, 'utf8');
            const minified = await minify(source, {
                compress: {
                    dead_code: true,
                    drop_console: true,
                    drop_debugger: true
                },
                mangle: true,
                output: {
                    comments: false
                }
            });
            fs.writeFileSync(
                path.join(distDir, path.basename(file)),
                minified.code
            );
        }

        // Optimize CSS
        console.log('🎨 Optimizing CSS...');
        const cssFiles = ['style.css'];
        for (const file of cssFiles) {
            const source = fs.readFileSync(file, 'utf8');
            const minified = csso.minify(source).css;
            fs.writeFileSync(
                path.join(distDir, file),
                minified
            );
        }

        // Optimize images
        console.log('🖼️ Optimizing images...');
        const imageFiles = await imagemin(['icons/**/*.{jpg,png,svg}'], {
            destination: path.join(distDir, 'icons'),
            plugins: [
                imageminMozjpeg({ quality: 80 }),
                imageminPngquant({
                    quality: [0.6, 0.8],
                    strip: true
                }),
                imageminSvgo({
                    plugins: [{
                        name: 'removeViewBox',
                        active: false
                    }]
                })
            ]
        });

        console.log(`Optimized ${imageFiles.length} images`);

        // Copy and minify HTML files
        console.log('📄 Processing HTML files...');
        const htmlFiles = ['index.html', 'offline.html'];
        for (const file of htmlFiles) {
            let content = fs.readFileSync(file, 'utf8');
            
            // Basic HTML minification
            content = content
                .replace(/\s+/g, ' ')
                .replace(/>\s+</g, '><')
                .replace(/<!--[\s\S]*?-->/g, '');

            fs.writeFileSync(
                path.join(distDir, file),
                content
            );
        }

        // Copy and minify manifest
        console.log('📱 Processing manifest...');
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        fs.writeFileSync(
            path.join(distDir, 'manifest.json'),
            JSON.stringify(manifest)
        );

        // Copy and minify locales
        console.log('🌐 Processing locales...');
        const localesDir = path.join(distDir, 'locales');
        if (!fs.existsSync(localesDir)) {
            fs.mkdirSync(localesDir);
        }

        const localeFiles = fs.readdirSync('locales');
        for (const file of localeFiles) {
            const locale = JSON.parse(fs.readFileSync(path.join('locales', file), 'utf8'));
            fs.writeFileSync(
                path.join(localesDir, file),
                JSON.stringify(locale)
            );
        }

        // Generate version file
        const version = {
            version: process.env.npm_package_version || '1.0.0',
            buildTime: new Date().toISOString()
        };
        fs.writeFileSync(
            path.join(distDir, 'version.json'),
            JSON.stringify(version)
        );

        // Generate precache manifest
        const precacheManifest = {
            files: jsFiles.concat(cssFiles, htmlFiles).map(file => ({
                url: `/${file}`,
                revision: version.buildTime
            }))
        };
        fs.writeFileSync(
            path.join(distDir, 'precache-manifest.js'),
            `self.__precacheManifest = ${JSON.stringify(precacheManifest.files, null, 2)};`
        );

        console.log('✅ Build completed successfully!');
        console.log(`📁 Output directory: ${distDir}`);
        console.log(`📦 Total files processed: ${count + imageFiles.length + htmlFiles.length + 2}`);

    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build
build();
