var globalWatermark = {}

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
    $('#photostack-error-toast').toast('show')
}

// Increase image count after imports
function increaseImageCount(number) {
    globalFilesCount += number
    document.querySelectorAll('.photostack-image-count').forEach(function (el) {
        el.textContent = globalFilesCount.toString()
    })
    var exportBtns = document.querySelectorAll('*[data-target="#photostack-export-modal"]')
    exportBtns.forEach(function (el) {
        if ((globalFilesCount > 0) && (el.disabled)) {
            el.disabled = false
        }
    })
}

// Read URL parameters
function getUrlVars() {
    var vars = {}
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value
    })
    return vars
}

// Apply settings to a canvas
function applyCanvasSettings(canvas, originalImage) {
    // Resize image
    if (document.getElementById('photostack-image-width').value != '') {
        // Use high-quality image scaling where possible
        canvas.getContext('2d').mozImageSmoothingEnabled = true
        canvas.getContext('2d').imageSmoothingQuality = "high"
        canvas.getContext('2d').webkitImageSmoothingEnabled = true
        canvas.getContext('2d').msImageSmoothingEnabled = true
        canvas.getContext('2d').imageSmoothingEnabled = true
        // Get width
        var userWidth = parseInt(document.getElementById('photostack-image-width').value)
        // Create aspect ratio from original canvas size
        var ratio = (canvas.width / canvas.height)
        // Set new canvas size
        var canvasContent = canvas.getImageData
        canvas.width = userWidth
        canvas.height = userWidth / ratio
        // Resizing the canvas wipes its contents, so we need to re-draw the image
        canvas.getContext('2d').drawImage(originalImage, 0, 0, canvas.width, canvas.height)
    }
    // Apply watermark
    if (document.getElementById('photostack-watermark-img').hasAttribute('src')) {
        var watermark = document.getElementById('photostack-watermark-img')
        // Calculate new size of watermark
        var resizeRatio = watermark.naturalHeight / watermark.naturalWidth
        var userSize = parseInt(globalWatermark.size)
        watermark.width = canvas.width * (userSize / 100)
        watermark.height = watermark.width * resizeRatio
        // Create temporary canvas for the watermark
        var watermarkCanvas = document.createElement('canvas')
        watermarkCanvas.width = watermark.width
        watermarkCanvas.height = watermark.height
        // Set opacity
        var opacity = parseInt(globalWatermark.opacity) / 100
        watermarkCanvas.getContext('2d').globalAlpha = opacity
        // Set horiztonal and vertical insets
        var horizontalInset = canvas.width * (globalWatermark.horizontalInset / 100)
        var veritcalInset = canvas.height * (globalWatermark.veritcalInset / 100)
        // Set anchor position
        if (globalWatermark.anchorPosition === 1) {
            // Top-left alignment
            // Because the X and Y values start from the top-left, nothing happens here
        } else if (globalWatermark.anchorPosition === 2) {
            // Top-center alignment (Ignore: Horizontal)
            horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
        } else if (globalWatermark.anchorPosition === 3) {
            // Top-right alignment
            horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
        } else if (globalWatermark.anchorPosition === 4) {
            // Middle-left alignment (Ignore: Vertical)
            veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
        } else if (globalWatermark.anchorPosition === 5) {
            // Middle-center alignment (Ignore: Vertical & Horizontal)
            horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
            veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
        } else if (globalWatermark.anchorPosition === 6) {
            // Middle-right alignment (Ignore: Vertical)
            horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
            veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
        } else if (globalWatermark.anchorPosition === 7) {
            // Bottom-left alignment
            veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
        } else if (globalWatermark.anchorPosition === 8) {
            // Bottom-center alignment (Ignore: Horizontal)
            veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
            horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
        } else if (globalWatermark.anchorPosition === 9) {
            // Bottom-right alignment
            veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
            horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
        }
        // Draw completed image to temporary canvas
        watermarkCanvas.getContext('2d').drawImage(watermark, 0, 0, watermark.width, watermark.height)
        canvas.getContext('2d').drawImage(watermarkCanvas, horizontalInset, veritcalInset)
    }
}

// Render canvas of first image, apply settings, and show a preview
function renderPreviewCanvas() {
    console.log('Rendering preview...')
    // Silently fail if there are no images imported
    if (!document.querySelectorAll('#photostack-original-container img').length) {
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
    // Add canvas element to canvas container
    canvasContainer.appendChild(canvas)
    // Resize canvas to a maximum of 800 pixels wide for faster processing
    var resizeRatio = originalImage.naturalHeight / originalImage.naturalWidth
    canvas.width = 800
    canvas.height = canvas.width * resizeRatio
    canvas.getContext('2d').drawImage(originalImage, 0, 0, canvas.width, canvas.height)
    // Apply settings
    applyCanvasSettings(canvas, originalImage)
    // Create image element
    if (previewContainer.querySelector('img')) {
        previewContainer.querySelector('img').setAttribute('src', canvas.toDataURL())
    } else {
        var previewImage = document.createElement('img')
        previewImage.setAttribute('src', canvas.toDataURL())
        previewContainer.innerHTML = ''
        previewContainer.appendChild(previewImage)
    }
}

// Import images from file picker
function importLocalFiles(element) {
    // Get files
    var files = element.files
    console.log('Number of files selected: ' + files.length)
    // Add each image to originals container
    Array.prototype.forEach.call(files, function (file, index) {
        var image = document.createElement('img')
        var reader = new FileReader()
        // Set the image source to the reader result, once the reader is done
        reader.onload = function () {
            image.src = reader.result
        }
        reader.onerror = function () {
            alert('Could not import this image: ' + file.name)
        }
        // Once both the reader and image is done, we can safely add it to the originals container and clean up
        image.onload = function () {
            // Save image to originals container
            document.getElementById('photostack-original-container').appendChild(image)
            // Increase image counter
            increaseImageCount(1)
            if (index === 0) {
                renderPreviewCanvas()
            }
        }
        reader.readAsDataURL(file)
    })
    // Clear file select
    document.getElementById('photostack-import-file').value = ''
    // Close import modal if it's still open
    $('#photostack-import-modal').modal('hide')
}

// Import images from file picker
function importLocalZIP(element) {
    // Get file
    var file = element.files[0]
    // Switch modal content to progress indicator
    document.querySelector('.photostack-import-modal-initial').style.display = 'none'
    document.querySelector('.photostack-import-modal-zip').style.display = 'block'
    // Read the ZIP
    var zip = new JSZip()
    zip.loadAsync(file).then(function (zip) {
        var zipPromises = $.map(zip.files, function (file) {
            return new Promise(function (resolve) {
                // Only read files that are images, aren't directories, and aren't inside __MACOSX
                var supportedImages = (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.bmp') || (Modernizr.webp && file.name.endsWith('.webp')));
                if ((supportedImages) && (!file.dir) && (!file.name.includes('__MACOSX/'))) {
                    console.log(file)
                    // Add images to originals container
                    file.async('base64').then(function (data) {
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
                        }
                        image.src = base64
                        // Save image to originals container
                        document.getElementById('photostack-original-container').appendChild(image)
                        increaseImageCount(1)
                        resolve()
                    })
                } else {
                    resolve()
                }
            })
        })
        // Continue once all canvases are rendered
        Promise.all(zipPromises).then(function () {
            // Generate image preview if there isn't one already
            if (!(document.querySelectorAll('.photostack-editor-preview img').length)) {
                renderPreviewCanvas()
            }
            // Clear file select
            document.getElementById('photostack-import-file').value = ''
            // Close import modal if it's still open
            $('#photostack-import-modal').modal('hide')
        })
    })
}

// Add image from URL
function importWebImage(url) {
    // Get image
    function addImageToCanvas(url) {
        var image = document.createElement('img')
        image.crossOrigin = 'anonymous'
        image.src = url
        image.onload = function () {
            console.log('Loaded image URL: ' + url)
            // Save image to originals container
            document.getElementById('photostack-original-container').appendChild(image)
            // Increase image counter
            increaseImageCount(1)
            // Generate preview
            renderPreviewCanvas()
        }
        image.onerror = function () {
            if (!url.includes('https://cors-anywhere.herokuapp.com/')) {
                console.log('Error loading image, trying CORS Anywhere...')
                addImageToCanvas('https://cors-anywhere.herokuapp.com/' + url)
            } else {
                alert('Could not import URL.')
            }
        }
    }
    addImageToCanvas(url)
    // Close import modal if it's still open
    $('#photostack-import-modal').modal('hide')
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
            // Close import modal if it's still open
            $('#photostack-import-modal').modal('hide')
        },
        cancel: function () {
            // Close import modal if it's still open
            $('#photostack-import-modal').modal('hide')
        },
        linkType: "direct",
        multiselect: true,
        extensions: ['images'],
        folderselect: false
    }
    Dropbox.choose(options)
}

// Read watermarks from localStorage
for (var i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).includes('Watermark')) {
        // Add watermark to select menu
        var option = document.createElement('option')
        option.innerText = localStorage.key(i).replace('Watermark: ', '') // Remove "Watermark: " from the key name
        option.value = i
        document.getElementById('photostack-watermark-select').appendChild(option)
    }
}

// Load watermark from storage
document.getElementById('photostack-watermark-select').addEventListener('change', function () {
    var watermarkImg = document.getElementById('photostack-watermark-img')
    if (this.value != 'no-watermark') {
        var selectedWatermark = localStorage.key(this.value)
        var watermarkObj = JSON.parse(localStorage[selectedWatermark])
        // TODO: Validate input
        globalWatermark = watermarkObj
        // Copy current watermark to DOM to avoid JS hangups
        watermarkImg.onload = function () {
            // Generate preview
            renderPreviewCanvas()
        }
        document.getElementById('photostack-watermark-img').setAttribute('src', watermarkObj.image)
    } else {
        // Reset watermark
        globalWatermark = {}
        // Delete current watermark image
        document.getElementById('photostack-watermark-img').removeAttribute('src')
        // Generate preview
        renderPreviewCanvas()
    }
})

// Update sample file names when text is entered in the name pattern field
function updateSampleFileNames() {
    var text = document.getElementById('photostack-file-pattern').value
    if (text === '') {
        text = 'vacation'
    }
    document.querySelectorAll('.photostack-file-pattern-demo').forEach(function (el) {
        el.textContent = text
    })
}

// Legacy export function for older browsers
function legacyExport() {
    // Start timer
    console.time('Legacy export')
    // Set variables
    var imgFormat = document.getElementById('photostack-file-format').value
    var imgQuality = parseInt(document.getElementById('photostack-file-quality').value) / 100
    var imgNamePattern = document.getElementById('photostack-file-pattern').value
    if (imgNamePattern === '') {
        imgNamePattern = 'image'
    }
    var imgCount = document.querySelectorAll('#photostack-original-container img').length
    var progressStep = 100 / imgCount
    // Switch modal content to progress indicator
    document.querySelector('.photostack-export-modal-initial').style.display = 'none'
    // Use jQuery's show() so the progress bar is fully displayed before the image processing begins
    $('.photostack-export-modal-loading').show('fast', function () {
        // Set title
        document.title = 'Photostack (0%)'
        // Start rendering canvases
        var originals = document.querySelectorAll('#photostack-original-container img')
        var canvasContainer = document.getElementById('photostack-canvas-container')
        // Clear current canvas elements
        canvasContainer.innerHTML = ''
        // Render canvas for each original image
        originals.forEach(function (original, i) {
            // Create canvas element
            var canvas = document.createElement('canvas')
            // Add canvas element to canvas container
            canvasContainer.appendChild(canvas)
            canvas.width = original.naturalWidth
            canvas.height = original.naturalHeight
            canvas.getContext('2d').drawImage(original, 0, 0)
            // Apply settings
            applyCanvasSettings(canvas, original)
        })
        // Create files object
        var files = []
        // Add canvases to ZIP and Dropbox object
        var zip = new JSZip()
        var canvases = document.querySelectorAll('#photostack-canvas-container canvas')
        canvases.forEach(function (canvas, i) {
            var canvasData = canvas.toDataURL(imgFormat, imgQuality)
            // JSZip requires the base64 part of the string to be removed
            zipData = canvasData.replace('data:' + imgFormat + ';base64,', '')
            // Give name to file
            if (imgFormat === 'image/jpeg') {
                var fileEnding = '.jpg'
            } else if (imgFormat === 'image/png') {
                var fileEnding = '.png'
            } else if (imgFormat === 'image/webp') {
                var fileEnding = '.webp'
            }
            var num = i + 1
            var fileName = imgNamePattern + ' ' + num + fileEnding
            // Add file to array
            files.push([fileName, canvasData])
            // Add image to ZIP
            zip.file(fileName, zipData, { base64: true })
            // Update progress bar and app title
            var progress = Math.ceil(progressStep * (i + 1))
            document.title = 'PhotoStack (' + progress + '%)'
            document.getElementById('photostack-zip-progress').style.width = progress + '%'
        })
        // Generate zip
        console.log('Generating zip...')
        zip.generateAsync({ type: 'blob' })
            .then(function (content) {
                // Switch modal content to finished result
                document.querySelector('.photostack-export-modal-loading').style.display = 'none'
                document.querySelector('.photostack-export-modal-finished').style.display = 'block'
                // Hide native share button because it's not compatible with the legacy export function
                document.querySelector('.photostack-web-share-btn-container').style.display = 'none'
                // Download files separately
                document.getElementById('photostack-export-separate-button').addEventListener('click', function () {
                    files.forEach(function (file) {
                        // First array item is file name, second item is the data URL
                        saveAs(file[1], file[0])
                    })
                })
                // Download as ZIP
                document.getElementById('photostack-export-zip-button').addEventListener('click', function () {
                    saveAs(content, 'images.zip')
                })
                // End timer
                console.timeEnd('Legacy export')
            })
    })
}

// Async export with Promises
function asyncExport() {
    // Start timer
    console.time('Async export')
    // Set variables
    var imgFormat = document.getElementById('photostack-file-format').value
    var imgQuality = parseInt(document.getElementById('photostack-file-quality').value) / 100
    var imgNamePattern = document.getElementById('photostack-file-pattern').value
    if (imgNamePattern === '') {
        imgNamePattern = 'image'
    }
    var imgCount = document.querySelectorAll('#photostack-original-container img').length
    // Switch modal content to progress indicator
    document.querySelector('.photostack-export-modal-initial').style.display = 'none'
    document.querySelector('.photostack-export-modal-loading').style.display = 'block'
    // Start rendering canvases
    var originals = document.querySelectorAll('#photostack-original-container img')
    var canvasContainer = document.getElementById('photostack-canvas-container')
    // Clear current canvas elements
    canvasContainer.innerHTML = ''
    // Render canvas for each original image
    var canvasPromises = $.map(originals, function (original) {
        return new Promise(function (resolve) {
            // Create canvas element
            var canvas = document.createElement('canvas')
            // Add canvas element to canvas container
            canvasContainer.appendChild(canvas)
            canvas.width = original.naturalWidth
            canvas.height = original.naturalHeight
            canvas.getContext('2d').drawImage(original, 0, 0)
            // Apply settings
            applyCanvasSettings(canvas, original)
            resolve(canvas)
        })
    })
    // Continue once all canvases are rendered
    Promise.all(canvasPromises).then(function (canvases) {
        // Create a new ZIP object
        var zip = new JSZip()
        // Create promises for final render of each image
        var promises = $.map(canvases, function (canvas) {
            return new Promise(function (resolve) {
                canvas.toBlob(resolve, imgFormat, imgQuality)
            })
        })
        // Show the final export screen when all renders are completed
        Promise.all(promises).then(function (blobs) {
            // Create final array of blobs with file names
            var files = []
            blobs.forEach(function (blob, i) {
                if (imgFormat === 'image/jpeg') {
                    var fileEnding = '.jpg'
                } else if (imgFormat === 'image/png') {
                    var fileEnding = '.png'
                } else if (imgFormat === 'image/webp') {
                    var fileEnding = '.webp'
                }
                var num = i + 1
                var fileName = imgNamePattern + ' ' + num + fileEnding
                // Add to files array
                var file = new File([blob], fileName, {
                    lastModified: Date.now(),
                    type: imgFormat
                })
                files.push(file)
                // Add to ZIP file
                zip.file(fileName, file)
            })
            // Generate zip file
            console.log('Generating zip...')
            zip.generateAsync({ type: 'blob' })
                .then(function (content) {
                    // Show badge on PWA icon
                    if ('ExperimentalBadge' in window) {
                        window.ExperimentalBadge.set()
                    }
                    // Switch modal content to finished result
                    document.querySelector('.photostack-export-modal-loading').style.display = 'none'
                    document.querySelector('.photostack-export-modal-finished').style.display = 'block'
                    // Web Share API
                    var shareData = { files: files }
                    if (navigator.canShare && navigator.canShare(shareData)) {
                        document.getElementById('photostack-export-web-share-button').addEventListener('click', function () {
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
                        $('#photostack-export-web-share-button').tooltip({
                            title: 'Your browser or platform does not support this feature.',
                        })
                    }
                    // Download files separately
                    document.getElementById('photostack-export-separate-button').addEventListener('click', function () {
                        files.forEach(function (file) {
                            saveAs(file)
                        })
                    })
                    // Download as ZIP
                    document.getElementById('photostack-export-zip-button').addEventListener('click', function () {
                        saveAs(content, 'images.zip')
                    })
                    // Stop time
                    console.timeEnd('Async export')
                })
        })
    })
}

// Export button in modal
document.getElementById('photostack-export-zip-btn').addEventListener('click', function () {
    if (Modernizr.promises) {
        asyncExport()
    } else {
        legacyExport()
    }
})

// Reset export modal content when the close button is clicked
$('#photostack-export-modal').on('hidden.bs.modal', function (e) {
    document.querySelector('.photostack-export-modal-loading').style.display = 'none'
    document.querySelector('.photostack-export-modal-finished').style.display = 'none'
    document.querySelector('.photostack-export-modal-initial').style.display = 'block'
    document.getElementById('photostack-zip-progress').style.width = '0%'
    // Reset title
    document.title = 'PhotoStack'
    // Clear PWA icon
    if ('ExperimentalBadge' in window) {
        window.ExperimentalBadge.clear()
    }
})

// Reset import modal content when the close button is clicked
$('#photostack-import-modal').on('hidden.bs.modal', function (e) {
    document.querySelector('.photostack-import-modal-zip').style.display = 'none'
    document.querySelector('.photostack-import-modal-initial').style.display = 'block'
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
Modernizr.on('webp', function(result) {
    if (result) {
        var formats = document.getElementById('photostack-import-file').getAttribute('accept')
        document.getElementById('photostack-import-file').setAttribute('accept', formats + ',image/webp')
    }
})

// Block ZIP import option from browsers that don't support Promises
if (!Modernizr.promises) {
    document.getElementById('photostack-import-zip-btn').setAttribute('disabled', 'true')
    $('#photostack-import-zip-btn').tooltip({
        title: 'Your browser does not support this feature',
    })
}

// Append event listeners to buttons and other elements

document.querySelectorAll('.photostack-import-file-btn').forEach(function (el) {
    el.addEventListener('click', function () {
        $('#photostack-import-file').click()
    })
})

document.getElementById('photostack-import-file').addEventListener('change', function () {
    importLocalFiles(this)
})

document.getElementById('photostack-import-url-button').addEventListener('click', function () {
    importWebImage(document.getElementById('photostack-import-url').value.trim())
})

document.querySelector('.photostack-import-dropbox-btn').addEventListener('click', function () {
    if (!Dropbox.isBrowserSupported()) {
        alert('Sorry, Dropbox does not support your web browser.')
    } else if (!navigator.onLine) {
        alert('You are not connected to the internet. Connect to the internet and try again.')
    } else {
        importDropboxImage()
    }
})

document.getElementById('photostack-import-zip-btn').addEventListener('click', function () {
    $('#photostack-import-zip').click()
})

document.getElementById('photostack-import-zip').addEventListener('change', function () {
    importLocalZIP(this)
})

document.getElementById('photostack-image-width-button').addEventListener('click', function () {
    renderPreviewCanvas()
})

document.getElementById('photostack-reset-image-width-button').addEventListener('click', function () {
    document.getElementById('photostack-image-width').value = ''
    renderPreviewCanvas()
})

// Show name pattern example in real-time
document.getElementById('photostack-file-pattern').addEventListener('keyup', function () {
    updateSampleFileNames()
})

// Update sample file names when the page is loaded
updateSampleFileNames()

// Show welcome page on first run
if (localStorage['welcome-editor'] != 'true') {
    $('#photostack-welcome-modal').modal('show')
    // Don't show welcome screen again after it is exited
    document.querySelector('#photostack-welcome-modal .btn-block').addEventListener('click', function () {
        localStorage['welcome-editor'] = 'true'
    })
}

// API support
// See readme.md in v1 folder for more information
if (getUrlVars()['import']) {
    // Create array of URLs to import
    var imageArray = getUrlVars()['import'].split(',')
    // Filter out empty items
    imageArray = imageArray.filter(Boolean)
    // Import the images
    imageArray.forEach(function (url) {
        importWebImage(decodeURIComponent(url))
    })
    // Remove parameters from URL
    window.history.replaceState({}, document.title, document.URL.substring(0, document.URL.indexOf('?')))
}