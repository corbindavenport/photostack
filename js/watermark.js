// Create new blank watermark from initial HTML values
var globalWatermark = {
    image: '',
    size: parseInt(document.getElementById('photostack-watermark-size').value),
    opacity: parseInt(document.getElementById('photostack-watermark-opacity').value),
    horizontalInset: parseInt(document.getElementById('photostack-watermark-horizontal-inset').value),
    veritcalInset: parseInt(document.getElementById('photostack-watermark-vertical-inset').value),
    anchorPosition: parseInt(document.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-',''))
}
console.log('Default watermark:', globalWatermark)

// Update globalWatermark with current HTML values
function updateGlobalWatermark() {
    // Size
    globalWatermark.size = document.getElementById('photostack-watermark-size').value
    // Opacity
    globalWatermark.opacity = document.getElementById('photostack-watermark-opacity').value
    // Horizontal inset
    globalWatermark.horizontalInset = document.getElementById('photostack-watermark-horizontal-inset').value
    // Vertical inset
    globalWatermark.veritcalInset = document.getElementById('photostack-watermark-vertical-inset').value
    // Anchor position
    globalWatermark.anchorPosition = parseInt(document.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-',''))
    // Display new settings in console
    console.log('Current watermark:', globalWatermark)
}

// Save current settings as watermark
function saveWatermark() {
    var watermarkName = prompt('Enter name for watermark:')
    if (watermarkName != null || watermarkName != '') {
        // Save to localStorage
        localStorage['Watermark: ' + watermarkName] = JSON.stringify(globalWatermark)
        alert('Saved!')
    }
}

// Load selected watermark from localStorage
function loadWatermark() {
    var select = document.getElementById('photostack-watermark-select').value
    var selectedWatermark = localStorage.key(selectedWatermark)
    var watermarkObj = JSON.parse(localStorage[selectedWatermark])
    console.log('Loading watermark:', watermarkObj)
    // TODO: Validate input
    globalWatermark = watermarkObj
    // Set size in UI
    document.getElementById('photostack-watermark-size').value = globalWatermark.size
    // Set opacity in UI
    document.getElementById('photostack-watermark-opacity').value = globalWatermark.opacity
    // Set horizontal inset in UI
    document.getElementById('photostack-watermark-horizontal-inset').value = globalWatermark.horizontalInset
    // Set vertical inset in UI
    document.getElementById('photostack-watermark-vertical-inset').value = globalWatermark.veritcalInset
    // Clear .btn-primary style from the currently-active anchor position
    var oldAnchor = document.querySelector('.photostack-anchor-btn.btn-primary')
    oldAnchor.classList.remove('btn-primary')
    oldAnchor.classList.add('btn-secondary')
    // Add .btn-primary style to the correct value
    var newAnchor = document.getElementById('photostack-watermark-pos-' + globalWatermark.anchorPosition)
    newAnchor.classList.remove('btn-secondary')
    newAnchor.classList.add('btn-primary')
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
document.getElementById('photostack-watermark-select').addEventListener('change', function() {
    loadWatermark()
})

// Update globalWatemark when input changes
document.getElementById('photostack-watermark-size').addEventListener('change', function() {
    updateGlobalWatermark()
})
document.getElementById('photostack-watermark-opacity').addEventListener('change', function() {
    updateGlobalWatermark()
})
document.getElementById('photostack-watermark-horizontal-inset').addEventListener('change', function() {
    updateGlobalWatermark()
})
document.getElementById('photostack-watermark-vertical-inset').addEventListener('change', function() {
    updateGlobalWatermark()
})
document.querySelectorAll('.photostack-anchor-btn').forEach(function(button) {
    button.addEventListener('click', function() {
        // Clear .btn-primary style from the currently-active button
        var previousButton = document.querySelector('.photostack-anchor-btn.btn-primary')
        previousButton.classList.remove('btn-primary')
        previousButton.classList.add('btn-secondary')
        // Add .btn-primary style to the button that was just clicked
        button.classList.remove('btn-secondary')
        button.classList.add('btn-primary')
        updateGlobalWatermark()
    })
})

// Watermark selector
document.getElementById('photostack-save-watermark').addEventListener('click', function() {
    saveWatermark()
})
document.getElementById('photostack-delete-watermark').addEventListener('click', function() {
    alert('Not implemented yet!')
})

renderPreviewCanvas()