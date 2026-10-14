"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./product-panels.css";
import { guestsLabel, itemsLabel } from "../lib/format";

type IconName = "arrow" | "check" | "close" | "minus" | "plus" | "pin" | "glass" | "star" | "clock" | "people" | "download";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    minus: <path d="M5 12h14" />,
    plus: <path d="M5 12h14M12 5v14" />,
    pin: <><path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    glass: <><path d="M4 4h16l-8 9-8-9ZM12 13v7M8 20h8" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const venues = [
  { id: "lumen", name: "Lumen", category: "Рестораны", area: "Сохо", note: "Современная кухня и спокойный зал.", time: "19:30", number: "01", tone: "amber" },
  { id: "vesper", name: "Vesper", category: "Бары", area: "Нижний Ист-Сайд", note: "Коктейли и разговоры за барной стойкой.", time: "21:00", number: "02", tone: "blue" },
  { id: "marea", name: "Marea", category: "Рестораны", area: "Нолита", note: "Рыба, морепродукты и сезонное меню.", time: "20:00", number: "03", tone: "amber" },
  { id: "atlas", name: "Atlas", category: "На крыше", area: "Трайбека", note: "Столики на крыше с видом на город.", time: "22:00", number: "04", tone: "blue" },
  { id: "sotto", name: "Sotto", category: "Рестораны", area: "Ист-Виллидж", note: "Вино по бокалам и небольшие закуски.", time: "23:00", number: "05", tone: "amber" },
];

function Panel({ label, children, className = "", footer }: { label: string; children: ReactNode; className?: string; footer?: ReactNode }) {
  return <div className={`hp-panel ${className}`}>
    <div className="hp-panel-top"><span className="hp-brand-dot" /><span>{label}</span><span className="hp-live-label">ПРИМЕР ИНТЕРФЕЙСА</span></div>
    {children}
    {footer && <div className="hp-panel-footer">{footer}</div>}
  </div>;
}

export function DiscoveryPanel({ onSelect, selected }: { onSelect: (id: string) => void; selected: string }) {
  const [category, setCategory] = useState("Все");
  const visible = venues.filter((venue) => category === "Все" || venue.category === category);
  return <Panel label="Выбор заведения" className="hp-discovery" footer={<><span>Демо-подборка · Манхэттен</span><Icon name="pin" size={14} /></>}>
    <div className="hp-discovery-title"><h3>Куда пойдём?</h3><span>5 заведений.<br />Один район.</span></div>
    <div className="hp-filter" aria-label="Фильтр заведений">
      {["Все", "Рестораны", "Бары", "На крыше"].map((item) => <button key={item} type="button" aria-pressed={category === item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
    </div>
    <div className="hp-venue-list">
      {visible.map((venue) => <button key={venue.id} type="button" className={`hp-venue ${selected === venue.id ? "is-selected" : ""} hp-venue-${venue.tone}`} onClick={() => onSelect(venue.id)} aria-pressed={selected === venue.id}>
        <span className="hp-venue-symbol"><span>{venue.number}</span><Icon name={venue.category === "Бары" ? "glass" : "star"} size={24} /></span>
        <span className="hp-venue-copy"><span className="hp-venue-name">{venue.name}</span><span className="hp-venue-detail">{venue.area} <span>·</span> {venue.category === "Бары" ? "Коктейли" : venue.category === "На крыше" ? "На крыше" : "Рестораны"}</span></span>
        <span className="hp-venue-time">{venue.time}<Icon name="arrow" size={16} /></span>
      </button>)}
    </div>
    <p className="hp-discover-note">Выберите место — карта покажет его ближе.</p>
  </Panel>;
}

export function BookingPanel({ venue = "Lumen" }: { venue?: string }) {
  const place = venues.find((item) => item.id === venue.toLowerCase() || item.name.toLowerCase() === venue.toLowerCase()) ?? venues[0];
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("19:30");
  const [day, setDay] = useState("Сегодня");
  const [confirmedVenue, setConfirmedVenue] = useState<string | null>(null);
  const confirmed = confirmedVenue === venue;
  return <Panel label="Бронирование столика" className="hp-booking" footer={<span>Демонстрация · столик не бронируется</span>}>
    <div className="hp-booking-scene" aria-hidden="true"><div className="hp-table-orbit" /><div className="hp-table-center">H</div><span className="hp-table-seat seat-one" /><span className="hp-table-seat seat-two" /><span className="hp-table-seat seat-three" /><span className="hp-table-seat seat-four" /><div className="hp-table-caption">СТОЛИК ДЛЯ ВАШЕЙ КОМПАНИИ</div></div>
    <div className="hp-restaurant-heading"><div><p className="hp-eyebrow">{place.area} · {place.category === "Бары" ? "Коктейльный бар" : "Ресторан"}</p><h3>{place.name}</h3></div><span className="hp-restaurant-mark">{place.name.slice(0, 1)}</span></div>
    <p className="hp-small-description">{place.note}</p>
    {confirmed ? <div className="hp-booking-confirmation" role="status"><span className="hp-confirm-icon"><Icon name="check" size={24} /></span><h4>Параметры бронирования сохранены.</h4><p>{day}, {time} · {guestsLabel(guests)}</p><span className="hp-demo-badge">ДЕМОНСТРАЦИОННОЕ ПОДТВЕРЖДЕНИЕ</span><p className="hp-confirm-disclaimer">Это пример работы сервиса. Реальная бронь не создана.</p><button type="button" className="hp-text-button" onClick={() => setConfirmedVenue(null)}>Изменить параметры <Icon name="arrow" size={15} /></button></div> : <>
      <div className="hp-booking-fields">
        <div className="hp-field"><span className="hp-field-label">Дата</span><div className="hp-day-switch">{["Сегодня", "Завтра"].map((item) => <button type="button" key={item} aria-pressed={day === item} className={day === item ? "is-active" : ""} onClick={() => setDay(item)}>{item}</button>)}</div></div>
        <div className="hp-field"><span className="hp-field-label">Число гостей</span><div className="hp-stepper"><button type="button" aria-label="Уменьшить число гостей" disabled={guests <= 1} onClick={() => setGuests((value) => value - 1)}><Icon name="minus" size={14} /></button><span>{guestsLabel(guests)}</span><button type="button" aria-label="Увеличить число гостей" disabled={guests >= 8} onClick={() => setGuests((value) => value + 1)}><Icon name="plus" size={14} /></button></div></div>
      </div>
      <div className="hp-time-field"><span className="hp-field-label">Время визита</span><div className="hp-time-options">{["18:30", "19:00", "19:30", "20:00"].map((item) => <button type="button" key={item} aria-pressed={time === item} onClick={() => setTime(item)} className={time === item ? "is-active" : ""}>{item}</button>)}</div></div>
      <button type="button" className="hp-action hp-action-amber" onClick={() => setConfirmedVenue(venue)}><span>Посмотреть подтверждение</span><Icon name="arrow" /></button>
    </>}
  </Panel>;
}

const menu = [
  { id: "martini", name: "Веспер Мартини", note: "Джин, водка, лимонная цедра", price: 18, icon: "glass" as const },
  { id: "negroni", name: "Белый Негрони", note: "Джин, белый вермут, горький аперитив", price: 17, icon: "glass" as const },
  { id: "olives", name: "Закуска к аперитиву", note: "Маринованные оливки и фокачча", price: 12, icon: "star" as const },
];

export function PreorderPanel() {
  const [quantities, setQuantities] = useState<Record<string, number>>({ martini: 2, negroni: 0, olives: 1 });
  const [preview, setPreview] = useState(false);
  const subtotal = menu.reduce((sum, item) => sum + item.price * quantities[item.id], 0);
  const count = Object.values(quantities).reduce((sum, value) => sum + value, 0);
  function update(id: string, delta: number) { setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(8, current[id] + delta)) })); setPreview(false); }
  return <Panel label="Предзаказ к визиту" className="hp-preorder" footer={<span>Пример цен в USD · без заказа и оплаты</span>}>
    <div className="hp-order-heading"><div><p className="hp-eyebrow">Vesper · Коктейльный бар</p><h3>До вашего<br /><em>прихода.</em></h3></div><div className="hp-cocktail-art" aria-hidden="true"><span /><svg viewBox="0 0 100 130"><path d="M12 28h76L50 78 12 28Z" fill="rgba(117,155,246,.12)" stroke="currentColor" strokeWidth="1" /><path d="M50 78v35M27 113h46M22 39h56" fill="none" stroke="currentColor" strokeWidth="1" /><circle cx="67" cy="32" r="7" fill="#e2ad6c" /><path d="M60 19 76 45" stroke="#e2ad6c" strokeWidth="1" /></svg></div></div>
    <div className="hp-arrival-line"><Icon name="clock" size={15} /><span>Сегодня, 21:00</span><span>2 гостя</span></div>
    <div className="hp-menu">
      {menu.map((item) => <div className="hp-menu-item" key={item.id}><div className="hp-menu-icon"><Icon name={item.icon} size={23} /></div><div className="hp-menu-copy"><span>{item.name}</span><small>{item.note}</small><b>${item.price}</b></div><div className="hp-menu-stepper"><button type="button" aria-label={`Убрать: ${item.name}`} disabled={quantities[item.id] === 0} onClick={() => update(item.id, -1)}><Icon name="minus" size={12} /></button><span aria-label={`${quantities[item.id]} ${item.name}`}>{quantities[item.id]}</span><button type="button" aria-label={`Добавить: ${item.name}`} disabled={quantities[item.id] >= 8} onClick={() => update(item.id, 1)}><Icon name="plus" size={12} /></button></div></div>)}
    </div>
    <div className="hp-subtotal"><span>{itemsLabel(count)} · сумма предзаказа</span><strong>${subtotal.toFixed(2)}</strong></div>
    {preview && <div className="hp-order-preview" role="status"><Icon name="check" size={18} /><div><strong>Предзаказ подготовлен.</strong><span>{itemsLabel(count)}. Заказ не отправлен, деньги не списаны.</span></div></div>}
    <button type="button" disabled={count === 0} className="hp-action hp-action-blue" onClick={() => setPreview(true)}><span>{preview ? "Обновить предзаказ" : "Посмотреть предзаказ"}</span><Icon name="arrow" /></button>
  </Panel>;
}

export function LoyaltyPanel() {
  const [redeem, setRedeem] = useState(false);
  const balance = 840 - (redeem ? 300 : 0);
  return <Panel label="Общий бонусный баланс" className="hp-loyalty" footer={<span>Демо-программа · бонусы условные</span>}>
    <div className="hp-pass"><div className="hp-pass-top"><span>HOSTESS<br /><b>КАРТА ГОСТЯ</b></span><span className="hp-pass-emblem">h.</span></div><div className="hp-pass-balance"><span>ВАШ БАЛАНС</span><strong>{balance.toLocaleString()}<em>бонусов</em></strong></div><div className="hp-pass-bottom"><span>ДЛЯ ЗАВЕДЕНИЙ ОБЩЕЙ СЕТИ</span><div className="hp-pass-bars" aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <i key={index} style={{ width: index % 3 === 0 ? 3 : 1 }} />)}</div></div></div>
    <div className="hp-loyalty-connection"><span className="hp-loyalty-place">L<span>Lumen</span></span><div className="hp-connection-line"><span>начислены здесь</span><Icon name="arrow" size={18} /><span>использованы здесь</span></div><span className="hp-loyalty-place">V<span>Vesper</span></span></div>
    <div className="hp-reward"><div><span className="hp-eyebrow">Доступное вознаграждение</span><h4>Приветственный коктейль</h4><p>300 бонусов · в Vesper</p></div><button type="button" className={`hp-toggle ${redeem ? "is-on" : ""}`} role="switch" aria-checked={redeem} aria-label="Пример списания 300 бонусов за коктейль" onClick={() => setRedeem((value) => !value)}><span /></button></div>
    <div className={`hp-redeem-status ${redeem ? "is-redeemed" : ""}`} role="status"><Icon name={redeem ? "check" : "star"} size={16} /><span>{redeem ? "Вознаграждение выбрано. Осталось 540 бонусов." : "Выберите вознаграждение и проверьте баланс."}</span></div>
  </Panel>;
}

const funnel = [{ label: "Просмотры", value: 120, accent: "blue" }, { label: "Бронирования", value: 48, accent: "blue" }, { label: "Визиты", value: 34, accent: "amber" }, { label: "Повторные визиты", value: 14, accent: "amber" }];

export function VenuePanel() {
  const [view, setView] = useState<"journey" | "orders">("journey");
  return <Panel label="Кабинет заведения" className="hp-venue-dashboard" footer={<span>Пример данных · не реальные показатели</span>}>
    <div className="hp-dashboard-head"><div><p className="hp-eyebrow">Lumen · Управление заведением</p><h3>До визита<br /><em>и после него.</em></h3></div><span className="hp-dashboard-period">ПРИМЕР<br />СМЕНЫ</span></div>
    <div className="hp-dashboard-tabs" aria-label="Раздел кабинета"><button type="button" aria-pressed={view === "journey"} className={view === "journey" ? "is-active" : ""} onClick={() => setView("journey")}>Путь гостя</button><button type="button" aria-pressed={view === "orders"} className={view === "orders" ? "is-active" : ""} onClick={() => setView("orders")}>Предзаказы</button></div>
    {view === "journey" ? <><div className="hp-funnel-heading"><span>От выбора места<br />к повторному визиту.</span><strong>40%<small>просмотры → брони</small></strong></div><div className="hp-funnel">{funnel.map((stage, index) => <div key={stage.label} className="hp-funnel-row"><span className="hp-funnel-index">0{index + 1}</span><div><div className="hp-funnel-label"><span>{stage.label}</span><strong>{stage.value}</strong></div><div className="hp-funnel-track"><span className={`hp-funnel-fill ${stage.accent}`} style={{ width: `${stage.value / 120 * 100}%` }} /></div></div></div>)}</div><p className="hp-dashboard-note">Пример воронки: сколько гостей посмотрели заведение, забронировали столик, пришли и вернулись.</p></> : <><div className="hp-order-metric"><strong>12<span>/ 48</span></strong><div><span>Бронирования с предзаказом</span><b>25% демонстрационных броней</b></div></div><div className="hp-dashboard-order"><span><Icon name="glass" /> Напитки к приходу</span><strong>8 заказов</strong></div><div className="hp-dashboard-order"><span><Icon name="star" /> Блюда заранее</span><strong>4 заказа</strong></div><div className="hp-dashboard-order"><span>Сумма предзаказов в примере</span><strong>$516</strong></div><p className="hp-dashboard-note">До начала обслуживания видно, что гости заказали и к какому времени нужно подготовиться.</p></>}
    <div className="hp-dashboard-insight"><span className="hp-brand-dot" /><span>Бронирования, заказы и визиты — вместе.</span></div>
  </Panel>;
}

const journey = [
  { label: "Выбрать место", venue: "Lumen · Сохо", time: "18:15", detail: "Место выбрано. Теперь можно спланировать визит.", icon: "pin" as const },
  { label: "Прийти к столу", venue: "Lumen · Столик на двоих", time: "19:30", detail: "Дата, время и число гостей — в вашем бронировании.", icon: "people" as const },
  { label: "Продолжить вечер", venue: "Vesper · Предзаказ напитков", time: "21:00", detail: "После ужина — в бар, с сохранёнными планами.", icon: "glass" as const },
  { label: "Использовать бонусы", venue: "Atlas · Бонусный баланс", time: "22:15", detail: "Бонусы остаются с вами до следующего визита.", icon: "star" as const },
];

export function JourneyPanel() {
  const [active, setActive] = useState(2);
  return <Panel label="Ваш маршрут" className="hp-journey" footer={<span>Демонстрационный маршрут · выберите этап</span>}>
    <div className="hp-journey-heading"><span className="hp-eyebrow">ПЛАНЫ НА ВЕЧЕР</span><h3>Ваш вечер.<br /><em>Ваш маршрут.</em></h3><span className="hp-journey-date">НЬЮ-ЙОРК<br />ПОСЛЕ ЗАКАТА</span></div>
    <div className="hp-journey-stops">{journey.map((stop, index) => <button type="button" key={stop.label} className={`hp-journey-stop ${index <= active ? "is-complete" : ""} ${index === active ? "is-current" : ""}`} onClick={() => setActive(index)} aria-pressed={index === active}><span className="hp-journey-node"><Icon name={index < active ? "check" : stop.icon} size={17} /></span><span className="hp-journey-stop-copy"><span>{stop.label}</span><small>{stop.venue}</small></span><span className="hp-journey-time">{stop.time}</span></button>)}</div>
    <div className="hp-journey-detail" role="status"><span>0{active + 1} / 04</span><p>{journey[active].detail}</p></div>
  </Panel>;
}

function VenueEnquiry() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [venue, setVenue] = useState("");
  const [interest, setInterest] = useState("Все возможности Hostess");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const draft = `Hostess — черновик заявки от заведения\n\nИмя: ${name.trim()}\nПочта: ${email.trim()}\nЗаведение: ${venue.trim()}\nИнтересует: ${interest}\n\nЧерновик подготовлен на вашем устройстве. Он не отправлен в Hostess.\n`;
  function download() {
    const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hostess-venue-enquiry.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Черновик скачан. Заявка не отправлена.");
  }
  async function copy() {
    try { await navigator.clipboard.writeText(draft); setStatus("Черновик скопирован. Заявка не отправлена."); }
    catch { setStatus("Буфер обмена недоступен. Скачайте черновик файлом."); }
  }
  return <div className="hm-enquiry"><p className="hp-eyebrow">ДЛЯ РЕСТОРАНОВ И БАРОВ</p><h2>Ваше заведение<br /><em>в Hostess.</em></h2><p className="hm-intro">Обсудим бронирования, предзаказы и общую программу лояльности.</p>
    <form onSubmit={(event) => { event.preventDefault(); setReady(true); setStatus("Черновик готов. Проверьте данные и скачайте его. Заявка пока никуда не отправлена."); }} onChange={() => { setReady(false); setStatus(""); }}>
      <div className="hm-form-grid"><label>Ваше имя<input required name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Алексей Иванов" maxLength={100} /></label><label>Рабочая почта<input required type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@restaurant.ru" maxLength={254} /></label></div>
      <label>Название заведения<input required name="venue" autoComplete="organization" value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Название ресторана или бара" maxLength={160} /></label>
      <label>Что вас интересует?<select value={interest} onChange={(event) => setInterest(event.target.value)}><option>Все возможности Hostess</option><option>Бронирования и поиск заведений</option><option>Предзаказы и подготовка к обслуживанию</option><option>Общая программа лояльности</option></select></label>
      <button type="submit" className="hp-action hp-action-amber"><span>Подготовить заявку</span><Icon name="arrow" /></button>
    </form>
    {ready && <div className="hm-draft"><span className="hp-eyebrow">ЧЕРНОВИК НА ВАШЕМ УСТРОЙСТВЕ</span><p><strong>{name}</strong> · {venue}<br /><span>{email}</span><br />{interest}</p><div className="hm-draft-actions"><button type="button" onClick={download}><Icon name="download" size={16} />Скачать черновик</button><button type="button" onClick={copy}>Скопировать<Icon name="arrow" size={15} /></button></div></div>}
    {status && <p className="hm-form-status" role="status">{status}</p>}
    <p className="hm-local-note">Это демонстрационная форма. Данные остаются на странице, заявка не отправляется.</p>
  </div>;
}

export function ExperienceModal({ mode, onClose, venue = 'lumen' }: { mode: "guest" | "venue" | "about" | null; onClose: () => void; venue?: string }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeFromKeyboard = useEffectEvent(onClose);
  useEffect(() => {
    if (!mode) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("button, input, select, [tabindex='0']")?.focus());
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); closeFromKeyboard(); }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex='0']");
      if (!focusable?.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", handleKey); document.body.style.overflow = oldOverflow; previousFocus?.focus({ preventScroll: true }); };
  }, [mode]);
  if (!mode || typeof document === "undefined") return null;
  return createPortal(<div className="hm-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`hm-dialog hm-dialog-${mode}`} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><div className="hm-dialog-header"><span>HOSTESS <span>·</span> {mode === "guest" ? "ГОСТЯМ" : mode === "venue" ? "ЗАВЕДЕНИЯМ" : "О ПРОЕКТЕ"}</span><button type="button" className="hm-close" aria-label="Закрыть окно" onClick={onClose}><Icon name="close" size={22} /></button></div>{mode === "guest" ? <div className="hm-guest"><div className="hm-guest-copy"><p className="hp-eyebrow">БРОНИРОВАНИЕ</p><h2 id={titleId}>Столик<br /><em>к вашему приходу.</em></h2><p>Укажите дату, время и число гостей.<br />Посмотрите, как выглядит подтверждение бронирования.</p><div className="hm-guest-detail"><span>01</span><p>Демонстрация интерфейса.<br />Без регистрации, реальной брони и оплаты.</p></div></div><BookingPanel venue={venue} /></div> : mode === "venue" ? <><h2 id={titleId} className="hp-sr-only">Заявка на подключение к Hostess</h2><VenueEnquiry /></> : <div className="hm-about"><p className="hp-eyebrow">HOSTESS · О ПРОЕКТЕ</p><h2 id={titleId}>Планы на вечер.<br /><em>В одном сервисе.</em></h2><p>Hostess объединяет поиск ресторанов и баров, бронирования, предзаказы и бонусы в общей сети заведений.</p><p>Перед вами интерактивная концепция продукта. Заведения, меню, цены, бонусы и показатели в кабинете — примеры. Реальные бронирования, заказы и платежи не выполняются.</p><p>Форма для заведения создаёт черновик на вашем устройстве. Данные никуда не передаются.</p><button className="hp-action hp-action-amber" onClick={onClose}>Вернуться к странице <Icon name="arrow" /></button></div>}</div></div>, document.body);
}
