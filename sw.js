const log = false;

const files = [
	// site
	'./',
	'./index.html',
	'./manifest.webmanifest',

	// images
	'./img/ilustration.svg',
	'./img/send.png',
	'./img/send512.png',
	'./img/send192.png',

	// javascript
	'./main.js',
	'./qrcode.js',

	// CSS
	'./styles/form.css',
	'./styles/header.css',
	'./styles/main.css',
	'./styles/messages.css',
	'./styles/qrcode.css',
	'./styles/sidebar.css'
];

// Installation dans le cache.
self.addEventListener('install', event =>
	event.waitUntil(
		caches.open('static').then(cache =>
			cache
				.addAll(files)
				.then(() => self.skipWaiting())
				.catch(error => console.error('Erreur de cache.', error))
		)
	)
);

// Récupération dans le cache si disponible, sinon par fetch.
self.addEventListener('fetch', event => {
	let file = event.request.url.split('/');
	file = file[file.length - 1];

	event.respondWith(
		caches.match(event.request).then(res => {
			if (log) console.warn(`used ${res ? 'cache' : 'fetch'} for ${file}`);
			return res ? res : fetch(event.request).catch(err => console.error(`fetch error for ${file}`));
		})
	);
});
