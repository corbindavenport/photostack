const watermarksStore = localforage.createInstance({
    name: 'Watermarks',
    driver: [localforage.WEBSQL, localforage.INDEXEDDB]
})

const watermarkEditor = document.getElementById('photostack-watermark-editor-modal')

// Render canvas of first image, apply settings, and show a preview
async function renderWatermarkPreviewCanvas(watermarkObject = null) {
    // Create white preview window for watermark
    var canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    canvas.getContext('2d').fillStyle = '#FFFFFF'
    canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height)
    // Apply settings
    canvas = await applyCanvasSettings(canvas, {
        // Image
        image: watermarkEditor.getAttribute('data-image'),
        // Size
        size: watermarkEditor.querySelector('#photostack-watermark-size').value,
        // Opacity
        opacity: parseInt(watermarkEditor.querySelector('#photostack-watermark-opacity').value),
        // Horizontal inset
        horizontalInset: parseInt(watermarkEditor.querySelector('#photostack-watermark-horizontal-inset').value),
        // Vertical inset
        veritcalInset: parseInt(watermarkEditor.querySelector('#photostack-watermark-vertical-inset').value),
        // Anchor position
        anchorPosition: parseInt(watermarkEditor.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-', ''))
    })
    // Add preview to window
    var previewImage = document.getElementById('photostack-watermark-editor-preview')
    previewImage.setAttribute('src', canvas.toDataURL())
}

// Open watermark in watermark editor
function openWatermarkEditor(watermarkKey) {
    // Add data to modal before opening
    watermarkEditor.querySelector('#photostack-watermark-editor-modal-title').innerText = watermarkKey
    watermarkEditor.setAttribute('data-watermark', watermarkKey)
    watermarksStore.getItem(watermarkKey).then(function (watermarkObj) {
        // Set image
        watermarkEditor.setAttribute('data-image', watermarkObj.image)
        // Set size in UI
        watermarkEditor.querySelector('#photostack-watermark-size').value = watermarkObj.size
        // Set opacity in UI
        watermarkEditor.querySelector('#photostack-watermark-opacity').value = watermarkObj.opacity
        // Set horizontal inset in UI
        watermarkEditor.querySelector('#photostack-watermark-horizontal-inset').value = parseInt(watermarkObj.horizontalInset)
        // Set vertical inset in UI
        watermarkEditor.querySelector('#photostack-watermark-vertical-inset').value = parseInt(watermarkObj.veritcalInset)
        // Clear .btn-primary style from the currently-active anchor position
        var oldAnchor = watermarkEditor.querySelector('.photostack-anchor-btn.btn-primary')
        oldAnchor.classList.remove('btn-primary')
        oldAnchor.classList.add('btn-secondary')
        // Add .btn-primary style to the correct value
        var newAnchor = watermarkEditor.querySelector('#photostack-watermark-pos-' + watermarkObj.anchorPosition)
        newAnchor.classList.remove('btn-secondary')
        newAnchor.classList.add('btn-primary')
        // Render preview image
        renderWatermarkPreviewCanvas()
        // Open the modal
        var managerModalEl = bootstrap.Modal.getOrCreateInstance(document.getElementById('photostack-watermark-manager-modal'))
        var editorModalEl = bootstrap.Modal.getOrCreateInstance(document.getElementById('photostack-watermark-editor-modal'))
        managerModalEl.hide()
        editorModalEl.show()
    }).catch(function (err) {
        alert('Error: ' + err)
    })
}

// Watermark editor event listeners

watermarkEditor.querySelector('#photostack-watermark-editor-image-btn').addEventListener('click', function () {
    document.getElementById('photostack-watermark-import-image').click()
})

watermarkEditor.querySelector('#photostack-watermark-import-image').addEventListener('change', function () {
    var image = document.createElement('img')
    var reader = new FileReader()
    // Set the image source to the reader result, once the reader is done
    reader.onload = function () {
        image.src = reader.result
    }
    reader.onerror = function (err) {
        alert('Error: ' + err)
    }
    // Once both the reader and image is done, we can safely add it to the originals container and clean up
    image.onload = function () {
        // Save image to watermark editor
        watermarkEditor.setAttribute('data-image', image.src)
        // Render preview again
        renderWatermarkPreviewCanvas()
        // Clear file select
        this.value = ''
    }
    reader.readAsDataURL(this.files[0])
})

watermarkEditor.querySelector('#photostack-watermark-size').addEventListener('change', function () {
    renderWatermarkPreviewCanvas()
})

watermarkEditor.querySelector('#photostack-watermark-opacity').addEventListener('change', function () {
    renderWatermarkPreviewCanvas()
})

watermarkEditor.querySelector('#photostack-watermark-horizontal-inset').addEventListener('change', function () {
    renderWatermarkPreviewCanvas()
})

watermarkEditor.querySelector('#photostack-watermark-vertical-inset').addEventListener('change', function () {
    renderWatermarkPreviewCanvas()
})

watermarkEditor.querySelectorAll('.photostack-anchor-btn').forEach(function (button) {
    button.addEventListener('click', function () {
        // Clear .btn-primary style from the currently-active button
        var previousButton = watermarkEditor.querySelector('.photostack-anchor-btn.btn-primary')
        previousButton.classList.remove('btn-primary')
        previousButton.classList.add('btn-secondary')
        // Add .btn-primary style to the button that was just clicked
        button.classList.remove('btn-secondary')
        button.classList.add('btn-primary')
        renderWatermarkPreviewCanvas()
    })
})

watermarkEditor.querySelector('#photostack-watermark-editor-save-btn').addEventListener('click', function () {
    var editorModalEl = bootstrap.Modal.getOrCreateInstance(document.getElementById('photostack-watermark-editor-modal'))
    var currentWatermark = watermarkEditor.getAttribute('data-watermark')
    // Save watermark back to storage
    watermarksStore.setItem(currentWatermark, {
        // Image
        image: watermarkEditor.getAttribute('data-image'),
        // Size
        size: watermarkEditor.querySelector('#photostack-watermark-size').value,
        // Opacity
        opacity: parseInt(watermarkEditor.querySelector('#photostack-watermark-opacity').value),
        // Horizontal inset
        horizontalInset: parseInt(watermarkEditor.querySelector('#photostack-watermark-horizontal-inset').value),
        // Vertical inset
        veritcalInset: parseInt(watermarkEditor.querySelector('#photostack-watermark-vertical-inset').value),
        // Anchor position
        anchorPosition: parseInt(watermarkEditor.querySelector('.photostack-anchor-btn.btn-primary').id.replace('photostack-watermark-pos-', ''))
    }).then(function (value) {
        // Close modal once saved
        editorModalEl.hide()
    }).catch(function (err) {
        alert('Error: ' + err)
    })
})

// Export watermark to JSON file
function exportWatermark(watermarkKey) {
    watermarksStore.getItem(watermarkKey).then(function (value) {
        var watermarkText = JSON.stringify(value)
        var fileName = watermarkKey + ".json"
        var blob = new Blob([watermarkText], { type: 'application/json;charset=utf-8' })
        saveAs(blob, fileName)
    }).catch(function (err) {
        alert('Error: ' + err)
    })
}

// Delete watermark from storage
function deleteWatermark(watermarkKey) {
    if (confirm('Are you sure you want to delete the watermark "' + watermarkKey + '"? This cannot be undone.')) {
        watermarksStore.removeItem(watermarkKey).then(function () {
            refreshWatermarks()
        }).catch(function (err) {
            alert('Error: ' + err)
        })
    }
}

// Import watermark from JSON file
function importWatermarkSettings(el) {
    // Create a promise for each file
    var watermarkFileArray = Object.entries(el.files)
    var importPromises = watermarkFileArray.map(function (file) {
        return new Promise(function (resolve) {
            // Read the file
            file = file[1]
            var reader = new FileReader()
            reader.onload = function () {
                // Make sure file is valid JSON
                try {
                    var watermarkObj = JSON.parse(reader.result)
                } catch (err) {
                    alert('Error: ' + err)
                    return resolve()
                }
                // Add watermark to watermarksStore
                var watermarkName = file.name.replace('.json', '')
                watermarksStore.setItem(watermarkName, watermarkObj).then(function () {
                    resolve()
                }).catch(function (err) {
                    alert('Error: ' + err)
                    return resolve()
                })
            }
            reader.onerror = function (event) {
                alert('Error: ' + event)
                return resolve()
            }
            reader.readAsText(file)
        })
    })
    // When all promises are returned, clean up
    Promise.all(importPromises).then(function () {
        // Clear file select
        document.getElementById('photostack-watermark-file-import').value = ''
        // Refresh watermarks
        refreshWatermarks()
    })
}

async function refreshWatermarks() {
    // Reset lists
    document.getElementById('photostack-watermark-manager-list').innerHTML = ''
    // Add watermarks to editor dropdown menu and watermark manager
    await watermarksStore.iterate(function (value, key, iterationNumber) {
        // Add watermark to select menu
        var option = document.createElement('option')
        option.innerText = key
        option.value = key
        // Add watermark to manager modal list
        var listItem = document.createElement('div')
        listItem.classList.add('list-group-item')
        var itemTitle = document.createElement('h5')
        itemTitle.innerText = key
        listItem.appendChild(itemTitle)
        // Add button container to list
        var buttons = document.createElement('div')
        buttons.classList.add('btn-group', 'w-100')
        buttons.setAttribute('role', 'group')
        listItem.appendChild(buttons)
        // Add edit button
        var editBtn = document.createElement('button')
        editBtn.innerText = 'Edit'
        editBtn.classList.add('btn', 'btn-primary', 'btn-sm')
        editBtn.addEventListener('click', function () {
            openWatermarkEditor(key)
        })
        buttons.appendChild(editBtn)
        // Add export button
        var exportBtn = document.createElement('button')
        exportBtn.innerText = 'Export'
        exportBtn.classList.add('btn', 'btn-secondary', 'btn-sm')
        exportBtn.addEventListener('click', function () {
            exportWatermark(key)
        })
        buttons.appendChild(exportBtn)
        // Add delete button
        var deleteBtn = document.createElement('button')
        deleteBtn.innerText = 'Delete'
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm')
        deleteBtn.addEventListener('click', function () {
            deleteWatermark(key)
        })
        buttons.appendChild(deleteBtn)
        // Add everything to the list
        document.getElementById('photostack-watermark-manager-list').appendChild(listItem)
        console.log('Loaded watermark:', [key, value])
    })
}

document.getElementById('photostack-watermark-new-btn').addEventListener('click', function () {
    var name = prompt('What do you want to call the watermark?')
    if (name && (name != '')) {
        // Create new watermark in storage
        watermarksStore.setItem(name, {
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABmJLR0QA/wAAAAAzJ3zzAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AEKFxkQjAI2aQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAALSURBVAjXY2AAAgAABQAB4iYFmwAAAABJRU5ErkJggg==', // 1x1 transparent PNG
            size: 30,
            opacity: 50,
            horizontalInset: 0,
            veritcalInset: 0,
            anchorPosition: 5
        }).then(function () {
            openWatermarkEditor(name)
            refreshWatermarks()
        }).catch(function (err) {
            alert('Error: ' + err)
        })
    }
})

// Allow WebP imports if the image format is supported
Modernizr.on('webp', function (result) {
    if (result) {
        var formats = document.getElementById('photostack-watermark-import-image').getAttribute('accept')
        document.getElementById('photostack-watermark-import-image').setAttribute('accept', formats + ',image/webp')
    }
})

// Allow AVIF imports if the image format is supported
var testAVIF = new Image()
testAVIF.onload = function () {
    var formats = document.getElementById('photostack-watermark-import-image').getAttribute('accept')
    document.getElementById('photostack-watermark-import-image').setAttribute('accept', formats + ',image/avif')
    // Add class to <html> tag like Modernizr
    document.getElementsByTagName('html')[0].classList.add('avif')
}
testAVIF.setAttribute('src', 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=')

// Allow JPEG XL imports if format is supported
var testJPEGXL = new Image()
testJPEGXL.onload = function () {
    var formats = document.getElementById('photostack-watermark-import-image').getAttribute('accept')
    document.getElementById('photostack-watermark-import-image').setAttribute('accept', formats + ',image/jxl')
    // Add class to <html> tag like Modernizr
    document.getElementsByTagName('html')[0].classList.add('jxl')
}
testJPEGXL.setAttribute('src', 'data:image/jxl;base64,AAAADEpYTCANCocKAAAAFGZ0eXBqeGwgAAAAAGp4bCAAAADCamJyZEBf3DaBIDRCIzRCIzRC0wiN0AgtAwIgWIEJgFCjBEQAAAAAwv+KAAAAAOD/RAAAAADw/yIAAAAA+H8RAAAAAPyfCAAAAAD+TwQAAAAA/y8CAAAAgP8XAQAAAMD/iQAAAADgfwEgAIgkCAoBAII/wIDgDyjA+AUACP4QAAEAAggECH4IA4IfooDghwAAAAAAAAAbJAD4BcRtW2iHl/qSLxcES4imZAoiSkXFjkbrEbunUS0LPjkfAq05FwAAAYtqeGxj/woAEBDCw8OAhHkARDWWr6Sx53UE9OgDvVo3DhroEIiw1iLM2WPZ68kgwYIiS67c4c6x+M6x7jlG154lo9Ho0rP8znH5fQDIOto6s5A/8boyI+Zc4gq7AAz4v7C04jc8DHWdWMJlDxMboQWK1qay0ttMdRc4K3ko8L33RyuvclnIWlHW1HGBhK+toakub7Jn5QFouo1nqACv8vbv33zLu3QTqB+kf//2hfr3r58IzrgQUBd8A8Hi6nAGgSV9YB4BskUExS7QrQNcLMsJHJqakLwTTM3gTlAYuTmKKtvy4QRo1BWk5EGmJpRJA2s8YS7Hd7+/ZRt8l+ZHdz/dAeBbABAA/AEMZAxkDGT+/w4AABgACAABAAAAAACAgCWJYsPUfQkCEFJgB4w29hoVGWMkYwxejwElOnIxDYj9K4ATQAzVb0OejYT5BJFx/N74ZXQPfP0ZhZ+a1+Sve6Q9zu7T9g9voIEP8YS24fmNeW25W4BaL/GArO2X6QPICAAAAAAAgJIE')

document.getElementById('photostack-watermark-import-btn').addEventListener('click', function () {
    document.getElementById('photostack-watermark-file-import').click()
})

document.getElementById('photostack-watermark-file-import').addEventListener('change', function () {
    importWatermarkSettings(this)
})

// Get list of watermarks when page is loaded
refreshWatermarks()