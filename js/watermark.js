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

renderPreviewCanvas()