const watermarksStore = localforage.createInstance({
    name: 'Watermarks',
    driver: [localforage.WEBSQL, localforage.INDEXEDDB]
});

const SettingsStore = localforage.createInstance({
    name: 'Settings',
    driver: [localforage.WEBSQL, localforage.INDEXEDDB]
});

const currentUrl = new URL(window.location);

const isApplePlatform = /MacIntel|iPhone|iPod|iPad/.test(navigator.platform);

const containerFileTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template', // .dotx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // .xltx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.openxmlformats-officedocument.presentationml.template', // .potx
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow', // .ppsx
    'application/zip', // .zip
    'application/x-zip', // .zip
    'application/x-zip-compressed' // .zip
];

const imageFileTypes = [
    'image/jpeg', // .jpg
    'image/png', // .png
    'image/gif', // .gif
    'image/bmp', // .bmp
    'image/webp', // .webp
    'image/avif', // .avif
    'image/jxl' // .jxl
];

const dragModal = new bootstrap.Modal(document.getElementById('photostack-drag-modal'));

const errorToast = new bootstrap.Toast(document.getElementById('photostack-error-toast'));

const importToast = new bootstrap.Toast(document.getElementById('photostack-import-toast'), {
    'autohide': false
});

const navCollapse = new bootstrap.Collapse('#navbarNav', {
    toggle: false
})


var globalFilesCount = 0;

// Prevent unload
window.onbeforeunload = function () {
    // Warn before navigating away if there are any files imported
    if (globalFilesCount > 0) {
        return 'Are you sure you want to navigate away?'
    }
}

// Show errors in UI
window.onerror = function () {
    errorToast.show()
}

// Plausible Analytics
window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments) }

/*

    MAIN EDITOR

*/

// Update interface and form elements based on supported image formats
async function updateSupportedFormats() {
    const canvas = document.createElement('canvas');
    const importForm = document.getElementById('photostack-import-file');
    const supportedImportFormats = await checkSupportedImportFormats();
    // Check WebP for exports
    if (!canvas.toDataURL('image/webp').includes('data:image/webp')) {
        document.querySelector('#photostack-file-format option[value="image/webp"]').setAttribute('disabled', true);
    }
    // Check JPEG for exports
    if (!canvas.toDataURL('image/jpeg').includes('data:image/jpeg')) {
        document.querySelector('#photostack-file-format option[value="image/jpeg"]').setAttribute('disabled', true);
    }
    // Add supported file types to file picker
    importForm.setAttribute('accept', importForm.getAttribute('accept') + ',' + supportedImportFormats.mimeTypes.join(','))
    // Display all supported file types in interface
    document.getElementById('photostack-file-format-list').innerText = 'Supported files: JPEG, PNG, GIF, BMP, ZIP, Microsoft Office 2007+, ' + supportedImportFormats.formatList.join(', ');
    console.log('Supported file formats for import:', importForm.getAttribute('accept').split(','));
}

// Increase image count after imports
function increaseImageCount(number) {
    // Any changes here should be mirrored in clearImportedImages()
    globalFilesCount += number
    document.querySelectorAll('.photostack-image-count').forEach(function (el) {
        el.textContent = globalFilesCount.toString()
    })
    var exportBtns = document.querySelectorAll('*[data-bs-target="#photostack-export-modal"]')
    exportBtns.forEach(function (el) {
        if ((globalFilesCount > 0) && (el.disabled)) {
            el.disabled = false
        }
    })
}

// Function to crop a canvas
function cropCanvas(canvas, top, bottom, left, right) {
    // Create a temp canvas
    const newCanvas = document.createElement('canvas')
    // Set its dimensions
    newCanvas.width = (canvas.width - left - right)
    newCanvas.height = (canvas.height - top - bottom)
    // Draw the canvas in the new resized temp canvas 
    // Helpful diagram: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage/canvas_drawimage.jpg
    newCanvas.getContext('2d').drawImage(
        canvas, // The original image
        (0 + left), // Source X
        (0 + top), // Source Y
        (canvas.width - left - right), // Source width
        (canvas.height - bottom - top), // Source height
        0, // Destination X
        0, // Destination Y
        newCanvas.width, // Destination width
        newCanvas.height // Destination height
    )
    return newCanvas
}

// Render canvas of first image, apply settings, and show a preview
function renderPreviewCanvas() {
    return new Promise(async function (resolve) {
        // Silently fail if there are no images imported
        if (document.querySelectorAll('#photostack-original-container img').length) {
            console.log('Rendering preview...')
        } else {
            console.log('Nothing to preview.')
            return
        }
        // Find elements
        var previewContainer = document.getElementById('photostack-editor-preview')
        var previewInfo = document.getElementById('photostack-preview-info')
        var originalsContainer = document.getElementById('photostack-original-container')
        var canvasContainer = document.getElementById('photostack-canvas-container')
        // Create canvas element for first imported image
        var canvas = document.createElement('canvas')
        var originalImage = originalsContainer.firstChild
        canvas.width = originalImage.naturalWidth
        canvas.height = originalImage.naturalHeight
        // Add canvas element to canvas container
        canvasContainer.appendChild(canvas)
        canvas.getContext('2d').drawImage(originalImage, 0, 0)
        // Apply settings
        if (document.getElementById('photostack-watermark-select').value === 'no-watermark') {
            canvas = await applyCanvasSettings(canvas, null, true)
        } else {
            var watermarkName = document.getElementById('photostack-watermark-select').value
            var watermarkObject = await new Promise(function (resolve) {
                watermarksStore.getItem(watermarkName).then(function (value) {
                    resolve(value)
                }).catch(function (err) {
                    alert('Error: ' + err)
                })
            })
            canvas = await applyCanvasSettings(canvas, watermarkObject, true)
        }
        // Generate Data URL
        var previewData = canvas.toDataURL()
        // Create image element
        if (previewContainer.querySelector('img')) {
            var previewImage = previewContainer.querySelector('img')
            previewImage.onload = function () {
                resolve()
            }
            previewImage.setAttribute('src', previewData)
        } else {
            var previewImage = document.createElement('img')
            previewImage.onload = function () {
                previewInfo.classList.add('d-none')
                previewContainer.appendChild(previewImage)
                resolve()
            }
            previewImage.setAttribute('src', previewData)
        }
        // Set image in print preview
        document.getElementById('photostack-print-preview').setAttribute('src', previewData)
    })
}

// Convert a file to a data URL
async function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// Load an image element and add it to the originals container if successful
async function processImage(imgEl, dataUrl, fileName) {
    return new Promise((resolve) => {
        imgEl.onload = function () {
            console.log('Processed image:', fileName);
            document.getElementById('photostack-original-container').appendChild(imgEl)
            increaseImageCount(1);
            resolve();
        }
        imgEl.onerror = function () {
            console.log('Could not import this image: ' + fileName);
            resolve()
        }
        // Load the image to strigger the onload() or onerror()
        imgEl.setAttribute('src', dataUrl);
    });
}

// Unified importer for local files (images and ZIPs)
async function importFiles(files, element = null) {
    const supportsWebP = document.getElementById('photostack-import-file').getAttribute('accept').includes('image/webp');
    const supportsJPEGXL = document.getElementById('photostack-import-file').getAttribute('accept').includes('image/jxl');
    const supportsAVIF = document.getElementById('photostack-import-file').getAttribute('accept').includes('image/avif');
    // Show import toast, and hide drag and drop modal if needed
    dragModal.hide();
    importToast.show();
    // Process each file
    for (const file of files) {
        if (containerFileTypes.includes(file.type)) {
            // This is a container file
            const zipFile = await JSZip().loadAsync(file);
            const zippedFiles = Object.entries(zipFile.files);
            console.log('Detected container file with contents:', zippedFiles);
            for (const zippedFile of zippedFiles) {
                const zippedFileName = zippedFile[1].name.match(/([^\\/]+)$/)?.[1]; // Example: image.png
                const zippedFileExt = zippedFile[1].name.split('.').pop().toLowerCase(); // Example: png
                const imgEl = document.createElement('img');
                let dataUrl;
                // Add each compatible file to originals container
                if (zippedFile[1].dir || zippedFile[1].name.includes('__MACOSX/')) {
                    // Exit early for directories or files in a __MACOSX directory
                    continue;
                } else if (zippedFileExt === 'png') {
                    // PNG image
                    const imgData = await zippedFile[1].async('base64');
                    dataUrl = 'data:image/png;base64,' + imgData;
                    imgEl.setAttribute('data-filename', zippedFileName.replace('.png', ''));
                } else if ((zippedFileExt === 'jpg') || (zippedFileExt === 'jpeg')) {
                    // JPEG image
                    const imgData = await zippedFile[1].async('base64');
                    dataUrl = 'data:image/jpeg;base64,' + imgData;
                    imgEl.setAttribute('data-filename', zippedFileName.replace('.jpeg', '').replace('.jpeg', ''));
                } else if (zippedFileExt === 'bmp') {
                    // BMP image
                    const imgData = await zippedFile[1].async('base64');
                    dataUrl = 'data:image/bmp;base64,' + imgData;
                    imgEl.setAttribute('data-filename', zippedFileName.replace('.bmp', ''));
                } else if (supportsWebP && zippedFileExt === 'webp') {
                    // WebP image
                    const imgData = await zippedFile[1].async('base64');
                    dataUrl = 'data:image/webp;base64,' + imgData;
                    imgEl.setAttribute('data-filename', zippedFileName.replace('.webp', ''));
                } else if (supportsAVIF && (zippedFileExt === 'avif')) {
                    // AVIF file
                    const imgData = await zippedFile[1].async('base64');
                    dataUrl = 'data:image/avif;base64,' + imgData;
                    imgEl.setAttribute('data-filename', zippedFileName.replace('.avif', ''));
                } else if (supportsJPEGXL && (zippedFileExt === 'jxl')) {
                    // JPEG XL file
                    const imgData = await zippedFile[1].async('base64');
                    dataUrl = 'data:image/jxl;base64,' + imgData;
                    imgEl.setAttribute('data-filename', zippedFileName.replace('.jxl', ''));
                } else {
                    // Unknown file type
                    continue;
                }
                // Add image to originals container
                await processImage(imgEl, dataUrl, zippedFileName);
            }
        } else if (imageFileTypes.includes(file.type)) {
            // This is an image file
            const imgEl = document.createElement('img');
            const imgFileName = file.name.replace(/\.[^/.]+$/, '');  // Example: image.png
            // Process image
            const dataUrl = await fileToDataURL(file);
            imgEl.setAttribute('data-filename', imgFileName);
            // Add image to originals container
            await processImage(imgEl, dataUrl, file.name);
        }
    }
    // Generate preview if needed
    await renderPreviewCanvas();
    // Hide import toast and reset <input> if needed
    setTimeout(function () {
        importToast.hide()
    }, 1000)
    if (element) {
        element.value = '';
    }
}

// Clear all imported images and reset preview box
function clearImportedImages() {
    // Confirm action
    if (!confirm('Do you want to clear all imported images?')) {
        return
    }
    // Remove imported images
    var originalsContainer = document.getElementById('photostack-original-container')
    while (originalsContainer.firstChild) {
        originalsContainer.removeChild(originalsContainer.firstChild)
    }
    // Remove already-exported images
    var canvasContainer = document.getElementById('photostack-canvas-container')
    while (canvasContainer.firstChild) {
        canvasContainer.removeChild(canvasContainer.firstChild)
    }
    // Reset image count
    globalFilesCount = 0
    document.querySelectorAll('.photostack-image-count').forEach(function (el) {
        el.textContent = '0'
    })
    var exportBtns = document.querySelectorAll('*[data-bs-target="#photostack-export-modal"]')
    exportBtns.forEach(function (el) {
        el.disabled = true
    })
    // Reset preview
    document.querySelector('#photostack-editor-preview img').remove()
    document.querySelector('#photostack-preview-info').classList.remove('d-none')
}

// Async export with Promises
function asyncExport() {
    // Start timer
    console.time('Async export')
    // Set variables
    const imgFormat = document.getElementById('photostack-file-format').value
    const imgQuality = parseInt(document.getElementById('photostack-file-quality').value) / 100
    const imgUseOriginalNames = document.getElementById('photostack-file-keep-name').checked
    const imgNamePattern = document.getElementById('photostack-file-name-pattern').value || 'Image'
    const imgTotal = document.querySelectorAll('#photostack-original-container img').length
    const imgStep = Math.round(100 / imgTotal)
    const progressBar = document.getElementById('photostack-export-modal-progress')
    // Switch modal content to progress indicator
    document.querySelector('.photostack-export-modal-initial').style.display = 'none'
    document.querySelector('.photostack-export-modal-loading').style.display = 'block'
    // Start rendering canvases
    var originals = document.querySelectorAll('#photostack-original-container img')
    var canvasContainer = document.getElementById('photostack-canvas-container')
    // Clear current canvas elements
    while (canvasContainer.firstChild) {
        canvasContainer.removeChild(canvasContainer.firstChild)
    }
    // Render canvas for each original image
    var originalsArray = Array.from(originals)
    var canvasPromises = originalsArray.map(function (original) {
        return new Promise(async function (resolve) {
            // Create canvas element
            var canvas = document.createElement('canvas')
            // Add canvas element to canvas container
            canvasContainer.appendChild(canvas)
            canvas.width = original.naturalWidth
            canvas.height = original.naturalHeight
            canvas.getContext('2d').drawImage(original, 0, 0)
            // Apply settings
            if (document.getElementById('photostack-watermark-select').value === 'no-watermark') {
                // No watermark selected
                canvas = await applyCanvasSettings(canvas)
            } else {
                // Get selected watermark
                var watermarkName = document.getElementById('photostack-watermark-select').value
                var watermarkObject = await new Promise(function (resolve) {
                    watermarksStore.getItem(watermarkName).then(function (value) {
                        resolve(value)
                    })
                })
                canvas = await applyCanvasSettings(canvas, watermarkObject)
            }
            // Retain file name
            canvas.dataset.filename = original.dataset.filename
            // Update progress bar and page title
            const previousProgress = parseInt(progressBar.getAttribute('aria-valuenow'))
            const newProgress = previousProgress + imgStep
            progressBar.setAttribute('aria-valuenow', newProgress)
            progressBar.setAttribute('style', 'width: ' + newProgress + '%')
            // Return rendered canvas
            resolve(canvas)
        })
    })
    // Continue once all canvases are rendered
    Promise.all(canvasPromises).then(function (canvases) {
        // Create promises for final render of each image
        console.log(canvases)
        var promises = canvases.map(function (canvas) {
            return new Promise(function (resolve) {
                canvas.toBlob(function (blob) {
                    resolve([blob, canvas.getAttribute('data-filename')])
                }, imgFormat, imgQuality)
            })
        })
        // Show the final export screen when all renders are completed
        Promise.all(promises).then(function (blobs) {
            // Create final array of blobs with file names
            var files = []
            blobs.forEach(function (blob, i) {
                // Set file ending
                if (imgFormat === 'image/jpeg') {
                    var fileEnding = '.jpg'
                } else if (imgFormat === 'image/png') {
                    var fileEnding = '.png'
                } else if (imgFormat === 'image/webp') {
                    var fileEnding = '.webp'
                }
                // Set file name
                if (imgUseOriginalNames) {
                    var fileName = blob[1] + fileEnding
                } else {
                    var num = i + 1
                    var fileName = imgNamePattern + ' ' + num + fileEnding
                }
                // Add to files array
                var file = new File([blob[0]], fileName, {
                    lastModified: Date.now(),
                    type: imgFormat
                })
                files.push(file)
            })
            // Show badge on PWA icon
            if ('setAppBadge' in navigator) {
                navigator.setAppBadge()
            }
            // File System Access API
            if ('showDirectoryPicker' in window) {
                // Add functionality for File System save button
                document.getElementById('photostack-export-filesystem-api-button').addEventListener('click', async function () {
                    // Send analytics event
                    plausible('Export', { props: { method: 'File System API' } })
                    // Ask for export directory
                    var directory = await window.showDirectoryPicker({
                        mode: 'readwrite',
                        startIn: 'pictures'
                    })
                    if (directory) {
                        // Save each file
                        console.log('Saving files in ' + directory.name + ' directory...')
                        files.forEach(async function (file) {
                            var writeableFile = await directory.getFileHandle(file.name, { create: true })
                            var writer = await writeableFile.createWritable()
                            await writer.write(file)
                            await writer.close()
                        })
                    }
                })
                // Hide legacy download method
                document.getElementById('photostack-legacy-download').style.display = 'none'
            } else {
                // Hide the File System Access button if the API isn't available
                document.getElementById('photostack-export-filesystem-api-button').style.display = 'none'
            }
            // Web Share API
            var shareData = { files: files }
            if (navigator.canShare && navigator.canShare(shareData)) {
                document.getElementById('photostack-export-web-share-button').addEventListener('click', function () {
                    plausible('Export', { props: { method: 'Web Share API' } })
                    navigator.share(shareData)
                        .then(function () {
                            console.log('Share successful.')
                        })
                        .catch(function (e) {
                            console.error(e)
                        })
                })
            } else {
                // Disable the native app share button if the API isn't available
                document.getElementById('photostack-export-web-share-button').setAttribute('disabled', 'true')
            }
            // Download files separately
            document.getElementById('photostack-export-separate-button').addEventListener('click', function () {
                plausible('Export', { props: { method: 'Individual files' } })
                files.forEach(function (file) {
                    saveAs(file)
                })
            })
            // Download as ZIP
            document.getElementById('photostack-export-zip-button').addEventListener('click', function () {
                plausible('Export', { props: { method: 'ZIP download' } })
                // Change button appearance
                document.getElementById('photostack-export-zip-button').disabled = true
                document.getElementById('photostack-export-zip-button').innerText = 'Please wait...'
                // Generate zip
                var zip = new JSZip()
                files.forEach(function (file) {
                    zip.file(file.name, file)
                })
                zip.generateAsync({ type: 'blob' }).then(function (zipData) {
                    var today = new Date()
                    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
                    saveAs(zipData, 'photostack-export-' + date + '.zip')
                    // Reset button appearance
                    document.getElementById('photostack-export-zip-button').disabled = false
                    document.getElementById('photostack-export-zip-button').innerText = 'Download as ZIP'
                })
            })
            // Stop time
            console.timeEnd('Async export')
            // Switch modal content to finished result
            document.querySelector('.photostack-export-modal-loading').style.display = 'none'
            document.querySelector('.photostack-export-modal-finished').style.display = 'block'
        })
    })
}

// Export button in modal
document.getElementById('photostack-start-export-btn').addEventListener('click', function () {
    asyncExport()
})

// Reset export status when the close button is clicked
document.getElementById('photostack-export-modal').addEventListener('hidden.bs.modal', function () {
    // Clear event listeners
    document.getElementById('photostack-export-web-share-button').replaceWith(document.getElementById('photostack-export-web-share-button').cloneNode(true))
    document.getElementById('photostack-export-separate-button').replaceWith(document.getElementById('photostack-export-separate-button').cloneNode(true))
    document.getElementById('photostack-export-filesystem-api-button').replaceWith(document.getElementById('photostack-export-filesystem-api-button').cloneNode(true))
    document.getElementById('photostack-export-zip-button').replaceWith(document.getElementById('photostack-export-zip-button').cloneNode(true))
    // Clear content
    document.querySelector('.photostack-export-modal-loading').style.display = 'none'
    document.querySelector('.photostack-export-modal-finished').style.display = 'none'
    document.querySelector('.photostack-export-modal-initial').style.display = 'block'
    document.getElementById('photostack-export-modal-progress').setAttribute('aria-valuenow', '0')
    document.getElementById('photostack-export-modal-progress').setAttribute('style', 'width: 0%')
    // Clear PWA icon
    if ('setAppBadge' in navigator) {
        navigator.clearAppBadge()
    }
})

// Update list of supported formats
updateSupportedFormats();

// Add warning for Safari users
const ifSafari = (navigator.userAgent.includes('Safari') && (!navigator.userAgent.includes('Chrome')))
if (ifSafari) {
    var warningBlock = document.querySelector('.photostack-safari-warning')
    warningBlock.style.display = 'block'
}

// Set initial name pattern radio value
if (document.querySelector('input[name="photostack-file-name"]:checked').id === 'photostack-file-keep-name') {
    document.getElementById('photostack-file-name-pattern').disabled = true
} else {
    document.getElementById('photostack-file-name-pattern').disabled = false
}

// Enable/disable name pattern field based on radio button
document.querySelectorAll('input[name="photostack-file-name"]').forEach(function (el) {
    el.addEventListener('click', function () {
        if (document.querySelector('input[name="photostack-file-name"]:checked').id === 'photostack-file-keep-name') {
            document.getElementById('photostack-file-name-pattern').disabled = true
        } else {
            document.getElementById('photostack-file-name-pattern').disabled = false
        }
    })
})

// Append event listeners to buttons and other elements

document.querySelector('#photostack-clear-images-btn').addEventListener('click', function () {
    clearImportedImages()
})

document.querySelector('#photostack-import-file-btn').addEventListener('click', function () {
    plausible('Import', { props: { method: 'Local file picker' } })
    document.getElementById('photostack-import-file').click()
})

document.getElementById('photostack-import-file').addEventListener('change', function () {
    importFiles(this.files, this)
})

document.querySelectorAll('.photostack-preview-update').forEach(function (item) {
    item.addEventListener('change', function () {
        renderPreviewCanvas()
    })
})

document.getElementById('photostack-reset-image-width-button').addEventListener('click', function () {
    document.getElementById('photostack-image-width').value = ''
    renderPreviewCanvas()
})

document.getElementById('photostack-print-btn').addEventListener('click', function () {
    window.print()
})

// Drag and drop file upload

document.body.addEventListener('dragenter', function (e) {
    console.log('Drag enter detected')
    dragModal.show()
})

document.body.addEventListener('dragleave', function (e) {
    console.log('Drag leave detected')
    dragModal.hide()
})

document.body.addEventListener('drop', function (e) {
    var files = e.dataTransfer.files
    importFiles(files)
})

document.getElementById('photostack-import-file').addEventListener('change', function () {
    // This prevents the modal from getting stuck when the 'drop' listener doesn't fire correctly
    dragModal.hide()
    // This hides the navbar dropdown after a file is selected on small screens
    navCollapse.hide()
})

// Prevent default browser drag/drop actions

var eventNames = ['dragenter', 'dragover', 'dragleave', 'drop']
eventNames.forEach(function (eventName) {
    document.body.addEventListener(eventName, function (e) {
        e.preventDefault()
        e.stopPropagation()
    }, false)
})

// Get list of watermarks when page is loaded

async function refreshWatermarks() {
    // Add watermarks to editor dropdown menu and watermark manager
    await watermarksStore.iterate(function (value, key, iterationNumber) {
        var option = document.createElement('option')
        option.innerText = key
        option.value = key
        document.getElementById('photostack-watermark-select').appendChild(option)
        console.log('Loaded watermark:', [key, value])
    })
}

refreshWatermarks()

// Keyboard shortcuts
// Some shortcuts are cloned from Adobe Lightroom: https://helpx.adobe.com/lightroom-classic/help/keyboard-shortcuts.html
document.addEventListener('keydown', function (event) {
    var exportModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('photostack-export-modal'))
    // Ignore if a modal is open
    if (document.querySelectorAll('.modal.show').length) {
        return
    }
    // All keyboard shortcuts
    if (event.metaKey && event.shiftKey && (event.code === 'KeyI') && isApplePlatform) {
        // Import on Mac: Command+Shift+I
        event.preventDefault()
        document.getElementById('photostack-import-file').click()
    } else if (event.ctrlKey && event.shiftKey && (event.code === 'KeyI') && (!isApplePlatform)) {
        // Import on PC: Ctrl+Shift+I
        event.preventDefault()
        document.getElementById('photostack-import-file').click()
    } else if (event.metaKey && (event.code === 'KeyD') && (globalFilesCount > 0) && isApplePlatform) {
        // Delete imported images on Mac: Command+D
        clearImportedImages()
    } else if (event.ctrlKey && (event.code === 'KeyD') && (globalFilesCount > 0) && (!isApplePlatform)) {
        // Delete imported images on PC: Ctrl+D
        clearImportedImages()
    } else if (event.shiftKey && (event.code === 'KeyE') && (globalFilesCount > 0)) {
        // Export: Shift + E
        exportModal.show()
    } else if (event.metaKey && (event.code === 'KeyS') && (globalFilesCount > 0) && isApplePlatform) {
        // Export on Mac: Command+S
        event.preventDefault()
        exportModal.show()
    } else if (event.ctrlKey && (event.code === 'KeyS') && (globalFilesCount > 0) && (!isApplePlatform)) {
        // Export on PC: Ctrl+S
        event.preventDefault()
        exportModal.show()
    }
})