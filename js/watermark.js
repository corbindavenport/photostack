// Create new blank watermark from initial HTML values
var globalWatermark = {
    image: '',
    size: parseInt(document.getElementById('photostack-watermark-size').value),
    opacity: parseInt(document.getElementById('photostack-watermark-opacity').value),
    horizontalInset: parseInt(document.getElementById('photostack-watermark-horizontal-inset').value) - 50,
    veritcalInset: parseInt(document.getElementById('photostack-watermark-vertical-inset').value) - 50,
    anchorPosition: parseInt(document.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-', ''))
}
console.log('Default watermark:', globalWatermark)

// Update globalWatermark with current HTML values
function updateGlobalWatermark() {
    // Size
    globalWatermark.size = document.getElementById('photostack-watermark-size').value
    // Opacity
    globalWatermark.opacity = parseInt(document.getElementById('photostack-watermark-opacity').value)
    // Horizontal inset
    globalWatermark.horizontalInset = parseInt(document.getElementById('photostack-watermark-horizontal-inset').value)
    // Vertical inset
    globalWatermark.veritcalInset = parseInt(document.getElementById('photostack-watermark-vertical-inset').value)
    // Anchor position
    globalWatermark.anchorPosition = parseInt(document.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-', ''))
}

// Save current settings as watermark
function saveWatermark() {
    var watermarkName = prompt('Enter name for watermark:')
    if (watermarkName != null && watermarkName != '') {
        // Save to localStorage
        localStorage['Watermark: ' + watermarkName] = JSON.stringify(globalWatermark)
        alert('Saved!')
    } else {
        alert('Watermark name cannot be blank!')
    }
}

// Delete selected watermark
function deleteWatermark(id) {
    var selectedWatermark = localStorage.key(id)
    var watermarkName = selectedWatermark.replace('Watermark: ', '')
    var watermarkObj = JSON.parse(localStorage[selectedWatermark])
    if (confirm('Are you sure you want to delete the watermark "' + watermarkName + '"? This cannot be undone.')) {
        localStorage.removeItem(selectedWatermark)
        alert('Watermark deleted.')
    }
}

// Load selected watermark from localStorage
function loadWatermark(id) {
    var selectedWatermark = localStorage.key(id)
    var watermarkObj = JSON.parse(localStorage[selectedWatermark])
    console.log('Loading watermark:', watermarkObj)
    // TODO: Validate input
    globalWatermark = watermarkObj
    // Set size in UI
    document.getElementById('photostack-watermark-size').value = globalWatermark.size
    // Set opacity in UI
    document.getElementById('photostack-watermark-opacity').value = globalWatermark.opacity
    // Set horizontal inset in UI
    document.getElementById('photostack-watermark-horizontal-inset').value = parseInt(globalWatermark.horizontalInset)
    // Set vertical inset in UI
    document.getElementById('photostack-watermark-vertical-inset').value = parseInt(globalWatermark.veritcalInset)
    // Clear .btn-primary style from the currently-active anchor position
    var oldAnchor = document.querySelector('.photostack-anchor-btn.btn-primary')
    oldAnchor.classList.remove('btn-primary')
    oldAnchor.classList.add('btn-secondary')
    // Add .btn-primary style to the correct value
    var newAnchor = document.getElementById('photostack-watermark-pos-' + globalWatermark.anchorPosition)
    newAnchor.classList.remove('btn-secondary')
    newAnchor.classList.add('btn-primary')
    // Generate preview
    renderPreviewCanvas()
}

// Add image from local file
function importLocalImage(file) {
    // Make sure image file is less than 1MB
    if (file.size > 1048576) {
        alert('Watermark must be under 1MB!')
        return
    }
    // Disable file picker while import is in progress
    document.getElementById('photostack-import-file').disabled = true
    document.querySelector('label[for="photostack-import-file"]').textContent = 'Importing images...'
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
        // Save image to globalWatermark
        globalWatermark.image = image.src
        // Regenerate preview
        renderPreviewCanvas()
    }
    reader.readAsDataURL(file)
    // Clear file select
    document.getElementById('photostack-import-file').value = ''
    // Re-enable file picker
    document.getElementById('photostack-import-file').disabled = false
    document.querySelector('label[for="photostack-import-file"]').textContent = 'Choose image file'
}

// Add image from URL
function importExternalImage(url) {
    // Get image
    function downloadExternalImage(url) {
        var image = document.createElement('img')
        image.crossOrigin = 'anonymous'
        image.src = url
        // Create canvas for converting image to Data URL
        var canvas = document.createElement("canvas")
        image.onload = function () {
            console.log('Loaded image URL: ' + url)
            // Add image to canvas
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            canvas.getContext('2d').drawImage(image, 0, 0)
            var data = canvas.toDataURL()
            // Check file size of image
            var size = new Blob([data]).size
            if (size > 1048576) {
                alert('Watermark must be under 1MB!')
            } else {
                // Save image to globalWatermark
                globalWatermark.image = data
                // Regenerate preview
                renderPreviewCanvas()
            }
        }
        image.onerror = function () {
            if (!url.includes('https://cors-anywhere.herokuapp.com/')) {
                console.log('Error loading image, trying CORS Anywhere...')
                downloadExternalImage('https://cors-anywhere.herokuapp.com/' + url)
            } else {
                alert('Could not import URL.')
            }
        }
    }
    downloadExternalImage(url)
}

// Apply current settings to a canvas
function applyWatermarkSettings(canvas, testImage) {
    // Silently return if no watermark image has been imported
    if (!globalWatermark.image) {
        return
    } else {
        console.log('Applying watermark settings to preview...')
    }
    var watermark = new Image()
    watermark.src = globalWatermark.image
    // Calculate new size of watermark
    var resizeRatio = watermark.height / watermark.width
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

// Render canvas of preview image
function renderPreviewCanvas() {
    // Find elements
    var previewImage = document.getElementById('photostack-watermark-preview')
    var canvasContainer = document.getElementById('photostack-canvas-container')
    var testImage = document.getElementById('photostack-watermark-sample')
    // Create canvas
    var canvas = document.createElement('canvas')
    // Add canvas element to canvas container
    canvas.width = testImage.naturalWidth
    canvas.height = testImage.naturalHeight
    canvas.getContext('2d').drawImage(testImage, 0, 0)
    // Apply settings
    if (globalWatermark.image) {
        applyWatermarkSettings(canvas, testImage)
    }
    // Change preview image to newly-generated image
    previewImage.setAttribute('src', canvas.toDataURL())
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

// Watermark dropdown menu and buttons
document.getElementById('photostack-watermark-select').addEventListener('change', function () {
    loadWatermark(this.value)
})
document.getElementById('photostack-save-watermark').addEventListener('click', function () {
    saveWatermark()
})
document.getElementById('photostack-delete-watermark').addEventListener('click', function () {
    deleteWatermark(document.getElementById('photostack-watermark-select').value)
})

// Local image picker
document.getElementById('photostack-import-file').addEventListener('change', function () {
    importLocalImage(this.files[0])
})

// URL image picker
document.getElementById('photostack-import-url-button').addEventListener('click', function () {
    var url = document.getElementById('photostack-import-url').value
    importExternalImage(url)
})


// Update globalWatemark when input changes
document.getElementById('photostack-watermark-size').addEventListener('change', function () {
    updateGlobalWatermark()
    renderPreviewCanvas()
})
document.getElementById('photostack-watermark-opacity').addEventListener('change', function () {
    updateGlobalWatermark()
    renderPreviewCanvas()
})
document.getElementById('photostack-watermark-horizontal-inset').addEventListener('change', function () {
    updateGlobalWatermark()
    renderPreviewCanvas()
})
document.getElementById('photostack-watermark-vertical-inset').addEventListener('change', function () {
    updateGlobalWatermark()
    renderPreviewCanvas()
})
document.querySelectorAll('.photostack-anchor-btn').forEach(function (button) {
    button.addEventListener('click', function () {
        // Clear .btn-primary style from the currently-active button
        var previousButton = document.querySelector('.photostack-anchor-btn.btn-primary')
        previousButton.classList.remove('btn-primary')
        previousButton.classList.add('btn-secondary')
        // Add .btn-primary style to the button that was just clicked
        button.classList.remove('btn-secondary')
        button.classList.add('btn-primary')
        updateGlobalWatermark()
        renderPreviewCanvas()
    })
})

// Prevent unload
window.onbeforeunload = function () {
    return 'Are you sure you want to navigate away?'
}