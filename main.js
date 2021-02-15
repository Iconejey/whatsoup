const id = getCookie('id');
const api = 'https://trankillprojets.fr/wal/wal.php';
const urlParams = new URLSearchParams(location.search);

let user = null;
let timeouts = [];
let selected_contact = null;

const getContactInfo = id => {
	for (let c of user.contacts) if (c.relation == id) return c;
};

const fetchError = err => {
	console.error('Erreur:', err);
	if (confirm("Une erreur s'est Produite.\nRecharger la page?")) location.reload();
};

const getRelations = id =>
	fetch(api + '?relations&identifiant=' + id)
		.then(res => res.json())
		.then(async json => {
			if (!user.contacts.length) setTimeout(e => fetchMessages(), 1000);
			user.contacts = json.relations;
			for (let c of user.contacts) c.messages = [];
			document.querySelector('p#info_contacts').hidden = true;
			setTimeout(e => (document.querySelector('div#search').hidden = false), 400);
			setTimeout(e => showContacts(''), 800);
			hideConnexion(true);
		})
		.catch(fetchError);

const supContact = (id, contact_id) =>
	fetch(api + '?delier&identifiant=' + id + '&relation=' + contact_id)
		.then(res => res.json())
		.then(json => getRelations(user.id))
		.catch(fetchError);

const sendMessage = (contact, message) =>
	fetch(api + '?ecrire&identifiant=' + user.id + '&relation=' + contact + '&message=' + encodeURI(message.trim()).replaceAll("'", '%27'))
		.then(res => res.json())
		.then(json => json);

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

const showQRCode = contact => {
	let qrdiv = document.querySelector('div#qrcode');
	let share = document.querySelector('div#share');
	let closeBtn = document.querySelector('div#qrtop i');

	document.querySelector('div#qrtitle h2').innerHTML = contact ? 'Contact' : 'Connexion';
	document.querySelector('p#qremail').innerHTML = user.mail;
	document.querySelector('p#qrsubtitle').innerHTML = contact
		? 'Scannez le QRcode avec un smartphone ou une tablette pour ajouter ' + user.name + ' à vos contacts.'
		: 'Scannez le QRcode avec un smartphone ou une tablette pour vous connecter instantanément.';
	document.querySelector('div#qrscreen').hidden = false;

	qrdiv.innerHTML = '';

	let link = contact ? user.contact_link : user.connect_link;
	qrdiv.appendChild(qrCanvas(link));

	document.querySelector('section').setAttribute('style', 'filter: blur(5px)');

	if ('share' in navigator) {
		document.querySelector('a#qrlink').innerHTML = 'Partager le lien';
		share.onclick = e => {
			navigator
				.share({
					title: document.title,
					text: 'Connexion à ' + user.mail,
					url: link
				})
				.then(() => closeBtn.click());
		};
	} else {
		share.onclick = e => {
			navigator.clipboard
				.writeText(link)
				.then(() => {
					alert('Lien copié.');
					closeBtn.click();
				})
				.catch(err => alert(err));
		};
	}
};

const backBtn = e => {
	if (document.querySelector('div#sidebar').hidden) {
		selected_contact = null;
		document.querySelector('div#sidebar').hidden = false;
		hideConnexion(true);
		showContacts();
	} else hideConnexion('toggle');
};

const addContact = async e => {
	if (e.target.classList.contains('email')) {
		e.target.classList.remove('email');
		let input = document.querySelector('div#search input');
		let email = input.value.trim();
		let add_contact = document.querySelector('p#add_contact');
		let adding_contact = document.querySelector('p#adding_contact');

		add_contact.hidden = true;
		adding_contact.hidden = false;

		fetch(api + '?lier&identifiant=' + user.id + '&mail=' + email)
			.then(res => res.json())
			.then(json => {
				if (json.etat.reponse) {
					if (urlParams.has('contact')) location.replace(location.origin + location.pathname);
					else {
						input.value = '';
						getRelations(user.id);
					}
				} else alert(json.etat.message);

				adding_contact.hidden = true;
			})
			.catch(fetchError);
	}
};

const showContacts = () => {
	setTimeout(e => {
		document.querySelector('p#search_contact').hidden = user.contacts.length > 0;
	}, 400);

	let sidebar = document.querySelector('div#sidebar');
	let list = sidebar.querySelector('div#contact-list');
	let template = sidebar.querySelector('template.contact');
	let val = sidebar.querySelector('div#search input').value.trim();
	let search_icon = sidebar.querySelector('div#search i');
	let add_info = sidebar.querySelector('p#add_contact');

	list.innerHTML = '';

	for (let timeout of timeouts) clearTimeout(timeout);
	timeouts = [];

	if (isEmail(val)) {
		add_info.hidden = false;
		search_icon.classList.add('email');
		search_icon.innerHTML = 'person_add';
	} else {
		add_info.hidden = true;
		search_icon.classList.remove('email');
		search_icon.innerHTML = 'search';
	}

	let timeoff = 0;
	for (let c of user.contacts) {
		if (!val || c.identite.includes(val)) {
			timeouts.push(
				setTimeout(e => {
					list.appendChild(document.createElement('hr'));

					let div = template.cloneNode(true).content.firstElementChild;
					div.setAttribute('id', 'c' + c.relation);

					if (c.relation === selected_contact) div.classList.add('selected');

					let nameDiv = div.querySelector('.name');

					if (val) {
						nameDiv.setAttribute('style', 'color: #6c757d;');
						nameDiv.innerHTML = c.identite.replaceAll(val, '<span style="color: #f8f9fa;">' + val + '</span>');
					} else nameDiv.innerHTML = c.identite;

					div.querySelector('.id').innerHTML = c.relation;

					div.onclick = e => {
						for (let d of document.querySelectorAll('div.contact')) d.classList.remove('selected');
						selected_contact = null;

						if (e.target.classList.contains('del')) {
							if (confirm('Supprimer ' + c.identite + '?')) {
								hideConnexion(true);
								supContact(user.id, c.relation);
								document.querySelector('div#contact-list').innerHTML = '';
							}
						} else {
							setTimeout(e => (sidebar.hidden = true), hideConnexion(true) ? 400 : 0);
							div.classList.add('selected');
							selected_contact = c.relation;
							showMessages();
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
		.then(res => res.json())
		.then(json => {
			if (json.etat.reponse) {
				user = {
					mail: json.mail,
					id: json.identifiant,
					name: json.identite,
					contacts: [],
					connect_link: location.origin + location.pathname + '?connect=' + json.identifiant,
					contact_link: location.origin + location.pathname + '?contact=' + json.mail
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

				if (urlParams.has('contact')) document.querySelector('div#search input').value = urlParams.get('contact');
				getRelations(user.id);
			}
		})
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

	fetch(api + '?activation=' + input.value)
		.then(res => res.json())
		.then(json => {
			if (json.etat.reponse) connectUser(json.identifiant);
		})
		.catch(fetchError);
};

const isEmail = val => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(val);

const sendEmail = () => {
	let emailInput = document.querySelector('input#email');
	let nameInput = document.querySelector('input#name');

	const url = api + '?inscription&identite=' + encodeURI(nameInput.value.trim()) + '&mail=' + encodeURI(emailInput.value);

	fetch(url.replaceAll("'", '%27'))
		.then(res => res.json())
		.then(json => {
			if (confirm(json.etat.message)) {
				emailInput.value = '';
				nameInput.value = '';
			}
			checkEmailInput();
		})
		.catch(fetchError);
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

const fetchMessages = async () => {
	let promises = [];

	for (let c of user.contacts)
		promises.push(
			fetch(api + '?lire&identifiant=' + user.id + '&relation=' + c.relation)
				.then(res => res.json())
				.then(json => {
					c.messages.push(...json.messages);
					if (c.relation === selected_contact) for (let m of json.messages) if (m.identite != user.name) addMessage(m);
				})
		);

	await Promise.all(promises).catch(err => console.error(err));

	console.log('fetched');
	setTimeout(e => fetchMessages(), 2000);
};

const showMessages = () => {
	document.querySelector('div#messages').innerHTML = '';

	if (selected_contact) {
		let c = getContactInfo(selected_contact);
		document.querySelector('h2#title').innerHTML = c.identite;
		document.querySelector('p#subtitle').innerHTML = c.relation;

		addMessage();

		setTimeout(e => {
			for (let m of getContactInfo(selected_contact).messages) addMessage(m);
		}, 400);
	}
};

const addMessage = m => {
	let list = document.querySelector('div#messages');
	let elem = document.createElement('div');
	let text = document.createElement('p');

	elem.classList.add('message');
	elem.appendChild(text);

	if (m) {
		elem.classList.add(m.identite == user.name ? 'right' : 'left');
		text.innerHTML = m.message;
		list.insertBefore(elem, list.lastChild);
	} else {
		elem.classList.add('edit');
		text.contentEditable = true;

		let btn = document.createElement('i');
		btn.classList.add('material-icons');
		btn.classList.add('message-btn');
		btn.innerHTML = 'send';

		btn.onclick = e => {
			if (text.innerHTML) {
				btn.classList.add('sent');
				text.contentEditable = false;

				addMessage();

				sendMessage(selected_contact, text.innerHTML)
					.then(res => {
						console.log(text.innerHTML, res);

						if (res.etat.reponse) {
							elem.classList.remove('edit');
							elem.classList.add('right');
							btn.remove();
						} else text.classList.add('not-sent');
					})
					.catch(err => text.classList.add('not-sent'));
			}
		};

		elem.appendChild(btn);
		list.appendChild(elem);
		text.focus();
	}
};

const hideConnexion = mode => {
	let sec = document.querySelector('section');
	let prev = !sec.classList.contains('hide-connexion');

	if (mode == 'toggle') mode = prev;

	if (mode) {
		sec.classList.add('hide-connexion');
		document.querySelector('header').classList.add('more');
		document.querySelector('i#action').innerHTML = 'question_answer';
		document.querySelector('h2#title').innerHTML = user.name;
		document.querySelector('p#subtitle').innerHTML = user.mail;
	} else {
		sec.classList.remove('hide-connexion');
		user.selected_contact = null;
		document.querySelector('i#action').innerHTML = 'account_circle';
		document.querySelector('h2#title').innerHTML = 'WhatSoup';
		document.querySelector('p#subtitle').innerHTML = 'Accueil';
	}

	return prev;
};

onpopstate = e => {
	if (e.state && e.state.noBackExitsApp) {
		history.pushState({ noBackExitsApp: true }, '');
		backBtn();
	}
};

onload = e => {
	history.pushState({ noBackExitsApp: true }, '');
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
