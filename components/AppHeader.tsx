"use client";

import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-name">Guide</span>
        <span className="council-name">City of Bayside Harbour</span>
      </div>
      <nav>
        <a href="/" className={pathname === "/" ? "active" : ""}>
          Citizen chat
        </a>
        <a href="/explorer" className={pathname === "/explorer" ? "active" : ""}>
          Taxonomy explorer
        </a>
      </nav>
    </header>
  );
}
