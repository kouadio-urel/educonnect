import { initializeApp } from "https://skypack.dev";
import { getDatabase, ref, push, onValue, update, remove } from "https://skypack.dev";

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

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRefProfs = ref(db, 'professeurs');

let listeProfs = [];
const CODE_SECRET_ADMIN = "225_ADMIN"; 

// Synchronisation en temps réel avec Firebase
onValue(dbRefProfs, (snapshot) => {
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

function actualiserCompteur() {
    const compteur = document.getElementById('compteur-profs');
    if (compteur) compteur.innerText = listeProfs.length;
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
            <p><b>Avis :</b> ${etoiles}</p>
            <div class="action-row">
                <button class="btn-whatsapp" id="wa-${prof.id}">💬 WhatsApp</button>
                <button class="btn-like" id="like-${prof.id}">👍 Voter</button>
                <button class="btn-supprimer" id="del-${prof.id}">🗑 Retirer (Admin)</button>
            </div>
        `;
        conteneur.appendChild(carte);

        // Liaison des événements de manière moderne pour éviter les blocages de sécurité
        document.getElementById(`wa-${prof.id}`).addEventListener('click', () => ouvrirWhatsApp(prof.whatsapp, prof.matiere));
        document.getElementById(`like-${prof.id}`).addEventListener('click', () => likerProf(prof.id, prof.note || 3));
        document.getElementById(`del-${prof.id}`).addEventListener('click', () => supprimerProfSécure(prof.id));
    });
}

function filtrerProfs() {
    var saisie = document.getElementById('moteur-recherche').value.toLowerCase();
    var cartes = document.getElementsByClassName('prof-card');
    for (var i = 0; i < cartes.length; i++) {
        var texte = cartes[i].getAttribute('data-search');
        if (texte.includes(saisie)) cartes[i].classList.remove('hidden');
        else cartes[i].classList.add('hidden');
    }
}
window.filtrerProfs = filtrerProfs;

function likerProf(idUnique, noteActuelle) {
    if (noteActuelle < 5) {
        const profRef = ref(db, 'professeurs/' + idUnique);
        update(profRef, { note: noteActuelle + 1 });
        alert("Merci pour ton vote !");
    } else {
        alert("Cet enseignant a déjà 5 étoiles !");
    }
}

function supprimerProfSécure(idUnique) {
    let motDePasse = prompt("🔒 Entrez le code secret Admin pour supprimer :");
    if (motDePasse === CODE_SECRET_ADMIN) {
        if (confirm("Confirmez-vous le retrait de cet enseignant ?")) {
            const profRef = ref(db, 'professeurs/' + idUnique);
            remove(profRef).then(() => alert("Enseignant retiré de Firebase."));
        }
    } else {
        alert("❌ Code incorrect.");
    }
}

function ouvrirWhatsApp(numero, matiere) {
    var message = "Bonjour, je vous contacte depuis l'application EduConnect CI car j'ai besoin d'un répétiteur en " + matiere + ".";
    var messageEncode = encodeURIComponent(message);
    let numPropre = numero.replace(/[^0-9]/g, ''); 
    if (!numPropre.startsWith('225') && numPropre.length === 10) numPropre = '225' + numPropre; 
    window.open("https://wa.me" + numPropre + "?text=" + messageEncode, '_blank');
}

function enregistrerProf(event) {
    event.preventDefault(); 
    var nom = document.getElementById('nom').value;
    var matiere = document.getElementById('matiere').value;
    var ville = document.getElementById('ville').value;
    var quartier = document.getElementById('quartier').value;
    var whatsapp = document.getElementById('whatsapp').value;

    push(dbRefProfs, {
        nom: nom,
        matiere: matiere,
        ville: ville,
        quartier: quartier,
        whatsapp: whatsapp,
        note: 3 
    }).then(() => {
        alert("Félicitations ! Votre profil est enregistré sur Firebase !");
        document.getElementById('form-inscription').reset();
        changerOnglet('eleve');
    }).catch((err) => alert("Erreur : " + err));
}
window.enregistrerProf = enregistrerProf;

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
window.changerOnglet = changerOnglet;
