/** Static page chrome ported from Yuki's local-preview design. */

export function SiteHeader({ onHome }: { onHome: () => void }) {
  return (
    <header className="site-header">
      <a
        className="brand"
        href="#prepare"
        aria-label="MockMate home"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
      >
        <span className="brand-mark" aria-hidden="true">
          <span></span>
          <span></span>
        </span>
        <span>
          mockmate<span className="brand-dot">.</span>
        </span>
      </a>
      <div className="header-right">
        <span className="demo-pill">
          <span className="pulse-dot"></span> Hackathon demo
        </span>
        <a className="header-link" href="#how-it-works">
          How it works <span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-line"></span> INTERVIEW PRACTICE, WITH A POINT OF VIEW
        </div>
        <h1 id="hero-title">
          Walk in prepared.
          <br />
          <em>Walk out sharper.</em>
        </h1>
        <p>
          Turn your role, experience, and project into a focused interview practice session — then see exactly what
          to work on next.
        </p>
        <div className="hero-meta">
          <span className="sparkle" aria-hidden="true">
            ✳
          </span>
          <span>Made for the moments before the real thing.</span>
        </div>
      </div>
      <div className="hero-graphic" aria-hidden="true">
        <div className="orbit orbit-one"></div>
        <div className="orbit orbit-two"></div>
        <div className="graphic-card graphic-card-back">
          <span>01 / YOUR STORY</span>
          <div className="graphic-line"></div>
          <div className="graphic-line short"></div>
        </div>
        <div className="graphic-card graphic-card-front">
          <span className="graphic-quote">“</span>
          <strong>Practice your story with purpose.</strong>
          <span className="graphic-wave">▂▅▃▆▂▃▅▂</span>
        </div>
        <div className="graphic-burst">✳</div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">
      <div>
        <span className="section-kicker">THE IDEA</span>
        <h2>
          Better practice starts
          <br />
          with better context.
        </h2>
      </div>
      <p>
        MockMate connects the role you want, the work you have done, and the decisions you made. It reads your public
        repository before the interview, asks about your real implementation, and points every piece of feedback back
        to what you said.
      </p>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <span className="footer-brand">
        mockmate<span>.</span>
      </span>
      <span>Make your next answer count.</span>
      <span>Gator Hack V · 2026</span>
    </footer>
  );
}
