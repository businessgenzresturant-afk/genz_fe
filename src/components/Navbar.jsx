import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import fallbackNav from '../assets/fallbackNav.json';
import { IconCartLine, IconClose, IconMenu } from './icons.jsx';

const defaultLinks = [
  { to: '/home', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/cart', label: 'Cart' },
  { to: '/checkout', label: 'Checkout' },
  { to: '/track', label: 'Track' },
];

const ownerDefaultLinks = [
  { to: '/home', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/admin/menu', label: 'Manage menu' },
  { to: '/admin/payment', label: 'Payment' },
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
  const { cart } = useCart();
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const isMenuHome = location.pathname === '/' || location.pathname === '/menu';

  const isNavActive = (to) => {
    const path = location.pathname;
    if (path === to) return true;
    if (to === '/menu' && (path === '/' || path === '/menu')) return true;
    return false;
  };
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
    `inline-flex min-h-[44px] md:min-h-[36px] items-center rounded-full px-3.5 py-2 md:px-3 md:py-1.5 text-sm md:text-sm xl:text-[15px] 2xl:text-base font-semibold transition-colors focus-ring ${
      isActive
        ? 'bg-delivery-500 text-white shadow-md'
        : 'text-ink hover:bg-slate-100 hover:text-charcoal-900'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 shadow-food backdrop-blur-md">
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 2xl:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className={`group flex min-h-[48px] items-center gap-2 sm:gap-2.5 focus-ring rounded-xl ${
              isMenuHome ? 'md:gap-3' : ''
            }`}
          >
            <img
              src="/genz-logo.png"
              alt=""
              width={140}
              height={48}
              className="h-9 w-auto sm:h-10 md:h-11 xl:h-12 object-contain object-left shrink-0"
              decoding="async"
            />
            <span className="sr-only">GEN-Z Restaurant</span>
            <span className="font-menu inline max-w-[min(220px,52vw)] truncate text-sm font-semibold tracking-tight text-ink sm:max-w-none sm:text-base md:text-[17px]">
              GEN-Z Restaurant
            </span>
          </Link>
          {isMenuHome && !isAdmin ? (
            <div className="flex md:hidden items-center gap-1">
              <Link
                to="/cart"
                className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-electric-800 focus-ring"
                aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}
              >
                <IconCartLine className="h-7 w-7" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-neon px-1 text-[10px] font-extrabold leading-none text-charcoal-900">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          ) : null}
          <button
            type="button"
            className={`inline-flex md:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-800 shadow-sm focus-ring ${
              isMenuHome && !isAdmin ? 'hidden' : ''
            }`}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
            {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
          <nav className="hidden md:flex flex-wrap items-center justify-end gap-1 max-w-[calc(100%-10rem)] xl:max-w-none" aria-label="Main">
            {links.map((link) => {
              const isActive = isNavActive(link.to);
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
              const isActive = isNavActive(link.to);
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
