import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { firebaseConfig, firebaseReady } from "/firebase-config.js";

let db = null;

if (firebaseReady) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

window.ouassVtcDriverAppReady = firebaseReady;

window.saveBookingToDriverApp = async function saveBookingToDriverApp(data) {
  if (!db) {
    return { saved: false, reason: "firebase-not-configured" };
  }

  const clean = value => String(value ?? "").trim().slice(0, 500);

  const booking = {
    customerName: clean(data.nom),
    customerPhone: clean(data.telephone),
    pickup: clean(data.depart),
    destination: clean(data.arrivee),
    scheduledAtText: clean(data.dateheure),
    passengers: clean(data.passagers),
    paymentMethod: clean(data.paiement),
    customerMessage: clean(data.message),
    estimatedPrice: clean(data.prix),
    status: "new",
    source: "website",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const reference = await addDoc(collection(db, "bookings"), booking);
  return { saved: true, id: reference.id };
};
