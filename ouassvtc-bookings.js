import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { firebaseConfig, firebaseReady } from "/firebase-config.js";

let db = null;

if (firebaseReady) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

window.ouassVtcDriverAppReady = firebaseReady;

window.saveWebsiteEstimate = async function saveWebsiteEstimate(data) {
  if (!db) {
    return { saved: false, reason: "firebase-not-configured" };
  }

  const clean = value => String(value ?? "").trim();
  const customerName = clean(data.customerName);

  if (customerName.toLowerCase() === "test") {
    return { saved: false, excluded: true };
  }

  const estimate = {
    app: "website",
    channel: "website",
    pickup: clean(data.pickup).slice(0, 240),
    destination: clean(data.destination).slice(0, 240),
    distanceKm: Number(data.distanceKm || 0),
    estimatedPrice: Number(data.estimatedPrice || 0),
    scheduledAtText: clean(data.scheduledAtText).slice(0, 30),
    converted: false,
    reportingExcluded: false,
    createdAt: serverTimestamp()
  };

  const reference = await addDoc(collection(db, "clientEstimates"), estimate);
  return { saved: true, id: reference.id };
};

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
    source: clean(data.sourceChannel) || "website",
    reportingExcluded: clean(data.nom).toLowerCase() === "test",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const reference = await addDoc(collection(db, "bookings"), booking);

  if (clean(data.estimateId)) {
    try {
      await updateDoc(doc(db, "clientEstimates", clean(data.estimateId)), {
        converted: true,
        bookingId: reference.id,
        convertedAt: serverTimestamp()
      });
    } catch (conversionError) {
      console.warn("Conversion estimation site indisponible :", conversionError);
    }
  }

  return { saved: true, id: reference.id };
};



