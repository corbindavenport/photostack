// Legacy export function for older browsers
function legacyExport() {
    // Start timer
    console.time('Legacy export')
    // Set variables
    var imgFormat = document.getElementById('photostack-file-format').value
    var imgQuality = parseInt(document.getElementById('photostack-file-quality').value) / 100
    var imgNamePattern = document.getElementById('photostack-file-pattern').value
    if (imgNamePattern === '') {
        imgNamePattern = 'image'
    }
    var imgCount = document.querySelectorAll('#photostack-original-container img').length
    var progressStep = 100 / imgCount
    // Switch modal content to progress indicator
    document.querySelector('.photostack-export-modal-initial').style.display = 'none'
    // Use jQuery's show() so the progress bar is fully displayed before the image processing begins
    $('.photostack-export-modal-loading').show('fast', function () {
        // Set title
        document.title = 'Photostack (0%)'
        // Start rendering canvases
        var originals = document.querySelectorAll('#photostack-original-container img')
        var canvasContainer = document.getElementById('photostack-canvas-container')
        // Clear current canvas elements
        canvasContainer.innerHTML = ''
        // Render canvas for each original image
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
        // Create files object
        var files = []
        // Add canvases to ZIP and Dropbox object
        var zip = new JSZip()
        var canvases = document.querySelectorAll('#photostack-canvas-container canvas')
        canvases.forEach(function (canvas, i) {
            var canvasData = canvas.toDataURL(imgFormat, imgQuality)
            // JSZip requires the base64 part of the string to be removed
            zipData = canvasData.replace('data:' + imgFormat + ';base64,', '')
            // Give name to file
            if (imgFormat === 'image/jpeg') {
                var fileEnding = '.jpg'
            } else if (imgFormat === 'image/png') {
                var fileEnding = '.png'
            } else if (imgFormat === 'image/webp') {
                var fileEnding = '.webp'
            }
            var num = i + 1
            var fileName = imgNamePattern + ' ' + num + fileEnding
            // Add file to array
            files.push([fileName, canvasData])
            // Add image to ZIP
            zip.file(fileName, zipData, { base64: true })
            // Update progress bar and app title
            var progress = Math.ceil(progressStep * (i + 1))
            document.title = 'PhotoStack (' + progress + '%)'
            document.getElementById('photostack-zip-progress').style.width = progress + '%'
        })
        // Generate zip
        console.log('Generating zip...')
        zip.generateAsync({ type: 'blob' })
            .then(function (content) {
                // Send notification (if permission is granted)
                if ('Notification' in window) {
                    if (Notification.permission === 'granted') {
                        var notification = new Notification('PhotoStack', {
                            body: 'Your image export is complete.',
                            icon: 'img/android-chrome-192x192.png'
                        })
                        // Clear the notification when the export dialog is closed, if the notification hasn't already been cleared
                        $('#photostack-export-modal').on('hidden.bs.modal', function (e) {
                            notification.close.bind(notification)
                        })
                    }
                }
                // Switch modal content to finished result
                document.querySelector('.photostack-export-modal-loading').style.display = 'none'
                document.querySelector('.photostack-export-modal-finished').style.display = 'block'
                // Hide native share button because it's not part of the legacy export function
                document.querySelector('.photostack-web-share-btn-container').style.display = 'none'
                // Download files separately
                document.getElementById('photostack-export-separate-button').addEventListener('click', function () {
                    files.forEach(function (file) {
                        // First array item is file name, second item is the data URL
                        saveAs(file[1], file[0])
                    })
                })
                // Download as ZIP
                document.getElementById('photostack-export-zip-button').addEventListener('click', function () {
                    saveAs(content, 'images.zip')
                })
                // End timer
                console.timeEnd('Legacy export')
            })
    })
}

// Async export with Promises
function asyncExport() {
    // Start timer
    console.time('Async export')
    // Set variables
    var imgFormat = document.getElementById('photostack-file-format').value
    var imgQuality = parseInt(document.getElementById('photostack-file-quality').value) / 100
    var imgNamePattern = document.getElementById('photostack-file-pattern').value
    if (imgNamePattern === '') {
        imgNamePattern = 'image'
    }
    var imgCount = document.querySelectorAll('#photostack-original-container img').length
    var progressStep = 100 / imgCount
    // Switch modal content to progress indicator
    document.querySelector('.photostack-export-modal-initial').style.display = 'none'
    // Use jQuery's show() so the progress bar is fully displayed before the image processing begins
    $('.photostack-export-modal-loading').show('fast', function () {
        // Start rendering canvases
        var originals = document.querySelectorAll('#photostack-original-container img')
        var canvasContainer = document.getElementById('photostack-canvas-container')
        // Clear current canvas elements
        canvasContainer.innerHTML = ''
        // Render canvas for each original image
        var canvasPromises = $.map(originals, function (original) {
            return new Promise(function (resolve) {
                // Create canvas element
                var canvas = document.createElement('canvas')
                // Add canvas element to canvas container
                canvasContainer.appendChild(canvas)
                canvas.width = original.naturalWidth
                canvas.height = original.naturalHeight
                canvas.getContext('2d').drawImage(original, 0, 0)
                // Apply settings
                applyCanvasSettings(canvas, original)
                resolve(canvas)
            })
        })
        // Continue once all canvases are rendered
        Promise.all(canvasPromises).then(function (canvases) {
            // Create a new ZIP object
            var zip = new JSZip()
            // Create promises for final render of each image
            var promises = $.map(canvases, function (canvas) {
                return new Promise(function (resolve) {
                    canvas.toBlob(resolve, imgFormat, imgQuality)
                })
            })
            // Show the final export screen when all renders are completed
            Promise.all(promises).then(function (blobs) {
                // Create final array of blobs with file names
                var files = []
                blobs.forEach(function (blob, i) {
                    if (imgFormat === 'image/jpeg') {
                        var fileEnding = '.jpg'
                    } else if (imgFormat === 'image/png') {
                        var fileEnding = '.png'
                    } else if (imgFormat === 'image/webp') {
                        var fileEnding = '.webp'
                    }
                    var num = i + 1
                    var fileName = imgNamePattern + ' ' + num + fileEnding
                    // Add to files array
                    var file = new File([blob], fileName, { lastModified: Date.now() })
                    files.push(file)
                    // Add to ZIP file
                    zip.file(fileName, file)
                })
                // Generate zip file
                console.log('Generating zip...')
                zip.generateAsync({ type: 'blob' })
                    .then(function (content) {
                        // Show badge on PWA icon
                        if ('ExperimentalBadge' in window) {
                            window.ExperimentalBadge.set()
                        }
                        // Send notification (if permission is granted)
                        if ('Notification' in window) {
                            if (Notification.permission === 'granted') {
                                var notification = new Notification('PhotoStack', {
                                    body: 'Your image export is complete.',
                                    icon: 'img/android-chrome-192x192.png'
                                })
                                // Clear the notification when the export dialog is closed, if the notification hasn't already been cleared
                                $('#photostack-export-modal').on('hidden.bs.modal', function (e) {
                                    notification.close.bind(notification)
                                })
                            }
                        }
                        // Switch modal content to finished result
                        document.querySelector('.photostack-export-modal-loading').style.display = 'none'
                        document.querySelector('.photostack-export-modal-finished').style.display = 'block'
                        // Web Share API
                        var shareData = { files: files }
                        if (navigator.canShare && navigator.canShare(shareData)) {
                            document.getElementById('photostack-export-web-share-button').addEventListener('click', function() {
                                navigator.share({
                                    files: files,
                                    title: 'PhotoStack export'
                                })
                                    .then(function () {
                                        console.log('Share successful.')
                                    })
                                    .catch(function (error) {
                                        console.log('Sharing failed:', error)
                                    })
                            })
                        } else {
                            // Hide native app share button if the API isn't available
                            document.querySelector('.photostack-web-share-btn-container').style.display = 'none'
                        }
                        // Download files separately
                        document.getElementById('photostack-export-separate-button').addEventListener('click', function () {
                            files.forEach(function (file) {
                                saveAs(file)
                            })
                        })
                        // Download as ZIP
                        document.getElementById('photostack-export-zip-button').addEventListener('click', function () {
                            saveAs(content, 'images.zip')
                        })
                        // Stop time
                        console.timeEnd('Async export')
                    })
            })
        })
    })
}

// Request permission to send notifications
function getNofificationPermission() {
    if (Notification.permission === 'granted') {
        document.getElementById('photostack-enable-notifications-btn').style.display = 'none'
        document.getElementById('photostack-notification-confirmation').style.display = 'block'
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === 'granted') {
                document.getElementById('photostack-enable-notifications-btn').style.display = 'none'
                document.getElementById('photostack-notification-confirmation').style.display = 'block'
            }
        })
    }
}

// Export button in modal
document.getElementById('photostack-export-zip-btn').addEventListener('click', function () {
    if (Modernizr.promises) {
        asyncExport()
    } else {
        legacyExport()
    }
})

// Notification support
if ('Notification' in window) {
    // Check notification permission
    if (Notification.permission === 'granted') {
        // If permission is already granted, hide the button to request permission
        document.getElementById('photostack-enable-notifications-btn').style.display = 'none'
        document.getElementById('photostack-notification-confirmation').style.display = 'block'
    } else if (Notification.permission !== 'denied') {
        // If permission has not been granted, show the button to request permission
        document.getElementById('photostack-enable-notifications-btn').addEventListener('click', function () {
            getNofificationPermission()
        })
    }
} else {
    // Hide notification button and show a warning
    document.getElementById('photostack-enable-notifications-btn').style.display = 'none'
    document.getElementById('photostack-notifications-alert').style.display = 'block'
}

// Reset modal content when the close button is clicked
$('#photostack-export-modal').on('hidden.bs.modal', function (e) {
    document.querySelector('.photostack-export-modal-loading').style.display = 'none'
    document.querySelector('.photostack-export-modal-finished').style.display = 'none'
    document.querySelector('.photostack-export-modal-initial').style.display = 'block'
    document.getElementById('photostack-zip-progress').style.width = '0%'
    // Reset title
    document.title = 'PhotoStack'
    // Clear PWA icon
    if ('ExperimentalBadge' in window) {
        window.ExperimentalBadge.clear()
    }
})