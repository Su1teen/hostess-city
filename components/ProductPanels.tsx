"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./product-panels.css";

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
  { id: "lumen", name: "Lumen", category: "Dining", area: "SoHo", note: "A little light. A long dinner.", time: "19:30", number: "01", tone: "amber" },
  { id: "vesper", name: "Vesper", category: "Bars", area: "Lower East Side", note: "Good conversations, on the rocks.", time: "21:00", number: "02", tone: "blue" },
  { id: "marea", name: "Marea", category: "Dining", area: "Nolita", note: "From the coast, to your table.", time: "20:00", number: "03", tone: "amber" },
  { id: "atlas", name: "Atlas", category: "Rooftops", area: "Tribeca", note: "The city, with a different perspective.", time: "22:00", number: "04", tone: "blue" },
  { id: "sotto", name: "Sotto", category: "Dining", area: "East Village", note: "For evenings that become mornings.", time: "23:00", number: "05", tone: "amber" },
];

function Panel({ label, children, className = "", footer }: { label: string; children: ReactNode; className?: string; footer?: ReactNode }) {
  return <div className={`hp-panel ${className}`}>
    <div className="hp-panel-top"><span className="hp-brand-dot" /><span>{label}</span><span className="hp-live-label">PRODUCT PREVIEW</span></div>
    {children}
    {footer && <div className="hp-panel-footer">{footer}</div>}
  </div>;
}

export function DiscoveryPanel({ onSelect, selected }: { onSelect: (id: string) => void; selected: string }) {
  const [category, setCategory] = useState("All");
  const visible = venues.filter((venue) => category === "All" || venue.category === category);
  return <Panel label="Your evening, opened up" className="hp-discovery" footer={<><span>Illustrative venues · Manhattan</span><Icon name="pin" size={14} /></>}>
    <div className="hp-discovery-title"><h3>Where next?</h3><span>05 places.<br />One city.</span></div>
    <div className="hp-filter" aria-label="Filter venues">
      {["All", "Dining", "Bars", "Rooftops"].map((item) => <button key={item} type="button" aria-pressed={category === item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
    </div>
    <div className="hp-venue-list">
      {visible.map((venue) => <button key={venue.id} type="button" className={`hp-venue ${selected === venue.id ? "is-selected" : ""} hp-venue-${venue.tone}`} onClick={() => onSelect(venue.id)} aria-pressed={selected === venue.id}>
        <span className="hp-venue-symbol"><span>{venue.number}</span><Icon name={venue.category === "Bars" ? "glass" : "star"} size={24} /></span>
        <span className="hp-venue-copy"><span className="hp-venue-name">{venue.name}</span><span className="hp-venue-detail">{venue.area} <span>·</span> {venue.category === "Bars" ? "Cocktails" : venue.category === "Rooftops" ? "Rooftop" : "Dining"}</span></span>
        <span className="hp-venue-time">{venue.time}<Icon name="arrow" size={16} /></span>
      </button>)}
    </div>
    <p className="hp-discover-note">Pick a place. The city follows.</p>
  </Panel>;
}

export function BookingPanel({ venue = "Lumen" }: { venue?: string }) {
  const place = venues.find((item) => item.id === venue.toLowerCase() || item.name.toLowerCase() === venue.toLowerCase()) ?? venues[0];
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("19:30");
  const [day, setDay] = useState("Tonight");
  const [confirmedVenue, setConfirmedVenue] = useState<string | null>(null);
  const confirmed = confirmedVenue === venue;
  return <Panel label="A table with your name on it" className="hp-booking" footer={<span>Interactive preview · no real reservation</span>}>
    <div className="hp-booking-scene" aria-hidden="true"><div className="hp-table-orbit" /><div className="hp-table-center">H</div><span className="hp-table-seat seat-one" /><span className="hp-table-seat seat-two" /><span className="hp-table-seat seat-three" /><span className="hp-table-seat seat-four" /><div className="hp-table-caption">YOUR EVENING STARTS HERE</div></div>
    <div className="hp-restaurant-heading"><div><p className="hp-eyebrow">{place.area} · {place.category === "Bars" ? "Cocktail bar" : "Restaurant"}</p><h3>{place.name}</h3></div><span className="hp-restaurant-mark">{place.name.slice(0, 1)}</span></div>
    <p className="hp-small-description">{place.note}</p>
    {confirmed ? <div className="hp-booking-confirmation" role="status"><span className="hp-confirm-icon"><Icon name="check" size={24} /></span><h4>Consider the evening planned.</h4><p>{day} at {time} · {guests} {guests === 1 ? "guest" : "guests"}</p><span className="hp-demo-badge">DEMO CONFIRMATION</span><p className="hp-confirm-disclaimer">This is a product preview. No table has been reserved.</p><button type="button" className="hp-text-button" onClick={() => setConfirmedVenue(null)}>Edit your preview <Icon name="arrow" size={15} /></button></div> : <>
      <div className="hp-booking-fields">
        <div className="hp-field"><span className="hp-field-label">When</span><div className="hp-day-switch">{["Tonight", "Tomorrow"].map((item) => <button type="button" key={item} aria-pressed={day === item} className={day === item ? "is-active" : ""} onClick={() => setDay(item)}>{item}</button>)}</div></div>
        <div className="hp-field"><span className="hp-field-label">Your people</span><div className="hp-stepper"><button type="button" aria-label="Remove one guest" disabled={guests <= 1} onClick={() => setGuests((value) => value - 1)}><Icon name="minus" size={14} /></button><span>{guests} {guests === 1 ? "guest" : "guests"}</span><button type="button" aria-label="Add one guest" disabled={guests >= 8} onClick={() => setGuests((value) => value + 1)}><Icon name="plus" size={14} /></button></div></div>
      </div>
      <div className="hp-time-field"><span className="hp-field-label">Make time for it</span><div className="hp-time-options">{["18:30", "19:00", "19:30", "20:00"].map((item) => <button type="button" key={item} aria-pressed={time === item} onClick={() => setTime(item)} className={time === item ? "is-active" : ""}>{item}</button>)}</div></div>
      <button type="button" className="hp-action hp-action-amber" onClick={() => setConfirmedVenue(venue)}><span>Preview reservation</span><Icon name="arrow" /></button>
    </>}
  </Panel>;
}

const menu = [
  { id: "martini", name: "Vesper Martini", note: "Gin, vodka, a twist of lemon", price: 18, icon: "glass" as const },
  { id: "negroni", name: "White Negroni", note: "Bitter, bright, beautifully balanced", price: 17, icon: "glass" as const },
  { id: "olives", name: "A little aperitivo", note: "Marinated olives & rosemary focaccia", price: 12, icon: "star" as const },
];

export function PreorderPanel() {
  const [quantities, setQuantities] = useState<Record<string, number>>({ martini: 2, negroni: 0, olives: 1 });
  const [preview, setPreview] = useState(false);
  const subtotal = menu.reduce((sum, item) => sum + item.price * quantities[item.id], 0);
  const count = Object.values(quantities).reduce((sum, value) => sum + value, 0);
  function update(id: string, delta: number) { setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(8, current[id] + delta)) })); setPreview(false); }
  return <Panel label="Your first round, ready" className="hp-preorder" footer={<span>Sample prices in USD · no order or payment</span>}>
    <div className="hp-order-heading"><div><p className="hp-eyebrow">Vesper · Cocktail bar</p><h3>Before you<br /><em>arrive.</em></h3></div><div className="hp-cocktail-art" aria-hidden="true"><span /><svg viewBox="0 0 100 130"><path d="M12 28h76L50 78 12 28Z" fill="rgba(117,155,246,.12)" stroke="currentColor" strokeWidth="1" /><path d="M50 78v35M27 113h46M22 39h56" fill="none" stroke="currentColor" strokeWidth="1" /><circle cx="67" cy="32" r="7" fill="#e2ad6c" /><path d="M60 19 76 45" stroke="#e2ad6c" strokeWidth="1" /></svg></div></div>
    <div className="hp-arrival-line"><Icon name="clock" size={15} /><span>Your table, tonight at 21:00</span><span>2 guests</span></div>
    <div className="hp-menu">
      {menu.map((item) => <div className="hp-menu-item" key={item.id}><div className="hp-menu-icon"><Icon name={item.icon} size={23} /></div><div className="hp-menu-copy"><span>{item.name}</span><small>{item.note}</small><b>${item.price}</b></div><div className="hp-menu-stepper"><button type="button" aria-label={`Remove ${item.name}`} disabled={quantities[item.id] === 0} onClick={() => update(item.id, -1)}><Icon name="minus" size={12} /></button><span aria-label={`${quantities[item.id]} ${item.name}`}>{quantities[item.id]}</span><button type="button" aria-label={`Add ${item.name}`} disabled={quantities[item.id] >= 8} onClick={() => update(item.id, 1)}><Icon name="plus" size={12} /></button></div></div>)}
    </div>
    <div className="hp-subtotal"><span>{count} {count === 1 ? "item" : "items"} · preview subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
    {preview && <div className="hp-order-preview" role="status"><Icon name="check" size={18} /><div><strong>Your round is in the preview.</strong><span>{count} {count === 1 ? "item" : "items"} selected. Nothing ordered or charged.</span></div></div>}
    <button type="button" disabled={count === 0} className="hp-action hp-action-blue" onClick={() => setPreview(true)}><span>{preview ? "Update order preview" : "Preview your first round"}</span><Icon name="arrow" /></button>
  </Panel>;
}

export function LoyaltyPanel() {
  const [redeem, setRedeem] = useState(false);
  const balance = 840 - (redeem ? 300 : 0);
  return <Panel label="A city that remembers you" className="hp-loyalty" footer={<span>Illustrative loyalty programme · preview only</span>}>
    <div className="hp-pass"><div className="hp-pass-top"><span>HOSTESS<br /><b>CITY PASS</b></span><span className="hp-pass-emblem">h.</span></div><div className="hp-pass-balance"><span>YOUR CITY BALANCE</span><strong>{balance.toLocaleString()}<em>pts</em></strong></div><div className="hp-pass-bottom"><span>ONE CITY. ALL YOUR PLACES.</span><div className="hp-pass-bars" aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <i key={index} style={{ width: index % 3 === 0 ? 3 : 1 }} />)}</div></div></div>
    <div className="hp-loyalty-connection"><span className="hp-loyalty-place">L<span>Lumen</span></span><div className="hp-connection-line"><span>earned here</span><Icon name="arrow" size={18} /><span>enjoyed there</span></div><span className="hp-loyalty-place">V<span>Vesper</span></span></div>
    <div className="hp-reward"><div><span className="hp-eyebrow">Your next little pleasure</span><h4>A welcome cocktail</h4><p>300 points · at Vesper</p></div><button type="button" className={`hp-toggle ${redeem ? "is-on" : ""}`} role="switch" aria-checked={redeem} aria-label="Preview redeeming 300 points for a welcome cocktail" onClick={() => setRedeem((value) => !value)}><span /></button></div>
    <div className={`hp-redeem-status ${redeem ? "is-redeemed" : ""}`} role="status"><Icon name={redeem ? "check" : "star"} size={16} /><span>{redeem ? "Reward previewed. 540 points left to explore." : "Try a reward. Your balance updates instantly."}</span></div>
  </Panel>;
}

const funnel = [{ label: "Discovered", value: 120, accent: "blue" }, { label: "Reserved", value: 48, accent: "blue" }, { label: "Arrived", value: 34, accent: "amber" }, { label: "Returned", value: 14, accent: "amber" }];

export function VenuePanel() {
  const [view, setView] = useState<"journey" | "orders">("journey");
  return <Panel label="The other side of the evening" className="hp-venue-dashboard" footer={<span>Illustrative data · not measured results</span>}>
    <div className="hp-dashboard-head"><div><p className="hp-eyebrow">Lumen · Venue workspace</p><h3>Make every<br /><em>seat count.</em></h3></div><span className="hp-dashboard-period">SAMPLE<br />EVENING</span></div>
    <div className="hp-dashboard-tabs" aria-label="Dashboard view"><button type="button" aria-pressed={view === "journey"} className={view === "journey" ? "is-active" : ""} onClick={() => setView("journey")}>Guest journey</button><button type="button" aria-pressed={view === "orders"} className={view === "orders" ? "is-active" : ""} onClick={() => setView("orders")}>Preorders</button></div>
    {view === "journey" ? <><div className="hp-funnel-heading"><span>From a passing thought<br />to a familiar face.</span><strong>40%<small>discovery → reservation</small></strong></div><div className="hp-funnel">{funnel.map((stage, index) => <div key={stage.label} className="hp-funnel-row"><span className="hp-funnel-index">0{index + 1}</span><div><div className="hp-funnel-label"><span>{stage.label}</span><strong>{stage.value}</strong></div><div className="hp-funnel-track"><span className={`hp-funnel-fill ${stage.accent}`} style={{ width: `${stage.value / 120 * 100}%` }} /></div></div></div>)}</div><p className="hp-dashboard-note">An example of the stages a venue can follow — from discovery to a repeat visit.</p></> : <><div className="hp-order-metric"><strong>12<span>/ 48</span></strong><div><span>Reservations with a preorder</span><b>25% of example bookings</b></div></div><div className="hp-dashboard-order"><span><Icon name="glass" /> First round</span><strong>8 orders</strong></div><div className="hp-dashboard-order"><span><Icon name="star" /> Dining ahead</span><strong>4 orders</strong></div><div className="hp-dashboard-order"><span>Sample preorder value</span><strong>$516</strong></div><p className="hp-dashboard-note">A clearer picture before service: what guests have chosen, when they arrive, and what to prepare.</p></>}
    <div className="hp-dashboard-insight"><span className="hp-brand-dot" /><span>One connected journey. More useful context.</span></div>
  </Panel>;
}

const journey = [
  { label: "Find your place", venue: "Lumen · SoHo", time: "18:15", detail: "A discovery becomes a dinner plan.", icon: "pin" as const },
  { label: "Take your seat", venue: "Lumen · Table for two", time: "19:30", detail: "The right table, at the right moment.", icon: "people" as const },
  { label: "Meet the night", venue: "Vesper · First round ready", time: "21:00", detail: "From dinner to drinks, without starting over.", icon: "glass" as const },
  { label: "Carry it forward", venue: "Atlas · Your city points", time: "22:15", detail: "Tonight becomes a reason to come back.", icon: "star" as const },
];

export function JourneyPanel() {
  const [active, setActive] = useState(2);
  return <Panel label="An evening, in one place" className="hp-journey" footer={<span>A fictional guest journey · explore each stop</span>}>
    <div className="hp-journey-heading"><span className="hp-eyebrow">THE EVENING EDIT</span><h3>One night.<br /><em>All yours.</em></h3><span className="hp-journey-date">NEW YORK<br />AFTER HOURS</span></div>
    <div className="hp-journey-stops">{journey.map((stop, index) => <button type="button" key={stop.label} className={`hp-journey-stop ${index <= active ? "is-complete" : ""} ${index === active ? "is-current" : ""}`} onClick={() => setActive(index)} aria-pressed={index === active}><span className="hp-journey-node"><Icon name={index < active ? "check" : stop.icon} size={17} /></span><span className="hp-journey-stop-copy"><span>{stop.label}</span><small>{stop.venue}</small></span><span className="hp-journey-time">{stop.time}</span></button>)}</div>
    <div className="hp-journey-detail" role="status"><span>0{active + 1} / 04</span><p>{journey[active].detail}</p></div>
  </Panel>;
}

function VenueEnquiry() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [venue, setVenue] = useState("");
  const [interest, setInterest] = useState("The complete Hostess experience");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const draft = `Hostess — venue enquiry draft\n\nName: ${name.trim()}\nEmail: ${email.trim()}\nVenue: ${venue.trim()}\nInterested in: ${interest}\n\nThis draft was prepared locally. It has not been sent to Hostess.\n`;
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
    setStatus("Your enquiry draft has been downloaded. Nothing was sent.");
  }
  async function copy() {
    try { await navigator.clipboard.writeText(draft); setStatus("Enquiry draft copied. Nothing was sent."); }
    catch { setStatus("Clipboard access is unavailable. You can download the draft instead."); }
  }
  return <div className="hm-enquiry"><p className="hp-eyebrow">FOR THE PLACES THAT MAKE A CITY</p><h2>A better evening.<br /><em>On both sides<br />of the table.</em></h2><p className="hm-intro">Bring reservations, preorders and a connected guest experience together.</p>
    <form onSubmit={(event) => { event.preventDefault(); setReady(true); setStatus("Your draft is ready. Review it, then copy or download it. Nothing was sent."); }} onChange={() => { setReady(false); setStatus(""); }}>
      <div className="hm-form-grid"><label>Your name<input required name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" maxLength={100} /></label><label>Work email<input required type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@yourvenue.com" maxLength={254} /></label></div>
      <label>Venue name<input required name="venue" autoComplete="organization" value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Your place in the city" maxLength={160} /></label>
      <label>What brings you here?<select value={interest} onChange={(event) => setInterest(event.target.value)}><option>The complete Hostess experience</option><option>Reservations and guest discovery</option><option>Preorders and service planning</option><option>Connected loyalty</option></select></label>
      <button type="submit" className="hp-action hp-action-amber"><span>Prepare an enquiry</span><Icon name="arrow" /></button>
    </form>
    {ready && <div className="hm-draft"><span className="hp-eyebrow">YOUR LOCAL DRAFT</span><p><strong>{name}</strong> · {venue}<br /><span>{email}</span><br />{interest}</p><div className="hm-draft-actions"><button type="button" onClick={download}><Icon name="download" size={16} />Download draft</button><button type="button" onClick={copy}>Copy draft<Icon name="arrow" size={15} /></button></div></div>}
    {status && <p className="hm-form-status" role="status">{status}</p>}
    <p className="hm-local-note">This preview keeps your details in this page. There is no connected enquiry service, and no information is transmitted.</p>
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
  return createPortal(<div className="hm-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`hm-dialog hm-dialog-${mode}`} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><div className="hm-dialog-header"><span>HOSTESS <span>·</span> {mode === "guest" ? "THE GUEST EXPERIENCE" : mode === "venue" ? "FOR VENUES" : "ABOUT THE EXPERIENCE"}</span><button type="button" className="hm-close" aria-label="Close experience" onClick={onClose}><Icon name="close" size={22} /></button></div>{mode === "guest" ? <div className="hm-guest"><div className="hm-guest-copy"><p className="hp-eyebrow">TAKE A SEAT IN THE EXPERIENCE</p><h2 id={titleId}>An evening<br /><em>worth making.</em></h2><p>Choose your people. Find your moment.<br />Try a Hostess reservation, from the guest&apos;s side of the table.</p><div className="hm-guest-detail"><span>01</span><p>Explore this interactive preview.<br />No account, reservation or payment.</p></div></div><BookingPanel venue={venue} /></div> : mode === "venue" ? <><h2 id={titleId} className="hp-sr-only">Prepare a Hostess venue enquiry</h2><VenueEnquiry /></> : <div className="hm-about"><p className="hp-eyebrow">ONE CITY. ONE HOSTESS.</p><h2 id={titleId}>A night with<br /><em>more possibility.</em></h2><p>Hostess brings restaurant discovery, reservations, preorders and rewards into one connected evening.</p><p>You are exploring an interactive concept. The five venues, menus, prices, rewards and dashboard figures are illustrative. No table, order or payment is placed.</p><p>The venue form prepares a draft on your device. It sends no enquiry or personal details.</p><button className="hp-action hp-action-amber" onClick={onClose}>Back to the evening <Icon name="arrow" /></button></div>}</div></div>, document.body);
}
