import type { ReactNode } from 'react';

const src = (name: string) => `/screens/${name}.webp`;

function StatusBar({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return <div className="phone__status" data-tone={tone} aria-hidden="true">
    <span>21:04</span>
    <span className="phone__icons"><i /><i /><i /><b /></span>
  </div>;
}

export function Phone({ screen, alt, tone, children, className = '' }: { screen?: string; alt?: string; tone?: 'light' | 'dark'; children?: ReactNode; className?: string }) {
  return <figure className={`phone ${className}`}>
    <div className="phone__body">
      <div className="phone__screen">
        <StatusBar tone={tone} />
        {screen ? <img src={src(screen)} alt={alt ?? ''} loading="lazy" decoding="async" width={393} height={852} /> : children}
      </div>
      <span className="phone__island" aria-hidden="true" />
    </div>
  </figure>;
}

/** Stack of real app screens that cross-fade as the guest chapters change. */
export function PhoneStage({ screens, active }: { screens: { id: string; alt: string; tone?: 'light' | 'dark' }[]; active: string | undefined }) {
  return <div className="phone-stage" data-visible={Boolean(active)} aria-hidden={!active}>
    <figure className="phone">
      <div className="phone__body">
        <div className="phone__screen">
          <StatusBar tone={screens.find(s => s.id === active)?.tone} />
          {screens.map((screen, i) => {
            const index = screens.findIndex(s => s.id === active);
            const state = screen.id === active ? 'current' : i < index ? 'past' : 'future';
            return <img key={screen.id} src={src(screen.id)} alt={screen.id === active ? screen.alt : ''} data-state={state} decoding="async" width={393} height={852} loading={i < 2 ? 'eager' : 'lazy'} />;
          })}
        </div>
        <span className="phone__island" aria-hidden="true" />
      </div>
    </figure>
    <p className="phone-stage__caption"><span className="live-dot" />Настоящие экраны hostes.online</p>
  </div>;
}

export function Laptop({ screen, alt, label }: { screen: string; alt: string; label: string }) {
  return <figure className="laptop">
    <div className="laptop__lid">
      <div className="laptop__bar"><span /><span /><span /><em>{label}</em></div>
      <img src={src(screen)} alt={alt} loading="lazy" decoding="async" width={1600} height={1000} />
    </div>
    <div className="laptop__base" aria-hidden="true" />
  </figure>;
}

type TableState = 'free' | 'busy' | 'booked' | 'bill';
const TABLES: { n: string; x: number; y: number; w: number; h: number; s: TableState; seats: number; round?: boolean }[] = [
  { n: '01', x: 6, y: 12, w: 13, h: 15, s: 'busy', seats: 4 }, { n: '02', x: 23, y: 12, w: 13, h: 15, s: 'free', seats: 4 },
  { n: '03', x: 40, y: 12, w: 13, h: 15, s: 'booked', seats: 2 }, { n: '04', x: 6, y: 36, w: 13, h: 15, s: 'bill', seats: 4 },
  { n: '05', x: 23, y: 36, w: 13, h: 15, s: 'busy', seats: 6 }, { n: '06', x: 40, y: 36, w: 13, h: 15, s: 'free', seats: 2 },
  { n: '09', x: 6, y: 66, w: 11, h: 11, s: 'free', seats: 2, round: true }, { n: '10', x: 22, y: 66, w: 11, h: 11, s: 'busy', seats: 2, round: true },
  { n: '11', x: 38, y: 66, w: 11, h: 11, s: 'booked', seats: 2, round: true },
  { n: '15', x: 64, y: 14, w: 28, h: 13, s: 'booked', seats: 6 }, { n: '16', x: 64, y: 36, w: 28, h: 13, s: 'busy', seats: 6 },
  { n: '17', x: 64, y: 58, w: 28, h: 13, s: 'free', seats: 8 },
];
const STATE_LABEL: Record<TableState, string> = { free: 'Свободен', busy: 'Гости за столом', booked: 'Бронь', bill: 'Просят счёт' };

/** Hall map modelled on the Command Center floor view. */
export function HallTablet() {
  return <figure className="tablet" aria-label="Схема зала XOXO в Command Center">
    <div className="tablet__screen cc">
      <header className="cc__head">
        <div><small>XOXO · ОПЕРАЦИИ ЗАЛА</small><b>Карта зала</b></div>
        <div className="cc__tabs"><span className="is-on">Сейчас</span><span>На время</span><span>Весь день</span></div>
      </header>
      <div className="cc__body">
        <div className="cc__floor">
          <span className="cc__zone" style={{ left: '3%', top: '4%', width: '53%', height: '52%' }}>Первый зал</span>
          <span className="cc__zone" style={{ left: '3%', top: '60%', width: '53%', height: '34%' }}>Второй зал</span>
          <span className="cc__zone" style={{ left: '60%', top: '4%', width: '36%', height: '74%' }}>ПС / общий зал · экран</span>
          {TABLES.map(t => <span key={t.n} className={`cc__table is-${t.s}${t.round ? ' is-round' : ''}`} style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, height: `${t.h}%` }} title={STATE_LABEL[t.s]}>
            <b>{t.n}</b><small>{t.seats} м.</small>
          </span>)}
          <span className="cc__bar" style={{ left: '60%', top: '84%', width: '36%', height: '9%' }}>Бар</span>
        </div>
        <aside className="cc__side">
          <p className="cc__side-title">Ближайшие брони</p>
          {[
            ['20:30', 'Айгерим', '4 гостя · стол 15', 'WhatsApp'],
            ['21:00', 'Данияр', '2 гостя · стол 03', 'Приложение'],
            ['21:15', 'Мадина', '2 гостя · стол 11', 'Звонок'],
          ].map(([time, name, meta, source]) => <div className="cc__booking" key={time}>
            <b>{time}</b><span><strong>{name}</strong><small>{meta}</small></span><em>{source}</em>
          </div>)}
          <div className="cc__wait"><b>Лист ожидания</b><span>3 гостя · ~15 мин</span></div>
          <div className="cc__legend">{(Object.keys(STATE_LABEL) as TableState[]).map(s => <span key={s}><i className={`is-${s}`} />{STATE_LABEL[s]}</span>)}</div>
        </aside>
      </div>
    </div>
  </figure>;
}

/** WhatsApp conversation handled by the Hostess agent. */
export function AgentChat() {
  return <Phone className="phone--chat">
    <div className="chat">
      <header className="chat__head">
        <span className="chat__avatar">X</span>
        <span><b>XOXO Sports & Lounge</b><small>Hostess · отвечает сразу</small></span>
      </header>
      <div className="chat__log">
        <p className="chat__day">Четверг</p>
        <p className="msg msg--in">Здравствуйте! Есть стол на четверых в субботу, часов в девять? Будем смотреть матч<time>18:02</time></p>
        <p className="msg msg--out">Добрый вечер! На 21:00 свободны столы 15 и 16 — общий зал, прямо напротив экрана. Бронирую 15-й?<time>18:02</time></p>
        <p className="msg msg--in">Да, на Айгерим<time>18:03</time></p>
        <div className="msg msg--out msg--card">
          <span className="msg__ok">Бронь подтверждена</span>
          <b>Суббота, 21:00</b>
          <span>Стол 15 · 4 гостя · общий зал</span>
          <span className="msg__hint">Накануне пришлю напоминание. Закуски к матчу можно заказать заранее — меню по ссылке.</span>
          <time>18:03</time>
        </div>
        <p className="msg msg--in">Супер, спасибо 🙌<time>18:04</time></p>
      </div>
      <div className="chat__input"><span>Сообщение</span><i /></div>
    </div>
  </Phone>;
}
