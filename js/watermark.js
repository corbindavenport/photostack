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
    // Hide Delete button and a right border radius from select
    $('.photostack-watermark-delete').hide()
    document.getElementById('photostack-watermark-select').setAttribute('style', 'border-radius: 0.3rem')
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
    // Make Delete button visible and delete right border radius from select
    $('.photostack-watermark-delete').show()
    document.getElementById('photostack-watermark-select').removeAttribute('style')
    // Generate preview
    renderPreviewCanvas()
}

// Export watermark to JSON file
function exportWatermarkSettings() {
    var watermarkName = prompt('Enter name for exported watermark:')
    if (watermarkName != null && watermarkName != '') {
        // Save settings to JSON file
        var watermarkText = JSON.stringify(globalWatermark)
        var fileName = watermarkName + ".json"
        var blob = new Blob([watermarkText], { type: "application/json;charset=utf-8" })
        saveAs(blob, fileName)
    } else {
        alert('Watermark name cannot be blank!')
    }
}

// Import watermark from JSON file
function importWatermarkSettings(el) {
    var files = el.files
    Array.prototype.forEach.call(files, function (file) {
        // Make sure image file is less than 1.5MB
        if (file.size > 1572864) {
            alert('Watermark must be under 1.5MB!')
            return
        }
        // Read the file
        var reader = new FileReader()
        reader.onload = function () {
            // Make sure file is valid JSON
            try {
                var watermarkObj = JSON.parse(reader.result)
            } catch (error) {
                alert('Error: ' + error)
            }
            // Add watermark to localStorage
            var watermarkName = file.name.replace('.json', '')
            localStorage['Watermark: ' + watermarkName] = reader.result
            // Show toast message
            console.log(watermarkName)
            document.querySelector('#photostack-watermark-import-toast .toast-body').innerText = 'Watermark saved to local storage as "' + watermarkName + '".'
            $('#photostack-watermark-import-toast').toast('show')
            loadWatermarkList()
        }
        reader.onerror = function (event) {
            alert('Error: ' + event)
        }
        reader.readAsText(file)
        // Clear file select
        document.getElementById('photostack-import-file').value = ''
    })
}

// Add image from local file
function importLocalImage(file) {
    // Make sure image file is less than 1MB
    if (file.size > 1048576) {
        alert('Watermark must be under 1MB!')
        return
    }
    // Create file reader
    var image = document.createElement('img')
    var reader = new FileReader()
    // Set the image source to the reader result, once the reader is done
    reader.onload = function () {
        image.src = reader.result
    }
    reader.onerror = function (event) {
        alert('Error: ' + event)
    }
    // Once both the reader and image is done, we can safely add it to the originals container and clean up
    image.onload = function () {
        // Save image to globalWatermark
        globalWatermark.image = image.src
        // Regenerate preview
        renderPreviewCanvas()
    }
    reader.readAsDataURL(file)
    // Clear file picker
    document.getElementById('photostack-import-file').value = ''
    // Close import modal if it's still open
    $('#photostack-import-modal').modal('hide')
}

// Add image from URL
function importWebImage(url) {
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
    // Close import modal if it's still open
    $('#photostack-import-modal').modal('hide')
}

// Add image from Dropbox
function importDropboxImage() {
    // Set configuration for file picker
    options = {
        success: function(file) {
            console.log(file[0])
            importWebImage(file[0].link)
            // Close import modal if it's still open
            $('#photostack-import-modal').modal('hide')
        },
        cancel: function() {
            // Close import modal if it's still open
            $('#photostack-import-modal').modal('hide')
        },
        linkType: "direct",
        multiselect: false,
        extensions: ['images'],
        folderselect: false
    }
    Dropbox.choose(options)
}

// Apply current settings to a canvas
function applyWatermarkSettings(canvas) {
    // Silently return if no watermark image has been imported
    if (!globalWatermark.image) {
        return
    } else {
        console.log('Applying watermark settings to preview...')
    }
}

// Render canvas of preview image
function renderPreviewCanvas() {
    // Create white preview window for watermark
    var canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 768
    canvas.getContext('2d').fillStyle = '#FFFFFF'
    canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height)
    // Apply settings
    if (globalWatermark.image) {
        var watermark = new Image()
        watermark.onload = function () {
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
            document.getElementById('photostack-watermark-preview').setAttribute('src', canvas.toDataURL())
        }
        watermark.src = globalWatermark.image
    } else {
        document.getElementById('photostack-watermark-preview').setAttribute('src', canvas.toDataURL())
    }
}

// Read watermarks from localStorage
function loadWatermarkList() {
    var select = document.getElementById('photostack-watermark-select')
    // Delete current content
    select.innerHTML = ''
    // Add disabled options
    var disabledOption = document.createElement('option')
    disabledOption.innerText = 'Select a watermark...'
    disabledOption.disabled = true
    disabledOption.selected = true
    select.appendChild(disabledOption)
    // Populate rest of select with stored watermarks
    for (var i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).includes('Watermark')) {
            // Add watermark to select menu
            var option = document.createElement('option')
            option.innerText = localStorage.key(i).replace('Watermark: ', '') // Remove "Watermark: " from the key name
            option.value = i
            select.appendChild(option)
        }
    }
}

// Fix for dropdown menu being cut off on mobile devices
function fixDropdownMenu(element) {
    var width = document.body.clientWidth
    if (width >= '991.98') {
        element.classList.add('dropdown-menu-right')
    } else {
        element.classList.remove('dropdown-menu-right')
    }
}

// Append event listeners to buttons and other elements

document.querySelectorAll('.photostack-watermark-save').forEach(function (el) {
    el.addEventListener('click', function () {
        saveWatermark()
        loadWatermarkList()
    })
})

document.querySelectorAll('.photostack-watermark-import').forEach(function (el) {
    el.addEventListener('click', function () {
        $('#photostack-watermark-file-import').click()
    })
})

document.querySelectorAll('.photostack-watermark-export').forEach(function (el) {
    el.addEventListener('click', function () {
        exportWatermarkSettings()
    })
})

document.querySelector('.photostack-watermark-delete').addEventListener('click', function () {
    deleteWatermark(document.getElementById('photostack-watermark-select').value)
    loadWatermarkList()
})

document.querySelectorAll('.photostack-import-file-btn').forEach(function(el) {
    el.addEventListener('click', function () {
        $('#photostack-import-file').click()
    })
})

document.getElementById('photostack-import-url-button').addEventListener('click', function () {
    var url = document.getElementById('photostack-import-url').value
    importWebImage(url)
})

document.querySelectorAll('.photostack-import-dropbox-btn').forEach(function(el) {
    el.addEventListener('click', function() {
        if (!Dropbox.isBrowserSupported()) {
            alert('Sorry, Dropbox does not support your web browser.')
        } else if (!navigator.onLine) {
            alert('You are not connected to the internet. Connect to the internet and try again.')
        } else {
            importDropboxImage()
        }
    })
})

document.getElementById('photostack-watermark-select').addEventListener('change', function () {
    loadWatermark(this.value)
})

document.getElementById('photostack-import-file').addEventListener('change', function () {
    importLocalImage(this.files[0])
})

document.getElementById('photostack-watermark-file-import').addEventListener('change', function () {
    importWatermarkSettings(this)
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

// Show welcome page on first run
if (localStorage['welcome-watermark'] != 'true') {
    $('#photostack-welcome-modal').modal('show')
    // Don't show welcome screen again after it is exited
    document.querySelector('#photostack-welcome-modal .btn-block').addEventListener('click', function() {
        localStorage['welcome-watermark'] = 'true'
    })
}

// Prevent unload
window.onbeforeunload = function () {
    if (globalWatermark.image != '') {
        return 'Are you sure you want to navigate away?'
    }
}

// Fix dropdown menu
window.addEventListener("resize", function () {
    fixDropdownMenu(document.querySelector('.dropdown-menu'))
})

// Show errors in UI
window.onerror = function () {
    $('#photostack-error-toast').toast('show')
}

renderPreviewCanvas()
loadWatermarkList()
fixDropdownMenu(document.querySelector('.dropdown-menu'))