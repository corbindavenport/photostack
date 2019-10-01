## PhotoStack API

PhotoStack has a very simple API that allows you to open PhotoStack with specific images already imported. Images are passed as comma-seperated URLs that have been converted to [URI Components](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

Here's a sample URL string ([demo](https://photostack.app/v1/?import=https%3A%2F%2Fi.imgur.com%2F3uLlis3.jpg,https%3A%2F%2Fi.imgur.com%2FAX14LIl.jpg,https%3A%2F%2Fi.imgur.com%2F5YxHV1I.jpg)):

```
https://photostack.app/v1/?import=https%3A%2F%2Fi.imgur.com%2F3uLlis3.jpg,https%3A%2F%2Fi.imgur.com%2FAX14LIl.jpg,https%3A%2F%2Fi.imgur.com%2F5YxHV1I.jpg
```

This API could be used in many ways. For example, an image gallery could add an 'Open in PhotoStack' button that would automatically import one or more images from the gallery directly into PhotoStack.

**Note:** While adding the `import` parameter directly to the PhotoStack editor page currently does the same thing as the API endpoint, you should not do this, because the URL of the editor page could change in the future. The URL of the API endpoint will never change.

### Example usage (JavaScript):

```
// An example array of URLs to images
var imageArray = ['http://example.com/hi.jpg', 'http://example.com/puppy.jpg']

// Convert each URL to something that can be safely inserted into a URL paramter
imageArray.forEach(function (url, index) {
    imageArray[index] = encodeURIComponent(url)
})

// Create the URL string
var link = 'https://photostack.app/v1/?import=' + imageArray.join()

// Open the link in a new tab
window.open(link, '_blank')
```