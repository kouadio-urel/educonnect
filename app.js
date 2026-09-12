// ==========================================
// 1. CONFIGURATION ET CONNEXION CLOUD FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBOBxcf0Y3VSIARUXsymUvJOZWSnZGFWf0",
    authDomain: "://firebaseapp.com",
    databaseURL: "https://firebaseio.com",
    projectId: "educonnect-ci-35f82",
    storageBucket: "educonnect-ci-35f82.firebasestorage.app",
    messagingSenderId: "12681914837",
    appId: "1:12681914837:web:66d7657c18297e03cd355c",
    measurementId: "G-JREBB4V314"
};

// Initialisation via la variable globale du navigateur
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const dbRefProfs = db.ref('professeurs');

let listeProfs = [];
const CODE_SECRET_ADMIN = "225_ADMIN"; 

// Synchronisation en temps réel avec Firebase Cloud
dbRefProfs.on('value', (snapshot) => {
    const donnees = snapshot.val();
    listeProfs = [];
    
    if (donnees) {
        Object.keys(donnees).forEach(idUnique => {
            listeProfs.push({
                id: idUnique,
                ...donnees[idUnique]
            });
        });
    }
    actualiserCompteur();
    afficherTousLesProfs();
});

// ==========================================
// 2. LOGIQUE METIER ET AFFICHAGE
// ==========================================
function actualiserCompteur() {
    const compteur = document.getElementById('compteur-profs');
    if (compteur) {
        compteur.innerText = listeProfs.length;
    }
}

function afficherTousLesProfs() {
    const conteneur = document.getElementById('liste-professeurs');
    if (!conteneur) return;
    conteneur.innerHTML = ""; 

    if (listeProfs.length === 0) {
        conteneur.innerHTML = "<p style='text-align:center;color:gray;margin-top:20px;'>Aucun répétiteur inscrit pour le moment.</p>";
        return;
    }

    listeProfs.forEach(prof => {
        const carte = document.createElement('div');
        carte.className = 'prof-card';
        carte.setAttribute('data-search', (prof.matiere + ' ' + prof.ville + ' ' + prof.quartier).toLowerCase());
        
        let etoiles = "⭐".repeat(prof.note || 3);

        carte.innerHTML = `
            <h3>${prof.nom}</h3>
            <p>📚 <b>Matière :</b> ${prof.matiere}</p>
            <p>📍 <b>Lieu :</b> ${prof.ville} - ${prof.quartier}</p>
            <p><b>Avis des élèves :</b> ${etoiles}</p>
            <div class="action-row">
                <button class="btn-whatsapp" onclick="ouvrirWhatsApp('${prof.whatsapp}', '${prof.matiere}')">💬 WhatsApp</button>
                <button class="btn-like" onclick="likerProf('${prof.id}', ${prof.note || 3})">👍 Voter (+1 Étoile)</button>
                <button class="btn-supprimer" onclick="supprimerProfSécure('${prof.id}')">🗑 Retirer (Admin)</button>
            </div>
        `;
        conteneur.appendChild(carte);
    });
}

function filtrerProfs() {
    var saisie = document.getElementById('moteur-recherche').value.toLowerCase();
    var cartes = document.getElementsByClassName('prof-card');
    for (var i = 0; i < cartes.length; i++) {
        var texte = cartes[i].getAttribute('data-search');
        if (texte.includes(saisie)) {
            cartes[i].classList.remove('hidden');
        } else {
            cartes[i].classList.add('hidden');
        }
    }
}

// ==========================================
// 3. PERSISTANCE ACTIONS DANS LE CLOUD
// ==========================================
function likerProf(idUnique, noteActuelle) {
    if (noteActuelle < 5) {
        db.ref('professeurs/' + idUnique).update({ note: noteActuelle + 1 });
        alert("Merci pour ton vote ! Note mise à jour dans la base Firebase.");
    } else {
        alert("Cet enseignant a déjà la note maximale de 5 étoiles !");
    }
}

function supprimerProfSécure(idUnique) {
    let motDePasse = prompt("🔒 Action réservée à la direction. Entrez le code secret Admin pour supprimer :");
    if (motDePasse === CODE_SECRET_ADMIN) {
        if (confirm("Confirmez-vous le retrait de cet enseignant de la plateforme ?")) {
            db.ref('professeurs/' + idUnique).remove()
                .then(() => alert("Enseignant retiré de Firebase."));
        }
    } else {
        alert("❌ Code incorrect. Action annulée.");
    }
}

function ouvrirWhatsApp(numero, matiere) {
    var message = "Bonjour, je vous contacte depuis l'application EduConnect CI car j'ai besoin d'un répétiteur en " + matiere + ".";
    var messageEncode = encodeURIComponent(message);
    
    let numPropre = numero.replace(/[^0-9]/g, ''); 
    if (!numPropre.startsWith('225') && numPropre.length === 10) {
        numPropre = '225' + numPropre; 
    }
    
    var urlComplete = "https://wa.me" + numPropre + "?text=" + messageEncode;
    window.open(urlComplete, '_blank');
}

function enregistrerProf(event) {
    event.preventDefault(); 
    
    var nom = document.getElementById('nom').value;
    var matiere = document.getElementById('matiere').value;
    var ville = document.getElementById('ville').value;
    var quartier = document.getElementById('quartier').value;
    var whatsapp = document.getElementById('whatsapp').value;

    dbRefProfs.push({
        nom: nom,
        matiere: matiere,
        ville: ville,
        quartier: quartier,
        whatsapp: whatsapp,
        note: 3
    }).then(() => {
        alert("Félicitations ! Profil enregistré sur Firebase Cloud.");
        document.getElementById('form-inscription').reset();
        changerOnglet('eleve');
    }).catch((error) => {
        alert("Erreur de connexion : " + error);
    });
}

function changerOnglet(nomOnglet) {
    document.getElementById('page-accueil').classList.add('hidden');
    document.getElementById('page-eleve').classList.add('hidden');
    document.getElementById('page-prof').classList.add('hidden');

    document.getElementById('tab-accueil').classList.remove('active');
    document.getElementById('tab-eleve').classList.remove('active');
    document.getElementById('tab-prof').classList.remove('active');

    if (nomOnglet === 'accueil') {
        document.getElementById('page-accueil').classList.remove('hidden');
        document.getElementById('tab-accueil').classList.add('active');
    } else if (nomOnglet === 'eleve') {
        document.getElementById('page-eleve').classList.remove('hidden');
        document.getElementById('tab-eleve').classList.add('active');
        afficherTousLesProfs(); 
    } else if (nomOnglet === 'prof') {
        document.getElementById('page-prof').classList.remove('hidden');
        document.getElementById('tab-prof').classList.add('active');
    }
}
