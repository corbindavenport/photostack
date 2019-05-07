// Register service worker

if (navigator.serviceWorker) {

	var newWorker;

	$(document).on("click", ".pwa-refresh", function() {
		newWorker.postMessage({ action: 'skipWaiting' });
	});

	navigator.serviceWorker.register("/sw.js").then(reg => {
		reg.addEventListener("updatefound", () => {
			// A wild service worker has appeared in reg.installing!
			newWorker = reg.installing;
			newWorker.addEventListener("statechange", () => {
				// Has network.state changed?
				switch (newWorker.state) {
					case "installed":
						if (navigator.serviceWorker.controller) {
							// new update available
							document.querySelector('.pwa-refresh').style.display = "block"
						} else {
							// no update available
							console.log("No service worker update available.");
						}
						break;
				}
			});
		});
	});

	var refreshing;
	
	navigator.serviceWorker.addEventListener("controllerchange", function () {
		console.log("controllerchange");
		if (refreshing) return;
		window.location.reload();
		refreshing = true;
	});

}
