const editorMode = document.getElementsByTagName('html')[0].dataset.photostackMode

// Light and dark mode switching
function applyTheme() {
    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.setAttribute('data-bs-theme', 'light');
    } else if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
        }
    }
}

// Add click events to theme switcher after the page has loaded
window.addEventListener('load', function () {
    document.querySelectorAll('.photostack-theme-btn').forEach(function (el) {
        el.addEventListener('click', function () {
            localStorage.setItem('theme', el.dataset.theme);
            applyTheme();
        })
    })
})

// Handle changes to system theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    applyTheme();
})

// Apply theme on initial page load
applyTheme();

// Apply settings to a canvas
function applyCanvasSettings(canvas, watermarkObject = null, previewMode = false) {
    return new Promise(async function (resolve) {
        // Create aspect ratio from original canvas size
        var ratio = (canvas.width / canvas.height)
        // Crop image
        var cropNeeded = false;
        if (editorMode === 'photo-editor') {
            cropNeeded = (
                (document.getElementById('photostack-crop-top').value != 0) ||
                (document.getElementById('photostack-crop-bottom').value != 0) ||
                (document.getElementById('photostack-crop-left').value != 0) ||
                (document.getElementById('photostack-crop-right').value != 0)
            )
        }
        if (cropNeeded) {
            canvas = cropCanvas(canvas, document.getElementById('photostack-crop-top').value, document.getElementById('photostack-crop-bottom').value, document.getElementById('photostack-crop-left').value, document.getElementById('photostack-crop-right').value)
            // Update ratio
            ratio = (canvas.width / canvas.height)
        }
        // Resize image
        if ((editorMode === 'photo-editor') && (document.getElementById('photostack-image-width').value != '')) {
            // Set new canvas size
            var width = parseInt(document.getElementById('photostack-image-width').value)
            if (previewMode && (width > 800)) {
                width = 800
            }
            var height = width / ratio
            // Do the resize
            canvas = await resizeCanvas(canvas, width, height)
        } else if (previewMode) {
            // Set new canvas size
            var width = 800
            var height = width / ratio
            // Do the resize
            canvas = await resizeCanvas(canvas, width, height)
        }
        // Apply border
        if ((editorMode === 'photo-editor') && (parseInt(document.getElementById('photostack-border-width').value) > 0)) {
            var borderSize = document.getElementById('photostack-border-width').value
            var borderColor = document.getElementById('photostack-border-color').value
            // Top border
            canvas.getContext("2d").beginPath()
            canvas.getContext("2d").lineWidth = borderSize
            canvas.getContext("2d").strokeStyle = borderColor
            canvas.getContext("2d").rect(0, 0, canvas.width, borderSize)
            canvas.getContext("2d").stroke()
            // Bottom border
            canvas.getContext("2d").beginPath()
            canvas.getContext("2d").lineWidth = borderSize
            canvas.getContext("2d").strokeStyle = borderColor
            canvas.getContext("2d").rect(0, (canvas.height - borderSize), canvas.width, borderSize)
            canvas.getContext("2d").stroke()
            // Left border
            canvas.getContext("2d").beginPath()
            canvas.getContext("2d").lineWidth = borderSize
            canvas.getContext("2d").strokeStyle = borderColor
            canvas.getContext("2d").rect(0, 0, borderSize, canvas.height)
            canvas.getContext("2d").stroke()
            // Right border
            canvas.getContext("2d").beginPath()
            canvas.getContext("2d").lineWidth = borderSize
            canvas.getContext("2d").strokeStyle = borderColor
            canvas.getContext("2d").rect((canvas.width - borderSize), 0, borderSize, canvas.height)
            canvas.getContext("2d").stroke()
        }
        // Apply watermark
        if (watermarkObject) {
            // Load the watermark image
            if (watermarkObject.image.length === document.getElementById('photostack-watermark-cache').src.length) {
                // If the current image has already been loaded, avoid loading it again
                var watermarkImage = document.getElementById('photostack-watermark-cache')
            } else {
                // Load the image and add it to cache
                var watermarkImage = await new Promise(function (resolve) {
                    var tempImage = document.getElementById('photostack-watermark-cache')
                    tempImage.onload = function () {
                        resolve(tempImage)
                    }
                    tempImage.src = watermarkObject.image
                })
            }
            // Create temporary canvas for the watermark
            var watermarkCanvas = document.createElement('canvas')
            watermarkCanvas.width = watermarkImage.naturalWidth
            watermarkCanvas.height = watermarkImage.naturalHeight
            // Set opacity
            var opacity = parseInt(watermarkObject.opacity) / 100
            // Draw watermark to temporary canvas
            watermarkCanvas.getContext('2d').drawImage(watermarkImage, 0, 0)
            // Calculate new size of watermark
            var resizeRatio = watermarkImage.naturalHeight / watermarkImage.naturalWidth
            var userSize = parseInt(watermarkObject.size)
            watermarkFinalWidth = canvas.width * (userSize / 100)
            watermarkFinalHeight = watermarkFinalWidth * resizeRatio
            // Do the resize
            watermarkCanvas = await resizeCanvas(watermarkImage, watermarkFinalWidth, watermarkFinalHeight, opacity)
            // Set horizontal and vertical insets
            var horizontalInset = canvas.width * (watermarkObject.horizontalInset / 100)
            var veritcalInset = canvas.height * (watermarkObject.veritcalInset / 100)
            // Set anchor position
            if (watermarkObject.anchorPosition === 1) {
                // Top-left alignment
                // Because the X and Y values start from the top-left, nothing happens here
            } else if (watermarkObject.anchorPosition === 2) {
                // Top-center alignment (Ignore: Horizontal)
                horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
            } else if (watermarkObject.anchorPosition === 3) {
                // Top-right alignment
                horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
            } else if (watermarkObject.anchorPosition === 4) {
                // Middle-left alignment (Ignore: Vertical)
                veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
            } else if (watermarkObject.anchorPosition === 5) {
                // Middle-center alignment (Ignore: Vertical & Horizontal)
                horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
                veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
            } else if (watermarkObject.anchorPosition === 6) {
                // Middle-right alignment (Ignore: Vertical)
                horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
                veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
            } else if (watermarkObject.anchorPosition === 7) {
                // Bottom-left alignment
                veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
            } else if (watermarkObject.anchorPosition === 8) {
                // Bottom-center alignment (Ignore: Horizontal)
                veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
                horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
            } else if (watermarkObject.anchorPosition === 9) {
                // Bottom-right alignment
                veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
                horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
            }
            // Draw completed image to temporary canvas
            canvas.getContext('2d').drawImage(watermarkCanvas, horizontalInset, veritcalInset)
        }
        resolve(canvas)
    })
}

// Resize a canvas using Pica library
function resizeCanvas(oldCanvas, width, height, globalAlpha = 1.0) {
    return new Promise(function (resolve, reject) {
        // Create canvas with new size
        var newCanvas = document.createElement('canvas')
        newCanvas.width = width
        newCanvas.height = height
        // Get settings
        if (editorMode === 'photo-editor') {
            var unsharpAmount = parseInt(document.getElementById('photostack-resize-unsharp-amount').value)
        } else {
            var unsharpAmount = 50
        }
        console.log('made')
        const options = {
            unsharpAmount: (unsharpAmount * 2),
            unsharpRadius: 0.5,
            unsharpThreshold: 1,
            alpha: true
        }
        // Configure Pica without Web Workers support, because it's broken in Safari and possibly other browsers
        const picaObj = pica({
            features: [ 'js', 'wasm' ]
        });
        // Do the resize
        picaObj.resize(oldCanvas, newCanvas, options).then(function () {
            // We have to create ANOTHER canvas to apply transparency
            if (globalAlpha != 1.0) {
                var tempCanvas = document.createElement('canvas')
                tempCanvas.width = newCanvas.width
                tempCanvas.height = newCanvas.height
                tempCanvas.getContext('2d').globalAlpha = globalAlpha
                tempCanvas.getContext('2d').drawImage(newCanvas, 0, 0)
                resolve(tempCanvas)
            } else {
                resolve(newCanvas)
            }
        }).catch(function (error) {
            console.error('Resize error:', error);
            reject(error);
        });
    })
}