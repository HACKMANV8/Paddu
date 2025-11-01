import { StarryBackground, Title } from "./components/Landing";
export default function Home() {
  return (
    <div>
      <div className="relative min-h-screen overflow-hidden">
        <StarryBackground />
        <Title />
      </div>
    </div>
  );
}
