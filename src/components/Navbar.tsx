"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/log-sheet", label: "Log Sheet" },
  { href: "/staff", label: "Staff Records" },
  { href: "/configuration", label: "Configuration" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="bg-[#1e3a5f] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-wide">
              <Image
                src="/logo.png"
                alt="AEON Delight Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
              AEON Document Log
            </Link>
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/80">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("microsoft-entra-id")}
                className="px-4 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                Sign In with Microsoft
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
