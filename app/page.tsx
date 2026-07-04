import AppHeader from "@/components/AppHeader";
import ChatInterface from "@/components/ChatInterface";
import LoginGate from "@/components/LoginGate";

export default function HomePage() {
  return (
    <LoginGate>
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <ChatInterface />
        </main>
      </div>
    </LoginGate>
  );
}
