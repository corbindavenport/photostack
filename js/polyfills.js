// forEach polyfill
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Polyfill
Array.prototype.forEach || (Array.prototype.forEach = function (r) {
    var o, t;
    if (null == this) throw new TypeError("this is null or not defined");
    var n = Object(this),
        e = n.length >>> 0;
    if ("function" != typeof r) throw new TypeError(r + " is not a function");
    for (1 < arguments.length && (o = arguments[1]), t = 0; t < e;) {
        var i;
        t in n && (i = n[t], r.call(o, i, t, n)), t++
    }
})

// Fix for NodeList not working in forEach on Internet Explorer
// Source: https://stackoverflow.com/a/55590238
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Polyfill for Array.includes
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill
Array.prototype.includes || Object.defineProperty(Array.prototype, "includes", {
    value: function(r, e) {
        if (null == this) throw new TypeError('"this" is null or not defined');
        var t = Object(this),
            n = t.length >>> 0;
        if (0 === n) return !1;
        var i, o, a = 0 | e,
            u = Math.max(0 <= a ? a : n - Math.abs(a), 0);
        for (; u < n;) {
            if ((i = t[u]) === (o = r) || "number" == typeof i && "number" == typeof o && isNaN(i) && isNaN(o)) return !0;
            u++
        }
        return !1
    }
})