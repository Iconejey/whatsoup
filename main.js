const id = getCookie('id');
const api = 'https://trankillprojets.fr/wal/wal.php';
const urlParams = new URLSearchParams(location.search);

let user = null;

const fetchError = err => {
	console.error('Erreur:', err);
	if (confirm("Une erreur s'est Produite.\nRecharger la page?")) location.reload();
};

const getRelations = id =>
	fetch(api + '?relations&identifiant=' + id)
		.then(res => res.json().then(json => json.relations))
		.catch(fetchError);

const addContact = (id, email) =>
	fetch(api + '?lier&identifiant=' + id + '&mail=' + email)
		.then(res => res.json().then(json => json.etat.message))
		.catch(fetchError);

const supContact = (id, email) =>
	fetch(api + '?delier&identifiant=' + id + '&mail=' + email)
		.then(res => res.json().then(json => json.etat.message))
		.catch(fetchError);

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

const connectUser = id => {
	let title = document.querySelector('form#connexion h2');
	let msg = document.querySelector('p#id-msg');
	let connectBtn = document.querySelector('i#connect');
	let showQRBtn = document.querySelector('i#showQR');
	let disconnectBtn = document.querySelector('i#disconnect');

	if (!getCookie('user') || urlParams.has('connect')) {
		setCookie('user', id);
		location.replace(location.origin + location.pathname);
		return;
	}

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
						connect_link: location.origin + location.pathname + '?connect=' + json.identifiant,
						contact_link: location.origin + location.pathname + '?contact=' + json.email
					};

					msg.innerHTML = user.mail;
					title.innerHTML = user.name;
					connectBtn.hidden = true;
					showQRBtn.hidden = false;
					disconnectBtn.hidden = false;

					disconnectBtn.addEventListener('click', e => {
						if (confirm('Se déconnecter de ' + user.mail + '?')) {
							setCookie('user', '');
							location.reload();
						}
					});

					showQRBtn.addEventListener('click', e => {
						let qrdiv = document.querySelector('div#qrcode');
						qrdiv.innerHTML = '';
						qrdiv.appendChild(qrCanvas(user.connect_link));
						document.querySelector('p#qremail').innerHTML = user.mail;
						document.querySelector('div#qrscreen').hidden = false;

						let share = document.querySelector('div#share');
						let closeBtn = document.querySelector('div#qrtop i');

						if ('share' in navigator) {
							document.querySelector('div#qrlink').innerHTML = 'Partager le lien';
							share.addEventListener('click', e => {
								navigator
									.share({
										title: document.title,
										text: 'Hello World',
										url: 'https://developer.mozilla.org'
									})
									.then(() => closeBtn.click());
							});
						} else {
							share.addEventListener('click', e => {
								navigator.clipboard
									.writeText(user.connect_link)
									.then(() => {
										alert('Lien copié.');
										closeBtn.click();
									})
									.catch(err => alert(err));
							});
						}
					});
				}
			})
		)
		.catch(fetchError);
};

const sendID = () => {
	let input = document.querySelector('input#identifiant');
	let msg = document.querySelector('p#id-msg');

	input.disabled = true;
	msg.classList.remove('green');
	msg.innerHTML = 'Validation...';

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

let checkIdInput = () => {
	let input = document.querySelector('input#identifiant');
	let msg = document.querySelector('p#id-msg');
	let btn = document.querySelector('form#connexion i');

	input.value = input.value.trim().toLowerCase();

	if (input.value.length == '') {
		msg.classList.remove('red');
		msg.classList.remove('green');
		btn.classList.add('disabled');
		msg.innerHTML = "Entrez l'identifiant reçu par email pour vous connecter.";
	} else if (input.value.length == 64) {
		msg.classList.remove('red');
		msg.classList.add('green');
		btn.classList.remove('disabled');
		msg.innerHTML = 'Cliquez sur "valider" pour vous connecter.';
	} else {
		msg.classList.remove('green');
		msg.classList.add('red');
		btn.classList.add('disabled');
		msg.innerHTML = 'Identifiant invalide.';
	}
};

let checkEmailInput = () => {
	let emailInput = document.querySelector('input#email');
	let nameInput = document.querySelector('input#name');
	let msg = document.querySelector('p#email-msg');
	let btn = document.querySelector('form#inscription i');

	emailInput.value = emailInput.value.trim().toLowerCase();

	if (emailInput.value == '' || nameInput.value.length < 3) {
		msg.classList.remove('red');
		msg.classList.remove('green');
		btn.classList.add('disabled');
		msg.innerHTML = 'Un lien pour obtenir votre identifiant vous sera envoyé par email.';
	} else if (isEmail(emailInput.value)) {
		msg.classList.remove('red');
		msg.classList.add('green');
		btn.classList.remove('disabled');
		msg.innerHTML = 'Cliquez sur "envoyer" pour recevoir votre identifiant par email.';
	} else {
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

const showContacts = () => {
	document.querySelector('i#action').innerHTML = 'send'; // question_answer perm_phone_msg supervisor_account
	document.querySelector('h2#title').innerHTML = 'Nicolas Gouwy';
	document.querySelector('p#subtitle').innerHTML = 'nicolas.gwy@gmail.com';
	document.querySelector('header').classList.add('more');
	document.querySelector('header').classList.add('back');
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
