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
        var editorModalEl = bootstrap.Modal.getOrCreateInstance(document.getElementById('photostack-watermark-editor-modal'))
        editorModalEl.show()
    }).catch(function (err) {
        alert('Error: ' + err)
        console.error(err)
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
        console.error(err)
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
        console.error(err)
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
        console.error(err)
    })
}

// Delete watermark from storage
function deleteWatermark(watermarkKey) {
    if (confirm('Are you sure you want to delete the watermark "' + watermarkKey + '"? This cannot be undone.')) {
        watermarksStore.removeItem(watermarkKey).then(function () {
            refreshWatermarks()
        }).catch(function (err) {
            alert('Error: ' + err)
            console.error(err)
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
                    console.error(err)
                    return resolve()
                }
                // Add watermark to watermarksStore
                var watermarkName = file.name.replace('.json', '')
                watermarksStore.setItem(watermarkName, watermarkObj).then(function () {
                    resolve()
                }).catch(function (err) {
                    alert('Error: ' + err)
                    console.error(err)
                    return resolve()
                })
            }
            reader.onerror = function (event) {
                alert('Error: ' + event)
                console.error(err)
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
        // Create card
        var card = document.createElement('div');
        card.classList.add('card', 'mb-2');
        // Create card content
        var cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);
        // Create card title
        var cardTitle = document.createElement('h5');
        cardTitle.classList.add('card-title');
        cardTitle.innerText = key;
        cardBody.appendChild(cardTitle);
        // Add edit button
        var editBtn = document.createElement('button')
        editBtn.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit';
        editBtn.classList.add('btn', 'btn-primary', 'me-2', 'mt-1');
        editBtn.addEventListener('click', function () {
            openWatermarkEditor(key);
        });
        cardBody.appendChild(editBtn);
        // Add export button
        var exportBtn = document.createElement('button');
        exportBtn.innerHTML = '<i class="bi bi-save me-2"></i>Export';
        exportBtn.classList.add('btn', 'btn-secondary', 'me-2', 'mt-1');
        exportBtn.addEventListener('click', function () {
            exportWatermark(key);
        });
        cardBody.appendChild(exportBtn);
        // Add delete button
        var deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Delete';
        deleteBtn.classList.add('btn', 'btn-danger', 'mt-1');
        deleteBtn.addEventListener('click', function () {
            deleteWatermark(key);
        });
        cardBody.appendChild(deleteBtn);
        // Add card to body
        document.getElementById('photostack-watermark-manager-list').appendChild(card);
        console.log('Loaded watermark:', [key, value]);
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
            console.error(err)
        })
    }
})

// Update interface and form elements based on supported image formats
async function updateSupportedFormats() {
    const importForm = document.getElementById('photostack-watermark-import-image');
    const supportedImportFormats = await checkSupportedImportFormats();
    // Add supported file types to file picker
    importForm.setAttribute('accept', importForm.getAttribute('accept') + ',' + supportedImportFormats.mimeTypes.join(','))
}

document.getElementById('photostack-watermark-import-btn').addEventListener('click', function () {
    document.getElementById('photostack-watermark-file-import').click()
})

document.getElementById('photostack-watermark-file-import').addEventListener('change', function () {
    importWatermarkSettings(this)
})

// Get list of watermarks when page is loaded
refreshWatermarks()

// Update list of supported formats
updateSupportedFormats();