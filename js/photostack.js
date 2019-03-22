// Global image configuration
var config = {

}

// Increase image count after imports
function increaseImageCount(number) {
    var currentCount = parseInt(document.getElementById('photostack-image-count').textContent)
    var newCount = currentCount + number
    document.getElementById('photostack-image-count').textContent = newCount
}

// Render a preview image
function renderPeview() {
    var container = document.getElementById('photostack-preview')
    var canvas = document.getElementById('photostack-canvas-container').firstChild
    // Clear existing content
    container.innerHTML = ''
    // Create image element
    var image = document.createElement('img')
    image.setAttribute('src', canvas.toDataURL())
    container.appendChild(image)
}

// Add image from local file
document.getElementById('photostack-import-file').addEventListener('change', function () {
    // Disable file picker while import is in progress
    document.getElementById('photostack-import-file').disabled = true
    document.querySelector('label[for="photostack-import-file"]').textContent = 'Importing images...'
    // Get files
    var files = document.getElementById('photostack-import-file').files
    // Add each image to originals container
    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i]
        var image = new Image()
        var reader = new FileReader()
        reader.onload = function () {
            image.src = reader.result
            // Save image to originals container
            document.getElementById('photostack-original-container').appendChild(image)
            // Create canvas element for image
            var canvas = document.createElement('canvas')
            canvas.setAttribute('data-filename', file.name)
            // Add canvas element to photos container
            document.getElementById('photostack-canvas-container').appendChild(canvas)
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            canvas.getContext('2d').drawImage(image, 0, 0)
            // Increase image counter
            increaseImageCount(1)
            // Render preview
            renderPeview()
        }
        reader.onerror = function () {
            alert('Could not import this image: ' + file.name)
        }
        reader.readAsDataURL(file)
    }
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
        var image = new Image()
        image.crossOrigin = 'anonymous'
        image.src = url
        image.onload = function () {
            console.log('Loaded image URL: ' + url)
            // Save image to originals container
            document.getElementById('photostack-original-container').appendChild(image)
            // Create canvas element for image
            var canvas = document.createElement('canvas')
            var filename = url.substring(url.lastIndexOf('/') + 1)
            canvas.setAttribute('data-filename', filename)
            // Add canvas element to photos container
            document.getElementById('photostack-canvas-container').appendChild(canvas)
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            canvas.getContext('2d').drawImage(image, 0, 0)
            // Increase image counter
            increaseImageCount(1)
            // Render previews
            renderPeview()
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