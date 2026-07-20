// ========================================================== */
// FIREBASE - CONFIGURAÇÃO                                    */
// ========================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyB9yAuIraXJwM-tSr-gETvcdyBSb1yI81Y",
    authDomain: "planner-a0bc6.firebaseapp.com",
    projectId: "planner-a0bc6",
    storageBucket: "planner-a0bc6.firebasestorage.app",
    messagingSenderId: "799515689986",
    appId: "1:799515689986:web:a2407b7230fa876722d31b"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Inicializa o Firestore
const db = firebase.firestore();

console.log('✅ Firebase conectado!');