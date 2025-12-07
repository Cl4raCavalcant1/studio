// firebase.js - module that initializes Firebase and exposes syncLoad/syncSave on window
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCq7CAOKCjX4wwHbhoHQ9eMl5ucNcGDfWI",
  authDomain: "studio-albany.firebaseapp.com",
  projectId: "studio-albany",
  storageBucket: "studio-albany.firebasestorage.app",
  messagingSenderId: "1034891076460",
  appId: "1:1034891076460:web:84955cc0e6cbb634900949",
  measurementId: "G-G1DK11N9B2"
};

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("firebase.js: Firebase initialized");
} catch (e) {
  console.warn("firebase.js: Firebase init failed", e);
}

// syncSave: writes the full data object to /app/dados (merge)
export async function syncSave(allData) {
  // always keep a local backup too
  try {
    localStorage.setItem("albany_full_backup", JSON.stringify(allData || {}));
  } catch (err) {
    // ignore
  }

  if (!db) {
    console.warn("firebase.js: no db (offline or init failed) - saved local only");
    return;
  }

  try {
    const ref = doc(db, "app", "dados");
    // write as-is (merge)
    await setDoc(ref, Object.assign({}, allData, { updatedAt: new Date().toISOString() }), { merge: true });
    console.log("firebase.js: syncSave -> /app/dados OK");
  } catch (err) {
    console.warn("firebase.js: syncSave failed", err);
    throw err;
  }
}

// syncLoad: reads /app/dados and returns the object (or local fallback)
export async function syncLoad() {
  if (!db) {
    console.warn("firebase.js: no db (offline) - returning local");
    return {
      agenda: JSON.parse(localStorage.getItem("albany_agenda") || "[]"),
      clientes: JSON.parse(localStorage.getItem("albany_clientes") || "[]"),
      vendas: JSON.parse(localStorage.getItem("albany_vendas") || "[]"),
      eventos: JSON.parse(localStorage.getItem("albany_eventos") || "[]")
    };
  }
  try {
    const ref = doc(db, "app", "dados");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.log("firebase.js: no remote doc, returning local");
      return {
        agenda: JSON.parse(localStorage.getItem("albany_agenda") || "[]"),
        clientes: JSON.parse(localStorage.getItem("albany_clientes") || "[]"),
        vendas: JSON.parse(localStorage.getItem("albany_vendas") || "[]"),
        eventos: JSON.parse(localStorage.getItem("albany_eventos") || "[]")
      };
    }
    const data = snap.data() || {};
    console.log("firebase.js: syncLoad fetched remote /app/dados");
    return {
      agenda: Array.isArray(data.agenda) ? data.agenda : [],
      clientes: Array.isArray(data.clientes) ? data.clientes : [],
      vendas: Array.isArray(data.vendas) ? data.vendas : [],
      eventos: Array.isArray(data.eventos) ? data.eventos : []
    };
  } catch (err) {
    console.warn("firebase.js: syncLoad failed, returning local", err);
    return {
      agenda: JSON.parse(localStorage.getItem("albany_agenda") || "[]"),
      clientes: JSON.parse(localStorage.getItem("albany_clientes") || "[]"),
      vendas: JSON.parse(localStorage.getItem("albany_vendas") || "[]"),
      eventos: JSON.parse(localStorage.getItem("albany_eventos") || "[]")
    };
  }
}

// expose on window for non-module scripts to call easily
window.syncSave = syncSave;
window.syncLoad = syncLoad;

// also auto-attempt to sync on online event
window.addEventListener("online", () => {
  (async () => {
    try {
      const data = {
        agenda: JSON.parse(localStorage.getItem("albany_agenda") || "[]"),
        clientes: JSON.parse(localStorage.getItem("albany_clientes") || "[]"),
        vendas: JSON.parse(localStorage.getItem("albany_vendas") || "[]"),
        eventos: JSON.parse(localStorage.getItem("albany_eventos") || "[]")
      };
      await syncSave(data);
    } catch (e) {
      // ignore
    }
  })();
});