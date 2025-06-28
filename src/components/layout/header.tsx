"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Contact Us", href: "/contact" },
];

const protectedNavLinks = [
  { name: "Integrations", href: "/integrations" },
  { name: "Profile", href: "/profile" },
];

export function Header() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();

  const allNavLinks = [
    ...navLinks,
    ...(isAuthenticated ? protectedNavLinks : []),
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-6 flex items-center justify-center">
          <div className="animate-pulse flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-48"></div>
              <div className="h-3 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Multi-Modal Chatbot
            </h1>
            <p className="text-sm text-gray-600">
              Powered by Next.js & shadcn/ui
            </p>
          </div>
        </div>

        {/* Hamburger for mobile */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            className="p-2"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </Button>
        </div>

        {/* Navigation - desktop */}
        <nav className="hidden md:flex items-center space-x-4">
          {allNavLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className={
                  pathname === link.href
                    ? "text-blue-600 font-semibold bg-blue-50 hover:text-blue-700"
                    : "text-gray-700 hover:text-blue-600"
                }
              >
                {link.name}
              </Button>
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600"
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/signin">
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow-sm">
          <nav className="flex flex-col p-4 space-y-2">
            {allNavLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={
                    pathname === link.href
                      ? "justify-start text-blue-600 font-semibold bg-blue-50 hover:text-blue-700 w-full"
                      : "justify-start text-gray-700 hover:text-blue-600 w-full"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {link.name}
                </Button>
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm text-gray-600">
                  {user?.email}
                </div>
                <Button
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isSigningOut}
                >
                  {isSigningOut ? "Signing Out..." : "Sign Out"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/signin">
                  <Button
                    onClick={() => setMenuOpen(false)}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    onClick={() => setMenuOpen(false)}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
