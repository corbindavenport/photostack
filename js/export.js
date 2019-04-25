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
    document.querySelector('.photostack-export-modal-loading').style.display = 'block'
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
    // Add canvases to ZIP
    var zip = new JSZip()
    var canvases = document.querySelectorAll('#photostack-canvas-container canvas')
    canvases.forEach(function (canvas, i) {
        var canvasData = canvas.toDataURL(imgFormat)
        // JSZip requires the base64 part of the string to be removed
        canvasData = canvasData.replace('data:' + imgFormat + ';base64,', '')
        // Give name to file
        if (imgFormat === 'image/jpeg') {
            var fileEnding = '.jpg'
        } else if (imgFormat === 'image/png') {
            var fileEnding = '.png'
        } else if (imgFormat === 'image/webp') {
            var fileEnding = '.webp'
        }
        var fileName = imgNamePattern + ' ' + i + fileEnding
        zip.file(fileName, canvasData, { base64: true });
        // Update progress bar
        var width = progressStep * (i + 1)
        document.getElementById('photostack-zip-progress').style.width = width + '%'
    })
    // Generate zip
    console.log('Generating zip...')
    zip.generateAsync({ type: 'blob' })
        .then(function (content) {
            // Switch modal content to finished result
            document.querySelector('.photostack-export-modal-loading').style.display = 'none'
            document.querySelector('.photostack-export-modal-finished').style.display = 'block'
            // Download file when Download button is clicked
            document.getElementById('photostack-export-download-zip-button').addEventListener('click', function() {
                saveAs(content, 'images.zip')
            })
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
    var text = document.getElementById('photostack-name-pattern').value
    if (text === '') {
        text = 'vacation'
    }
    document.querySelectorAll('.photostack-name-pattern-demo').forEach(function (el) {
        el.textContent = text
    })
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
})