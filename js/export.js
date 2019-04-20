// Remove image formats from export dialog that aren't supported
if (!Modernizr.todataurljpeg) {
    var option = document.querySelector('#photostack-export-format option[value="jpg"]')
    option.setAttribute('disabled', true)
}
if (!Modernizr.todataurlwebp) {
    var option = document.querySelector('#photostack-export-format option[value="webp"]')
    option.setAttribute('disabled', true)
}
// Show name pattern example in real-time
document.getElementById('photostack-name-pattern').addEventListener('keyup', function() {
    var text = document.getElementById('photostack-name-pattern').value
    if (text === '') {
        text = 'vacation'
    }
    document.querySelectorAll('.photostack-name-pattern-demo').forEach(function (el) {
        el.textContent = text
    })
})