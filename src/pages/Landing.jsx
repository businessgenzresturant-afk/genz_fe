import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DishNameBackdrop from '../components/DishNameBackdrop.jsx';

function IconSteps({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function IconChef({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

function IconPulse({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function DashboardPreview() {
  const rows = [
    { id: '#1042', items: 'Veg noodles · Full', status: 'Cooking', tone: 'bg-amber-100/20 text-amber-300 border-amber-500/30' },
    { id: '#1041', items: 'Paneer tikka · Half', status: 'Ready', tone: 'bg-delivery-500/20 text-delivery-300 border-delivery-500/30' },
    { id: '#1040', items: 'Momo platter · Full', status: 'New', tone: 'bg-white/10 text-white border-white/20' },
  ];
  return (
    <div className="overflow-hidden rounded-[16px] border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/5 transition hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2.5">
        <span className="size-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" aria-hidden />
        <span className="size-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" aria-hidden />
        <span className="size-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" aria-hidden />
        <span className="text-xs font-semibold text-slate-400 ml-2 tracking-wider uppercase">Live Dashboard</span>
      </div>
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between gap-2 bg-white/5">
        <span className="text-sm font-bold text-white">Live queue</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-delivery-400 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-delivery-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-delivery-500"></span>
          </span>
          syncing
        </span>
      </div>
      <div className="p-3.5 space-y-2.5 bg-transparent">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 transition hover:bg-white/10"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-white tracking-wide">{row.id}</p>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">{row.items}</p>
            </div>
            <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${row.tone}`}>{row.status}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between text-xs text-slate-400 bg-white/5 backdrop-blur-sm">
        <span className="font-medium">Today · 24 orders</span>
        <span className="text-delivery-400 font-bold">Avg. prep 12m</span>
      </div>
    </div>
  );
}

const shell = 'mx-auto w-full max-w-[min(1680px,94vw)] px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 2xl:px-10';

function MenuPreviewMini() {
  const dishes = [
    { name: 'Veg noodles', cat: 'Chinese', half: 80, full: 140 },
    { name: 'Paneer tikka', cat: 'Tandoor', half: 140, full: 260 },
  ];
  return (
    <div className="mt-4 rounded-[16px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Menu Preview</p>
        <span className="rounded-full bg-delivery-500/20 px-2.5 py-1 text-[10px] font-bold text-delivery-300 border border-delivery-500/30">
          Live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {dishes.map((row) => (
          <div
            key={row.name}
            className="group flex flex-col rounded-xl border border-white/10 bg-white/5 transition hover:border-delivery-500/50 hover:bg-white/10 p-3"
          >
            <p className="text-sm font-bold text-white truncate">{row.name}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">{row.cat}</p>
            <div className="mt-3 flex justify-between gap-1 text-xs text-slate-300">
              <span className="font-medium"><span className="text-slate-500">H</span> ₹{row.half}</span>
              <span className="font-bold text-delivery-400"><span className="text-slate-500">F</span> ₹{row.full}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAdmin } = useAuth();

  return (
    <div className="w-full overflow-x-hidden text-slate-800 relative min-h-screen flex flex-col selection:bg-delivery-200 selection:text-delivery-900">
      {/* Visible Food Image Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
        <div className="absolute inset-0 bg-[#FDFDFD]/80" />
      </div>

      {/* Antigravity Global Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-delivery-100/40 blur-3xl opacity-80" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-flame-100/40 blur-3xl opacity-80" />
        <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] rounded-full bg-amber-100/40 blur-3xl opacity-80" />
      </div>

      <main className="flex w-full flex-1 flex-col relative z-10">
        <div className={`${shell} pt-8 md:pt-12 pb-16 space-y-12`}>
          
          {/* FLOATING ISLAND HERO */}
          <section className="animate-float-up opacity-0 delay-100 relative">
            <div className="relative overflow-hidden rounded-[40px] bg-charcoal-900 text-white shadow-[0_0_40px_rgba(252,128,25,0.2)] border border-white/10 transition-transform duration-500">
              
              {/* Visible Hero Background Image */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop')] bg-cover bg-right opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/95 to-charcoal-900/20 pointer-events-none" />

              {/* Island internal glows */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_50%)] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[70%] h-[70%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(252,128,25,0.15),transparent_50%)] pointer-events-none" />
              
              <div className="relative p-8 sm:p-10 md:p-16 lg:p-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                  
                  {/* Hero Content */}
                  <div className="lg:col-span-6 flex flex-col justify-center">
                    <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-delivery-400 mb-4 inline-flex items-center gap-2">
                      <span className="h-px w-8 bg-delivery-400/50"></span>
                      Food delivery · Gen-Z
                    </p>
                    <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] text-white">
                      Crave it.<br />Order it.
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-delivery-400 to-amber-300 mt-2"> Track it live.</span>
                    </h1>
                    <p className="mt-6 text-base md:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-2xl font-medium">
                      Browse the menu like your favourite delivery app — cart, checkout, and live order status in one smooth, antigravity flow.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <a
                        href="/menu"
                        className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-delivery-500 to-flame-500 px-8 text-base md:text-lg font-bold text-white shadow-[0_10px_25px_rgba(252,128,25,0.4)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(252,128,25,0.5)] focus:outline-none focus:ring-2 focus:ring-delivery-400"
                      >
                        Order food online
                      </a>
                      {isAdmin ? (
                        <a
                          href="/admin/dashboard"
                          className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-8 text-base md:text-lg font-bold text-white transition-all hover:bg-white/20 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                          Dashboard
                        </a>
                      ) : (
                        <a
                          href="/checkout"
                          className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-8 text-base md:text-lg font-bold text-white transition-all hover:bg-white/20 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                          Go to checkout
                        </a>
                      )}
                    </div>
                    
                    <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                      <div>
                        <p className="text-3xl font-black text-white">100%</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Live Status</p>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-delivery-400">24/7</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Ordering</p>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-white">All</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Portions</p>
                      </div>
                    </div>
                  </div>

                  {/* Hero Previews */}
                  {/* <div className="lg:col-span-6 relative">
                    <div className="absolute inset-0 bg-delivery-500/20 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative transform lg:translate-x-4 xl:translate-x-8">
                      <DashboardPreview />
                      <MenuPreviewMini />
                    </div>
                  </div> */}

                </div>
              </div>
            </div>
          </section>

          {/* VALUE STRIP */}
          <section className="animate-float-up opacity-0 delay-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { num: '01', text: 'Mobile-first layout for ordering on the go.' },
                { num: '02', text: 'Owner tools for menu and order control.' },
                { num: '03', text: 'Transparent pricing — half & full portions.' },
                { num: '04', text: 'Live status updates from kitchen to doorstep.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 rounded-2xl border border-white/20 bg-white/70 backdrop-blur-md px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-2">
                  <span className="text-delivery-500 font-black text-xl tabular-nums leading-none">{item.num}</span>
                  <span className="text-slate-700 font-semibold text-sm leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* FEATURE CARDS */}
          <section className="animate-float-up opacity-0 delay-300">
            <div className="mb-8 max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Everything you expect from a delivery experience
              </h2>
              <p className="mt-3 text-lg md:text-xl text-slate-500 font-medium">
                Fast menu browsing, simple checkout, and live tracking — without the clutter.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: IconSteps, title: 'Curated flow', desc: 'Steps and forms stay obvious — fewer drop-offs from cart to confirmation.', color: 'from-delivery-500 to-amber-400', text: 'text-white' },
                { icon: IconChef, title: 'Menu structure', desc: 'Categories and pricing stay scannable; half/full portions on every line.', color: 'from-flame-400 to-orange-500', text: 'text-white' },
                { icon: IconPulse, title: 'Live kitchen', desc: 'Guests track orders; owners see the queue update as tickets move.', color: 'from-blue-500 to-indigo-500', text: 'text-white' }
              ].map((card, idx) => (
                <article key={idx} className="group flex flex-col rounded-[24px] border border-white/20 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)]">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} ${card.text} shadow-lg mb-6 transition-transform group-hover:scale-110`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-3 flex-1 text-base text-slate-600 font-medium leading-relaxed">
                    {card.desc}
                  </p>
                </article>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* GLASSMORPHIC FOOTER */}
      <footer className="mt-auto w-full shrink-0 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl text-white">
        <div className={`${shell} py-10 md:py-16 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,128,25,0.1),transparent_50%)] pointer-events-none" />
          
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-delivery-400 mb-2">
                {isAdmin ? 'Owner Access' : 'Get started'}
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                {isAdmin ? 'Manage your menu & live queue' : 'Order your next meal in minutes'}
              </h2>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl font-medium leading-relaxed">
                {isAdmin
                  ? 'Edit dishes on Manage menu; handle the incoming orders seamlessly on the Dashboard.'
                  : 'Browse the menu, build a cart, and track delivery — all in one smooth, antigravity flow.'}
              </p>
            </div>
            
            <div className="lg:col-span-4 flex flex-col sm:flex-row gap-4 lg:justify-end">
              <a
                href={isAdmin ? '/admin/menu' : '/menu'}
                className="inline-flex h-12 sm:h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-delivery-500 to-flame-500 px-6 sm:px-8 text-base font-bold text-white shadow-[0_10px_25px_rgba(252,128,25,0.3)] transition-all hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-delivery-400"
              >
                {isAdmin ? 'Manage menu' : 'Explore menu'}
              </a>
              {isAdmin ? (
                <a
                  href="/admin/dashboard"
                  className="inline-flex h-12 sm:h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-6 sm:px-8 text-base font-bold text-white transition-all hover:bg-white/10 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Dashboard
                </a>
              ) : (
                <Link
                  to="/admin/login"
                  className="inline-flex h-12 sm:h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-6 sm:px-8 text-base font-bold text-white transition-all hover:bg-white/10 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Owner login
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
