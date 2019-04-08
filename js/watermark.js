// Create new blank watermark from initial HTML values
var globalWatermark = {
    image: '',
    size: parseInt(document.getElementById('photostack-watermark-size').value),
    opacity: parseInt(document.getElementById('photostack-watermark-opacity').value),
    horizontalInset: parseInt(document.getElementById('photostack-watermark-horizontal-inset').value),
    veritcalInset: parseInt(document.getElementById('photostack-watermark-vertical-inset').value),
    anchorPosition: parseInt(document.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-', ''))
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
    globalWatermark.anchorPosition = parseInt(document.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-', ''))
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
document.getElementById('photostack-watermark-select').addEventListener('change', function () {
    loadWatermark()
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
})
document.getElementById('photostack-watermark-opacity').addEventListener('change', function () {
    updateGlobalWatermark()
})
document.getElementById('photostack-watermark-horizontal-inset').addEventListener('change', function () {
    updateGlobalWatermark()
})
document.getElementById('photostack-watermark-vertical-inset').addEventListener('change', function () {
    updateGlobalWatermark()
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
    })
})

// Watermark selector
document.getElementById('photostack-save-watermark').addEventListener('click', function () {
    saveWatermark()
})
document.getElementById('photostack-delete-watermark').addEventListener('click', function () {
    alert('Not implemented yet!')
})

// Render initial preview of canvas
renderPreviewCanvas()

// Prevent unload
window.onbeforeunload = function () {
    return 'Are you sure you want to navigate away?'
}