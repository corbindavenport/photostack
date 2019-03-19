// Global image configuration
var config = {

}

// Render images and add previews to image container
function renderPeviews() {
    var container = document.getElementById('image-container')
    // Delete existing content and add loading spinner
    container.innerHTML = '<div class="text-center" id="temporary-image-loading"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></div>'
    // Create image of each canvas and add them to image container
    var originals = document.querySelectorAll('#photostack-originals canvas')
    originals.forEach(function (canvas) {
        // Create card container
        var card = document.createElement('div')
        card.classList.add('card')
        // Create image element
        var image = document.createElement('img')
        image.setAttribute('src', canvas.toDataURL('image/png'))
        card.appendChild(image)
        // Add filename to bottom of card
        var footer = document.createElement('div')
        footer.classList.add('card-footer')
        footer.classList.add('text-center')
        footer.textContent = canvas.getAttribute('data-filename')
        card.append(footer)
        // Add card to image container
        container.appendChild(card)
    })
    // Remove spinner when complete
    container.removeChild(document.getElementById('temporary-image-loading'))
}

// Add image from URL
document.getElementById('button-import-url').addEventListener('click', function () {
    // Get image URL
    var url = document.getElementById('photostack-import-url').value
    // Create canvas
    var canvas = document.createElement('canvas')
    var filename = url.substring(url.lastIndexOf('/') + 1)
    canvas.setAttribute('data-filename', filename)
    // Add canvas element to photos container
    document.getElementById('photostack-originals').appendChild(canvas)
    // Get image
    function addImageToCanvas(url) {
        var image = new Image()
        image.crossOrigin = 'anonymous'
        image.src = url
        image.onload = function () {
            console.log('Loaded image URL: ' + url)
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            canvas.getContext('2d').drawImage(image, 0, 0)
            // Render previews
            renderPeviews()
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