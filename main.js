const id = getCookie('id');
const api = 'https://trankillprojets.fr/wal/wal.php';
const urlParams = new URLSearchParams(location.search);

let user = null;
let timeouts = [];

const fetchError = err => {
	console.error('Erreur:', err);
	if (confirm("Une erreur s'est Produite.\nRecharger la page?")) location.reload();
};

const getRelations = id =>
	fetch(api + '?relations&identifiant=' + id)
		.then(res =>
			res.json().then(async json => {
				user.contacts = json.relations;
				document.querySelector('p#info_contacts').hidden = true;
				setTimeout(e => (document.querySelector('div#search').hidden = false), 400);
				setTimeout(e => showContacts(''), 800);
				hideConnexion(true);
			})
		)
		.catch(fetchError);

const addContact = (id, email) =>
	fetch(api + '?lier&identifiant=' + id + '&mail=' + email)
		.then(res => res.json().then(json => json.etat.message))
		.catch(fetchError);

const supContact = (id, contact_id) =>
	fetch(api + '?delier&identifiant=' + id + '&relation=' + contact_id)
		.then(res => res.json().then(json => showContacts()))
		.catch(fetchError);

const deleteContact = btn => {
	let id;
};

const qrCanvas = data => {
	let can = document.createElement('canvas');
	let mat = new QRCode(document.getElementById('qrcode'), data)._oQRCode.modules;
	can.width = mat[0].length;
	can.height = mat.length;
	let ctx = can.getContext('2d');
	ctx.fillStyle = '#131b20';

	for (let x = 0; x < can.width; x++) {
		for (let y = 0; y < can.height; y++) {
			if (mat[y][x]) ctx.fillRect(x, y, 1, 1);
		}
	}

	return can;
};

const showQRCode = e => {
	let qrdiv = document.querySelector('div#qrcode');
	let share = document.querySelector('div#share');
	let closeBtn = document.querySelector('div#qrtop i');

	document.querySelector('p#qremail').innerHTML = user.mail;
	document.querySelector('div#qrscreen').hidden = false;

	qrdiv.innerHTML = '';
	qrdiv.appendChild(qrCanvas(user.connect_link));

	document.querySelector('section').setAttribute('style', 'filter: blur(5px)');

	if ('share' in navigator) {
		document.querySelector('a#qrlink').innerHTML = 'Partager le lien';
		share.onclick = e => {
			navigator
				.share({
					title: document.title,
					text: 'Connexion à ' + user.mail,
					url: user.connect_link
				})
				.then(() => closeBtn.click());
		};
	} else {
		share.onclick = e => {
			navigator.clipboard
				.writeText(user.connect_link)
				.then(() => {
					alert('Lien copié.');
					closeBtn.click();
				})
				.catch(err => alert(err));
		};
	}
};

const showContacts = () => {
	setTimeout(e => {
		document.querySelector('p#add_contacts').hidden = user.contacts.length > 0;
	}, 400);

	let sidebar = document.querySelector('div#sidebar');
	let list = document.querySelector('div#contact-list');
	let template = document.querySelector('template.contact');
	let val = document.querySelector('div#search input').value.trim();

	list.innerHTML = '';

	for (let timeout of timeouts) clearTimeout(timeout);
	timeouts = [];

	let timeoff = 0;
	for (let c of user.contacts) {
		if (!val || c.identite.includes(val)) {
			timeouts.push(
				setTimeout(e => {
					list.appendChild(document.createElement('hr'));

					let div = template.cloneNode(true).content.firstElementChild;

					if (val) div.querySelector('.name').setAttribute('style', 'color: #6c757d;');
					div.querySelector('.name').innerHTML = c.identite.replace(val, '<span style="color: #f8f9fa;">' + val + '</span>');
					div.querySelector('.id').innerHTML = c.relation;

					div.onclick = e => {
						setTimeout(e => (sidebar.hidden = true), hideConnexion(true) ? 400 : 0);

						for (let d of document.querySelectorAll('div.contact')) d.classList.remove('selected');

						if (e.target.classList.contains('del')) console.log('del');
						else {
							div.classList.add('selected');
						}
					};

					list.appendChild(div);
				}, timeoff * 100)
			);
			timeoff++;
		}
	}
};

const connectUser = id => {
	if (!getCookie('user') || urlParams.has('connect')) {
		setCookie('user', id);
		location.replace(location.origin + location.pathname);
		return;
	}

	let title = document.querySelector('form#connexion h2');
	let msg = document.querySelector('p#id-msg');
	let showQRBtn = document.querySelector('i#showQR');
	let disconnectBtn = document.querySelector('i#disconnect');
	let cancelBtn = document.querySelector('i#cancel');

	msg.innerHTML = 'Connection...';

	const url = api + '?information&identifiant=' + id;

	fetch(url)
		.then(res =>
			res.json().then(json => {
				if (json.etat.reponse) {
					user = {
						mail: json.mail,
						id: json.identifiant,
						name: json.identite,
						contacts: [],
						connect_link: location.origin + location.pathname + '?connect=' + json.identifiant,
						contact_link: location.origin + location.pathname + '?contact=' + json.email
					};

					msg.innerHTML = user.mail;
					title.innerHTML = user.name;
					cancelBtn.hidden = true;
					showQRBtn.hidden = false;
					disconnectBtn.hidden = false;

					disconnectBtn.onclick = e => {
						if (confirm('Se déconnecter de ' + user.mail + '?')) {
							setCookie('user', '');
							location.reload();
						}
					};

					document.querySelector('#info_contacts').hidden = false;
					getRelations(user.id);
				}
			})
		)
		.catch(fetchError);
};

const sendID = () => {
	let input = document.querySelector('input#identifiant');
	let msg = document.querySelector('p#id-msg');
	let cancelBtn = document.querySelector('i#cancel');

	input.disabled = true;
	msg.classList.remove('green');
	msg.innerHTML = 'Validation...';
	document.querySelector('i#connect').hidden = true;
	cancelBtn.hidden = false;

	cancelBtn.onclick = e => {
		if (confirm('Annuler?')) {
			setCookie('user', '');
			location.reload();
		}
	};

	const url = api + '?activation=' + input.value;

	fetch(url)
		.then(res =>
			res.json().then(json => {
				if (json.etat.reponse) connectUser(json.identifiant);
			})
		)
		.catch(fetchError);
};

const isEmail = val => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(val);

const sendEmail = () => {
	let emailInput = document.querySelector('input#email');
	let nameInput = document.querySelector('input#name');

	const url = api + '?inscription&identite=' + nameInput.value.trim().replace(' ', '%20') + '&mail=' + emailInput.value;

	fetch(url)
		.then(res =>
			res.json().then(json => {
				if (confirm(json.etat.message)) {
					emailInput.value = '';
					nameInput.value = '';
				}
				checkEmailInput();
			})
		)
		.catch(err => {
			console.error('Erreur:', err);
			alert("Une erreur s'est Produite.");
		});
};

const checkIdInput = () => {
	let input = document.querySelector('input#identifiant');
	let msg = document.querySelector('p#id-msg');
	let btn = document.querySelector('form#connexion i');

	input.value = input.value.trim().toLowerCase();

	if (input.value.length == '') {
		// Par défaut
		msg.classList.remove('red');
		msg.classList.remove('green');
		btn.classList.add('disabled');
		msg.innerHTML = "Entrez l'identifiant reçu par email pour vous connecter.";
	} else if (input.value.length == 64) {
		// Valide
		msg.classList.remove('red');
		msg.classList.add('green');
		btn.classList.remove('disabled');
		msg.innerHTML = 'Cliquez sur "valider" pour vous connecter.';
	} else {
		// Invalide
		msg.classList.remove('green');
		msg.classList.add('red');
		btn.classList.add('disabled');
		msg.innerHTML = 'Identifiant invalide.';
	}
};

const checkEmailInput = () => {
	let emailInput = document.querySelector('input#email');
	let nameInput = document.querySelector('input#name');
	let msg = document.querySelector('p#email-msg');
	let btn = document.querySelector('form#inscription i');

	emailInput.value = emailInput.value.trim().toLowerCase();

	if (emailInput.value == '' || nameInput.value.length < 3) {
		// Par défaut
		msg.classList.remove('red');
		msg.classList.remove('green');
		btn.classList.add('disabled');
		msg.innerHTML = 'Un lien pour obtenir votre identifiant vous sera envoyé par email.';
	} else if (isEmail(emailInput.value)) {
		// Valide
		msg.classList.remove('red');
		msg.classList.add('green');
		btn.classList.remove('disabled');
		msg.innerHTML = 'Cliquez sur "envoyer" pour recevoir votre identifiant par email.';
	} else {
		// Invalide
		msg.classList.remove('green');
		msg.classList.add('red');
		btn.classList.add('disabled');
		msg.innerHTML = 'Email invalide.';
	}
};

const showHomescreen = () => {
	let idInput = document.querySelector('input#identifiant');
	let emailInput = document.querySelector('input#email');
	let nameInput = document.querySelector('input#name');
	let sendBtn = document.querySelector('div#email-input i');
	let connectBtn = document.querySelector('div#id-input i');

	setTimeout(() => (document.querySelector('form#connexion').hidden = false), 400);
	if (!getCookie('user')) setTimeout(() => (document.querySelector('form#inscription').hidden = false), 600);

	nameInput.addEventListener('input', checkEmailInput);
	emailInput.addEventListener('input', checkEmailInput);
	idInput.addEventListener('input', checkIdInput);

	setTimeout(checkEmailInput(), 100);
	setTimeout(checkIdInput(), 100);

	sendBtn.addEventListener('click', e => {
		if (!sendBtn.classList.contains('disabled')) {
			sendBtn.classList.add('disabled');
			sendEmail();
		}
	});

	connectBtn.addEventListener('click', e => {
		if (!connectBtn.classList.contains('disabled')) {
			connectBtn.classList.add('disabled');
			sendID();
		}
	});
};

const hideConnexion = mode => {
	let sec = document.querySelector('section');
	let prev = !sec.classList.contains('hide-connexion');

	if (mode) {
		sec.classList.add('hide-connexion');
		document.querySelector('header').classList.add('more');

		document.querySelector('i#action').innerHTML = 'question_answer';
		document.querySelector('h2#title').innerHTML = user.name;
		document.querySelector('p#subtitle').innerHTML = user.mail;
	} else {
		sec.classList.remove('hide-connexion');

		document.querySelector('i#action').innerHTML = 'account_circle';
		document.querySelector('h2#title').innerHTML = 'WhatSoup';
		document.querySelector('p#subtitle').innerHTML = 'Accueil';
	}

	return prev;
};

onload = e => {
	showHomescreen();

	let userID = null;
	if (getCookie('user')) userID = getCookie('user');
	if (urlParams.has('connect')) userID = urlParams.get('connect');

	if (userID) {
		document.querySelector('input#identifiant').value = userID;
		checkIdInput();
		setTimeout(() => document.querySelector('i#connect').click(), 1000);
	}
};
