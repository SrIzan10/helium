import { Browser } from "@capacitor/browser";

const HELIUM_URL = "https://helium.srizan.dev";
const HELIUM_CHROME_INTENT_URL =
  "intent://helium.srizan.dev#Intent;scheme=https;package=com.android.chrome;end";

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

async function openHelium(): Promise<void> {
  if (isAndroid()) {
    window.location.href = HELIUM_CHROME_INTENT_URL;
    return;
  }

  await Browser.open({
    url: HELIUM_URL,
    presentationStyle: "fullscreen",
  });
}

async function openHeliumFallback(): Promise<void> {
  await Browser.open({
    url: HELIUM_URL,
    presentationStyle: "fullscreen",
  });
}

function App() {
  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Helium Android Wrapper</p>
        <h1>Open Helium with screen share support</h1>
        <p className="lead">
          This wrapper launches Helium in a Chrome Custom Tab. On most Android
          devices this gives the best chance for WebRTC screen sharing,
          including audio when Android and Chrome allow it.
        </p>

        <button className="cta" type="button" onClick={openHelium}>
          Open Helium in Chrome
        </button>

        <button className="secondary" type="button" onClick={openHeliumFallback}>
          Open with default browser
        </button>

        <p className="note">
          If Chrome is not installed, use the fallback button. For audio capture,
          update Chrome and Android, then enable audio in the system
          screen-share picker.
        </p>
      </section>
    </main>
  );
}

export default App;
