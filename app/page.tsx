import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "4rem 2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>MyGuide</h1>
      <p>
        <Link href="/how-it-works">See how Guide, Validator, and Plus work together →</Link>
      </p>
    </main>
  );
}
