import { Browser } from "@capacitor/browser";

const HELIUM_URL = "https://helium.srizan.dev";

async function openHelium(): Promise<void> {
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
          Open Helium
        </button>

        <p className="note">
          If audio is missing in screen capture, update Chrome and Android, then
          allow audio capture in the system screen-share picker.
        </p>
      </section>
    </main>
  );
}

export default App;
