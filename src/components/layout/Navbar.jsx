import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentUser, selectAuthLoading } from '../../features/auth/authSelectors';
import { logoutUser } from '../../features/auth/authThunks';
import { toastSuccess } from '../../utils/toast';
import { useRole } from '../../hooks/useRole';

const NAV_LINKS = [
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Projects',     to: '/explore'      },
  { label: 'About',        to: '/about'         },
];

function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const { isAdmin, isUser } = useRole();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const avatarRef = useRef(null);

  /* close avatar dropdown on outside click */
  useEffect(() => {
    function handler(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* close mobile menu on route change */
  const handleNavClick = () => setMenuOpen(false);

  const handleLogout = async () => {
    setAvatarOpen(false);
    setIsLoggingOut(true);
    try {
      // Dispatch logoutUser thunk which calls POST /api/auth/logout
      await dispatch(logoutUser()).unwrap();
      // Show success toast
      toastSuccess('You have been logged out.');
      // Redirect to login
      navigate('/login');
    } catch {
      // Even if logout fails on the backend, clear local state and redirect
      // This ensures user can't access protected routes if disconnected
      toastSuccess('You have been logged out.');
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <style>{`
        /* ── Navbar ─────────────────────────────────────────────── */
        .sna-root {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #ffffff;
          border-bottom: 1px solid #e8ecf0;
          box-shadow: 0 1px 4px rgba(15,23,42,.06);
          font-family: 'Poppins', sans-serif;
        }
        .sna-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        /* Logo */
        .sna-logo {
          display: flex;
          align-items: center;
          gap: .6rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .sna-logo-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #1e3a6e;
          color: #fff;
          font-size: .9rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: -.5px;
        }
        .sna-logo-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -.3px;
        }

        /* Desktop nav links */
        .sna-links {
          display: flex;
          align-items: center;
          gap: .25rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .sna-links a {
          padding: .45rem .85rem;
          border-radius: 6px;
          font-size: .875rem;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: background .15s, color .15s;
          white-space: nowrap;
        }
        .sna-links a:hover,
        .sna-links a.active {
          background: #f1f5f9;
          color: #0f172a;
        }

        /* Auth buttons */
        .sna-auth {
          display: flex;
          align-items: center;
          gap: .6rem;
          flex-shrink: 0;
        }
        .sna-btn-ghost {
          padding: .45rem 1rem;
          border-radius: 6px;
          font-size: .875rem;
          font-weight: 500;
          color: #0f172a;
          background: transparent;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background .15s;
          white-space: nowrap;
        }
        .sna-btn-ghost:hover { background: #f1f5f9; }
        .sna-btn-primary {
          padding: .45rem 1.15rem;
          border-radius: 6px;
          font-size: .875rem;
          font-weight: 600;
          color: #fff;
          background: #1e3a6e;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background .15s, transform .1s;
          white-space: nowrap;
        }
        .sna-btn-primary:hover { background: #162d56; transform: translateY(-1px); }

        /* Avatar dropdown */
        .sna-avatar-wrap {
          position: relative;
        }
        .sna-avatar-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #1e3a6e;
          color: #fff;
          font-size: .8rem;
          font-weight: 700;
          border: 2px solid #e8ecf0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: border-color .15s;
        }
        .sna-avatar-btn:hover { border-color: #1e3a6e; }
        .sna-avatar-btn img { width: 100%; height: 100%; object-fit: cover; }
        .sna-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 180px;
          background: #fff;
          border: 1px solid #e8ecf0;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(15,23,42,.12);
          padding: .4rem;
          animation: dropIn .15s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sna-dropdown-name {
          padding: .5rem .75rem .35rem;
          font-size: .75rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .sna-dropdown a,
        .sna-dropdown button.sna-dd-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: .5rem .75rem;
          border-radius: 6px;
          font-size: .875rem;
          color: #334155;
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background .12s;
        }
        .sna-dropdown a:hover,
        .sna-dropdown button.sna-dd-item:hover { background: #f1f5f9; }
        .sna-dropdown .sna-dd-divider {
          height: 1px;
          background: #e8ecf0;
          margin: .3rem 0;
        }
        .sna-dd-logout { color: #ef4444 !important; }

        /* Hamburger */
        .sna-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: .4rem;
          border-radius: 6px;
          transition: background .15s;
        }
        .sna-hamburger:hover { background: #f1f5f9; }
        .sna-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #0f172a;
          border-radius: 2px;
          transition: transform .25s, opacity .25s;
          transform-origin: center;
        }
        .sna-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .sna-hamburger.open span:nth-child(2) { opacity: 0; }
        .sna-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile drawer */
        .sna-mobile {
          display: none;
          flex-direction: column;
          background: #fff;
          border-top: 1px solid #e8ecf0;
          padding: .75rem 1.5rem 1.25rem;
          gap: .25rem;
          animation: slideDown .2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sna-mobile a {
          padding: .6rem .75rem;
          border-radius: 6px;
          font-size: .9rem;
          font-weight: 500;
          color: #334155;
          text-decoration: none;
          transition: background .12s;
        }
        .sna-mobile a:hover,
        .sna-mobile a.active { background: #f1f5f9; color: #0f172a; }
        .sna-mobile-divider {
          height: 1px;
          background: #e8ecf0;
          margin: .5rem 0;
        }
        .sna-mobile-auth {
          display: flex;
          flex-direction: column;
          gap: .4rem;
          margin-top: .25rem;
        }
        .sna-mobile-auth .sna-btn-primary,
        .sna-mobile-auth .sna-btn-ghost {
          display: block;
          text-align: center;
          width: 100%;
          padding: .65rem 1rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sna-links  { display: none; }
          .sna-auth   { display: none; }
          .sna-hamburger { display: flex; }
          .sna-mobile.open { display: flex; }
        }
      `}</style>

      <nav className="sna-root" role="navigation" aria-label="Main navigation">
        <div className="sna-inner">
          {/* Logo */}
          <Link to="/" className="sna-logo" onClick={handleNavClick}>
            <span className="sna-logo-icon">P</span>
            <span className="sna-logo-text">PawnLoan</span>
          </Link>

          {/* Desktop nav */}
          <ul className="sna-links" role="list">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop auth */}
          <div className="sna-auth">
            {isAuthLoading ? (
              <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="sna-avatar-wrap" ref={avatarRef}>
                <button
                  className="sna-avatar-btn"
                  onClick={() => setAvatarOpen((v) => !v)}
                  aria-label="User menu"
                  aria-expanded={avatarOpen}
                >
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.name} />
                    : initials(user.name)
                  }
                </button>
                {avatarOpen && (
                  <div className="sna-dropdown" role="menu">
                    <div className="sna-dropdown-name">{user.name}</div>
                    <div className="sna-dd-divider" />
                    <Link to="/dashboard" role="menuitem" onClick={() => setAvatarOpen(false)}>Dashboard</Link>
                    {isAdmin && (
                      <Link to="/admin" role="menuitem" onClick={() => setAvatarOpen(false)}>Admin Panel</Link>
                    )}
                    {isUser && (
                      <Link to="/create" role="menuitem" onClick={() => setAvatarOpen(false)}>Create Campaign</Link>
                    )}
                    <Link to="/profile"   role="menuitem" onClick={() => setAvatarOpen(false)}>Profile</Link>
                    <Link to="/settings"  role="menuitem" onClick={() => setAvatarOpen(false)}>Settings</Link>
                    <div className="sna-dd-divider" />
                    <button 
                      className="sna-dd-item sna-dd-logout" 
                      role="menuitem" 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      style={{ opacity: isLoggingOut ? 0.6 : 1, cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
                    >
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"    className="sna-btn-ghost">Sign In</Link>
                <Link to="/register" className="sna-btn-primary">Get Started</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className={`sna-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`sna-mobile${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              {label}
            </NavLink>
          ))}

          <div className="sna-mobile-divider" />

          {isAuthLoading ? (
            <div className="space-y-3 py-2">
              <div className="h-8 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-8 bg-slate-100 rounded animate-pulse w-full" />
            </div>
          ) : user ? (
            <>
              <Link to="/dashboard" onClick={handleNavClick}>Dashboard</Link>
              {isAdmin && (
                <Link to="/admin" onClick={handleNavClick}>Admin Panel</Link>
              )}
              {isUser && (
                <Link to="/create" onClick={handleNavClick}>Create Campaign</Link>
              )}
              <Link to="/profile"   onClick={handleNavClick}>Profile</Link>
              <Link to="/settings"  onClick={handleNavClick}>Settings</Link>
              <div className="sna-mobile-divider" />
              <button 
                className="sna-btn-ghost" 
                style={{ textAlign:'left', color:'#ef4444', opacity: isLoggingOut ? 0.6 : 1, cursor: isLoggingOut ? 'not-allowed' : 'pointer' }} 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </>
          ) : (
            <div className="sna-mobile-auth">
              <Link to="/login"    className="sna-btn-ghost"   onClick={handleNavClick}>Sign In</Link>
              <Link to="/register" className="sna-btn-primary" onClick={handleNavClick}>Get Started</Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}