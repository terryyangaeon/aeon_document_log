"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const isDev =
  process.env.NEXT_PUBLIC_APP_ENV === "dev" ||
  (typeof window !== "undefined" && /^dev\./.test(window.location.hostname));

export default function Navbar() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/accounts/check-role")
        .then((res) => res.json())
        .then((data) => setIsAdmin(data.role === "admin"))
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [session]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  function positionMenu() {
    if (!btnRef.current || !menuRef.current) return;
    const br = btnRef.current.getBoundingClientRect();
    menuRef.current.style.top = `${br.bottom + 6}px`;
    menuRef.current.style.right = `${Math.max(8, window.innerWidth - br.right)}px`;
    menuRef.current.style.left = "auto";
  }

  function toggleMenu() {
    if (!menuOpen) positionMenu();
    setMenuOpen(!menuOpen);
  }

  const userName = session?.user?.name || session?.user?.email || "";
  const userRole = isAdmin ? "Admin — all business units" : "User";

  return (
    <header className="ov-header">
      <Link
        href="/"
        className="ov-brand"
        aria-label="AEON delight — 文件記錄 AEON Document Log"
      >
        <Image
          src="/aeon_banner.png"
          alt="AEON delight"
          width={180}
          height={54}
          className="ov-banner"
          priority
        />
        {isDev && <span className="ov-dev-label">DEV</span>}
        <span className="ov-brand-text">
          <span className="ov-l1">文件記錄</span>
          <span className="ov-l2">AEON Document Log</span>
        </span>
      </Link>

      {session?.user && (
        <div className="ov-menu-wrap">
          <button
            ref={btnRef}
            className="ov-burger"
            onClick={toggleMenu}
            aria-label="Menu"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1c1917"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div
            ref={menuRef}
            className="ov-menu"
            hidden={!menuOpen}
          >
            <div className="ov-who">
              <div className="ov-who-name">{userName}</div>
              <div className="ov-who-role">{userRole}</div>
            </div>
            <Link href="/log-sheet" className="ov-menu-item" onClick={() => setMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              記錄表 Log Sheet
            </Link>
            <Link href="/staff" className="ov-menu-item" onClick={() => setMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              員工記錄 Staff Records
            </Link>
            {isAdmin && (
              <Link href="/accounts" className="ov-menu-item" onClick={() => setMenuOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                帳戶管理 Account Management
              </Link>
            )}
            {isAdmin && (
              <Link href="/configuration" className="ov-menu-item" onClick={() => setMenuOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                設定 Configuration
              </Link>
            )}
            <a
              href="/AEON_Document_Log_Operation_Manual.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="ov-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
              使用手冊 User Guide
            </a>
            <button
              type="button"
              className="ov-menu-item"
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
              登出 Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
