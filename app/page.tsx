import { Toaster } from "sonner";
import SVMOffsetCalculator from "./components/SVMOffsetCalculator";

export default function Home() {
  return (
    <main>
      <SVMOffsetCalculator />
      <Toaster />
    </main>
  );
}
