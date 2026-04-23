import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Enable verbose logging during connectivity issues to help debug
if (process.env.NODE_ENV !== 'production') {
  setLogLevel('error');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with long-polling fallback for restricted environments
// and persistence for better offline experience
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Bypass potential WebSocket blocks in sandboxed environments
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Ensure persistence is set, which can help with session stability in flaky networks
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn("Auth persistence failed:", err);
});

// Comprehensive Connectivity Diagnostic
export async function checkConnectivity() {
  const diagnostics = {
    firestore: false,
    auth: false,
    google: false,
    error: null as string | null
  };

  try {
    // 1. Check general Google APIs connectivity
    const ping = await fetch('https://www.googleapis.com/generate_204', { mode: 'no-cors' });
    diagnostics.google = true;
    
    // 2. Check Auth endpoint proximity
    await fetch('https://identitytoolkit.googleapis.com/generate_204', { mode: 'no-cors' });
    diagnostics.auth = true;

    // 3. Check Firestore Specifically
    await getDocFromServer(doc(db, '_internal_', 'health_check'));
    diagnostics.firestore = true;
  } catch (error: any) {
    diagnostics.error = error.message;
  }

  return diagnostics;
}

// Initial check
checkConnectivity().then(d => {
  if (!d.firestore || !d.auth) {
    console.warn("HerbRx System Warning: Connectivity restricted. If you are behind a corporate firewall or using an ad-blocker, please white-list Google services or open the app in a new tab.", d);
  }
});

export default app;
