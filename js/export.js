// Hide native share button if unsupported by browser
if (!navigator.canShare || !navigator.canShare(data)) {
    document.getElementById('photostack-export-web-share-button').style.display = 'none'
} else {
    // Change the button name on Android to be more descriptive
    if (navigator.userAgent.includes('Android')) {
        document.getElementById('photostack-export-web-share-button').textContent = 'Share to Android app'
    }
}

// Main export function
function createZip() {
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
            var fileName = imgNamePattern + ' ' + i + fileEnding
            // Add image to dropboxOptions
            var file = JSON.parse('{"filename": "' + fileName + '", "url": "' + canvasData + '"}')
            files.push(file)
            // Add image to ZIP
            zip.file(fileName, zipData, { base64: true });
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
                    // Grab files from the Dropbox object because it's easy
                    files.forEach(function (file) {
                        saveAs(file.url, file.filename)
                    })
                })
                // Download as ZIP
                document.getElementById('photostack-export-zip-button').addEventListener('click', function () {
                    saveAs(content, 'images.zip')
                })
                // Share to native app
                document.getElementById('photostack-export-web-share-button').addEventListener('click', function () {
                    navigator.share({
                        title: 'Made with PhotoStack',
                        text: '',
                        url: 'https://photostack.app',
                        files: files
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
    createZip()
})

// Reset modal content when the close button is clicked
$('#photostack-export-modal').on('hidden.bs.modal', function (e) {
    document.querySelector('.photostack-export-modal-loading').style.display = 'none'
    document.querySelector('.photostack-export-modal-finished').style.display = 'none'
    document.querySelector('.photostack-export-modal-initial').style.display = 'block'
    document.getElementById('photostack-zip-progress').style.width = '0%'
    // Reset title
    document.title = 'PhotoStack'
})

// Update sample file names when the page is loaded
updateSampleFileNames()