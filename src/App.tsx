import AttributeView from "./components/AttributeView/AttributeView";
import PeerView from "./components/PeerView/PeerView";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";
import { SelectionProvider } from "./context/SelectionContext";
import { RendererProvider } from "./context/RendererContext";


function App() {
  return (
    <RendererProvider>
      <SelectionProvider>
        <PeerView />
        <AttributeView />
        <InfiniteCanvas />
      </SelectionProvider>
    </RendererProvider>
  );
}

export default App;
