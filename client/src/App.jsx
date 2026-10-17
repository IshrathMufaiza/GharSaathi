const API = import.meta.env.VITE_API_URL || "https://gharsaathi-api.onrender.com";
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [introStep, setIntroStep] = useState(0);
  const [showAuth, setShowAuth] = useState(false);

  // Restore a valid session when the app opens. Closing/reopening the app should not log users out.
  // The server validates the HttpOnly session cookie; an invalid/expired session returns to welcome.
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const googleResult = params.get("google");
    if (googleResult === "error") {
      setShowAuth(true);
      const reason = params.get("reason");
      setAuthError(reason === "not_configured"
        ? "Google sign-in isn't configured yet. Add your Google OAuth credentials to server/.env."
        : "Google sign-in couldn't be completed. Please try again or use email and password.");
    }
    (async () => {
      try {
        const response = await fetch(`${API}/api/auth/me`, { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (active && data.user) setUser(data.user);
        }
      } catch {
        // Keep the welcome screen available when the server is unreachable.
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    // Clean callback query parameters after reading them; invitation acceptance remains explicit.
    if (googleResult || params.has("invite")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    return () => { active = false; };
  }, []);

  async function handleAuth(formData) {
    setAuthError(""); setAuthMessage("");
    const endpoint = authMode === "register" ? "register" : "login";
    try {
      const response = await fetch(`${API}/api/auth/${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Authentication failed. Please try again.");
      setUser(data.user);
      setAuthError("");
    } catch (error) {
      setAuthError(error.message || "Can't reach the server. Please try again.");
    }
  }
  async function handleLogout() {
    try { await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" }); }
    finally { setUser(null); setAuthMode("login"); setShowAuth(true); setAuthMessage("You've been logged out safely."); setAuthError(""); }
  }

  if (authLoading) return <div className="auth-loading"><div className="brand-mark app-logo-mark"><img src="/gharsaathi-logo.png" alt="" /></div><strong>GharSaathi</strong><span>Getting your space ready…</span></div>;
  if (!user && !showAuth) return <WelcomeFlow step={introStep} setStep={setIntroStep} onContinue={() => setShowAuth(true)} />;
  if (!user) return <AuthPage mode={authMode} setMode={(mode) => {setAuthMode(mode);setAuthError("");setAuthMessage("");}} onSubmit={handleAuth} error={authError} message={authMessage} onBack={() => setShowAuth(false)}/>;
  return <Dashboard user={user} onLogout={handleLogout}/>;
}

function WelcomeFlow({ step, setStep, onContinue }) {
  const features = [
    { icon: ShoppingBasket, title: "Groceries", text: "Keep shopping lists organized with quantities, units, and categories." },
    { icon: ClipboardList, title: "Tasks & reminders", text: "Remember the little things with due dates, priorities, and reminders." },
    { icon: Users, title: "Shared households", text: "Coordinate with the people you live with, with each person using their own account." },
    { icon: Sparkles, title: "AI household assistant", text: "Get help planning meals and organizing everyday home routines." }
  ];
  const next = () => { if (step === 0) setStep(1); else onContinue(); };
  return <main className="welcome-screen">
    <header className="welcome-brand"><img src="/gharsaathi-logo.png" alt="GharSaathi logo"/><span>GharSaathi</span></header>
    <div className="welcome-content">
      {step === 0 ? <section className="welcome-hero">
        <div className="welcome-logo-wrap"><img src="/gharsaathi-logo.png" alt="" /></div>
        <span className="eyebrow">A LITTLE MORE IN SYNC</span>
        <h1>Your home, feeling more like home.</h1>
        <p>One friendly place for groceries, little tasks, shared plans, and a helping hand when you need one.</p>
        <div className="welcome-preview"><div className="welcome-preview-icon"><ShoppingBasket size={21}/></div><div><strong>Less to remember.</strong><span>More room for everyday life.</span></div><Check size={19}/></div>
      </section> : <section className="welcome-features">
        <span className="eyebrow">MADE FOR EVERYDAY LIFE</span>
        <h1>A little help goes a long way.</h1>
        <p>Explore the things you can keep in sync with GharSaathi.</p>
        <div className="welcome-feature-grid">{features.map(({icon: Icon,title,text}) => <article className="welcome-feature-card" key={title}><span className="welcome-feature-icon"><Icon size={21}/></span><h2>{title}</h2><p>{text}</p></article>)}</div>
      </section>}
    </div>
    <footer className="welcome-footer"><div className="welcome-progress" aria-label={`Introduction screen ${step + 1} of 2`}><span className={step === 0 ? "current" : ""}/><span className={step === 1 ? "current" : ""}/></div><button className="welcome-skip" onClick={onContinue}>Skip</button><button className="welcome-next" onClick={next}>{step === 0 ? "Next" : "Get started"}<span aria-hidden="true">→</span></button></footer>
  </main>;
}

function AuthPage({ mode, setMode, onSubmit, error, message, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";
  async function submit(e) {
    e.preventDefault(); setSubmitting(true);
    try { await onSubmit({ name, email, password }); } finally { setSubmitting(false); }
  }
  return <main className="auth-screen">
    <section className="auth-art-panel">
      <div className="auth-brand"><span className="brand-mark app-logo-mark"><img src="/gharsaathi-logo.png" alt="" /></span><span>GharSaathi</span></div>
      <div className="auth-art-copy"><span className="eyebrow">A LITTLE MORE IN SYNC</span><h1>Your home,<br/>feeling more like home.</h1><p>Keep groceries, little tasks, and everyday plans in one friendly place.</p>
        <div className="auth-preview-card"><div className="auth-preview-top"><span><ShoppingBasket size={17}/> This week's groceries</span><span className="auth-preview-count">3 items</span></div>{["Fresh spinach","Milk","Something for dinner"].map((x,i)=><div className="auth-preview-item" key={x}><span className={i===0?"preview-check done":"preview-check"}>{i===0&&<Check size={12}/>}</span><span className={i===0?"preview-strike":""}>{x}</span></div>)}</div>
      </div>
      <div className="auth-art-footer"><Leaf size={15}/> Small steps make a happy home.</div>
    </section>
    <section className="auth-form-panel">
      <div className="auth-form-wrap">
        <button className="auth-back-link" type="button" onClick={onBack}>← Back to welcome</button>
        <div className="auth-mobile-brand"><button className="auth-back-button" type="button" onClick={onBack} aria-label="Back to welcome">←</button><span className="brand-mark app-logo-mark"><img src="/gharsaathi-logo.png" alt="" /></span><strong>GharSaathi</strong></div>
        <span className="eyebrow">{isRegister ? "LET'S MAKE A LITTLE SPACE" : "WELCOME BACK"}</span>
        <h2>{isRegister ? "Create your account" : "Good to see you"}</h2>
        <p className="auth-subtitle">{isRegister ? "Start with your own personal space. You can invite your household later." : "Sign in to pick up where home left off."}</p>
        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          {isRegister && <label>Your name<input value={name} onChange={e=>setName(e.target.value)} placeholder="How should we call you?" autoComplete="name" minLength={2} maxLength={80} required/></label>}
          <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></label>
          <label>Password<div className="password-field"><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={isRegister?"At least 8 characters":"Enter your password"} autoComplete={isRegister?"new-password":"current-password"} minLength={isRegister?8:1} maxLength={128} required/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Hide":"Show"}</button></div></label>
          {isRegister && <p className="password-hint">Use at least 8 characters.</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}<span>→</span></button>
        </form>
        <div className="auth-divider"><span/> <small>OR</small> <span/></div>
        <button className="google-button" onClick={() => window.location.assign(`${API}/api/auth/google`)} type="button"><GoogleMark/> Continue with Google</button>
        <p className="auth-switch">{isRegister ? "Already have an account?" : "New to GharSaathi?"} <button onClick={()=>setMode(isRegister?"login":"register")}>{isRegister?"Sign in":"Create an account"}</button></p>
        <p className="auth-privacy">Your personal space is private. Shared household access is granted only when you join a household.</p>
      </div>
    </section>
  </main>;
}
function GoogleMark() {
  return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.99 46.98 31.88 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.55 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
}

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, Check, ChevronDown, ChevronUp, CircleUserRound, ClipboardList, LogOut, Users, Copy, Mail, Trash2,
  House, Leaf, ListChecks, Menu, Plus, Search, Settings, ShoppingBasket,
  ShoppingCart, Sparkles, Sprout, X, PanelLeftClose, PanelLeftOpen, CalendarDays, Flag, Send, Mic, Bot, UserRound, LoaderCircle, Volume2
} from "lucide-react";

const initialItems = [];
const categories = [
  { name: "Vegetables", icon: Sprout },
  { name: "Dairy", icon: Leaf },
  { name: "Fruits", icon: Sprout },
  { name: "Grains & pulses", icon: ShoppingBasket },
  { name: "Snacks", icon: ShoppingBasket },
  { name: "Household supplies", icon: ShoppingBasket },
  { name: "Other", icon: ShoppingBasket }
];

function Dashboard({ user, onLogout }) {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState("Groceries");
  const [space, setSpace] = useState("Personal space");
  const [spaceMenu, setSpaceMenu] = useState(false);
  const [households, setHouseholds] = useState([]);
const [activeHouseholdId, setActiveHouseholdId] = useState("");
const [showCreateHousehold, setShowCreateHousehold] = useState(false);
const [householdName, setHouseholdName] = useState("");
const [householdError, setHouseholdError] = useState("");
const [householdLoading, setHouseholdLoading] = useState(false);
const [members, setMembers] = useState([]);
const [invitations, setInvitations] = useState([]);
const [inviteEmail, setInviteEmail] = useState("");
const [inviteUrl, setInviteUrl] = useState("");
const [inviteBusy, setInviteBusy] = useState(false);
const [inviteError, setInviteError] = useState("");
const [inviteMessage, setInviteMessage] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskReminderAt, setTaskReminderAt] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Vegetables");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newUnit, setNewUnit] = useState("piece");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  
async function loadHouseholds() {
  try {
    const response = await fetch(`${API}/api/households`, {
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Couldn't load households.");
    }

    const list = data.households || [];
    setHouseholds(list);

    const current = list.find(
      h => String(h._id) === activeHouseholdId
    );

    const selected = current || list.find(
      h => h.type === "personal"
    ) || list[0];

    if (selected) {
      setActiveHouseholdId(String(selected._id));
      setSpace(selected.name);
    }
  } catch (error) {
    setHouseholdError(error.message);
  }
}

useEffect(() => {
  loadHouseholds();
}, []);

async function loadNotifications() {
  try {
    const response = await fetch(`${API}/api/notifications`, { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Couldn't load notifications.");
    setNotifications(data.notifications || []);
    setNotificationError("");
  } catch (error) { setNotificationError(error.message || "Couldn't load notifications."); }
}
useEffect(() => {
    loadNotifications();
    // Keep the notification feed fresh while other household members use the app.
    const intervalId = window.setInterval(loadNotifications, 15000);
    const refreshOnFocus = () => loadNotifications();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);
async function markNotificationRead(id) {
  try {
    const response = await fetch(`${API}/api/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Couldn't update notification.");
    setNotifications(list => list.map(n => String(n._id) === String(id) ? data.notification : n));
  } catch (error) { setNotificationError(error.message); }
}
async function markAllNotificationsRead() {
  try {
    const response = await fetch(`${API}/api/notifications/read-all`, { method: "PATCH", credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Couldn't update notifications.");
    setNotifications(list => list.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
  } catch (error) { setNotificationError(error.message); }
}


async function createHousehold(e) {
  e.preventDefault();

  const name = householdName.trim();

  if (name.length < 2) {
    setHouseholdError("Enter a household name with at least 2 characters.");
    return;
  }

  setHouseholdLoading(true);
  setHouseholdError("");

  try {
    const response = await fetch(`${API}/api/households`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Couldn't create household.");
    }

    const created = data.household;

    setHouseholds(previous => [...previous, created]);
    setActiveHouseholdId(String(created._id));
    setSpace(created.name);
    setHouseholdName("");
    setShowCreateHousehold(false);
    setSpaceMenu(false);
    setActiveTab("Household");
    setMembers([{ id: String(user.id), name: user.name, email: user.email, role: "owner" }]);
    setNotice("Household created. You can invite members now.");
  } catch (error) {
    setHouseholdError(error.message);
  } finally {
    setHouseholdLoading(false);
  }
}


  useEffect(() => {
    if (!activeHouseholdId) { setTasks([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API}/api/households/${activeHouseholdId}/tasks`, { credentials: "include" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Couldn't load tasks.");
        if (!cancelled) setTasks(data.tasks || []);
      } catch (error) {
        if (!cancelled) setTaskError(error.message || "Couldn't load tasks.");
      }
    })();
    return () => { cancelled = true; };
  }, [activeHouseholdId]);

  async function addTask(e) {
    e.preventDefault();
    if (!activeHouseholdId || !taskTitle.trim()) return;
    setTaskSaving(true); setTaskError("");
    try {
      const response = await fetch(`${API}/api/households/${activeHouseholdId}/tasks`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(), description: taskDescription.trim(),
          dueDate: taskDueDate || null, priority: taskPriority,
          reminderAt: taskReminderAt ? new Date(taskReminderAt).toISOString() : null
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't save task.");
      setTasks(prev => [...prev, data.task].sort((a,b) => (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity)));
      setTaskTitle(""); setTaskDescription(""); setTaskDueDate(""); setTaskPriority("medium"); setTaskReminderAt("");
      setNotice("Task saved.");
    } catch (error) { setTaskError(error.message || "Couldn't save task."); }
    finally { setTaskSaving(false); }
  }

  async function toggleTask(task) {
    if (!activeHouseholdId) return;
    const status = task.status === "completed" ? "pending" : "completed";
    try {
      const response = await fetch(`${API}/api/households/${activeHouseholdId}/tasks/${task._id}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't update task.");
      setTasks(prev => prev.map(t => String(t._id) === String(task._id) ? data.task : t));
    } catch (error) { setTaskError(error.message || "Couldn't update task."); }
  }

  async function deleteTask(taskId) {
    if (!activeHouseholdId || !window.confirm("Delete this task?")) return;
    try {
      const response = await fetch(`${API}/api/households/${activeHouseholdId}/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't delete task.");
      setTasks(prev => prev.filter(t => String(t._id) !== String(taskId)));
      setNotice("Task deleted.");
    } catch (error) { setTaskError(error.message || "Couldn't delete task."); }
  }

  useEffect(() => {
    if (!activeHouseholdId) { setItems([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API}/api/households/${activeHouseholdId}/groceries`, { credentials: "include" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Couldn't load groceries.");
        if (!cancelled) setItems((data.items || []).map(item => ({
          id: String(item._id), name: item.name, category: item.category,
          quantity: `${item.quantity} ${item.unit}`.trim(),
          quantityValue: item.quantity, unit: item.unit, checked: item.status === "purchased",
          initials: ""
        })));
      } catch (error) {
        if (!cancelled) setNotice(error.message || "Couldn't load groceries.");
      }
    })();
    return () => { cancelled = true; };
  }, [activeHouseholdId]);

  useEffect(() => {
    if (!activeHouseholdId) return;
    let cancelled = false;
    async function loadHouseholdDetails() {
      try {
        const [memberRes, inviteRes] = await Promise.all([
          fetch(`${API}/api/households/${activeHouseholdId}/members`, { credentials: "include" }),
          fetch(`${API}/api/households/${activeHouseholdId}/invitations`, { credentials: "include" })
        ]);
        const memberData = await memberRes.json().catch(() => ({}));
        const inviteData = await inviteRes.json().catch(() => ({}));
        if (!cancelled && memberRes.ok) setMembers(memberData.members || []);
        if (!cancelled && inviteRes.ok) setInvitations(inviteData.invitations || []);
      } catch (error) {
        if (!cancelled) setInviteError("Couldn't load household members. Check the backend connection.");
      }
    }
    loadHouseholdDetails();
    return () => { cancelled = true; };
  }, [activeHouseholdId]);


  async function createInvite(e) {
    e.preventDefault();
    if (!activeHouseholdId) return;
    setInviteBusy(true); setInviteError(""); setInviteMessage(""); setInviteUrl("");
    try {
      const response = await fetch(`${API}/api/households/${activeHouseholdId}/invitations`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't create invitation.");
      setInviteUrl(data.inviteUrl);
      setInviteMessage(data.message || "Invitation link created.");
      setInviteEmail("");
      const invResponse = await fetch(`${API}/api/households/${activeHouseholdId}/invitations`, { credentials: "include" });
      const invData = await invResponse.json().catch(() => ({}));
      if (invResponse.ok) setInvitations(invData.invitations || []);
    } catch (error) { setInviteError(error.message || "Couldn't create invitation."); }
    finally { setInviteBusy(false); }
  }

  async function revokeInvite(invitationId) {
    try {
      const response = await fetch(`${API}/api/households/${activeHouseholdId}/invitations/${invitationId}`, {
        method: "DELETE", credentials: "include"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't revoke invitation.");
      setInvitations(list => list.filter(invite => invite._id !== invitationId));
      setInviteMessage("Invitation revoked.");
    } catch (error) { setInviteError(error.message); }
  }

  const filteredItems = useMemo(() => items.filter(i =>
    i.name.toLowerCase().includes(query.toLowerCase())
  ), [items, query]);

  async function toggleItem(id) {
    const item = items.find(i => String(i.id) === String(id));
    if (!item || !activeHouseholdId) return;
    try {
      const response = await fetch(`${API}/api/households/${activeHouseholdId}/groceries/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: item.checked ? "needed" : "purchased" })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't update item.");
      setItems(prev => prev.map(i => String(i.id) === String(id) ? { ...i, checked: data.item.status === "purchased" } : i));
      setNotice(data.item.status === "purchased" ? "Marked as purchased." : "Moved back to shopping list.");
    } catch (error) { setNotice(error.message || "Couldn't update item."); }
  }
  async function addItem(e) {
    e.preventDefault();
    if (!newName.trim() || !activeHouseholdId) return;
    const quantity = Number(newQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) { setNotice("Quantity must be greater than zero."); return; }
    try {
      const response = await fetch(`${API}/api/households/${activeHouseholdId}/groceries`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), category: newCategory, quantity, unit: newUnit })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't add grocery.");
      const item = data.item;
      setItems(prev => [{ id: String(item._id), name: item.name, category: item.category, quantity: `${item.quantity} ${item.unit}`.trim(), quantityValue: item.quantity, unit: item.unit, checked: false, initials: "" }, ...prev]);
      setNewName(""); setNewQuantity("1"); setNewUnit("piece"); setShowAdd(false);
      setNotice("Grocery saved.");
    } catch (error) { setNotice(error.message || "Couldn't add grocery."); }
  }
  async function removeItem(id) {
    if (!activeHouseholdId || !window.confirm("Delete this grocery item?")) return;
    try {
      const response = await fetch(`${API}/api/households/${activeHouseholdId}/groceries/${id}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't delete item.");
      setItems(prev => prev.filter(item => String(item.id) !== String(id)));
      setNotice("Grocery deleted.");
    } catch (error) { setNotice(error.message || "Couldn't delete grocery."); }
  }

  const nav = [
    { label: "Groceries", icon: ListChecks },
    { label: "Tasks", icon: ClipboardList },
    { label: "Household", icon: Users },
    { label: "Notifications", icon: Bell },
    { label: "AI Assistant", icon: Sparkles }
  ];

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark app-logo-mark"><img src="/gharsaathi-logo.png" alt="GharSaathi logo" /></div>
          <div className="brand-text"><div className="brand-name">GharSaathi</div><div className="brand-caption">Your home, in sync</div></div>
          <button className="icon-button desktop-collapse-button" aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setSidebarCollapsed(v => !v)}>{sidebarCollapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button>
          <button className="icon-button close-menu" aria-label="Close menu" onClick={() => setMobileMenu(false)}><X size={18} /></button>
        </div>
        <div className="space-wrap">
          <button className="space-select" title={space} onClick={() => setSpaceMenu(!spaceMenu)}>
            <span className="space-icon"><House size={17} /></span>
            <span className="space-copy"><strong>{space}</strong><small>{space === "Personal space" ? "Just for you" : "Shared household"}</small></span>
            {spaceMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {spaceMenu && <div className="space-dropdown">
            {households.map(h => <button key={h._id} onClick={() => {setActiveHouseholdId(String(h._id));setSpace(h.name);setSpaceMenu(false);setActiveTab("Household");}}>
              {String(h._id) === activeHouseholdId ? <Check size={15} /> : <span className="check-placeholder" />}{h.name}
            </button>)}
            
<button onClick={() => {
  setShowCreateHousehold(true);
  setHouseholdError("");
  setSpaceMenu(false);
}}>
  <Plus size={15} /> Create household
</button>

          </div>}
        </div>
        
{showCreateHousehold && (
  <form className="add-panel" onSubmit={createHousehold}>
    <div className="add-panel-heading">
      <strong>Create a household</strong>
      <button
        type="button"
        className="icon-button"
        onClick={() => {
          setShowCreateHousehold(false);
          setHouseholdError("");
        }}
        aria-label="Close"
      >
        <X size={17} />
      </button>
    </div>

    <div className="add-fields">
      <input
        autoFocus
        value={householdName}
        onChange={e => setHouseholdName(e.target.value)}
        placeholder="e.g. My Home"
        minLength={2}
        maxLength={80}
        required
      />
      <button className="add-submit" disabled={householdLoading}>
        {householdLoading ? "Creating..." : "Create"}
      </button>
    </div>

    {householdError && (
      <p className="auth-error" role="alert">
        {householdError}
      </p>
    )}
  </form>
)}

        <div className="nav-label">YOUR HOME</div>
        <nav className="side-nav">
          {nav.map(({label, icon: Icon}) => <button key={label} title={label} className={`nav-item ${activeTab === label ? "active" : ""}`} onClick={() => {setActiveTab(label);setMobileMenu(false);if(label === "Notifications") loadNotifications();}}>
            <Icon size={19} strokeWidth={1.8} /><span>{label}</span>{label === "AI Assistant" && <span className="nav-new">AI</span>}{label === "Notifications" && notifications.some(n => !n.readAt) && <span className="nav-new">{notifications.filter(n => !n.readAt).length}</span>}
          </button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span className="tip-icon"><Leaf size={17}/></span><div><strong>A little greener</strong><p>Small steps make a happy home.</p></div></div>
          <div className="profile-card"><span className="avatar">{(user?.name || "U").slice(0,1).toUpperCase()}</span><span className="profile-copy"><strong>{user?.name || "Your profile"}</strong><small>{user?.email || "Account & settings"}</small></span><button className="logout-button" onClick={onLogout} title="Log out" aria-label="Log out"><LogOut size={17}/></button></div>
        </div>
      </aside>
      {mobileMenu && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

      <main className="main-panel">
        <div className="content-area">
          <div className="content-page-title"><button className="content-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(true)}><Menu size={20}/></button><div className="content-page-title-copy"><h1>{activeTab === "Groceries" ? "Grocery List" : activeTab}</h1><p>{activeTab === "Groceries" ? "A little list goes a long way." : pageDescription(activeTab)}</p></div></div>
          {activeTab === "Groceries" ? <>
            <div className="list-toolbar">
              <div className="toolbar-left">
                <button className="toolbar-chip selected"><ShoppingCart size={15}/> Shopping Run</button>
                <button className="toolbar-chip household-chip" onClick={() => setActiveTab("Household")}>{space} <span className="people-mini">♧</span></button>
              </div>
              <div className="toolbar-right">
                <button className="toolbar-chip new-list-chip" onClick={() => setShowAdd(true)}><Plus size={15}/> New Item</button>
                <button className="small-circle-button" aria-label="Invite member" onClick={() => setActiveTab("Household")}><CircleUserRound size={17}/></button>
              </div>
            </div>

            <div className="search-row"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find an item in your list…" aria-label="Search groceries"/>{query && <button onClick={() => setQuery("")}><X size={15}/></button>}</div>

            {showAdd && <form className="add-panel" onSubmit={addItem}>
              <div className="add-panel-heading"><strong>Add a grocery</strong><button type="button" className="icon-button" onClick={() => setShowAdd(false)} aria-label="Close"><X size={17}/></button></div>
              <div className="add-fields"><input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Item name" aria-label="Item name" required/><input type="number" min="0.01" step="0.01" value={newQuantity} onChange={e=>setNewQuantity(e.target.value)} aria-label="Quantity" required/><select value={newUnit} onChange={e=>setNewUnit(e.target.value)} aria-label="Unit">{["piece","kg","g","litre","ml","pack","bunch","box","bottle","bag"].map(unit=><option key={unit}>{unit}</option>)}</select><select value={newCategory} onChange={e => setNewCategory(e.target.value)} aria-label="Category">{categories.map(c => <option key={c.name}>{c.name}</option>)}</select><button className="add-submit" type="submit">Add item</button></div>
            </form>}

            <div className="grocery-groups">
              {categories.map(({name, icon: Icon}) => {
                const groupItems = filteredItems.filter(i => i.category === name);
                if (!groupItems.length) return null;
                const isCollapsed = !!collapsed[name];
                return <section className="category-section" key={name}>
                  <button className="category-heading" onClick={() => setCollapsed(p => ({...p,[name]:!p[name]}))}>
                    <span className="category-title"><Icon size={17} fill="currentColor" strokeWidth={1.5}/>{name}</span>
                    <span className="category-meta">{groupItems.filter(i => !i.checked).length} left {isCollapsed ? <ChevronDown size={17}/> : <ChevronUp size={17}/>}</span>
                  </button>
                  {!isCollapsed && <div className="category-items">{groupItems.map(item => <div className={`grocery-item ${item.checked ? "item-checked" : ""}`} key={item.id}>
                    <button className={`check-box ${item.checked ? "checked" : ""}`} aria-label={`Mark ${item.name} ${item.checked ? "needed" : "purchased"}`} onClick={() => toggleItem(item.id)}>{item.checked && <Check size={15}/>}</button>
                    <button className="item-main" onClick={() => toggleItem(item.id)}><span className="item-name">{item.name}</span><small>{item.quantity}</small></button>
                    {item.initials && <span className="member-initials" title="Added by household member">{item.initials}</span>}
                    <button className="item-more" aria-label={`Delete ${item.name}`} title="Delete item" onClick={() => removeItem(item.id)}><Trash2 size={15}/></button>
                  </div>)}</div>}
                </section>;
              })}
              {!filteredItems.length && <div className="empty-state"><ShoppingBasket size={28}/><strong>No matching groceries</strong><p>Try another search or add a new item.</p><button className="add-submit" onClick={() => setShowAdd(true)}>Add a grocery</button></div>}
            </div>
            <div className="preview-note"><span className="preview-dot"/> Groceries are saved to the selected household in MongoDB.</div>
          </> : activeTab === "Household" ? <section className="household-page">
            <div className="household-page-heading"><div><span className="eyebrow">SHARED SPACE</span><h2>{space}</h2><p>Manage members and invitations for this household.</p></div><span className="household-heading-icon"><Users size={24}/></span></div>
            {!activeHouseholdId ? <div className="empty-state"><Users size={26}/><strong>No household selected</strong><p>Create a household or choose one from the sidebar.</p></div> : <>
              <div className="household-columns">
                <section className="household-card"><h3>Members <span className="count-badge">{members.length}</span></h3>
                  {members.map(member => <div className="household-member" key={member.id}><span className="member-avatar">{(member.name || member.email || "?").slice(0,1).toUpperCase()}</span><span><strong>{member.name}</strong><small>{member.email}</small></span><span className="member-role-pill">{member.role}</span></div>)}
                </section>
                <section className="household-card"><h3><Mail size={17}/> Invite by email</h3>
                  <p className="household-help">Invited people must sign in or register with this exact email, then accept the link. Links expire after 7 days.</p>
                  <form className="household-invite-form" onSubmit={createInvite}><label htmlFor="invite-email">Email address</label><div><input id="invite-email" type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="person@example.com" required/><button className="add-submit" disabled={inviteBusy}>{inviteBusy ? "Creating…" : "Create invite"}</button></div></form>
                  {inviteError && <p className="auth-error" role="alert">{inviteError}</p>}
                  {inviteMessage && <p className="household-success" role="status">{inviteMessage}</p>}
                  {inviteUrl && <div className="invite-link-box"><label>Share this secure invitation link</label><input readOnly value={inviteUrl}/><button className="add-submit" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(inviteUrl);setInviteMessage("Invitation link copied.");}catch{setInviteMessage("Copy the link from the field above.");}}}><Copy size={15}/> Copy link</button></div>}
                  <h4>Pending invitations</h4>
                  {!invitations.length && <p className="household-help">No pending invitations.</p>}
                  {invitations.map(invite => <div className="pending-invite" key={invite._id}><span><strong>{invite.invitedEmail}</strong><small>Expires {new Date(invite.expiresAt).toLocaleDateString()}</small></span><button className="icon-button" type="button" aria-label={`Revoke invitation for ${invite.invitedEmail}`} onClick={()=>revokeInvite(invite._id)}><Trash2 size={16}/></button></div>)}
                </section>
              </div>
            </>}
          </section> : activeTab === "Notifications" ? <section className="notifications-page">
            <div className="notifications-heading"><div><span className="eyebrow">UPDATES FOR YOU</span><h2>Notifications</h2><p>Invitations and household updates across your spaces.</p></div>{notifications.some(n => !n.readAt) && <button className="add-submit" onClick={markAllNotificationsRead}>Mark all read</button>}</div>
            {notificationError && <p className="auth-error" role="alert">{notificationError}</p>}
            {!notifications.length ? <div className="empty-state"><Bell size={26}/><strong>You're all caught up</strong><p>New invitations and household updates will appear here.</p></div> : <div className="notification-list">{notifications.map(n => <article className={`notification-row ${n.readAt ? "is-read" : "is-unread"}`} key={n._id}><span className="notification-row-icon">{n.type === "invitation" ? <Mail size={18}/> : <Bell size={18}/>}</span><div className="notification-row-copy"><strong>{n.title}</strong><p>{n.message}</p><small>{new Date(n.createdAt).toLocaleString()}</small>{n.type === "invitation" && <p className="notification-invite-note">Accept this invitation to join the shared household.</p>}</div>{n.type === "invitation" && n.invitation && <button className="add-submit notification-accept-button" onClick={async()=>{try{const response=await fetch(`${API}/api/notifications/${n._id}/accept-invitation`,{method:"POST",credentials:"include"});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Couldn't accept invitation.");setNotice(data.message||"Invitation accepted.");await loadHouseholds();setActiveHouseholdId(String(data.household._id));setSpace(data.household.name);setActiveTab("Household");await loadNotifications();}catch(error){setNotificationError(error.message);}}}>Accept invitation</button>}{!n.readAt && <button className="text-action" onClick={() => markNotificationRead(n._id)}>Mark read</button>}</article>)}</div>}
          </section> : activeTab === "Tasks" ? <section className="tasks-page">
            <div className="tasks-heading"><div><span className="eyebrow">HOME ORGANIZER</span><h2>One thing at a time.</h2><p>Keep the little things from slipping through the cracks.</p></div><span className="household-heading-icon"><ClipboardList size={24}/></span></div>
            {!activeHouseholdId ? <div className="empty-state"><ClipboardList size={26}/><strong>No household selected</strong><p>Create or choose a household before adding tasks.</p></div> : <>
              <form className="task-create-card" onSubmit={addTask}>
                <h3>Add a task</h3>
                <label>Task title<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="e.g. Pay the electricity bill" maxLength={160} required /></label>
                <label>Description <span className="optional-label">(optional)</span><textarea value={taskDescription} onChange={e=>setTaskDescription(e.target.value)} placeholder="Any details to remember…" maxLength={2000} rows={2}/></label>
                <div className="task-form-grid">
                  <label><CalendarDays size={14}/> Due date<input type="date" value={taskDueDate} onChange={e=>setTaskDueDate(e.target.value)}/></label>
                  <label><Flag size={14}/> Priority<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                  <label><Bell size={14}/> Reminder time<input type="datetime-local" value={taskReminderAt} onChange={e=>setTaskReminderAt(e.target.value)}/></label>
                </div>
                <p className="task-reminder-note">Reminder times can be saved now; automatic notifications will be connected in the notifications milestone.</p>
                <button className="add-submit task-submit" disabled={taskSaving || !taskTitle.trim()}>{taskSaving ? "Saving…" : <><Plus size={15}/> Add task</>}</button>
                {taskError && <p className="auth-error" role="alert">{taskError}</p>}
              </form>
              <div className="tasks-list-card"><div className="tasks-list-heading"><div><h3>Your tasks</h3><p>{tasks.filter(t=>t.status !== "completed").length} remaining · {tasks.filter(t=>t.status === "completed").length} completed</p></div></div>
                {!tasks.length ? <div className="empty-state task-empty"><ClipboardList size={25}/><strong>No tasks yet</strong><p>Add your first task above. It will be saved to this household.</p></div> : tasks.map(task => {
                  const due = task.dueDate ? new Date(task.dueDate) : null;
                  const overdue = due && due < new Date(new Date().toDateString()) && task.status !== "completed";
                  return <article className={`task-row-card ${task.status === "completed" ? "task-is-complete" : ""}`} key={task._id}>
                    <button className={`task-check ${task.status === "completed" ? "checked" : ""}`} onClick={() => toggleTask(task)} aria-label={task.status === "completed" ? "Reopen task" : "Complete task"}>{task.status === "completed" && <Check size={14}/>}</button>
                    <div className="task-row-main"><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<div className="task-meta">{due && <span className={overdue ? "task-overdue" : ""}><CalendarDays size={13}/>{overdue ? "Overdue · " : "Due "}{due.toLocaleDateString()}</span>}<span className={`priority-pill priority-${task.priority}`}><Flag size={12}/>{task.priority} priority</span>{task.reminderAt && <span><Bell size={12}/>{new Date(task.reminderAt).toLocaleString()}</span>}</div></div>
                    <button className="task-delete" onClick={() => deleteTask(task._id)} aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={16}/></button>
                  </article>;
                })}
              </div>
            </>}
          </section> : activeTab === "AI Assistant" ? <AIAssistant householdId={activeHouseholdId} householdName={space} /> : <FeaturePlaceholder activeTab={activeTab} onGoGroceries={() => setActiveTab("Groceries")} />}
        </div>

        {notice && <div className="toast" role="status"><Check size={17}/>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}
      </main>
    </div>
  );
}

function pageDescription(tab) {
  return ({
    Home: "A calmer view of what's happening at home.",
    Tasks: "Keep the little things from slipping through the cracks.",
    "AI Assistant": "A friendly hand with everyday household planning.",
    Household: "Manage members and invitations for your home.",
    Settings: "Make GharSaathi feel like yours."
  })[tab] || "Your home, in sync.";
}


function AIAssistant({ householdId, householdName }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [speakingMessage, setSpeakingMessage] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const endRef = useMemo(() => ({ current: null }), []);

  // Stop speech when the selected conversation changes or this component unmounts.
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeakingMessage(null);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [conversationId]);

  // Load saved chats whenever the selected household changes.
  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setMessages([]);
      setConversations([]);
      setConversationId(null);
      setError("");

      if (!householdId) {
        setLoadingConversations(false);
        return;
      }

      setLoadingConversations(true);
      try {
        const response = await fetch(
          `${API}/api/ai/conversations?householdId=${encodeURIComponent(householdId)}`,
          { credentials: "include" }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Couldn't load your conversations.");
        if (cancelled) return;

        const list = Array.isArray(data.conversations) ? data.conversations : [];
        setConversations(list);
        if (list.length) setConversationId(list[0].id);
      } catch (err) {
        if (!cancelled) setError(err.message || "Couldn't load your conversations.");
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    }

    loadConversations();
    return () => { cancelled = true; };
  }, [householdId]);

  // Load the selected chat's messages.
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setMessages([]);
      if (!householdId || !conversationId) return;

      try {
        const params = new URLSearchParams({ householdId, conversationId });
        const response = await fetch(`${API}/api/ai/history?${params.toString()}`, {
          credentials: "include"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Couldn't load chat history.");
        if (!cancelled) setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Couldn't load chat history.");
      }
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [householdId, conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, sending, endRef]);

  async function startNewChat() {
    if (!householdId || sending || loadingConversations) return;
    setError("");

    try {
      const response = await fetch(`${API}/api/ai/conversations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.conversation?.id) {
        throw new Error(data.error || "Couldn't start a new chat.");
      }

      const chat = data.conversation;
      setConversations(current => [chat, ...current]);
      setConversationId(chat.id);
      setMessages([]);
      setDraft("");
    } catch (err) {
      setError(err.message || "Couldn't start a new chat.");
    }
  }

  function openConversation(id) {
    if (sending || id === conversationId) return;
    setError("");
    setConversationId(id);
  }

  const suggestions = [
    { title: "Check my groceries", prompt: "What groceries do we still need to buy?" },
    { title: "Plan today's meals", prompt: "Help me plan simple meals for today." },
    { title: "What's pending?", prompt: "Summarize the pending tasks in this household." },
    { title: "Get organized", prompt: "Suggest a simple plan to organize my household today." }
  ];

  async function sendMessage(text = draft) {
    const message = text.trim();
    if (!message || sending) return;
    if (!householdId) {
      setError("Choose or create a household before chatting with GharSaathi.");
      return;
    }

    const nextMessages = [...messages, { role: "user", text: message }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSending(true);

    try {
      const response = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId, conversationId, message })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "GharSaathi couldn't respond. Please try again.");
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The assistant returned an empty reply. Please try again.");
      }
      setMessages(current => [...current, { role: "assistant", text: data.reply.trim() }]);
      setConversations(current => current.map(chat => chat.id === conversationId && chat.title === "New chat"
        ? { ...chat, title: message.slice(0, 45) }
        : chat));
    } catch (err) {
      setError(err.message || "Couldn't reach the AI assistant. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  function speakReply(text, messageId) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setError("Voice playback isn't supported by this browser.");
      return;
    }

    // Tap the same response button again to stop playback.
    if (speakingMessage === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessage(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = navigator.language || "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const languageCode = utterance.lang.split("-")[0].toLowerCase();
    const languageVoices = voices.filter(voice =>
      voice.lang.toLowerCase().startsWith(languageCode)
    );
    const femaleVoicePattern = /female|woman|zira|samantha|susan|karen|heera|priya|veena|lekha|aria|jenny/i;
    const preferredVoice = languageVoices.find(voice => femaleVoicePattern.test(voice.name))
      || languageVoices[0]
      || voices.find(voice => femaleVoicePattern.test(voice.name));

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setSpeakingMessage(messageId);
    utterance.onend = () => setSpeakingMessage(current => current === messageId ? null : current);
    utterance.onerror = () => setSpeakingMessage(current => current === messageId ? null : current);

    setSpeakingMessage(messageId);
    window.speechSynthesis.speak(utterance);
  }

  async function startVoiceInput() {
    // Click once to record; click again to stop and transcribe.
    if (listening) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Audio recording isn't supported in this browser. Please use a current version of Opera or Chrome.");
      return;
    }

    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "");
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = event => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError("Recording failed. Please check your microphone and try again.");
        setListening(false);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.onstop = async () => {
        setListening(false);
        stream.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        mediaRecorderRef.current = null;

        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        if (!audioBlob.size) {
          setError("I didn't receive any audio. Please try recording again.");
          return;
        }
        if (audioBlob.size > 8 * 1024 * 1024) {
          setError("That recording is too large. Please keep voice messages under about 1 minute.");
          return;
        }

        try {
          setSending(true);
          setError("Transcribing your voice…");
          const base64Audio = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = String(reader.result || "");
              const comma = result.indexOf(",");
              if (comma < 0) return reject(new Error("Couldn't read the recording."));
              resolve(result.slice(comma + 1));
            };
            reader.onerror = () => reject(new Error("Couldn't read the recording."));
            reader.readAsDataURL(audioBlob);
          });

          const response = await fetch(`${API}/api/ai/transcribe`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ householdId, audio: base64Audio, mimeType })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || "Couldn't transcribe your voice. Please try again.");
          if (!data.transcript?.trim()) throw new Error("I couldn't make out the words. Please try again.");
          setDraft(current => current ? `${current} ${data.transcript.trim()}` : data.transcript.trim());
          setError("");
        } catch (err) {
          setError(err.message || "Voice transcription failed. You can still type your message.");
        } finally {
          setSending(false);
        }
      };

      recorder.start();
      setListening(true);
      setError("Recording… click the microphone again when you're done speaking.");
    } catch (err) {
      setListening(false);
      const reason = err?.name === "NotAllowedError"
        ? "Microphone permission was denied. Allow microphone access and try again."
        : err?.name === "NotFoundError"
          ? "No microphone was found. Connect or select a microphone and try again."
          : "Couldn't start microphone recording. Please check microphone access and try again.";
      setError(reason);
    }
  }

  const css = `
    .gs-ai-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:16px;padding:24px;border:1px solid #e2eee3;border-radius:22px;background:linear-gradient(115deg,#f2f8f0 0%,#fffaf2 100%)}
    .gs-ai-mark{display:grid;place-items:center;flex:0 0 56px;width:56px;height:56px;border-radius:18px;background:#fff;color:#438f60;box-shadow:0 8px 24px #234d3212}
    .gs-ai-hero h2{margin:0 0 6px;font-size:clamp(22px,3vw,30px);color:#203c2b;letter-spacing:-.6px}
    .gs-ai-hero p{margin:0;color:#66766b;line-height:1.55}
    .gs-ai-status{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:#3f8558;font-weight:700}
    .gs-ai-status:before{content:"";width:7px;height:7px;border-radius:50%;background:#55a66e}
    .gs-ai-history{min-width:0;max-height:520px;overflow-y:auto}
    .gs-ai-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: calc(100vh - 170px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  box-sizing: border-box;
}

.gs-ai-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
  min-height: 430px;
}

/* Default: keep the chat readable */
.gs-ai-workspace > .gs-ai-history,
.gs-ai-workspace > .gs-ai-chat,
.gs-ai-workspace > .gs-ai-side {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* Use three columns when enough space is available */
@media (min-width: 1250px) {
  .gs-ai-workspace {
    grid-template-columns:
      minmax(190px, 230px)
      minmax(300px, 1fr)
      minmax(200px, 250px);
  }
}

/* Prevent headings from breaking word by word */
.gs-ai-chat-top strong {
  overflow-wrap: normal;
  word-break: normal;
}

.gs-ai-chat-top span {
  white-space: nowrap;
}


.gs-ai-history {
  min-width: 0;
  max-height: 520px;
  overflow-y: auto;
}

.gs-ai-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e6ebe5;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 30px #263b2a08;
}

.gs-ai-chat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 15px 18px;
  border-bottom: 1px solid #edf0eb;
}

.gs-ai-transcript {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
  overflow-y: auto;
  min-width: 0;
  min-height: 270px;
  max-height: calc(100vh - 430px);
  overflow-wrap: anywhere;
}
    .gs-ai-new-chat{width:100%;padding:11px 12px;margin-bottom:16px;border:0;border-radius:12px;background:#4a9863;color:#fff;font:inherit;font-weight:700;cursor:pointer}
    .gs-ai-new-chat:disabled{opacity:.5;cursor:not-allowed}
    .gs-ai-speak-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;flex-shrink:0;align-self:flex-start;margin-top:5px;padding:7px 9px;border:1px solid #dce9dc;border-radius:10px;background:#fff;color:#438f60;font:inherit;font-size:12px;cursor:pointer}
    .gs-ai-speak-btn:hover{background:#edf6ec}
    .gs-ai-speak-btn:focus-visible{outline:2px solid #438f60;outline-offset:2px}
    .gs-ai-history .gs-ai-prompt{overflow:hidden}
    .gs-ai-history .gs-ai-prompt span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gs-ai-history .gs-ai-prompt.active{background:#eaf5e9;border-color:#a9d0ae}
    .gs-ai-chat{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid #e6ebe5;border-radius:20px;background:#fff;box-shadow:0 8px 30px #263b2a08}
    .gs-ai-chat-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 18px;border-bottom:1px solid #edf0eb}
    .gs-ai-chat-top strong{color:#263d2e;font-size:14px}
    .gs-ai-chat-top span{font-size:12px;color:#829087}
    .gs-ai-transcript{display:flex;flex:1;flex-direction:column;gap:16px;padding:22px;overflow-y:auto;min-height:270px;max-height:calc(100vh - 430px)}
    .gs-ai-welcome{text-align:center;max-width:460px;margin:auto;padding:24px 8px}
    .gs-ai-welcome-icon{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 14px;border-radius:19px;background:#edf6ec;color:#4b9663}
    .gs-ai-welcome h3{margin:0 0 8px;color:#263d2e;font-size:21px}
    .gs-ai-welcome p{margin:0;color:#77847b;font-size:14px;line-height:1.6}
    .gs-ai-message{display:flex;align-items:flex-start;gap:10px;max-width:92%}
    .gs-ai-message.user{align-self:flex-end;flex-direction:row-reverse}
    .gs-ai-avatar{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border-radius:11px;background:#edf5ec;color:#478a5c}
    .gs-ai-message.user .gs-ai-avatar{background:#f7e8d3;color:#8c6339}
    .gs-ai-bubble{padding:12px 15px;border:1px solid #e8eee7;border-radius:5px 16px 16px 16px;background:#f8faf7;color:#33463a;font-size:14px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}
    .gs-ai-message.user .gs-ai-bubble{border-color:#d8eadb;border-radius:16px 5px 16px 16px;background:#eaf5e9}
    .gs-ai-typing{display:flex;align-items:center;gap:5px;padding:13px 15px;border-radius:5px 16px 16px 16px;background:#f4f7f2}
    .gs-ai-typing i{width:6px;height:6px;border-radius:50%;background:#76a583;animation:gsAiPulse 1s infinite ease-in-out}
    .gs-ai-typing i:nth-child(2){animation-delay:.15s}.gs-ai-typing i:nth-child(3){animation-delay:.3s}
    @keyframes gsAiPulse{0%,60%,100%{opacity:.4;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
    .gs-ai-error{margin:0 18px 12px;padding:10px 12px;border-radius:10px;background:#fff0ed;color:#a34437;font-size:13px}
    .gs-ai-composer{display:flex;align-items:flex-end;gap:9px;padding:14px;border-top:1px solid #edf0eb;background:#fff}
    .gs-ai-input{flex:1;min-width:0;resize:vertical;max-height:130px;min-height:44px;padding:12px 13px;border:1px solid #e0e8df;border-radius:13px;outline:none;font:inherit;font-size:14px;color:#273c2e;background:#fcfdfb}
    .gs-ai-input:focus{border-color:#7ab28a;box-shadow:0 0 0 3px #70a97d18}
    .gs-ai-icon-btn,.gs-ai-send{display:grid;place-items:center;flex:0 0 43px;width:43px;height:43px;border:1px solid #e1e9df;border-radius:13px;background:#fff;color:#548262;cursor:pointer}
    .gs-ai-icon-btn:disabled,.gs-ai-send:disabled{opacity:.45;cursor:not-allowed}
    .gs-ai-icon-btn.listening{background:#fff0ed;border-color:#f3c9c1;color:#b54c3d}
    .gs-ai-send{border-color:#4a9863;background:#4a9863;color:white}
    .gs-ai-hint{padding:0 16px 13px;color:#9aa49b;font-size:11px;text-align:center}
    .gs-ai-side{display:flex;flex-direction:column;gap:12px}
    .gs-ai-side-card{padding:17px;border:1px solid #e6ebe5;border-radius:18px;background:#fff}
    .gs-ai-side-card h3{margin:0 0 6px;color:#2b4131;font-size:14px}
    .gs-ai-side-card p{margin:0 0 13px;color:#7b887e;font-size:12px;line-height:1.5}
    .gs-ai-prompt{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;margin-top:8px;padding:11px 10px;border:1px solid #e8eee6;border-radius:12px;background:#fbfdf9;color:#405745;text-align:left;font:inherit;font-size:12px;cursor:pointer;transition:background .15s,border-color .15s}
    .gs-ai-prompt:hover{background:#f0f7ee;border-color:#cfe2cf}
    .gs-ai-privacy{display:flex;gap:8px;align-items:flex-start;padding:12px;border-radius:13px;background:#f3f7f0;color:#7c897d;font-size:11px;line-height:1.5}
@media (max-width: 780px) {
  .gs-ai-page {
    width: 100%;
    min-height: calc(100vh - 140px);
    gap: 12px;
  }

  .gs-ai-hero {
    padding: 18px;
    border-radius: 17px;
  }

  .gs-ai-workspace {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
    gap: 12px;
  }

  .gs-ai-history {
    max-height: 220px;
  }

  .gs-ai-side {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .gs-ai-side-card {
    padding: 14px;
  }

  .gs-ai-chat {
    min-height: 480px;
  }

  .gs-ai-chat-top {
    flex-wrap: wrap;
  }

  .gs-ai-transcript {
    padding: 16px;
    max-height: 48vh;
  }

  .gs-ai-message {
    max-width: 100%;
  }

  .gs-ai-hint {
    font-size: 10px;
  }
}  `;

  return <div className="gs-ai-page">
    <style>{css}</style>
    <section className="gs-ai-hero">
      <div className="gs-ai-mark"><Sparkles size={28}/></div>
      <div>
        <span className="eyebrow">YOUR HOUSEHOLD COMPANION</span>
        <h2>A little help, whenever you need it.</h2>
        <p>Ask about groceries, plan meals, or make sense of today's to-dos.</p>
        <span className="gs-ai-status">Ready to help · {householdName || "Your space"}</span>
      </div>
    </section>

    <div className="gs-ai-workspace">
      <aside className="gs-ai-side-card gs-ai-history" aria-label="Chat history">
        <button type="button" className="gs-ai-new-chat" onClick={startNewChat}
          disabled={!householdId || sending || loadingConversations}>+ New Chat</button>
        <h3>Chat History</h3>
        {loadingConversations && <p>Loading conversations…</p>}
        {!loadingConversations && conversations.length === 0 && <p>No saved chats yet. Start a new chat!</p>}
        {conversations.map(chat => (
          <button type="button" key={chat.id}
            className={`gs-ai-prompt ${chat.id === conversationId ? "active" : ""}`}
            onClick={() => openConversation(chat.id)} disabled={sending} title={chat.title || "New chat"}>
            <span>{chat.title || "New chat"}</span><span aria-hidden="true">›</span>
          </button>
        ))}
      </aside>

      <section className="gs-ai-chat" aria-label="GharSaathi AI chat">
        <header className="gs-ai-chat-top">
          <strong><Sparkles size={15} style={{display:"inline",verticalAlign:"-3px",marginRight:7,color:"#4a9863"}}/>Chat with GharSaathi</strong>
          <span>Gemini 3.6 Flash</span>
        </header>

        <div className="gs-ai-transcript" aria-live="polite">
          {!messages.length && <div className="gs-ai-welcome">
            <div className="gs-ai-welcome-icon"><Bot size={28}/></div>
            <h3>Hi{householdName ? `, welcome to ${householdName}` : ""}! 👋</h3>
            <p>I'm here to make everyday home life feel a little lighter. Ask me a question or choose a suggestion to get started.</p>
          </div>}
          {messages.map((message, index) => {
            const messageId = `${conversationId}-${index}`;
            return (
              <div
                className={`gs-ai-message ${message.role === "user" ? "user" : "assistant"}`}
                key={`${index}-${message.role}`}
              >
                <span className="gs-ai-avatar">
                  {message.role === "user" ? <UserRound size={16} /> : <Sparkles size={16} />}
                </span>
                <div className="gs-ai-bubble">{message.text}</div>
                {message.role === "assistant" && (
                  <button
                    type="button"
                    className="gs-ai-speak-btn"
                    onClick={() => speakReply(message.text, messageId)}
                    aria-label={speakingMessage === messageId ? "Stop speaking" : "Read response aloud"}
                    title={speakingMessage === messageId ? "Stop speaking" : "Read aloud"}
                  >
                    {speakingMessage === messageId ? "■ Stop" : <><Volume2 size={16} /><span>Listen</span></>}
                  </button>
                )}
              </div>
            );
          })}
          {sending && <div className="gs-ai-message assistant"><span className="gs-ai-avatar"><Sparkles size={16}/></span><div className="gs-ai-typing" aria-label="GharSaathi is thinking"><i/><i/><i/></div></div>}
          <div ref={node => { endRef.current = node; }} />
        </div>

        {error && <p className="gs-ai-error" role="alert">{error}</p>}
        <form className="gs-ai-composer" onSubmit={event => { event.preventDefault(); sendMessage(); }}>
          <textarea className="gs-ai-input" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Ask GharSaathi anything about your home…" aria-label="Message GharSaathi" rows={1} maxLength={4000}/>
          <button type="button" className={`gs-ai-icon-btn ${listening ? "listening" : ""}`} onClick={startVoiceInput} disabled={sending} aria-label={listening ? "Stop recording" : "Use voice input"} title={listening ? "Stop recording and transcribe" : "Start voice recording"}><Mic size={18}/></button>
          <button type="submit" className="gs-ai-send" disabled={sending || !draft.trim()} aria-label="Send message" title="Send message">{sending ? <LoaderCircle size={18} className="gs-ai-spinner"/> : <Send size={18}/>}</button>
        </form>
        <div className="gs-ai-hint">Tap the mic to record, tap again to transcribe · Enter to send · Shift + Enter for a new line.</div>
      </section>

      <aside className="gs-ai-side">
        <section className="gs-ai-side-card">
          <h3>Try asking</h3>
          <p>Start with one of these everyday questions.</p>
          {suggestions.map(item => <button className="gs-ai-prompt" key={item.title} onClick={() => sendMessage(item.prompt)} disabled={sending}>
            <span>{item.title}</span><span aria-hidden="true">↗</span>
          </button>)}
        </section>
        <div className="gs-ai-privacy"><span>✦</span><span>GharSaathi uses the selected space's grocery and task information to help answer your question. It won't change your lists just because you ask.</span></div>
      </aside>
    </div>
  </div>;
}

function FeaturePlaceholder({ activeTab, onGoGroceries }) {
  const details = {
    Home: {icon: House, title: "Your home, at a glance", body: "Your next build will bring your groceries, tasks, and reminders together here."},
    Tasks: {icon: ClipboardList, title: "One thing at a time", body: "Create tasks, set due dates and priorities, and choose reminders that work for you."},
    "AI Assistant": {icon: Sparkles, title: "Meet your household assistant", body: "Plan meals, ask questions by text or voice, and review suggested list changes before they happen."},
    Settings: {icon: Settings, title: "Your space, your preferences", body: "Account, sign-in, notification, and household settings will live here."}
  };
  const info = details[activeTab] || details.Home;
  const Icon = info.icon;
  return <div className="feature-page"><div className="feature-art"><span><Icon size={32}/></span><span className="leaf-orbit orbit-one"/><span className="leaf-orbit orbit-two"/></div><span className="eyebrow">GHARSAATHI · {activeTab.toUpperCase()}</span><h2>{info.title}</h2><p>{info.body}</p><button className="add-submit" onClick={onGoGroceries}>Explore grocery list</button><small>This screen is part of the design foundation. Its working features will be added in the next implementation stages.</small></div>;
}
