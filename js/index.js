// Increase image count after imports
function increaseImageCount(number) {
    var currentCount = parseInt(document.getElementById('photostack-image-count').textContent)
    var newCount = currentCount + number
    document.getElementById('photostack-image-count').textContent = newCount
}

// Apply settings to a canvas
function applyCanvasSettings(canvas, originalImage) {
    // Resize image
    if (document.getElementById('photostack-image-width').value != '') {
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
}

// Render canvas of first image, apply settings, and show a preview
function renderPreviewCanvas() {
    // Silently fail if there are no images imported
    if (!document.querySelectorAll('#photostack-original-container img').length) {
        console.log('Nothing to preview.')
        return
    }
    // Find elements
    var previewContainer = document.getElementById('photostack-preview')
    var originalsContainer = document.getElementById('photostack-original-container')
    var canvasContainer = document.getElementById('photostack-canvas-container')
    // Create loading icon
    previewContainer.innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></div>'
    // Create canvas element for first imported image
    var canvas = document.createElement('canvas')
    var originalImage = originalsContainer.firstChild
    // Add canvas element to canvas container
    canvasContainer.appendChild(canvas)
    canvas.width = originalImage.naturalWidth
    canvas.height = originalImage.naturalHeight
    canvas.getContext('2d').drawImage(originalImage, 0, 0)
    // Apply settings
    applyCanvasSettings(canvas, originalImage)
    // Create image element
    var previewImage = document.createElement('img')
    previewImage.setAttribute('src', canvas.toDataURL())
    previewContainer.innerHTML = ''
    previewContainer.appendChild(previewImage)
}

// Render canvases of all images (for exporting)
function renderAllCanvas() {
    var originals = document.querySelectorAll('#photostack-original-container img')
    var canvasContainer = document.getElementById('photostack-canvas-container')
    // Clear current canvas elements
    canvasContainer.innerHTML = ''
    // Creat canvas for each original image
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
}

// Add image from local file
document.getElementById('photostack-import-file').addEventListener('change', function () {
    // Disable file picker while import is in progress
    document.getElementById('photostack-import-file').disabled = true
    document.querySelector('label[for="photostack-import-file"]').textContent = 'Importing images...'
    // Get files
    var files = document.getElementById('photostack-import-file').files
    console.log('Number of files selected: ' + files.length)
    var filesImported = 0
    // Add each image to originals container
    Array.prototype.forEach.call(files, function (file) {
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
        }
        reader.readAsDataURL(file)
    })
    // Clear file select
    document.getElementById('photostack-import-file').value = ''
    // Re-enable file picker
    document.getElementById('photostack-import-file').disabled = false
    document.querySelector('label[for="photostack-import-file"]').textContent = 'Choose image file'
})

// Add image from URL
document.getElementById('photostack-import-url-button').addEventListener('click', function () {
    // Get image URL
    var url = document.getElementById('photostack-import-url').value
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
})

// Export images
document.getElementById('photostack-export-button').addEventListener('click', function () {
    var zip = new JSZip()
    // Create data URL for each canvas element and add it to zip
    renderAllCanvas()
    var canvases = document.querySelectorAll('#photostack-canvas-container canvas')
    canvases.forEach(function (canvas, i) {
        var canvasData = canvas.toDataURL('image/png')
        // JSZip requires the base64 part of the string to be removed
        canvasData = canvasData.replace('data:image/png;base64,', '')
        var fileName = 'image' + i + '.png'
        zip.file(fileName, canvasData, { base64: true });
        console.log('Added ' + fileName + ' to zip')
    })
    // Generate zip
    console.log('Generating zip...')
    zip.generateAsync({ type: 'blob' })
        .then(function (content) {
            saveAs(content, 'images.zip');
        })
})

// Scale image panel
document.getElementById('photostack-image-width-button').addEventListener('click', function () {
    renderPreviewCanvas()
})
document.getElementById('photostack-reset-image-width-button').addEventListener('click', function () {
    document.getElementById('photostack-image-width').value = ''
    renderPreviewCanvas()
})

// Prevent unload
window.onbeforeunload = function () {
    return 'Are you sure you want to navigate away?'
}