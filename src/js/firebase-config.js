// Firebase configuration
// Replace these values with your Firebase project config from the Firebase Console
  const firebaseConfig = {

    apiKey: "AIzaSyDn7hq87QTQw03hf52PSOgYTuya7xFpzUw",

    authDomain: "breadservice-7c81d.firebaseapp.com",

    projectId: "breadservice-7c81d",

    storageBucket: "breadservice-7c81d.firebasestorage.app",

    messagingSenderId: "900425847331",

    appId: "1:900425847331:web:d585303c8320c26fbe1796",

    measurementId: "G-E39K4DHNE7"

  };


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
