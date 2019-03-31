// Save current settings as watermark
function saveWatermark() {
    var watermarkName = prompt('Enter name for watermark:')
    if (watermarkName != null || watermarkName != '') {
        // Save to localStorage
        localStorage['Watermark: ' + watermarkName] = 'data:xyz'
        alert('Saved!')
    }
}

// Render canvas of preview image
function renderPreviewCanvas() {
    // Find elements
    var previewContainer = document.getElementById('photostack-preview')
    var canvasContainer = document.getElementById('photostack-canvas-container')
    var testImage = document.getElementById('photostack-watermark-sample')
    // Create loading icon
    previewContainer.innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></div>'
    // Create canvas
    var canvas = document.createElement('canvas')
    // Add canvas element to canvas container
    canvasContainer.appendChild(canvas)
    canvas.width = testImage.naturalWidth
    canvas.height = testImage.naturalHeight
    canvas.getContext('2d').drawImage(testImage, 0, 0)
    // Apply settings
    //TODO: applyCanvasSettings(canvas, testImage)
    // Create preview element
    var previewImage = document.createElement('img')
    previewImage.setAttribute('src', canvas.toDataURL())
    previewContainer.innerHTML = ''
    previewContainer.appendChild(previewImage)
}

// Watermark selecter
document.getElementById('photostack-save-watermark').addEventListener('click', function() {
    saveWatermark()
})
document.getElementById('photostack-delete-watermark').addEventListener('click', function() {
    alert('Not implemented yet!')
})

// Initialze array of watermarks
var watermarks = []

// Read watermarks from localStorage
for (var i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).includes('Watermark')) {
        // Add watermark to global variable
        watermarks.push([localStorage.key(i), localStorage.getItem(i)])
        // Add watermark to select menu
        var option = document.createElement('option')
        option.innerText = localStorage.key(i).replace('Watermark: ', '') // Remove "Watermark: " from the key name
        option.value = i
        document.getElementById('photostack-watermark-select').appendChild(option)
    }
}

renderPreviewCanvas()