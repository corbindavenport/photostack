## PhotoStack API (v1)

PhotoStack has a very simple API that allows you to open PhotoStack with specific images already imported. Images are passed as comma-seperated URLs that have been converted to [URI Components](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

Here's a sample URL string ([demo](https://photostack.app/v1/?import=https%3A%2F%2Fi.imgur.com%2F3uLlis3.jpg,https%3A%2F%2Fi.imgur.com%2FAX14LIl.jpg,https%3A%2F%2Fi.imgur.com%2F5YxHV1I.jpg)):

```
https://photostack.app/v1/?import=https%3A%2F%2Fi.imgur.com%2F3uLlis3.jpg,https%3A%2F%2Fi.imgur.com%2FAX14LIl.jpg,https%3A%2F%2Fi.imgur.com%2F5YxHV1I.jpg
```

This API could be used in many ways. For example, an image gallery could add an 'Open in PhotoStack' button that would automatically import one or more images from the gallery directly into PhotoStack.

**Important usage instructons:**

- It is highly recommended that your images be served with the [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) HTTP header, so PhotoStack can download them without using the [CORS Anywhere](https://cors-anywhere.herokuapp.com/) service. If CORS Anywhere becomes temporarily available, PhotoStack will not be able to import any external images.
- Data URLs are not supported due to browser limitations. If your app generates images client-side, you can upload them to a service like Imgur first, then pass the URLs to PhotoStack.

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