// ==========================================
// 1. CONFIGURATION ET CONNEXION FIREBASE (Clés de Kouakou)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBOBxcf0Y3VSIARUXsymUvJOZWSnZGFWf0",
    authDomain: "://firebaseapp.com",
    databaseURL: "https://educonnect-ci-35f82-default-rtdb.firebaseio.com",
    projectId: "educonnect-ci-35f82",
    storageBucket: "educonnect-ci-35f82.firebasestorage.app",
    messagingSenderId: "12681914837",
    appId: "1:12681914837:web:66d7657c18297e03cd355c",
    measurementId: "G-JREBB4V314"
};

// Initialisation de Firebase via les CDN officiels de Google
import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://gstatic.com";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRefProfs = ref(db, 'professeurs');

// Variables globales de l'application
let listeProfs = [];
const CODE_SECRET_ADMIN = "225_ADMIN"; 

// ==========================================
// 2. ÉCOUTE ET SYNCHRONISATION CLOUD EN TEMPS RÉEL
// ==========================================
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
    if (compteur) {
        compteur.innerText = listeProfs.length;
    }
}

// ==========================================
// 3. AFFICHAGE DES CARTES ET ACTIONS ÉLÈVES / ADMIN
// ==========================================
function afficherTousLesProfs() {
    const conteneur = document.getElementById('liste-professeurs');
    conteneur.innerHTML = ""; 

    if (listeProfs.length === 0) {
        conteneur.innerHTML = "<p style='text-align:center;color:gray;margin-top:20px;'>Aucun répétiteur inscrit pour le moment.</p>";
        return;
    }

    listeProfs.forEach(prof => {
        const carte = document.createElement('div');
        carte.className = 'prof-card';
        carte.setAttribute('data-search', (prof.matiere + ' ' + prof.ville + ' ' + prof.quartier).toLowerCase());
        
        let etoiles = "⭐".repeat(prof.note);

        carte.innerHTML = `
            <h3>${prof.nom}</h3>
            <p>📚 <b>Matière :</b> ${prof.matiere}</p>
            <p>📍 <b>Lieu :</b> ${prof.ville} - ${prof.quartier}</p>
            <p><b>Avis des élèves :</b> ${etoiles}</p>
            <div class="action-row">
                <button class="btn-whatsapp" onclick="ouvrirWhatsApp('${prof.whatsapp}', '${prof.matiere}')">💬 WhatsApp</button>
                <button class="btn-like" onclick="likerProf('${prof.id}', ${prof.note})">👍 Voter (+1 Étoile)</button>
                <button class="btn-supprimer" onclick="supprimerProfSécure('${prof.id}')">🗑 Retirer (Admin)</button>
            </div>
        `;
        conteneur.appendChild(carte);
    });
}

// FONCTIONNALITÉ FILTRE ET RECHERCHE
window.filtrerProfs = function() {
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

// ACTION ÉLÈVE : Voter (Mise à jour en temps réel sur le Cloud)
window.likerProf = function(idUnique, noteActuelle) {
    if (noteActuelle < 5) {
        const profRef = ref(db, 'professeurs/' + idUnique);
        update(profRef, { note: noteActuelle + 1 });
        alert("Merci pour ton vote d'élève ! La note cloud a été mise à jour.");
    } else {
        alert("Cet enseignant a déjà la note maximale de 5 étoiles !");
    }
};

// ACTION ADMIN : Supprimer (Protégé par ton mot de passe)
window.supprimerProfSécure = function(idUnique) {
    let motDePasse = prompt("🔒 Action réservée à la direction. Entrez le code secret Admin pour supprimer :");
    
    if (motDePasse === CODE_SECRET_ADMIN) {
        if (confirm("Confirmez-vous le retrait de cet enseignant de la plateforme ?")) {
            const profRef = ref(db, 'professeurs/' + idUnique);
            remove(profRef)
                .then(() => alert("Enseignant retiré du Cloud avec succès."))
                .catch((error) => alert("Erreur lors de la suppression : " + error));
        }
    } else {
        alert("❌ Code incorrect. Action annulée.");
    }
};

// ==========================================
// 4. ROUTAGE EXTERNE AVEC NETTOYAGE WHATSAPP STRICT
// ==========================================
window.ouvrirWhatsApp = function(numero, matiere) {
    var message = "Bonjour, je vous contacte depuis l'application EduConnect CI car j'ai besoin d'un répétiteur en " + matiere + ".";
    var messageEncode = encodeURIComponent(message);
    
    // Nettoyage complet : supprime espaces, tirets et caractères invalides
    let numPropre = numero.replace(/[^0-9]/g, ''); 
    
    // Ajout automatique de l'indicatif 225 
    if (!numPropre.startsWith('225') && numPropre.length === 10) {
        numPropre = '225' + numPropre; 
    }
    
    // API universelle wa.me pour cibler directement le compte de la personne
    var urlComplete = "https://wa.me" + numPropre + "?text=" + messageEncode;
    window.open(urlComplete, '_blank');
}

// AJOUTER UN NOUVEAU ENSEIGNANT DANS LE CLOUD GOOGLE
window.enregistrerProf = function(event) {
    event.preventDefault(); 
    
    var nom = document.getElementById('nom').value;
    var matiere = document.getElementById('matiere').value;
    var ville = document.getElementById('ville').value;
    var quartier = document.getElementById('quartier').value;
    var whatsapp = document.getElementById('whatsapp').value;

    const nouveauProfRef = push(dbRefProfs);
    
    set(nouveauProfRef, {
        nom: nom,
        matiere: matiere,
        ville: ville,
        quartier: quartier,
        whatsapp: whatsapp,
        note: 3 
    }).then(() => {
        alert("Félicitations ! Ton profil de prof est enregistré dans Firebase et visible en direct !");
        document.getElementById('form-inscription').reset();
        changerOnglet('eleve');
    }).catch((error) => {
        alert("Erreur de connexion au serveur Cloud : " + error);
    });
};

// ROUTAGE DES ONGLETS DE L'APPLICATION
window.changerOnglet = function(nomOnglet) {
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

// Lancement automatique au chargement initial
document.addEventListener("DOMContentLoaded", () => {
    actualiserCompteur();
    afficherTousLesProfs();
});
