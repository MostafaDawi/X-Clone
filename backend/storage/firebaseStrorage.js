// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOZBo0dYBc-mt4mUqb0JshnGVpwi_d13U",
  authDomain: "react-firebase-chat-app-fb306.firebaseapp.com",
  projectId: "react-firebase-chat-app-fb306",
  storageBucket: "react-firebase-chat-app-fb306.appspot.com",
  messagingSenderId: "891838300758",
  appId: "1:891838300758:web:cf769278fa90ba681b31f7",
};

// Initialize Firebase
const firebaseapp = initializeApp(firebaseConfig);

// Get a reference to the storage service and auth service
export const storage = getStorage(firebaseapp);
export const auth = getAuth(firebaseapp);
