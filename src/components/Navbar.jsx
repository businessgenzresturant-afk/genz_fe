import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import fallbackNav from '../assets/fallbackNav.json';

function IconMenu({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

const defaultLinks = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/cart', label: 'Cart' },
  { to: '/checkout', label: 'Checkout' },
  { to: '/track', label: 'Track' },
];

const ownerDefaultLinks = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/admin/menu', label: 'Manage menu' },
  { to: '/track', label: 'Track' },
];

function normalizeNavLinks(rawLinks, isAdmin) {
  return (isAdmin
    ? rawLinks.filter((l) => l.to !== '/cart' && l.to !== '/checkout')
    : rawLinks
  ).filter((l) => l.to !== '/admin/login');
}

export default function Navbar() {
  const location = useLocation();
  const { token, isAdmin, logout } = useAuth();
  const [links, setLinks] = useState(defaultLinks);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    fetch('/api/nav', { headers })
      .then((res) => {
        if (!res.ok) throw new Error('nav');
        return res.json();
      })
      .then((data) => {
        const raw =
          Array.isArray(data?.links) && data.links.length
            ? data.links
            : isAdmin
              ? fallbackNav.ownerLinks
              : fallbackNav.links;
        setLinks(normalizeNavLinks(raw, isAdmin));
      })
      .catch(() =>
        setLinks(
          normalizeNavLinks(isAdmin ? fallbackNav.ownerLinks : fallbackNav.links, isAdmin),
        ),
      );
  }, [token, isAdmin]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const linkClass = (isActive) =>
    `inline-flex min-h-[44px] md:min-h-[36px] items-center rounded-[8px] px-3 py-2 md:px-2.5 md:py-1.5 text-sm md:text-sm xl:text-[15px] 2xl:text-base font-medium transition-colors focus-ring ${
      isActive
        ? 'bg-slate-900 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 2xl:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="group flex min-h-[48px] items-baseline gap-1 font-display text-lg sm:text-xl md:text-2xl xl:text-3xl 2xl:text-4xl font-semibold tracking-tight text-slate-900"
          >
            <span>GEN</span>
            <span className="text-brand-600 group-hover:text-brand-700 transition-colors">-Z</span>
            <span className="font-sans text-xs sm:text-sm xl:text-base 2xl:text-lg font-medium text-slate-500 ml-0.5">
              Restaurant
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex md:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-800 shadow-sm focus-ring"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
            {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
          <nav className="hidden md:flex flex-wrap items-center justify-end gap-1 max-w-[calc(100%-10rem)] xl:max-w-none" aria-label="Main">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={`${link.to}-${link.label}`}
                  to={link.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={linkClass(isActive)}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
                className="inline-flex min-h-[36px] items-center rounded-[8px] border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs sm:text-sm xl:text-[15px] 2xl:text-base font-semibold text-rose-900 hover:bg-rose-100 focus-ring"
              >
                Log out
              </button>
            )}
          </nav>
        </div>
        <nav
          id="mobile-nav"
          className={`md:hidden overflow-hidden border-t border-slate-100 transition-[max-height,opacity] duration-200 ease-out ${
            mobileOpen ? 'max-h-[min(70vh,520px)] opacity-100' : 'max-h-0 opacity-0 pointer-events-none border-t-0'
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="flex flex-col gap-1 py-3">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={`m-${link.to}-${link.label}`}
                  to={link.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={linkClass(isActive)}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100 focus-ring"
              >
                Log out
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
