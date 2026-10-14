'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DiscoveryPanel as DiscoveryView, BookingPanel as BookingView, PreorderPanel as PreorderView, LoyaltyPanel as LoyaltyView, VenuePanel as VenueView, JourneyPanel as JourneyView, ExperienceModal } from './ProductPanels';
import type { ScrollState } from '../lib/scroll-state';

const DiscoveryPanel = memo(DiscoveryView);
const BookingPanel = memo(BookingView);
const PreorderPanel = memo(PreorderView);
const LoyaltyPanel = memo(LoyaltyView);
const VenuePanel = memo(VenueView);
const JourneyPanel = memo(JourneyView);

const CityMap = dynamic(() => import('./CityMap'), { ssr: false });
const chapters = ['Город', 'Выбор места', 'Столик', 'Предзаказ', 'Бонусы', 'Заведениям', 'Ваш маршрут', 'Ваш вечер'];
const ids = ['city', 'discover', 'booking', 'preorder', 'loyalty', 'venues', 'journey', 'your-night'];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function Spark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true"><path d="m16 0 3.3 12.7L32 16l-12.7 3.3L16 32l-3.3-12.7L0 16l12.7-3.3Z" fill="currentColor" /></svg>;
}

export default function HostessExperience() {
  const story = useRef<HTMLElement>(null);
  const motion = useRef<ScrollState>({ progress: 0, activeChapter: 0, paused: false });
  const progressLine = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const renderer = useRef<(() => void) | undefined>(undefined);
  const registerRenderer = useCallback((draw: () => void) => {
    renderer.current = draw;
    return () => { if (renderer.current === draw) renderer.current = undefined; };
  }, []);
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
      motion.current.paused = noMotion;
      const clock = { value: 0 };
      let stops: number[] = [];
      const renderCamera = () => {
        const p = clock.value;
        const next = Math.min(7, Math.floor(p + 0.38));
        motion.current.progress = p;
        motion.current.activeChapter = next;
        renderer.current?.();
        if (progressLine.current) progressLine.current.style.transform = `scaleX(${p / 7})`;
        if (activeRef.current !== next) { activeRef.current = next; setActive(next); }
      };
      const smoothCamera = gsap.quickTo(clock, 'value', { duration: .24, ease: 'power2.out', onUpdate: renderCamera });
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
        gsap.utils.toArray<HTMLElement>('.scene').forEach((scene) => {
          const elements = gsap.utils.toArray<HTMLElement>('.reveal', scene);
          let reveal: gsap.core.Tween | undefined;
          gsap.set(elements, { y: 26, opacity: 0 });
          const finish = () => { reveal?.kill(); gsap.set(elements, { y: 0, opacity: 1 }); };
          const show = () => {
            if (scene.getBoundingClientRect().bottom < 0) { finish(); return; }
            reveal?.kill();
            reveal = gsap.to(elements, { y: 0, opacity: 1, stagger: .04, duration: .65, ease: 'power3.out', overwrite: true });
          };
          ScrollTrigger.create({ trigger: scene, start: 'top 70%', end: 'bottom 10%', onEnter: show, onEnterBack: show, onLeave: finish, onLeaveBack: finish });
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
    <a className="skip-link" href="#discover">Перейти к выбору заведения</a>
    <div className="city-stage"><CityMap motion={motion} registerRenderer={registerRenderer} selectedVenue={venue} onVenueSelect={setVenue} /></div>
    <div className="film-shade" aria-hidden="true" />
    <div className="film-grain" aria-hidden="true" />
    <header className="topbar">
      <a href="#city" className="wordmark" aria-label="Hostess — начало">hostess<Spark /></a>
      <nav className="desktop-nav" aria-label="Основная навигация">
        <button onClick={() => go(1)} className={active >= 1 && active <= 4 ? 'nav-active' : ''}>Как это работает</button>
        <button onClick={() => go(5)} className={active === 5 ? 'nav-active' : ''}>Заведениям</button>
      </nav>
      <button className="nav-cta" onClick={() => setModal('guest')}>Выбрать место <Arrow diagonal /></button>
      <button className="menu-toggle" aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} onClick={() => setMenu(!menu)}><span /><span /></button>
    </header>
    {menu && <nav className="mobile-menu" aria-label="Главы">{chapters.map((c, i) => <button key={c} onClick={() => go(i)}><span>0{i + 1}</span>{c}<Arrow /></button>)}</nav>}
    <aside className="chapter-nav" aria-label="Навигация по главам">
      {chapters.map((c, i) => <button key={c} onClick={() => go(i)} aria-label={`Глава ${i + 1}: ${c}`} aria-current={active === i ? 'step' : undefined} className={active === i ? 'is-active' : ''}><span className="chapter-tooltip">{c}</span><span className="chapter-dot" /></button>)}
      <span className="chapter-count">0{active + 1}<i>/ 08</i></span>
    </aside>
    <main ref={story} className="story">
      <section id="city" className="scene hero-scene" aria-labelledby="hero-title">
        <div className="scene-inner hero-inner">
          <div className="hero-copy">
            <p className="eyebrow reveal"><span className="status-dot" /> РЕСТОРАНЫ · БАРЫ · ВАШИ ПЛАНЫ</p>
            <h1 id="hero-title" className="reveal">Вечер<br /><em>в городе.</em></h1>
            <p className="hero-description reveal">Ресторан, столик и планы на вечер —<br />в одном месте.</p>
            <div className="hero-actions reveal"><button className="button-primary" onClick={() => go(1)}>Посмотреть места <Arrow /></button><span className="quiet-note">Выберите, куда пойти.<br />Остальное спланируйте здесь.</span></div>
          </div>
          <div className="city-caption"><span className="crosshair">+</span><div><b>НЬЮ-ЙОРК</b><span>40°43′ N &nbsp; 73°59′ W</span></div><span className="caption-line" /><span>ПОСЛЕ ЗАКАТА</span></div>
          <div className="hero-venue-note reveal"><span className="tiny-label">ВАШИ ПЛАНЫ НА КАРТЕ ГОРОДА</span><div><span className="venue-orbit"><Spark /></span><span><b>Сначала — место.</b><small>Ужин, бар или столик на крыше.</small></span><button aria-label="Выбрать заведение" onClick={() => go(1)}><Arrow diagonal /></button></div></div>
          <button className="scroll-hint" onClick={() => go(1)}><span className="scroll-line" /><span>ЛИСТАЙТЕ ДАЛЬШЕ</span><span>↓</span></button>
        </div>
      </section>

      <section id="discover" className="scene discovery-scene" aria-labelledby="discover-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal"><span>01 / ВЫБОР МЕСТА</span><span className="small-rule" /></p>
            <h2 id="discover-title" className="reveal">Найдите<br /><em>своё место.</em></h2>
            <p className="body-copy reveal">Ужин в тихом зале. Бар с хорошими коктейлями. Столик над вечерним городом.</p>
            <p className="body-secondary reveal">Начните с того, каким вы хотите провести вечер. Посмотрите заведения, выберите формат и отметьте место на карте.</p>
            <div className="scene-footnote reveal"><span className="line-icon">⌖</span><span>Пять мест — пять разных поводов встретиться.<small>Демонстрационная подборка на Манхэттене.</small></span></div>
          </div>
          <div className="scene-product reveal"><DiscoveryPanel selected={venue} onSelect={setVenue} /></div>
        </div>
      </section>

      <section id="booking" className="scene booking-scene" aria-labelledby="booking-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal">02 / БРОНИРОВАНИЕ</p>
            <h2 id="booking-title" className="reveal">Время выбрано.<br /><em>Столик за вами.</em></h2>
            <p className="body-copy reveal">Выберите дату, время<br />и число гостей.</p>
            <p className="body-secondary reveal">Все параметры бронирования — перед вами. Не нужно созваниваться с компанией, искать меню и уточнять время в разных переписках.</p>
            <div className="editorial-number reveal"><span>01</span><p>Визит начинается<br />с понятного бронирования.</p></div>
          </div>
          <div className="scene-product reveal"><BookingPanel venue={venue} /></div>
        </div>
      </section>

      <section id="preorder" className="scene preorder-scene" aria-labelledby="preorder-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal">03 / ПРЕДЗАКАЗ</p>
            <h2 id="preorder-title" className="reveal">Меню<br /><em>заранее.</em></h2>
            <p className="body-copy reveal">Выберите блюда и напитки<br />до визита.</p>
            <p className="body-secondary reveal">Пара коктейлей к встрече, закуска на двоих или ужин для компании. Предзаказ дополняет бронирование и помогает заведению подготовиться.</p>
            <span className="editorial-aside reveal">За столом — время для разговора.</span>
          </div>
          <div className="scene-product reveal"><PreorderPanel /></div>
        </div>
      </section>

      <section id="loyalty" className="scene loyalty-scene" aria-labelledby="loyalty-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal"><span className="blue-dot" />04 / ОБЩИЕ БОНУСЫ</p>
            <h2 id="loyalty-title" className="reveal">Новые места.<br /><em>Общие бонусы.</em></h2>
            <p className="body-copy reveal">Баланс один.<br />Заведений — несколько.</p>
            <p className="body-secondary reveal">Получайте бонусы за визиты и используйте их в заведениях сети. Не обязательно возвращаться туда, где вы их заработали.</p>
            <div className="network-legend reveal"><span /><span /><span /><p>Разные заведения.<br />Общая программа.</p></div>
          </div>
          <div className="scene-product reveal"><LoyaltyPanel /></div>
        </div>
      </section>

      <section id="venues" className="scene venues-scene" aria-labelledby="venues-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal">05 / ЗАВЕДЕНИЯМ</p>
            <h2 id="venues-title" className="reveal">Работа с гостями<br /><em>до и после визита.</em></h2>
            <p className="body-copy reveal">От первого интереса — к повторному визиту.</p>
            <p className="body-secondary reveal">Бронирования, предзаказы и лояльность в одном процессе. Видно, что выбрали гости, когда они придут и как меняется число повторных визитов.</p>
            <button className="text-link reveal" onClick={() => setModal('venue')}>Обсудить подключение <Arrow diagonal /></button>
          </div>
          <div className="scene-product wide-product reveal"><VenuePanel /></div>
        </div>
      </section>

      <section id="journey" className="scene journey-scene" aria-labelledby="journey-title">
        <div className="scene-inner">
          <div className="scene-copy">
            <p className="eyebrow reveal">06 / ЕДИНЫЙ МАРШРУТ</p>
            <h2 id="journey-title" className="reveal">Весь вечер<br /><em>в одном месте.</em></h2>
            <p className="body-copy reveal">Сначала — ресторан.<br />Потом — бар неподалёку.</p>
            <p className="body-secondary reveal">Ваши бронирования, заказы и бонусы связаны между собой. Продолжайте вечер в другом месте, сохраняя планы и общий баланс.</p>
          </div>
          <div className="scene-product reveal"><JourneyPanel /></div>
        </div>
      </section>

      <section id="your-night" className="scene finale-scene" aria-labelledby="finale-title">
        <div className="scene-inner finale-inner">
          <p className="eyebrow reveal">ПЛАНЫ НА ВЕЧЕР НАЧИНАЮТСЯ ЗДЕСЬ</p>
          <h2 id="finale-title" className="reveal">Пора<br /><em>выбрать место.</em></h2>
          <p className="body-copy reveal">Ресторан, бар или встреча над городом. Решать вам.</p>
          <div className="finale-actions reveal"><button className="button-primary" onClick={() => setModal('guest')}>Выбрать место <Arrow diagonal /></button><button className="button-outline" onClick={() => setModal('venue')}>Подключить заведение <Arrow diagonal /></button></div>
          <div className="footer-wordmark">hostess<Spark /></div>
          <footer><span>© {new Date().getFullYear()} Hostess · Концепция продукта</span><button onClick={() => setModal('about')}>О проекте <Arrow diagonal /></button><button onClick={() => go(0)}>К началу ↑</button></footer>
        </div>
      </section>
    </main>
    <div className="journey-status" aria-hidden="true"><span className="status-dot" /><span>МАНХЭТТЕН / {chapters[active].toUpperCase()}</span><span className="status-progress"><span ref={progressLine} /></span></div>
    <button className="motion-toggle" aria-label="Спокойная анимация" aria-pressed={reduced} disabled={reduced && !motionOff} onClick={() => setMotionOff(value => !value)}><span aria-hidden="true">{reduced ? '◯' : 'Ⅱ'}</span>{reduced ? 'СПОКОЙНЫЙ РЕЖИМ' : 'АНИМАЦИЯ'}</button>
    <ExperienceModal mode={modal} venue={venue} onClose={() => setModal(null)} />
  </>;
}
