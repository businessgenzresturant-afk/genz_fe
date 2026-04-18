import { Link, useLocation } from 'react-router-dom';

function IconHome({ className, active }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function IconMenu({ className, active }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

function IconCart({ className, active }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconTrack({ className, active }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

const items = [
  { to: '/home', label: 'Home', Icon: IconHome },
  { to: '/menu', label: 'Menu', Icon: IconMenu },
  { to: '/cart', label: 'Cart', Icon: IconCart },
  { to: '/track', label: 'Track', Icon: IconTrack },
];

/**
 * Minimal bottom tab bar (mobile). Line-style icons; active route uses heavier stroke.
 */
export default function MenuBottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-[#F9F9F9]/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Quick navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {items.map(({ to, label, Icon }) => {
          const active = path === to || (to === '/menu' && (path === '/' || path === '/menu'));
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors ${
                active ? 'text-charcoal-900' : 'text-charcoal-900/45 hover:text-charcoal-900/70'
              }`}
            >
              <Icon className="h-6 w-6" active={active} />
              <span className="text-[10px] font-semibold tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
