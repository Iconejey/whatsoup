const id = getCookie('id');
const api = 'https://trankillprojets.fr/wal/wal.php';

const headerClasses = document.querySelector('header').classList;

const getRelations = id =>
	fetch(api + '?relations&identifiant=' + id)
		.then(res => res.json().then(json => json.relations))
		.catch(err => console.error('Erreur:', err));

const addContact = (id, email) =>
	fetch(api + '?lier&identifiant=' + id + '&mail=' + email)
		.then(res => res.json().then(json => json.etat.message))
		.catch(err => console.error('Erreur:', err));

const supContact = (id, email) =>
	fetch(api + '?delier&identifiant=' + id + '&mail=' + email)
		.then(res => res.json().then(json => json.etat.message))
		.catch(err => console.error('Erreur:', err));

const logIn = () => {
	document.querySelector('i#action').innerHTML = 'supervisor_account'; // question_answer
	document.querySelector('h2#title').innerHTML = 'Nicolas Gouwy';
	document.querySelector('p#subtitle').innerHTML = 'nicolas.gwy@gmail.com';
	headerClasses.add('back');
	headerClasses.add('more');
};

if (id) logIn();
else document.querySelector('section#sign-up').hidden = false;

setTimeout(() => logIn(), 2000);
