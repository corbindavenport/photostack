const watermarksStore = localforage.createInstance({
    name: 'Watermarks',
    driver: [localforage.WEBSQL, localforage.INDEXEDDB]
})

const SettingsStore = localforage.createInstance({
    name: 'Settings',
    driver: [localforage.WEBSQL, localforage.INDEXEDDB]
})

const currentUrl = new URL(window.location)

var globalFilesCount = 0

// Prevent unload
window.onbeforeunload = function () {
    // Warn before navigating away if there are any files imported
    if (globalFilesCount > 0) {
        return 'Are you sure you want to navigate away?'
    }
}

// Show errors in UI
window.onerror = function () {
    var errorToast = new bootstrap.Toast(document.getElementById('photostack-error-toast'))
    errorToast.show()
}

// Google Analytics
window.ga = window.ga || function () { (ga.q = ga.q || []).push(arguments) }; ga.l = +new Date
ga('create', 'UA-59452245-5', 'auto')
ga('require', 'displayfeatures')
ga('send', 'pageview', '/')

/*

    MAIN EDITOR

*/

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

// Resize a canvas using Pica library
function resizeCanvas(oldCanvas, width, height, globalAlpha = 1.0) {
    return new Promise(function (resolve) {
        // Create canvas with new size
        var newCanvas = document.createElement('canvas')
        newCanvas.width = width
        newCanvas.height = height
        // Get settings
        const options = {
            unsharpAmount: parseInt(document.getElementById('photostack-resize-unsharp-amount').value),
            unsharpRadius: 0.5,
            unsharpThreshold: 2,
            alpha: true
        }
        // Do the resize
        pica().resize(oldCanvas, newCanvas, options).then(function () {
            // We have to create ANOTHER canvas to apply transparency
            if (globalAlpha != 1.0) {
                var tempCanvas = document.createElement('canvas')
                tempCanvas.width = newCanvas.width
                tempCanvas.height = newCanvas.height
                tempCanvas.getContext('2d').globalAlpha = globalAlpha
                tempCanvas.getContext('2d').drawImage(newCanvas, 0, 0)
                resolve(tempCanvas)
            } else {
                resolve(newCanvas)
            }
        })
    })
}

// Apply settings to a canvas
function applyCanvasSettings(canvas, watermarkObject = null, previewMode = false) {
    return new Promise(async function (resolve) {
        // Create aspect ratio from original canvas size
        var ratio = (canvas.width / canvas.height)
        // Crop image
        var cropNeeded = (
            (document.getElementById('photostack-crop-top').value != 0) ||
            (document.getElementById('photostack-crop-bottom').value != 0) ||
            (document.getElementById('photostack-crop-left').value != 0) ||
            (document.getElementById('photostack-crop-right').value != 0)
        )
        if (cropNeeded) {
            canvas = cropCanvas(canvas, document.getElementById('photostack-crop-top').value, document.getElementById('photostack-crop-bottom').value, document.getElementById('photostack-crop-left').value, document.getElementById('photostack-crop-right').value)
            // Update ratio
            ratio = (canvas.width / canvas.height)
        }
        // Resize image
        if (document.getElementById('photostack-image-width').value != '') {
            // Set new canvas size
            var width = parseInt(document.getElementById('photostack-image-width').value)
            if (previewMode && (width > 800)) {
                width = 800
            }
            var height = width / ratio
            // Do the resize
            canvas = await resizeCanvas(canvas, width, height)
        } else if (previewMode) {
            // Set new canvas size
            var width = 800
            var height = width / ratio
            // Do the resize
            canvas = await resizeCanvas(canvas, width, height)
        }
        // Apply border
        if (parseInt(document.getElementById('photostack-border-width').value) > 0) {
            var borderSize = document.getElementById('photostack-border-width').value
            var borderColor = document.getElementById('photostack-border-color').value
            // Top border
            canvas.getContext("2d").beginPath()
            canvas.getContext("2d").lineWidth = borderSize
            canvas.getContext("2d").strokeStyle = borderColor
            canvas.getContext("2d").rect(0, 0, canvas.width, borderSize)
            canvas.getContext("2d").stroke()
            // Bottom border
            canvas.getContext("2d").beginPath()
            canvas.getContext("2d").lineWidth = borderSize
            canvas.getContext("2d").strokeStyle = borderColor
            canvas.getContext("2d").rect(0, (canvas.height - borderSize), canvas.width, borderSize)
            canvas.getContext("2d").stroke()
            // Left border
            canvas.getContext("2d").beginPath()
            canvas.getContext("2d").lineWidth = borderSize
            canvas.getContext("2d").strokeStyle = borderColor
            canvas.getContext("2d").rect(0, 0, borderSize, canvas.height)
            canvas.getContext("2d").stroke()
            // Right border
            canvas.getContext("2d").beginPath()
            canvas.getContext("2d").lineWidth = borderSize
            canvas.getContext("2d").strokeStyle = borderColor
            canvas.getContext("2d").rect((canvas.width - borderSize), 0, borderSize, canvas.height)
            canvas.getContext("2d").stroke()
        }
        // Apply watermark
        if (watermarkObject) {
            // Load the watermark image
            if (watermarkObject.image.length === document.getElementById('photostack-watermark-cache').src.length) {
                // If the current image has already been loaded, avoid loading it again
                var watermarkImage = document.getElementById('photostack-watermark-cache')
            } else {
                // Load the image and add it to cache
                var watermarkImage = await new Promise(function (resolve) {
                    var tempImage = document.getElementById('photostack-watermark-cache')
                    tempImage.onload = function () {
                        resolve(tempImage)
                    }
                    tempImage.src = watermarkObject.image
                })
            }
            // Create temporary canvas for the watermark
            var watermarkCanvas = document.createElement('canvas')
            watermarkCanvas.width = watermarkImage.naturalWidth
            watermarkCanvas.height = watermarkImage.naturalHeight
            // Set opacity
            var opacity = parseInt(watermarkObject.opacity) / 100
            // Draw watermark to temporary canvas
            watermarkCanvas.getContext('2d').drawImage(watermarkImage, 0, 0)
            // Calculate new size of watermark
            var resizeRatio = watermarkImage.naturalHeight / watermarkImage.naturalWidth
            var userSize = parseInt(watermarkObject.size)
            watermarkFinalWidth = canvas.width * (userSize / 100)
            watermarkFinalHeight = watermarkFinalWidth * resizeRatio
            // Do the resize
            watermarkCanvas = await resizeCanvas(watermarkImage, watermarkFinalWidth, watermarkFinalHeight, opacity)
            // Set horizontal and vertical insets
            var horizontalInset = canvas.width * (watermarkObject.horizontalInset / 100)
            var veritcalInset = canvas.height * (watermarkObject.veritcalInset / 100)
            // Set anchor position
            if (watermarkObject.anchorPosition === 1) {
                // Top-left alignment
                // Because the X and Y values start from the top-left, nothing happens here
            } else if (watermarkObject.anchorPosition === 2) {
                // Top-center alignment (Ignore: Horizontal)
                horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
            } else if (watermarkObject.anchorPosition === 3) {
                // Top-right alignment
                horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
            } else if (watermarkObject.anchorPosition === 4) {
                // Middle-left alignment (Ignore: Vertical)
                veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
            } else if (watermarkObject.anchorPosition === 5) {
                // Middle-center alignment (Ignore: Vertical & Horizontal)
                horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
                veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
            } else if (watermarkObject.anchorPosition === 6) {
                // Middle-right alignment (Ignore: Vertical)
                horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
                veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
            } else if (watermarkObject.anchorPosition === 7) {
                // Bottom-left alignment
                veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
            } else if (watermarkObject.anchorPosition === 8) {
                // Bottom-center alignment (Ignore: Horizontal)
                veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
                horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
            } else if (watermarkObject.anchorPosition === 9) {
                // Bottom-right alignment
                veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
                horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
            }
            // Draw completed image to temporary canvas
            canvas.getContext('2d').drawImage(watermarkCanvas, horizontalInset, veritcalInset)
        }
        resolve(canvas)
    })
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
                previewContainer.innerHTML = ''
                previewContainer.appendChild(previewImage)
                resolve()
            }
            previewImage.setAttribute('src', previewData)
        }
        // Set image in print preview
        document.getElementById('photostack-print-preview').setAttribute('src', previewData)
    })
}

// Unified importer for local files (images and ZIPs)
function importFiles(files, element = null) {
    // Initialize import toast
    var importToast = new bootstrap.Toast(document.getElementById('photostack-import-toast'), {
        'autohide': false
    })
    // Show import toast
    importToast.show()
    // Define file types
    var containerFiles = [
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
    ]
    var imageFiles = [
        'image/jpeg', // .jpg
        'image/png', // .png
        'image/gif', // .gif
        'image/bmp', // .bmp
        'image/webp', // .webp
        'image/avif' // .avif
    ]
    // Get files
    console.log('Number of files selected: ' + files.length)
    // Process files
    var importPromises = $.map(files, function (file) {
        return new Promise(function (resolve) {
            if (containerFiles.includes(file.type)) {
                // This is a container file
                var zip = new JSZip()
                zip.loadAsync(file).then(function (zip) {
                    // Create a promise for each file in the container file
                    var zipPromises = $.map(zip.files, function (file) {
                        return new Promise(function (resolve) {
                            // Only read files that are images, aren't directories, and aren't inside __MACOSX
                            var supportedImages = (
                                file.name.endsWith('.png') ||
                                file.name.endsWith('.jpg') ||
                                file.name.endsWith('.jpeg') ||
                                file.name.endsWith('.bmp') ||
                                (Modernizr.webp && file.name.endsWith('.webp')) ||
                                (document.getElementsByTagName('html')[0].classList.contains('avif') && file.name.endsWith('.avif'))
                            )
                            if ((supportedImages) && (!file.dir) && (!file.name.includes('__MACOSX/'))) {
                                // Add images to originals container
                                file.async('base64').then(function (data) {
                                    // Create image element
                                    var image = document.createElement('img')
                                    // Add MIME type to each image so the browser can render them
                                    if (file.name.endsWith('.png')) {
                                        var base64 = 'data:image/png;base64,' + data
                                    } else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
                                        var base64 = 'data:image/jpeg;base64,' + data
                                    } else if (file.name.endsWith('.bmp')) {
                                        var base64 = 'data:image/bmp;base64,' + data
                                    } else if (file.name.endsWith('.webp')) {
                                        var base64 = 'data:image/webp;base64,' + data
                                    } else if (file.name.endsWith('.avif')) {
                                        var base64 = 'data:image/avif;base64,' + data
                                    }
                                    // Once both the reader and image is done, resolve the Promise
                                    image.onload = function () {
                                        // Remove file ending
                                        var filename = file.name
                                        if (filename.includes('.')) {
                                            filename = filename.slice(0, filename.indexOf("."))
                                            image.setAttribute('data-file-name', filename)
                                        } else {
                                            image.setAttribute('data-file-name', filename)
                                        }
                                        // Resolve promise
                                        console.log('Processed image:', file.name)
                                        resolve(image)
                                    }
                                    image.onerror = function () {
                                        console.log('Could not import this image: ' + file.name)
                                        resolve()
                                    }
                                    image.setAttribute('src', base64)
                                })
                            } else {
                                resolve()
                            }
                        })
                    })
                    // Pass all processed images to main Promise
                    Promise.all(zipPromises).then(function (data) {
                        resolve(data)
                    })
                })
            } else if (imageFiles.includes(file.type)) {
                // This is an image file
                var image = document.createElement('img')
                var reader = new FileReader()
                // Set the image source to the reader result, once the reader is done
                reader.onload = function () {
                    image.src = reader.result
                }
                reader.onerror = function () {
                    console.log('Could not import this image: ' + file.name)
                    resolve()
                }
                // Once both the reader and image is done, resolve the Promise
                image.onload = function () {
                    // Remove file ending
                    var filename = file.name
                    if (filename.includes('.')) {
                        filename = filename.slice(0, filename.indexOf("."))
                        image.setAttribute('data-file-name', filename)
                    } else {
                        image.setAttribute('data-file-name', filename)
                    }
                    // Resolve promise
                    console.log('Processed image:', file.name)
                    resolve(image)
                }
                reader.readAsDataURL(file)
            } else {
                console.log('Could not detect format of this file, skipping:', file)
                resolve()
            }
        })
    })
    // Add processed files to originals container
    Promise.all(importPromises).then(async function (imageArray) {
        // Promises for containers return arrays of objects, so we need to flatten the entire array
        imageArray = imageArray.flat()
        imageArray = imageArray.filter(function (e) {
            return e instanceof HTMLElement
        })
        // Update image counter
        increaseImageCount(imageArray.length)
        // Add images to originals container
        imageArray.forEach(function (imageEl) {
            document.getElementById('photostack-original-container').appendChild(imageEl)
        })
        // Generate preview if needed
        await renderPreviewCanvas()
        // Hide import toast and reset <input> if needed
        setTimeout(function () {
            importToast.hide()
        }, 1000)
        if (element) {
            element.value = ''
        }
    })
}

// Add image from URL
function importWebImage(url) {
    // Initialize import toast
    var importToast = new bootstrap.Toast(document.getElementById('photostack-import-toast'), {
        'autohide': false
    })
    // Show import toast
    importToast.show()
    // Get image
    function addImageToCanvas(url) {
        // Create image element
        var image = document.createElement('img')
        image.setAttribute('crossorigin', 'anonymous')
        image.setAttribute('src', url)
        // Get filename
        try {
            var filename = url.split('/').pop().split('#')[0].split('?')[0]
            filename = decodeURIComponent(filename) // Revert URI encoding
            filename = filename.slice(0, filename.indexOf(".")) // Remove file ending
            image.setAttribute('data-file-name', filename)
        } catch (error) {
            console.error('Error obtaining filename for image:', error)
            image.setAttribute('data-file-name', 'Image ' + (globalFilesCount + 1))
        }
        // Load image
        image.onload = async function () {
            console.log('Loaded image URL: ' + url)
            // Save image to originals container
            document.getElementById('photostack-original-container').appendChild(image)
            // Increase image counter
            increaseImageCount(1)
            // Generate preview
            await renderPreviewCanvas()
            // Hide toast
            importToast.hide()
        }
        image.onerror = function () {
            alert('Could not import image: ' + url)
            // Hide toast
            setTimeout(function () {
                importToast.hide()
            }, 1000)
        }
    }
    addImageToCanvas(url)
}

// Add image from Dropbox
function importDropboxImage() {
    // Set configuration for file picker
    options = {
        success: function (files) {
            // Send each URL to importWebImage function
            files.forEach(function (file) {
                importWebImage(file.link)
            })
        },
        linkType: "direct",
        multiselect: true,
        extensions: ['images'],
        folderselect: false
    }
    Dropbox.choose(options)
}

// Clear all imported images and reset preview box
function clearImportedImages() {
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
    document.getElementById('photostack-editor-preview').innerHTML = '<p><br />A preview of your settings will appear here once you import some images.</p>'
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
    var canvasPromises = $.map(originals, function (original) {
        return new Promise(async function (resolve) {
            // Create canvas element
            var canvas = document.createElement('canvas')
            // Add canvas element to canvas container
            canvasContainer.appendChild(canvas)
            canvas.width = original.naturalWidth
            canvas.height = original.naturalHeight
            canvas.setAttribute('data-file-name', original.getAttribute('data-file-name'))
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
        var promises = $.map(canvases, function (canvas) {
            return new Promise(function (resolve) {
                canvas.toBlob(function (blob) {
                    resolve([blob, canvas.getAttribute('data-file-name')])
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
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'Export',
                        eventAction: 'Export via File System API',
                    })
                    // Ask for export directory
                    var directory = await window.showDirectoryPicker()
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
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'Export',
                        eventAction: 'Export via Web Share API',
                    })
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
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'Export',
                    eventAction: 'Export as individual files',
                })
                files.forEach(function (file) {
                    saveAs(file)
                })
            })
            // Download as ZIP
            document.getElementById('photostack-export-zip-button').addEventListener('click', function () {
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'Export',
                    eventAction: 'Export as ZIP',
                })
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
$('#photostack-export-modal').on('hidden.bs.modal', function (e) {
    // Clear event listeners
    $('#photostack-export-web-share-button').replaceWith($('#photostack-export-web-share-button').clone())
    $('#photostack-export-separate-button').replaceWith($('#photostack-export-separate-button').clone())
    $('#photostack-export-filesystem-api-button').replaceWith($('#photostack-export-filesystem-api-button').clone())
    $('#photostack-export-zip-button').replaceWith($('#photostack-export-zip-button').clone())
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

// Remove image formats from Export card that aren't supported
if (!Modernizr.todataurljpeg) {
    var option = document.querySelector('#photostack-file-format option[value="image/jpeg"]')
    option.setAttribute('disabled', true)
}
if (!Modernizr.todataurlwebp) {
    var option = document.querySelector('#photostack-file-format option[value="image/webp"]')
    option.setAttribute('disabled', true)
}

// Allow WebP imports if the image format is supported
Modernizr.on('webp', function (result) {
    if (result) {
        var formats = document.getElementById('photostack-import-file').getAttribute('accept')
        // Main editor image picker
        document.getElementById('photostack-import-file').setAttribute('accept', formats + ',image/webp')
        // Watermark editor image picker
        document.getElementById('photostack-watermark-import-image').setAttribute('accept', formats + ',image/webp')
    }
})

// Allow AVIF imports if the image format is supported
var testAVIF = new Image()
testAVIF.onload = function () {
    var formats = document.getElementById('photostack-import-file').getAttribute('accept')
    // Main editor image picker
    document.getElementById('photostack-import-file').setAttribute('accept', formats + ',image/avif')
    // Watermark editor image picker
    document.getElementById('photostack-watermark-import-image').setAttribute('accept', formats + ',image/avif')
    // Add class to <html> tag like Modernizr
    document.getElementsByTagName('html')[0].classList.add('avif')
}
testAVIF.setAttribute('src', 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=')

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

// Show credits
fetch('https://corbin.io/supporters.json')
    .then(function (response) {
        response.json().then(function (data) {
            var creditsList = ''
            for (var i = 0; i < data['supporters'].length; i++) {
                creditsList += data['supporters'][i] + ', '
            }
            creditsList = creditsList.substring(0, creditsList.length - 2)
            document.getElementById('photostack-credits').innerText = creditsList
        })
    })
    .catch(function (err) {
        document.getElementById('photostack-credits').innerText = 'There was an error fetching PhotoStack supporters.'
    })

// Append event listeners to buttons and other elements

document.querySelectorAll('.photostack-clear-images-btn').forEach(function (el) {
    el.addEventListener('click', function () {
        clearImportedImages()
    })
})

document.querySelectorAll('.photostack-import-file-btn').forEach(function (el) {
    el.addEventListener('click', function () {
        ga('send', {
            hitType: 'event',
            eventCategory: 'Import',
            eventAction: 'Import local files'
        })
        $('#photostack-import-file').click()
    })
})

document.getElementById('photostack-import-file').addEventListener('change', function () {
    importFiles(this.files, this)
})

document.querySelector('.photostack-import-dropbox-btn').addEventListener('click', function () {
    if (!Dropbox.isBrowserSupported()) {
        alert('Sorry, Dropbox does not support your web browser.')
    } else if (!navigator.onLine) {
        alert('You are not connected to the internet. Connect to the internet and try again.')
    } else {
        ga('send', {
            hitType: 'event',
            eventCategory: 'Import',
            eventAction: 'Import from Dropbox'
        })
        importDropboxImage()
    }
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

document.getElementById('photostack-watermark-import-btn').addEventListener('click', function () {
    $('#photostack-watermark-file-import').click()
})

document.getElementById('photostack-watermark-file-import').addEventListener('change', function () {
    importWatermarkSettings(this)
})

// Drag and drop file upload

const dragModal = new bootstrap.Modal(document.getElementById('photostack-drag-modal'))

document.body.addEventListener('dragenter', function (e) {
    console.log('Drag enter detected')
    dragModal.show()
})

document.body.addEventListener('dragleave', function (e) {
    console.log('Drag leave detected')
    dragModal.hide()
})

document.body.addEventListener('drop', function (e) {
    dragModal.hide()
    var files = e.dataTransfer.files
    importFiles(files)
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
refreshWatermarks()

// Keyboard shortcuts

$(document).bind('keyup', 'shift+o', function () {
    if (!document.querySelectorAll('.modal.show').length) { // Make sure no modals are open
        $('#photostack-import-file').click()
    }
})

$(document).bind('keyup', 'shift+d', function () {
    if (!document.querySelectorAll('.modal.show').length) { // Make sure no modals are open
        if (!Dropbox.isBrowserSupported()) {
            alert('Sorry, Dropbox does not support your web browser.')
        } else if (!navigator.onLine) {
            alert('You are not connected to the internet. Connect to the internet and try again.')
        } else {
            try {
                importDropboxImage()
            } catch {
                // Ask user to allow popups
                if (document.getElementsByTagName('html')[0].classList.contains('photostack-android')) {
                    alert('This keyboard shortcut does not work on your device.')
                } else {
                    alert('Your browser is blocking popups. Please allow popups for the Dropbox keyboard shortcut to work.')
                }
            }
        }
    }
})

$(document).bind('keyup', 'shift+x', function () {
    // Make sure no modals are open and at least one image is imported
    if ((!document.querySelectorAll('.modal.show').length) && (globalFilesCount > 0)) {
        if (confirm('Do you want to clear all imported images?')) {
            clearImportedImages()
        }
    }
})

$(document).bind('keyup', 'shift+e', function () {
    // Make sure no modals are open and at least one image is imported
    if ((!document.querySelectorAll('.modal.show').length) && (globalFilesCount > 0)) {
        $('#photostack-export-modal').modal('show')
    }
})

$(document).bind('keyup', 'shift+w', function () {
    if (!document.querySelectorAll('.modal.show').length) { // Make sure no modals are open
        $('#photostack-watermark-manager-modal').modal('show')
    }
})

// Show welcome page on first run
SettingsStore.getItem('welcome-completed').then(function (value) {
    if (localStorage.getItem('welcome-editor') === 'true') {
        // Migrate older variable from localStorage
        SettingsStore.setItem('welcome-completed', 'true')
        localStorage.removeItem('welcome-editor')
    } else if (!value) {
        $('#photostack-welcome-modal').modal('show')
        // Don't show welcome screen again after it is exited
        $('#photostack-welcome-modal').on('hidden.bs.modal', function () {
            SettingsStore.setItem('welcome-completed', 'true')
        })
    }
})

// Android app and Web Manifest shortcuts
window.addEventListener('load', function () {
    if (currentUrl.searchParams.get('open_watermarks')) {
        $('#photostack-watermark-manager-modal').modal('show')
    } else if (currentUrl.searchParams.get('open_import')) {
        $('#photostack-import-modal').modal('show')
    }
})

/*
 
    WATERMARKS
 
*/

const watermarkEditor = document.getElementById('photostack-watermark-editor-modal')

// Render canvas of first image, apply settings, and show a preview
async function renderWatermarkPreviewCanvas(watermarkObject = null) {
    // Create white preview window for watermark
    var canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    canvas.getContext('2d').fillStyle = '#FFFFFF'
    canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height)
    // Apply settings
    canvas = await applyCanvasSettings(canvas, {
        // Image
        image: watermarkEditor.getAttribute('data-image'),
        // Size
        size: watermarkEditor.querySelector('#photostack-watermark-size').value,
        // Opacity
        opacity: parseInt(watermarkEditor.querySelector('#photostack-watermark-opacity').value),
        // Horizontal inset
        horizontalInset: parseInt(watermarkEditor.querySelector('#photostack-watermark-horizontal-inset').value),
        // Vertical inset
        veritcalInset: parseInt(watermarkEditor.querySelector('#photostack-watermark-vertical-inset').value),
        // Anchor position
        anchorPosition: parseInt(watermarkEditor.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-', ''))
    })
    // Add preview to window
    var previewImage = document.getElementById('photostack-watermark-editor-preview')
    previewImage.setAttribute('src', canvas.toDataURL())
}

// Open watermark in watermark editor
function openWatermarkEditor(watermarkKey) {
    // Add data to modal before opening
    watermarkEditor.querySelector('#photostack-watermark-editor-modal-title').innerText = watermarkKey
    watermarkEditor.setAttribute('data-watermark', watermarkKey)
    watermarksStore.getItem(watermarkKey).then(function (watermarkObj) {
        // Set image
        watermarkEditor.setAttribute('data-image', watermarkObj.image)
        // Set size in UI
        watermarkEditor.querySelector('#photostack-watermark-size').value = watermarkObj.size
        // Set opacity in UI
        watermarkEditor.querySelector('#photostack-watermark-opacity').value = watermarkObj.opacity
        // Set horizontal inset in UI
        watermarkEditor.querySelector('#photostack-watermark-horizontal-inset').value = parseInt(watermarkObj.horizontalInset)
        // Set vertical inset in UI
        watermarkEditor.querySelector('#photostack-watermark-vertical-inset').value = parseInt(watermarkObj.veritcalInset)
        // Clear .btn-primary style from the currently-active anchor position
        var oldAnchor = watermarkEditor.querySelector('.photostack-anchor-btn.btn-primary')
        oldAnchor.classList.remove('btn-primary')
        oldAnchor.classList.add('btn-secondary')
        // Add .btn-primary style to the correct value
        var newAnchor = watermarkEditor.querySelector('#photostack-watermark-pos-' + watermarkObj.anchorPosition)
        newAnchor.classList.remove('btn-secondary')
        newAnchor.classList.add('btn-primary')
        // Render preview image
        renderWatermarkPreviewCanvas()
        // Open the modal
        $('#photostack-watermark-manager-modal').modal('hide')
        $('#photostack-watermark-editor-modal').modal('show')
    }).catch(function (err) {
        alert('Error: ' + err)
    })
}

// Watermark editor event listeners

watermarkEditor.querySelector('#photostack-watermark-editor-image-btn').addEventListener('click', function () {
    $('#photostack-watermark-import-image').click()
})

watermarkEditor.querySelector('#photostack-watermark-import-image').addEventListener('change', function () {
    var image = document.createElement('img')
    var reader = new FileReader()
    // Set the image source to the reader result, once the reader is done
    reader.onload = function () {
        image.src = reader.result
    }
    reader.onerror = function (err) {
        alert('Error: ' + err)
    }
    // Once both the reader and image is done, we can safely add it to the originals container and clean up
    image.onload = function () {
        // Save image to watermark editor
        watermarkEditor.setAttribute('data-image', image.src)
        // Render preview again
        renderWatermarkPreviewCanvas()
        // Clear file select
        this.value = ''
    }
    reader.readAsDataURL(this.files[0])
})

watermarkEditor.querySelector('#photostack-watermark-size').addEventListener('change', function () {
    renderWatermarkPreviewCanvas()
})

watermarkEditor.querySelector('#photostack-watermark-opacity').addEventListener('change', function () {
    renderWatermarkPreviewCanvas()
})

watermarkEditor.querySelector('#photostack-watermark-horizontal-inset').addEventListener('change', function () {
    renderWatermarkPreviewCanvas()
})

watermarkEditor.querySelector('#photostack-watermark-vertical-inset').addEventListener('change', function () {
    renderWatermarkPreviewCanvas()
})

watermarkEditor.querySelectorAll('.photostack-anchor-btn').forEach(function (button) {
    button.addEventListener('click', function () {
        // Clear .btn-primary style from the currently-active button
        var previousButton = watermarkEditor.querySelector('.photostack-anchor-btn.btn-primary')
        previousButton.classList.remove('btn-primary')
        previousButton.classList.add('btn-secondary')
        // Add .btn-primary style to the button that was just clicked
        button.classList.remove('btn-secondary')
        button.classList.add('btn-primary')
        renderWatermarkPreviewCanvas()
    })
})

watermarkEditor.querySelector('#photostack-watermark-editor-save-btn').addEventListener('click', function () {
    var currentWatermark = watermarkEditor.getAttribute('data-watermark')
    // Save watermark back to storage
    watermarksStore.setItem(currentWatermark, {
        // Image
        image: watermarkEditor.getAttribute('data-image'),
        // Size
        size: watermarkEditor.querySelector('#photostack-watermark-size').value,
        // Opacity
        opacity: parseInt(watermarkEditor.querySelector('#photostack-watermark-opacity').value),
        // Horizontal inset
        horizontalInset: parseInt(watermarkEditor.querySelector('#photostack-watermark-horizontal-inset').value),
        // Vertical inset
        veritcalInset: parseInt(watermarkEditor.querySelector('#photostack-watermark-vertical-inset').value),
        // Anchor position
        anchorPosition: parseInt(watermarkEditor.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-', ''))
    }).then(function (value) {
        // Close modal once saved
        $('#photostack-watermark-editor-modal').modal('hide')
    }).catch(function (err) {
        alert('Error: ' + err)
    })
})

// Export watermark to JSON file
function exportWatermark(watermarkKey) {
    watermarksStore.getItem(watermarkKey).then(function (value) {
        var watermarkText = JSON.stringify(value)
        var fileName = watermarkKey + ".json"
        var blob = new Blob([watermarkText], { type: 'application/json;charset=utf-8' })
        saveAs(blob, fileName)
    }).catch(function (err) {
        alert('Error: ' + err)
    })
}

// Delete watermark from storage
function deleteWatermark(watermarkKey) {
    if (confirm('Are you sure you want to delete the watermark "' + watermarkKey + '"? This cannot be undone.')) {
        watermarksStore.removeItem(watermarkKey).then(function () {
            refreshWatermarks()
        }).catch(function (err) {
            alert('Error: ' + err)
        })
    }
}

// Import watermark from JSON file
function importWatermarkSettings(el) {
    // Create a promise for each file
    var importPromises = $.map(el.files, function (file) {
        return new Promise(function (resolve) {
            // Read the file
            var reader = new FileReader()
            reader.onload = function () {
                // Make sure file is valid JSON
                try {
                    var watermarkObj = JSON.parse(reader.result)
                } catch (err) {
                    alert('Error: ' + err)
                    return resolve()
                }
                // Add watermark to watermarksStore
                var watermarkName = file.name.replace('.json', '')
                watermarksStore.setItem(watermarkName, watermarkObj).then(function () {
                    resolve()
                }).catch(function (err) {
                    alert('Error: ' + err)
                    return resolve()
                })
            }
            reader.onerror = function (event) {
                alert('Error: ' + event)
                return resolve()
            }
            reader.readAsText(file)
        })
    })
    // When all promises are returned, clean up
    Promise.all(importPromises).then(function () {
        // Clear file select
        document.getElementById('photostack-watermark-file-import').value = ''
        // Refresh watermarks
        refreshWatermarks()
    })
}

async function refreshWatermarks() {
    // Reset lists
    document.getElementById('photostack-watermark-select').innerHTML = '<option selected="" value="no-watermark">No watermark</option>'
    document.getElementById('photostack-watermark-manager-list').innerHTML = ''
    // Add watermarks to editor dropdown menu and watermark manager
    await watermarksStore.iterate(function (value, key, iterationNumber) {
        // Add watermark to select menu
        var option = document.createElement('option')
        option.innerText = key
        option.value = key
        document.getElementById('photostack-watermark-select').appendChild(option)
        // Add watermark to manager modal list
        var listItem = document.createElement('div')
        listItem.classList.add('list-group-item')
        var itemTitle = document.createElement('h5')
        itemTitle.innerText = key
        listItem.appendChild(itemTitle)
        // Add button container to list
        var buttons = document.createElement('div')
        buttons.classList.add('btn-group', 'w-100')
        buttons.setAttribute('role', 'group')
        listItem.appendChild(buttons)
        // Add edit button
        var editBtn = document.createElement('button')
        editBtn.innerText = 'Edit'
        editBtn.classList.add('btn', 'btn-primary', 'btn-sm')
        editBtn.addEventListener('click', function () {
            openWatermarkEditor(key)
        })
        buttons.appendChild(editBtn)
        // Add export button
        var exportBtn = document.createElement('button')
        exportBtn.innerText = 'Export'
        exportBtn.classList.add('btn', 'btn-secondary', 'btn-sm')
        exportBtn.addEventListener('click', function () {
            exportWatermark(key)
        })
        buttons.appendChild(exportBtn)
        // Add delete button
        var deleteBtn = document.createElement('button')
        deleteBtn.innerText = 'Delete'
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm')
        deleteBtn.addEventListener('click', function () {
            deleteWatermark(key)
        })
        buttons.appendChild(deleteBtn)
        // Add everything to the list
        document.getElementById('photostack-watermark-manager-list').appendChild(listItem)
        console.log('Loaded watermark:', [key, value])
    })
}

document.getElementById('photostack-watermark-new-btn').addEventListener('click', function () {
    var name = prompt('What do you want to call the watermark?')
    if (name && (name != '')) {
        // Create new watermark in storage
        watermarksStore.setItem(name, {
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABmJLR0QA/wAAAAAzJ3zzAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AEKFxkQjAI2aQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAALSURBVAjXY2AAAgAABQAB4iYFmwAAAABJRU5ErkJggg==', // 1x1 transparent PNG
            size: 30,
            opacity: 50,
            horizontalInset: 0,
            veritcalInset: 0,
            anchorPosition: 5
        }).then(function () {
            openWatermarkEditor(name)
            refreshWatermarks()
        }).catch(function (err) {
            alert('Error: ' + err)
        })
    }
})