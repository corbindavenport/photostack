// Legacy export function for older browsers
function legacyExport() {
    // Start timer
    console.time('Legacy export')
    // Set variables
    var imgFormat = document.getElementById('photostack-export-format').value
    var imgQuality = parseInt(document.getElementById('photostack-export-quality').value) / 100
    var imgNamePattern = document.getElementById('photostack-name-pattern').value
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
    var imgFormat = document.getElementById('photostack-export-format').value
    var imgQuality = parseInt(document.getElementById('photostack-export-quality').value) / 100
    var imgNamePattern = document.getElementById('photostack-name-pattern').value
    if (imgNamePattern === '') {
        imgNamePattern = 'image'
    }
    var imgCount = document.querySelectorAll('#photostack-original-container img').length
    var progressStep = 100 / imgCount
    // Switch modal content to progress indicator
    document.querySelector('.photostack-export-modal-initial').style.display = 'none'
    // Use jQuery's show() so the progress bar is fully displayed before the image processing begins
    $('.photostack-export-modal-loading').show('fast', function () {
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
                    files.push([fileName, blob])
                    // Add to ZIP file
                    zip.file(fileName, blob, { blob: true })
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
                        // Download files separately
                        document.getElementById('photostack-export-separate-button').addEventListener('click', function () {
                            // Grab files from the Dropbox object because it's easy
                            files.forEach(function (file) {
                                // First array item is file name, second item is the data URL
                                saveAs(file[1], file[0])
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
    })
}

function updateSampleFileNames() {
    var text = document.getElementById('photostack-name-pattern').value
    if (text === '') {
        text = 'vacation'
    }
    document.querySelectorAll('.photostack-name-pattern-demo').forEach(function (el) {
        el.textContent = text
    })
}

// Remove image formats from export dialog that aren't supported
if (!Modernizr.todataurljpeg) {
    var option = document.querySelector('#photostack-export-format option[value="image/jpeg"]')
    option.setAttribute('disabled', true)
}
if (!Modernizr.todataurlwebp) {
    var option = document.querySelector('#photostack-export-format option[value="image/webp"]')
    option.setAttribute('disabled', true)
}

// Show name pattern example in real-time
document.getElementById('photostack-name-pattern').addEventListener('keyup', function () {
    updateSampleFileNames()
})

// Export button in modal
document.getElementById('photostack-export-zip-btn').addEventListener('click', function () {
    if (Modernizr.promises) {
        asyncExport()
    } else {
        legacyExport()
    }
})

// Reset modal content when the close button is clicked
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

// Update sample file names when the page is loaded
updateSampleFileNames()