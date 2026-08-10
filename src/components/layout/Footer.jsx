import { Link } from 'react-router-dom';

const PLATFORM_LINKS = [
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Projects',     to: '/explore'      },
  { label: 'About',        to: '/about'         },
];

const LEGAL_LINKS = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms',   to: '/terms'   },
  { label: 'Contact', to: '/contact' },
];

/* Simple inline SVGs — no external icon library required */
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.012 2.25h6.962l4.265 5.636 5.005-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028ZM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38Zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38Z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/>
  </svg>
);

export default function Footer() {
  return (
    <>
      <style>{`
        .sft-root {
          background: #fff;
          border-top: 1px solid #e8ecf0;
          font-family: 'Poppins', sans-serif;
          color: #475569;
          font-size: .875rem;
        }
        .sft-top {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1.5rem 2.5rem;
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1fr;
          gap: 2.5rem;
        }
        /* Brand column */
        .sft-brand {
          display: flex;
          flex-direction: column;
          gap: .75rem;
        }
        .sft-logo {
          display: flex;
          align-items: center;
          gap: .6rem;
          text-decoration: none;
        }
        .sft-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          background: #1e3a6e;
          color: #fff;
          font-size: .85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sft-logo-text {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -.3px;
        }
        .sft-tagline {
          color: #64748b;
          font-size: .82rem;
          line-height: 1.55;
          max-width: 220px;
        }

        /* Link columns */
        .sft-col h4 {
          font-size: .78rem;
          font-weight: 600;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: .07em;
          margin-bottom: 1rem;
        }
        .sft-col ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: .55rem;
        }
        .sft-col a {
          color: #64748b;
          text-decoration: none;
          transition: color .15s;
        }
        .sft-col a:hover { color: #1e3a6e; }

        /* Social icons */
        .sft-socials {
          display: flex;
          gap: .6rem;
          margin-top: .25rem;
        }
        .sft-social-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid #e8ecf0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          text-decoration: none;
          transition: background .15s, color .15s, border-color .15s;
        }
        .sft-social-btn:hover {
          background: #1e3a6e;
          color: #fff;
          border-color: #1e3a6e;
        }

        /* Bottom bar */
        .sft-bottom {
          border-top: 1px solid #e8ecf0;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: .8rem;
          text-align: center;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .sft-top {
            grid-template-columns: 1fr 1fr;
          }
          .sft-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 540px) {
          .sft-top {
            grid-template-columns: 1fr;
            padding: 2rem 1.25rem;
            gap: 1.75rem;
          }
          .sft-brand { grid-column: auto; }
        }
      `}</style>

      <footer className="sft-root" role="contentinfo">
        <div className="sft-top">
          {/* Brand */}
          <div className="sft-brand">
            <Link to="/" className="sft-logo">
              <span className="sft-logo-icon">P</span>
              <span className="sft-logo-text">PawnLoan</span>
            </Link>
            <p className="sft-tagline">Trustless collateralized lending on Stellar</p>
          </div>

          {/* Platform */}
          <div className="sft-col">
            <h4>Platform</h4>
            <ul>
              {PLATFORM_LINKS.map(({ label, to }) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="sft-col">
            <h4>Legal</h4>
            <ul>
              {LEGAL_LINKS.map(({ label, to }) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="sft-col">
            <h4>Connect</h4>
            <div className="sft-socials">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                 className="sft-social-btn" aria-label="Twitter / X">
                <TwitterIcon />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer"
                 className="sft-social-btn" aria-label="Discord">
                <DiscordIcon />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                 className="sft-social-btn" aria-label="GitHub">
                <GitHubIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="sft-bottom">
          © {new Date().getFullYear()} PawnLoan. All rights reserved.
        </div>
      </footer>
    </>
  );
}