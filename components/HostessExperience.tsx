'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DiscoveryPanel, BookingPanel, PreorderPanel, LoyaltyPanel, VenuePanel, JourneyPanel, ExperienceModal } from './ProductPanels';

const CityMap = dynamic(() => import('./CityMap'), { ssr: false });
const chapters = ['The city', 'Discover', 'A table', 'Your order', 'Connected', 'For venues', 'One journey', 'Your night'];
const ids = ['city', 'discover', 'booking', 'preorder', 'loyalty', 'venues', 'journey', 'your-night'];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function Spark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true"><path d="m16 0 3.3 12.7L32 16l-12.7 3.3L16 32l-3.3-12.7L0 16l12.7-3.3Z" fill="currentColor" /></svg>;
}

export default function HostessExperience() {
  const story = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [venue, setVenue] = useState('lumen');
  const [modal, setModal] = useState<'guest' | 'venue' | 'about' | null>(null);
  const [menu, setMenu] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [motionOff, setMotionOff] = useState(false);

  useEffect(() => {
    let mounted = true;
    const initialChapter = window.location.hash.slice(1);
    document.fonts.ready.then(() => {
      if (!mounted) return;
      ScrollTrigger.refresh();
      if (ids.includes(initialChapter)) document.getElementById(initialChapter)?.scrollIntoView({ behavior: 'instant' });
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, (context) => {
      const noMotion = Boolean(context.conditions?.reduced) || motionOff;
      setReduced(noMotion);
      const clock = { value: 0 };
      let stops: number[] = [];
      const renderCamera = () => {
        const p = clock.value;
        setProgress(p);
        setActive(Math.min(7, Math.floor(p + 0.38)));
      };
      const smoothCamera = gsap.quickTo(clock, 'value', { duration: .65, ease: 'power2.out', onUpdate: renderCamera });
      const measure = () => {
        const max = Math.max(1, (story.current?.offsetHeight ?? 1) - window.innerHeight);
        stops = ids.map(id => Math.min(max, document.getElementById(id)?.offsetTop ?? 0));
      };
      const update = () => {
        const y = window.scrollY;
        let index = 0;
        while (index < 6 && y >= stops[index + 1]) index++;
        const fraction = Math.max(0, Math.min(1, (y - stops[index]) / Math.max(1, stops[index + 1] - stops[index])));
        const p = Math.min(7, index + fraction);
        if (noMotion) { clock.value = p; renderCamera(); } else smoothCamera(p);
      };
      measure();
      ScrollTrigger.create({ trigger: story.current, start: 'top top', end: 'bottom bottom', onUpdate: update, onRefresh: () => { measure(); update(); } });
      if (!noMotion) {
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.fromTo(el, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 89%', toggleActions: 'play none none reverse' } });
        });
      }
      ScrollTrigger.refresh();
      update();
      const observer = new ResizeObserver(() => ScrollTrigger.refresh());
      if (story.current) observer.observe(story.current);
      return () => observer.disconnect();
    });
    return () => mm.revert();
  }, [motionOff]);

  const go = (i: number) => {
    setMenu(false);
    window.history.replaceState(null, '', `#${ids[i]}`);
    document.getElementById(ids[i])?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
  };

  return <>
    <a className="skip-link" href="#discover">Skip to the experience</a>
    <div className="city-stage"><CityMap progress={progress} activeChapter={active} selectedVenue={venue} onVenueSelect={setVenue} motionPaused={motionOff} /></div>
    <div className="film-shade" aria-hidden="true" />
    <div className="film-grain" aria-hidden="true" />
    <header className="topbar">
      <a href="#city" className="wordmark" aria-label="Hostess home">hostess<Spark /></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <button onClick={() => go(1)} className={active >= 1 && active <= 4 ? 'nav-active' : ''}>The experience</button>
        <button onClick={() => go(5)} className={active === 5 ? 'nav-active' : ''}>For venues</button>
      </nav>
      <button className="nav-cta" onClick={() => setModal('guest')}>Find your night <Arrow diagonal /></button>
      <button className="menu-toggle" aria-label={menu ? 'Close chapter menu' : 'Open chapter menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}><span /><span /></button>
    </header>
    {menu && <nav className="mobile-menu" aria-label="Chapters">{chapters.map((c, i) => <button key={c} onClick={() => go(i)}><span>0{i + 1}</span>{c}<Arrow /></button>)}</nav>}
    <aside className="chapter-nav" aria-label="Journey chapters">
      {chapters.map((c, i) => <button key={c} onClick={() => go(i)} aria-label={`Chapter ${i + 1}: ${c}`} aria-current={active === i ? 'step' : undefined} className={active === i ? 'is-active' : ''}><span className="chapter-tooltip">{c}</span><span className="chapter-dot" /></button>)}
      <span className="chapter-count">0{active + 1}<i>/ 08</i></span>
    </aside>
    <main ref={story} className="story">
      <section id="city" className="scene hero-scene" aria-labelledby="hero-title">
        <div className="scene-inner hero-inner">
          <div className="hero-copy">
            <p className="eyebrow reveal"><span className="status-dot" /> ONE CITY. ONE HOSTESS.</p>
            <h1 id="hero-title" className="reveal">The city<br />is <em>yours.</em></h1>
            <p className="hero-description reveal">A table worth finding.<br />A night worth staying for.</p>
            <div className="hero-actions reveal"><button className="button-primary" onClick={() => go(1)}>Step inside <Arrow /></button><span className="quiet-note">Your next great night<br />starts with a little curiosity.</span></div>
          </div>
          <div className="city-caption"><span className="crosshair">+</span><div><b>NEW YORK CITY</b><span>40°43′ N &nbsp; 73°59′ W</span></div><span className="caption-line" /><span>AFTER DARK</span></div>
          <div className="hero-venue-note reveal"><span className="tiny-label">SOMEWHERE GOOD, JUST AROUND THE CORNER</span><div><span className="venue-orbit"><Spark /></span><span><b>The evening is open.</b><small>Dining. Drinks. A little spontaneity.</small></span><button aria-label="Discover the city" onClick={() => go(1)}><Arrow diagonal /></button></div></div>
          <button className="scroll-hint" onClick={() => go(1)}><span className="scroll-line" /><span>SCROLL TO EXPLORE</span><span>↓</span></button>
        </div>
      </section>

      <section id="discover" className="scene discovery-scene" aria-labelledby="discover-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal"><span>01 / DISCOVER</span><span className="small-rule" /></p>
            <h2 id="discover-title" className="reveal">Follow your<br /><em>appetite.</em></h2>
            <p className="body-copy reveal">The candlelit corner. The rooftop after sunset. The place you almost walked past.</p>
            <p className="body-secondary reveal">Good places are closer than you think. Find a little of what you love — and a little of what you haven’t tried.</p>
            <div className="scene-footnote reveal"><span className="line-icon">⌖</span><span>Five places. A thousand possible evenings.<small>Explore our illustrative Manhattan collection.</small></span></div>
          </div>
          <div className="scene-product reveal"><DiscoveryPanel selected={venue} onSelect={setVenue} /></div>
        </div>
      </section>

      <section id="booking" className="scene booking-scene" aria-labelledby="booking-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal">02 / MAKE IT A DATE</p>
            <h2 id="booking-title" className="reveal">Less arranging.<br /><em>More arriving.</em></h2>
            <p className="body-copy reveal">Pick a place. Choose a time.<br />Leave the rest of the evening open.</p>
            <p className="body-secondary reveal">A reservation should be the beginning of your night, never the complicated part.</p>
            <div className="editorial-number reveal"><span>01</span><p>A few taps.<br />A seat with your name on it.</p></div>
          </div>
          <div className="scene-product reveal"><BookingPanel venue={venue} /></div>
        </div>
      </section>

      <section id="preorder" className="scene preorder-scene" aria-labelledby="preorder-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal">03 / AHEAD OF THE EVENING</p>
            <h2 id="preorder-title" className="reveal">Your first round.<br /><em>One step ahead.</em></h2>
            <p className="body-copy reveal">You bring the company.<br />Let your favourites lead the way.</p>
            <p className="body-secondary reveal">Explore the menu before you arrive. Plan a welcome drink, a plate to share, or the start of something memorable.</p>
            <span className="editorial-aside reveal">Less waiting. More being there.</span>
          </div>
          <div className="scene-product reveal"><PreorderPanel /></div>
        </div>
      </section>

      <section id="loyalty" className="scene loyalty-scene" aria-labelledby="loyalty-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal"><span className="blue-dot" />04 / GOOD NIGHTS CONNECT</p>
            <h2 id="loyalty-title" className="reveal">New places.<br /><em>Familiar perks.</em></h2>
            <p className="body-copy reveal">A great dinner tonight.<br />A little more possibility tomorrow.</p>
            <p className="body-secondary reveal">One balance travels with you across participating venues. Earn in one place. Discover what’s next in another.</p>
            <div className="network-legend reveal"><span /><span /><span /><p>Independent places.<br />One connected circle.</p></div>
          </div>
          <div className="scene-product reveal"><LoyaltyPanel /></div>
        </div>
      </section>

      <section id="venues" className="scene venues-scene" aria-labelledby="venues-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal">05 / ON THE OTHER SIDE OF THE TABLE</p>
            <h2 id="venues-title" className="reveal">Every seat<br />has a <em>story.</em></h2>
            <p className="body-copy reveal">Give yours a next chapter.</p>
            <p className="body-secondary reveal">Turn discovery into a reservation. A reservation into a considered order. A good experience into a reason to return.</p>
            <button className="text-link reveal" onClick={() => setModal('venue')}>Bring your venue into the city <Arrow diagonal /></button>
          </div>
          <div className="scene-product wide-product reveal"><VenuePanel /></div>
        </div>
      </section>

      <section id="journey" className="scene journey-scene" aria-labelledby="journey-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal">06 / THE WHOLE PICTURE</p>
            <h2 id="journey-title" className="reveal">One evening.<br /><em>All connected.</em></h2>
            <p className="body-copy reveal">From “where shall we go?”<br />to “let’s do that again.”</p>
            <p className="body-secondary reveal">Your plans, your order and your rewards belong to the same journey. Hostess brings them together, so you can stay in the moment.</p>
          </div>
          <div className="scene-product reveal"><JourneyPanel /></div>
        </div>
      </section>

      <section id="your-night" className="scene finale-scene" aria-labelledby="finale-title">
        <div className="scene-inner finale-inner">
          <p className="eyebrow reveal">THE NIGHT IS STILL YOUNG.</p>
          <h2 id="finale-title" className="reveal">Go somewhere<br /><em>worth remembering.</em></h2>
          <p className="body-copy reveal">One city. One Hostess. Your kind of night.</p>
          <div className="finale-actions reveal"><button className="button-primary" onClick={() => setModal('guest')}>Find your night <Arrow diagonal /></button><button className="button-outline" onClick={() => setModal('venue')}>For your venue <Arrow diagonal /></button></div>
          <div className="footer-wordmark">hostess<Spark /></div>
          <footer><span>© {new Date().getFullYear()} Hostess · Concept experience</span><button onClick={() => setModal('about')}>About this experience <Arrow diagonal /></button><button onClick={() => go(0)}>Back to the city ↑</button></footer>
        </div>
      </section>
    </main>
    <div className="journey-status" aria-hidden="true"><span className="status-dot" /><span>MANHATTAN / {chapters[active].toUpperCase()}</span><span className="status-progress"><span style={{ width: `${progress / 7 * 100}%` }} /></span></div>
    <button className="motion-toggle" aria-label="Use calm motion" aria-pressed={reduced} disabled={reduced && !motionOff} onClick={() => setMotionOff(value => !value)}><span aria-hidden="true">{reduced ? '◯' : 'Ⅱ'}</span>{reduced ? 'CALM MOTION' : 'MOTION ON'}</button>
    <ExperienceModal mode={modal} venue={venue} onClose={() => setModal(null)} />
  </>;
}
