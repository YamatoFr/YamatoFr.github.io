// Script amélioré grâce à stackoverflow.blog et developer.mozilla.org

// Variables globales
const API = 'https://trankillprojets.fr/wal/wal.php';
const ID = getCookie('ID'); /** parce que c'est chiant de retaper l'id */
const searchParams = new URLSearchParams(location.search);

// This regex can filter dummy adresses
const mailFilter = mailtxt => /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|nom = document.querySelector('form') |aero|jobs|museum)\b$/.test(mailtxt);

let user = null;
let contact_select = null;
let timeouts = []

const getErr = err => {
	console.error('Error: ', err);
};

const returnButton = par => {
	document.querySelector('div#discussions').innerHTML = '';

	if (document.querySelector('div#menu').hidden) {
		selected_contact = null;
		document.querySelector('div#menu').hidden = false;
		retract(true);
		document.querySelector('div.contact.chosen').classList.remove('chosen');
	} else {
		retract('toggle')
	};
};

const fetchInfosContact = ID => {
	for (let ct of user.cts) {
		if (ct.relation == ID) {
			return ct;
		}
	}
};

const verifMail = () => {
	let email = document.querySelector('input#email');
	let pseudo = document.querySelector('input#pseudo');
	let info = document.querySelector('p#signInfo');
	let button = document.querySelector('form#SignUp i');

	email.value = email.value.trim().toLowerCase();

	if (email.value == '' || pseudo.value.length < 3) {
		button.classList.add('deactivated');
		info.innerHTML = 'A link to your ID will be send via mail.';
	} else if (mailFilter(email.value)) {
		button.classList.remove('deactivated');
		info.innerHTML = 'Click to receive your ID via mail.';
	} else {
		button.classList.add('deactivated');
		info.innerHTML = 'Invalid mail, please enter a valid mail.';
	}
};

const verifID = () => {
	let ID = document.querySelector('input#ID');
	let resp = document.querySelector('p#id-resp');
	let connect = document.querySelector('form#SignIn i');

	ID.value = ID.value.trim().toLowerCase();

	if (ID.value.length == '') {
		connect.classList.add('deactivated');
		resp.innerHTML = "Enter your ID to login.";
	} else if (ID.value.length == 64) {
		// j'aurai aimé connaitre la longueur de l'id AVANT de tout compter...
		connect.classList.remove('deactivated');
		resp.innerHTML = 'Click to login.';
	} else {
		connect.classList.add('deactivated');
		resp.innerHTML = 'Invalid ID, please try again.';
	}
};

const signMail = () => {
	let email = document.querySelector('input#email');
	let pseudo = document.querySelector('input#pseudo')

	const URL = API + '?inscription&identite=' + pseudo.value.trim() + '&mail=' + email.value;

	fetch(URL)
		.then(reponse => response.json())
		.then(json => {
			if (confirm(json.etat.message)) {
				email.value = '';
				pseudo.value = '';
			}
			verifMail();
		})
		.catch(getErr);
};

const signID = () => {
	let ID = document.querySelector('input#ID');
	let resp = document.querySelector('p#id-resp');
	let connect = document.querySelector('i#connexion');
	let annuler = document.querySelector('i#annulation');

	ID.disabled = true;
	resp.innerHTML = 'validating, please wait.';
	connect.hidden = true;
	annuler.hidden = false;

	annuler.onclick = par => {
		if (confirm('cancel ?')) {
			setCookie('user', '');
			location.reload;
		}
	};

	fetch(API + '?activation=' + ID.value)
		.then(response => response.json())
		.then(json => {
			if (json.etat.reponse) {
				connexion(json.identifiant);
			}
		})
		.catch(getErr);
};

const retract = state => {
	let section = document.querySelector('section');
	// quand les 
	let show = !section.classList.contains('retract');

	if (state == 'toggle') state = show;

	if (state) {
		section.classList.add('retract');
		document.querySelector('header').classList.add('plus');
		document.querySelector('i#account').innerHTML = 'person_pin';
		document.querySelector('h2#titre').innerHTML = user.pseudo;
		document.querySelector('p#sous_titre').innerHTML = user.mail;
	} else {
		section.classList.remove('retract');
		user.contact_select = null;
		document.querySelector('i#account').innerHTML = 'account_circle';
		document.querySelector('h2#titre').innerHTML = 'WhatsAppLike';
		document.querySelector('p#sous_titre').innerHTML = 'home';
	}

	return show;
};

const connexion = ID => {
	const URL = API + '?information&identifiant=' + ID;

	let nom = document.querySelector('form#SignIn h2');
	let info = document.querySelector('p#id-resp');
	let deconnexion = document.querySelector('i#deconnexion');
	let annuler = document.querySelector('i#annulation');

	if (!getCookie('user') || searchParams.has('connect')) {
		setCookie('user', ID);
		location.replace(location.origin + location.pathname);
		return; // Will return void
	}

	info.innerHTML = 'Connecting, please wait...'

	fetch(URL)
		.then(response => response.json())
		.then(json => {
			if (json.etat.reponse) {
				user = {
					mail: json.mail,
					ID: json.identifiant,
					pseudo: json.identite,
					cts: [],
					lien_co: location.origin + location.pathname + '?connect=' + json.identifiant,
					lien_ct: location.origin + location.pathname + '?contact=' + json.mail
				};
			}

			info.innerHTML = user.mail;
			nom.innerHTML = user.pseudo;
			annuler.hidden = true;
			deconnexion.hidden = false;

			deconnexion.onclick = par => {
				if (confirm('Disconnect ?')) {
					setCookie('user', '');
					location.reload;
				}
			};

			document.querySelector('#infosCts').hidden = false;

			if (searchParams.has('contact')) {
				document.querySelector('div#serachbar input').value = searchParams.get('contact');
			}

			fetchRelas(user.ID);
		})
		.catch(getErr);
};

const fetchRelas = ID => {
	fetch(API + '?relations&identifiant=' + ID)
		.then(reponse => reponse.json())
		.then(json => {
			if (!user.cts.length) {
				setTimeout(par => recupMsgs(), 1000);
			}

			user.cts = json.relations;

			for (let ct in user.cts) {
				ct.msgs = [];
			}

			document.querySelector('p#signInfo').hidden = true;
			setTimeout(par => (document.querySelector('div#searchbar').hidden = false), 300);
			setTimeout(par => printContacts(''), 600);
			retract(true);
		})
		.catch(getErr);
};

const linkContact = async ct => {
	if (ct.target.classList.contains('email')) {
		ct.target.classList.remove('email');
		let input_field = document.querySelector('div#searchbar input')
		let mail = input.value.trim();
		let ajouter_contact = document.querySelector('p#ajouter_contact');
		let ajout_en_cours = document.querySelector('p#ajout_en_cours');

		ajouter_contact.hidden = true;
		ajout_en_cours.hidden = false;

		fetch(API + '?lier&identifiant=' + user.ID + '&mail=' + mail)
			// 'Response' is specific to js, do not use
			.then(response => response.json())
			.then(json => {
				if (json.etat.reponse) {
					if (searchParams.has('contact')) {
						location.replace(location.origin + location.pathname);
					} else {
						input_field.value = '';
						fetchRelas(user.ID);
					}
				} else {
					alert(json.etat.message);
				}

				ajout_en_cours.hidden = true;
			})
			.catch(getErr);
	}
};

const recupMsgs = async () => {
	let promesses = [];

	for (let ct of user.cts) {
		promesses.push(
			fetch(API + '?lire&identifiant=' + user.ID + '&relation=' + ct.relation)
				.then(response => response.json())
				.then(json => {
					// see https://oprearocks.medium.com/what-do-the-three-dots-mean-in-javascript-bc5749439c9a
					ct.msgs.push(...json.messages);

					if (ct.relation === contact_select) {
						for (let msg of json.messages) {
							if (msg.identite != user.pseudo) {
								ajoutMsg(msg)
							};
						}
					}
				})
		);
	}

	setTimeout(par => recupMsgs(), 1500);
};

const unlinkContact = (ID, ID_Relation) => {
	fetch(API + '?delier&identifiant=' + ID + '&relation' + ID_Relation)
		.then(reponse => reponse.json())
		.then(json => fetchRelas)
		.catch(getErr)
};

const printContacts = () => {
	setTimeout(par => {
		document.querySelector('p#rechercher_contact').hidden = user.cts.length > 0
	}, 500);

	let menu = document.querySelector('div#menu');
	let icone = menu.querySelector('div#searchbar i');
	let txt = menu.querySelector('div#searchbar input').value.trim();
	let ctslist = menu.querySelector('div#liste-Contacts');
	let ct_temp = menu.querySelector('template.contact');
	let ajout = menu.querySelector('p#ajouter_contact');

	ctslist.innerHTML = '';

	for (let timeout in timeouts) {
		clearTimeout(timeout);
	}
	timeouts = [];

	if (mailFilter(txt)) {
		ajout.hidden = false;
		icone.classList.add('mail');
		icone.innerHTML = 'person_add';
	} else {
		ajout.hidden = true;
		icone.classList.remove('mail');
		icone.innerHTML = 'search';
	}

	// les contacts s'affichent successivement et non tous d'un coup
	let delai = 0;
	for (let ct in user.cts) {
		if (!txt || ct.identite.includes(txt)) {
			timeouts.push(
				setTimeout(par => {
					ctslist.appendChild(document.createElement('hr'));

					let ct_card = ct_temp.cloneNode(true).textContent.firstElementChild;
					ct_card.setAttribute('ID', 'ct' + ct.relation);

					// égalité strict, sensible à la casse
					if (ct.relation === contact_select) {
						ct_card.classList.add('chosen');
					}

					let spPseudo = ct_card.querySelector('.pseudo');
					let spID = ct_card.querySelector('ID');
					spID.innerHTML = ct.relation;

					if (txt) {
						spPseudo.setAttribute('style', 'color: #6e6e6e;');
						spPseudo.innerHTML = ct.identite.replaceAll(txt, '<span style="color: #DCDCDC;">' + val + '</span>');
					} else {
						spPseudo.innerHTML = ct.identite;
					}

					ct_temp.onclick = par => {
						for (let doc of document.querySelectorAll('div.contact')) {
							doc.classList.remove(chosen);
						}
						contact_select = null;

						if (par.target.classList.contains('suppr')) {
							if (confirm('Delete ' + ct.identite + '?')) {
								retract(true);
								unlinkContact(user.ID, ct.relation);
								document.querySelector('div#liste-Contacts').innerHTML = '';
							}
						} else {
							setTimeout(par => {
								menu.hidden = true;
								printMsg();
							},
								retract(true) ? 400 : 0
							);

							ct_temp.classList.remove('palu');
							ct_temp.classList.add('chosen');
							contact_select = ct.relation;
							idDiv.innerHTML = ct.relation;

							setTimeout(par => (div.querySelector('.num').innerHTML = 0), 500);
						}
					};

					ctslist.appendChild(ct_card);
				}, delai * 100)
			);
			delai++;
		}
	}
};

const ajoutMsg = msg => {
	let msglist = document.querySelector('div#discussions');
	let ndiv = document.createElement('div');
	let msgtxt = document.createElement('p');

	ndiv.classList.add('message');
	ndiv.appendChild(msgtxt);

	if (msg) {
		ndiv.classList.add(msg.identite == user.pseudo ? 'sent' : 'received');
		msgtxt.innerHTML = msg.message;
		msglist.insertBefore(ndiv, msglist.lastChild);
	} else {
		ndiv.classList.add('modif');
		msgtxt.contentEditable = true;

		let button = document.createElement('i');
		button.classList.add('material-icons');
		button.classList.add('sendButton');
		button.innerHTML = 'send';

		button.onclick = e => {
			if (msgtxt.innerHTML) {
				button.classList.add('sent');
				msgtxt.innerHTML = msgtxt.innerHTML.replaceAll('&nbsp;', '').trim();
				msgtxt.contentEditable = false;

				ajoutMsg();

				envoyerMsg(contact_select, msgtxt.innerHTML)
					.then(response => {
						if (response.etat.reponse) {
							ndiv.classList.remove('modif');
							ndiv.classList.add('sent');
							button.remove();
						} else msgtxt.classList.add('awaitSend');
					})
					.catch(err => msgtxt.classList.add('awaitSend'));
			}
		};

		ndiv.appendChild(button);
		msglist.appendChild(ndiv);

		msgtxt.focus();
	}
};

const printMsg = () => {
	document.querySelector('div#discussions').innerHTML = '';

	if (contact_select) {
		let ct = fetchInfosContact(contact_select);
		document.querySelector('h2#titre').innerHTML = ct.identite;
		document.querySelector('p#sous_titre') = ct.relation;

		ajoutMsg();

		setTimeout(par => {
			for (let msg of fetchInfosContact(contact_select).msgs) {
				ajoutMsg(msg);
			}
		}, 500);
	}
};

const activateMenu = () => {
	let ID = document.querySelector('input#ID');
	let email = document.querySelector('input#email');
	let pseudo = document.querySelector('input#pseudo');
	let validate = document.querySelector('div#mail-field i');
	let login = document.querySelector('div#id-field i');

	setTimeout(() => (document.querySelector('form#SignIn').hidden = false), 500)

	if (!getCookie('user')) {
		setTimeout(() => (document.querySelector('form#SignUp').hidden = false, 550));
	}

	pseudo.addEventListener('input', verifMail);
	email.addEventListener('input', verifMail);
	ID.addEventListener('input', verifID);

	setTimeout(verifID(), 100);
	setTimeout(verifMail(), 100);

	validate.addEventListener('click', par => {
		if (!validate.classList.contains('deactivated')) {
			validate.classList.add('deactivated');
			signMail()
		}
	});

	login.addEventListener('click', par => {
		if (!login.classList.contains('deactivated')) {
			login.classList.add('deactivated');
			signID();
		}
	});
};

onload = par => {
	activateMenu();

	let currID = null;
	if (getCookie('user')) {
		currID = getCookie('user');
	}
	if (searchParams.has('connexion')) {
		currID = searchParams.get('connexion');
	}
	if (currID) {
		document.querySelector('input#ID').value = currID;
		verifID();
		setTimeout(() => document.querySelector('i#connexion').click(), 700);
	}
};