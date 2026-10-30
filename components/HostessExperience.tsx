'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AgentChat, HallTablet, Laptop, Phone, PhoneStage } from './Devices';
import { CHAPTERS, FIRST_BUSINESS } from '../lib/story';
import type { ScrollState } from '../lib/scroll-state';

const CityMap = dynamic(() => import('./CityMap'), { ssr: false });
const LAST = CHAPTERS.length - 1;
const APP_URL = 'https://hostes.online';
const ADMIN_URL = 'https://admin.hostes.online';

const SCREENS = [
  { id: 'app-map', alt: 'Карта Hostess: заведения Астаны с фотографиями и живой загрузкой' },
  { id: 'app-places', alt: 'Раздел «Места»: подборка «Сегодня вечером» с Selfie на первом месте' },
  { id: 'app-concierge', alt: 'Консьерж предлагает Selfie на 18 этаже Ritz-Carlton для ужина с видом' },
  { id: 'app-selfie', tone: 'dark' as const, alt: 'Карточка Selfie: прямой эфир из кухни и загрузка зала 92%' },
  { id: 'app-xoxo', tone: 'dark' as const, alt: 'Карточка XOXO Sports & Lounge с кнопкой бронирования' },
  { id: 'app-tables', alt: 'Бронирование в XOXO: выбор конкретного стола по зонам зала' },
  { id: 'app-exchange', alt: 'Биржа напитков XOXO: цены текущего раунда ниже обычных' },
  { id: 'app-tangiers', tone: 'dark' as const, alt: 'Карточка Tangiers Lounge: загрузка 38%, свободно' },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d={diagonal ? 'M7 17 17 7M8 7h9v9' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function Spark() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 0 3.3 12.7L32 16l-12.7 3.3L16 32l-3.3-12.7L0 16l12.7-3.3Z" fill="currentColor" /></svg>;
}

function Scene({ index, title, eyebrow, children, aside, wide, className = '' }: {
  index: number; title: ReactNode; eyebrow: string; children: ReactNode; aside?: ReactNode; wide?: boolean; className?: string;
}) {
  const chapter = CHAPTERS[index];
  const screen = SCREENS.find(s => s.id === chapter.screen);
  return <section id={chapter.id} className={`scene ${chapter.business ? 'scene--business' : 'scene--guest'} ${wide ? 'scene--wide' : ''} ${className}`} aria-labelledby={`${chapter.id}-title`}>
    <div className="scene__inner">
      <div className="scene__copy">
        <p className="eyebrow reveal"><span>{String(index).padStart(2, '0')}</span>{eyebrow}</p>
        <h2 id={`${chapter.id}-title`} className="reveal">{title}</h2>
        {children}
      </div>
      {aside && <div className="scene__device reveal">{aside}</div>}
      {screen && <div className="scene__phone-inline reveal"><Phone screen={screen.id} alt={screen.alt} tone={screen.tone} /></div>}
    </div>
  </section>;
}

export default function HostessExperience() {
  const story = useRef<HTMLElement>(null);
  const motion = useRef<ScrollState>({ progress: 0, activeChapter: 0, paused: false });
  const progressLine = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const renderer = useRef<(() => void) | undefined>(undefined);
  const registerRenderer = useCallback((draw: () => void) => {
    renderer.current = draw;
    draw();
    return () => { if (renderer.current === draw) renderer.current = undefined; };
  }, []);
  const [active, setActive] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, context => {
      const still = Boolean(context.conditions?.reduced);
      motion.current.paused = still;
      const clock = { value: motion.current.progress };
      let stops: number[] = [];
      const render = () => {
        const p = clock.value;
        const chapter = Math.min(LAST, Math.floor(p + .5));
        motion.current.progress = p;
        motion.current.activeChapter = chapter;
        renderer.current?.();
        if (progressLine.current) progressLine.current.style.transform = `scaleX(${p / LAST})`;
        if (activeRef.current !== chapter) { activeRef.current = chapter; setActive(chapter); }
      };
      const glide = gsap.quickTo(clock, 'value', { duration: .5, ease: 'power3.out', onUpdate: render });
      const measure = () => {
        const max = Math.max(1, (story.current?.offsetHeight ?? 1) - window.innerHeight);
        stops = CHAPTERS.map(c => {
          const el = document.getElementById(c.id);
          // A chapter's camera is reached when its section is centred in the viewport.
          return el ? Math.min(max, Math.max(0, el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2)) : 0;
        });
      };
      const update = () => {
        const y = window.scrollY;
        let i = 0;
        while (i < LAST - 1 && y >= stops[i + 1]) i++;
        const span = Math.max(1, stops[i + 1] - stops[i]);
        const p = Math.min(LAST, i + Math.max(0, Math.min(1, (y - stops[i]) / span)));
        if (still) { clock.value = Math.round(p); render(); } else glide(p);
      };
      measure();
      ScrollTrigger.create({ trigger: story.current, start: 'top top', end: 'bottom bottom', onUpdate: update, onRefresh: () => { measure(); update(); } });
      if (!still) {
        gsap.utils.toArray<HTMLElement>('.scene, .hero').forEach(scene => {
          const items = gsap.utils.toArray<HTMLElement>('.reveal', scene);
          gsap.set(items, { y: 28, opacity: 0 });
          ScrollTrigger.create({
            trigger: scene, start: 'top 72%', once: true,
            onEnter: () => gsap.to(items, { y: 0, opacity: 1, duration: .8, stagger: .06, ease: 'power3.out' }),
          });
        });
      }
      const observer = new ResizeObserver(() => ScrollTrigger.refresh());
      if (story.current) observer.observe(story.current);
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      update();
      return () => observer.disconnect();
    });
    return () => mm.revert();
  }, []);

  const go = (id: string) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: motion.current.paused ? 'instant' : 'smooth', block: 'center' });
  };
  const business = active >= FIRST_BUSINESS;

  return <>
    <a className="skip-link" href="#discover">К содержанию</a>
    <div className="city-stage"><CityMap motion={motion} registerRenderer={registerRenderer} /></div>
    <div className="city-shade" data-business={business} aria-hidden="true" />

    <header className="topbar">
      <a href="#city" className="wordmark" aria-label="Hostess — в начало" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>hostess<Spark /></a>
      <nav className="topnav" aria-label="Разделы">
        <button onClick={() => go('discover')} className={active > 0 && !business ? 'is-on' : ''}>Гостям</button>
        <button onClick={() => go('business')} className={business ? 'is-on' : ''}>Заведениям</button>
        <a href={ADMIN_URL} target="_blank" rel="noopener">Вход для команды</a>
      </nav>
      <a className="topbar__cta" href={APP_URL} target="_blank" rel="noopener">Открыть Hostess <Arrow diagonal /></a>
      <button className="menu-toggle" aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} onClick={() => setMenu(!menu)}><span /><span /></button>
    </header>
    {menu && <nav className="mobile-menu" aria-label="Главы">
      {CHAPTERS.map((c, i) => <button key={c.id} onClick={() => go(c.id)}><span>{String(i).padStart(2, '0')}</span>{c.nav}<Arrow /></button>)}
      <a href={ADMIN_URL} target="_blank" rel="noopener"><span>→</span>Вход для команды<Arrow diagonal /></a>
    </nav>}

    <aside className="chapter-rail" aria-label="Главы">
      {CHAPTERS.map((c, i) => <button key={c.id} onClick={() => go(c.id)} aria-label={c.nav} aria-current={active === i ? 'step' : undefined} className={`${active === i ? 'is-on' : ''} ${c.business ? 'is-biz' : ''}`}>
        <span className="chapter-rail__tip">{c.nav}</span><span className="chapter-rail__dot" />
      </button>)}
    </aside>

    <PhoneStage screens={SCREENS} active={CHAPTERS[active]?.screen} />

    <main ref={story} className="story">
      <section id="city" className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow reveal"><span className="live-dot" />Рестораны и бары · бронь · консьерж</p>
          <h1 id="hero-title" className="reveal">Город<br /><em>после восьми.</em></h1>
          <p className="hero__lead reveal">Hostess показывает, где сейчас есть места, бронирует конкретный стол и держит весь вечер — от первого вопроса до последнего бокала — в одном приложении.</p>
          <div className="hero__actions reveal">
            <a className="button button--gold" href={APP_URL} target="_blank" rel="noopener">Открыть Hostess <Arrow diagonal /></a>
            <button className="button button--ghost" onClick={() => go('business')}>Для заведений <Arrow /></button>
          </div>
        </div>
        <button className="hero__scroll" onClick={() => go('discover')}><span className="hero__scroll-line" />Листайте: один вечер, три адреса, 2,7 км</button>
        <div className="scene__phone-inline hero__phone reveal"><Phone screen="app-map" alt={SCREENS[0].alt} /></div>
      </section>

      <Scene index={1} eyebrow="Выбор" title={<>Сначала —<br /><em>куда.</em></>}>
        <p className="lead reveal">Подборка на сегодня, рестораны рядом и афиша — в одной ленте.</p>
        <p className="body reveal">У каждого места видно главное ещё до карточки: кухня, район, рейтинг и то, насколько сейчас занят зал. Вечер начинается с честного ответа «есть ли там места».</p>
        <dl className="facts reveal">
          <div><dt>7</dt><dd>мест в «Выборе Hostess» на этот вечер</dd></div>
          <div><dt>4.9</dt><dd>у Selfie — 1 520 отзывов</dd></div>
        </dl>
      </Scene>

      <Scene index={2} eyebrow="Консьерж" title={<>Опишите вечер<br /><em>словами.</em></>}>
        <p className="lead reveal">«Ужин на двоих сегодня с видом на город» — и консьерж отвечает конкретным местом, а не списком из двадцати.</p>
        <blockquote className="quote reveal">
          <p>Для такого вечера — Selfie на 18 этаже Ritz-Carlton. Попрошу стол у окна: закат над Есилем начинается около девяти.</p>
          <cite>Ответ консьержа Hostess</cite>
        </blockquote>
        <p className="body reveal">Можно написать или наговорить голосом. Консьерж помнит повод, аллергии и любимый стол — и передаёт это заведению вместе с бронью.</p>
      </Scene>

      <Scene index={3} eyebrow="Загрузка зала" title={<>Зал виден<br /><em>заранее.</em></>}>
        <p className="lead reveal">Selfie сейчас заполнен на 92%. Это видно до того, как вы вызвали такси.</p>
        <div className="meters reveal">
          <div className="meter" style={{ ['--v' as string]: .92 }}><span className="meter__ring" /><b>92%</b><p><strong>Selfie</strong>почти полно</p></div>
          <div className="meter meter--calm" style={{ ['--v' as string]: .38 }}><span className="meter__ring" /><b>38%</b><p><strong>Tangiers</strong>свободно</p></div>
        </div>
        <p className="body reveal">Загрузка приходит из системы заведения и обновляется в течение вечера. В карточке — прямой эфир из кухни или зала, меню с ценами и средний чек.</p>
      </Scene>

      <Scene index={4} eyebrow="Дальше по вечеру" title={<>После ужина —<br /><em>матч.</em></>}>
        <p className="lead reveal">Маршрут продолжается: XOXO Sports & Lounge, двенадцать минут пешком.</p>
        <p className="body reveal">Спорт-бар с трансляциями, кухней и большим баром. Бронь, меню на 119 позиций и биржа напитков — в той же карточке, без звонков и переходов в мессенджеры.</p>
        <p className="route-note reveal"><span>1,0 км</span>Selfie → XOXO</p>
      </Scene>

      <Scene index={5} eyebrow="Стол" title={<>Не «столик».<br /><em>Стол 15.</em></>}>
        <p className="lead reveal">Вы выбираете конкретный стол в нужном зале — с доступностью ровно на ваше время.</p>
        <p className="body reveal">Зоны, вместимость и занятость берутся из схемы зала, которую ведёт команда XOXO. Хотите напротив экрана — так и бронируете. Заявка сразу появляется у хостес в Command Center.</p>
        <ul className="ticks reveal"><li>ПС / общий зал — 3 стола у экрана</li><li>Первый зал — 8 столов</li><li>Бронь на 2 часа, подтверждает заведение</li></ul>
      </Scene>

      <Scene index={6} eyebrow="Биржа напитков" title={<>Цены, которые<br /><em>двигаются.</em></>}>
        <p className="lead reveal">В XOXO цены на напитки меняются раундами, как на бирже. В этом раунде «Хортица Айс» — на 34% дешевле.</p>
        <div className="ticker reveal" aria-label="Пример раунда биржи">
          <span><b>Хортица Айс</b>590 ₸<s>890 ₸</s><em>−34%</em></span>
          <span><b>Немецкое 0,5</b>790 ₸<s>1 190 ₸</s><em>−34%</em></span>
          <span><b>Кызылжар</b>590 ₸<i>0,0%</i></span>
        </div>
        <p className="body reveal">Гость видит текущий раунд и прошлую цену прямо в приложении. Для бара это способ поднять продажи в тихие часы, не снижая цены на всё меню.</p>
      </Scene>

      <Scene index={7} eyebrow="Последний адрес" title={<>Вечер не обязан<br /><em>заканчиваться.</em></>}>
        <p className="lead reveal">Tangiers Lounge, авторские коктейли. Загрузка — 38%, места есть.</p>
        <p className="body reveal">Брони, заказы и история визитов собираются в одном профиле. В следующий раз консьерж уже знает, что вам понравилось, а заведение — как вас встретить.</p>
        <dl className="facts facts--route reveal">
          <div><dt>2,7 км</dt><dd>пешком за вечер</dd></div>
          <div><dt>3</dt><dd>заведения</dd></div>
          <div><dt>1</dt><dd>приложение</dd></div>
        </dl>
      </Scene>

      <div className="divider" aria-hidden="true"><span>Hostess для заведений</span></div>

      <Scene index={8} wide eyebrow="Для заведений" title={<>Один пульт<br /><em>на всё заведение.</em></>}
        aside={<Laptop screen="cc-dashboard" alt="Command Center: выручка бара за сегодня, сделки биржи и средний чек" label="admin.hostes.online" />}>
        <p className="lead reveal">Hostess Command Center — рабочее место команды: зал, брони, заказы, меню, гости и выручка.</p>
        <p className="body reveal">Открывается в браузере — на ноутбуке управляющего, планшете у стойки хостес или телефоне. Ничего не нужно устанавливать, а каждое изменение сразу видно гостям в приложении.</p>
        <ul className="ticks reveal"><li>Смена: новые заказы, брони и задачи в одной очереди</li><li>Меню, стоп-лист и биржа напитков</li><li>Роли для владельца, управляющего и хостес</li></ul>
      </Scene>

      <Scene index={9} wide eyebrow="Зал и брони" title={<>Зал<br /><em>в реальном времени.</em></>} aside={<HallTablet />}>
        <p className="lead reveal">Схема с настоящими столами: кто сидит, кто придёт в 20:30 и где посадить гостя без брони.</p>
        <ul className="ticks reveal">
          <li>Брони из приложения, WhatsApp и по телефону — в одной ленте</li>
          <li>Лист ожидания и сообщение гостю, когда стол освободился</li>
          <li>QR на каждом столе: меню, заказ и счёт без ожидания официанта</li>
          <li>Загрузка зала уходит в приложение — гости видят её на карте</li>
        </ul>
      </Scene>

      <Scene index={10} wide eyebrow="AI-хостес" title={<>Хостес<br /><em>без выходных.</em></>} aside={<AgentChat />}>
        <p className="lead reveal">AI-агент отвечает гостям в WhatsApp: подбирает время, бронирует стол, переносит визит и напоминает о нём.</p>
        <p className="body reveal">Агент работает по вашей схеме зала и вашим правилам — депозит, минимальный чек, длительность брони. Нестандартные просьбы передаёт живому сотруднику вместе со всей перепиской.</p>
        <dl className="facts reveal">
          <div><dt>24/7</dt><dd>ответ без ожидания, в том числе ночью</dd></div>
          <div><dt>1</dt><dd>гостевой профиль для WhatsApp, приложения и зала</dd></div>
        </dl>
      </Scene>

      <Scene index={11} wide eyebrow="Данные и маркетинг" title={<>Цифры, а не<br /><em>ощущения.</em></>}
        aside={<div className="device-pair"><Laptop screen="cc-sales" alt="Продажи за сегодня: выручка по часам и сделки биржи" label="Продажи · сегодня" /><figure className="mini-card"><img src="/screens/cc-suppliers-card.webp" alt="Поставщики: открытый баланс и ближайшие поставки" loading="lazy" decoding="async" /></figure></div>}>
        <p className="lead reveal">Видно, что продаётся, в какие часы пустеет зал и кто возвращается — без выгрузок в таблицы.</p>
        <div className="caps reveal">
          <div><b>Касса</b><p>Подключаемся к iiko и r_keeper: продажи и чеки попадают в отчёты сами.</p></div>
          <div><b>Гости</b><p>История визитов, предпочтения и сегменты — общие для зала, приложения и WhatsApp.</p></div>
          <div><b>Маркетинг</b><p>Рассылки в WhatsApp по сегментам, место в «Выборе Hostess» и биржа в тихие часы.</p></div>
          <div><b>Операции</b><p>Поставщики, поставки и взаиморасчёты — рядом с выручкой.</p></div>
        </div>
        <p className="integrations reveal"><span>iiko</span><span>r_keeper</span><span>WhatsApp Business</span><span>QR-меню</span><span>и другие кассы — по запросу</span></p>
      </Scene>

      <section id="finale" className="finale" aria-labelledby="finale-title">
        <div className="finale__inner">
          <p className="eyebrow reveal"><span className="live-dot" />Сегодня вечером</p>
          <h2 id="finale-title" className="reveal">Куда<br /><em>пойдём?</em></h2>
          <p className="lead reveal">Гостям — приложение. Заведениям — Command Center. Вечер — один.</p>
          <div className="hero__actions reveal">
            <a className="button button--gold" href={APP_URL} target="_blank" rel="noopener">Открыть Hostess <Arrow diagonal /></a>
            <a className="button button--ghost" href={APP_URL} target="_blank" rel="noopener">Демо для заведения <Arrow diagonal /></a>
          </div>
        </div>
        <footer className="footer">
          <span className="wordmark wordmark--small">hostess<Spark /></span>
          <span>© {new Date().getFullYear()} Hostess · Астана</span>
          <span className="footer__note">Карта — Манхэттен, Mapbox. Заведения и экраны — из рабочей версии Hostess.</span>
          <a href={ADMIN_URL} target="_blank" rel="noopener">Вход для команды <Arrow diagonal /></a>
        </footer>
      </section>
    </main>

    <div className="progress" aria-hidden="true"><span>{String(active).padStart(2, '0')} · {CHAPTERS[active]?.nav}</span><span className="progress__track"><span ref={progressLine} /></span></div>
  </>;
}
