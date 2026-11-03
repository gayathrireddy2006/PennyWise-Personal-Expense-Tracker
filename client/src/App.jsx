import { useEffect, useState } from "react";
import "./App.css";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/expenses`;
const categories = ["Food", "Travel", "Shopping", "Education", "Bills", "Other"];
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Food", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });

  async function loadExpenses() {
    try {
      setError("");
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load expenses.");
      setExpenses(await response.json());
    } catch (err) {
      setError("Cannot connect to the backend. Check that the server is running.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadExpenses(); }, []);

  function openAdd() {
    setEditingId(null);
    setForm({ title: "", category: "Food", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });
    setShowForm(true);
  }

  function openEdit(expense) {
    setEditingId(expense._id);
    setForm({ title: expense.title, category: expense.category, amount: String(expense.amount), date: String(expense.date).slice(0, 10), notes: expense.notes || "" });
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = { ...form, title: form.title.trim(), amount: Number(form.amount) };
    if (!payload.title || !payload.date || !Number.isFinite(payload.amount) || payload.amount <= 0) {
      alert("Enter a valid title, date, and amount."); return;
    }
    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Could not save expense.");
      setShowForm(false);
      setEditingId(null);
      await loadExpenses();
    } catch (err) { alert("Could not save the expense. Check the backend and try again."); }
  }

  async function deleteExpense(id) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      await loadExpenses();
    } catch { alert("Could not delete the expense. Please try again."); }
  }

  function exportCSV() {
    const rows = [["Title", "Category", "Amount", "Date"], ...filtered.map(e => [e.title, e.category, e.amount, String(e.date).slice(0, 10)])];
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = "pennywise-expenses.csv"; link.click(); URL.revokeObjectURL(url);
  }

  const filtered = expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) && (category === "All" || e.category === category)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const now = new Date();
  const monthExpenses = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = 10000;

  return <div className="app-layout">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon">₹</div><div><h2>PennyWise</h2><span>PERSONAL FINANCE</span></div></div>
      <p className="menu-label">WORKSPACE</p>
      <div className="navigation"><button className="nav-item active">▦ Dashboard</button><button className="nav-item" onClick={() => document.getElementById("expenses")?.scrollIntoView({ behavior: "smooth" })}>↗ All Expenses</button><button className="nav-item" onClick={exportCSV}>▥ Export Report</button></div>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✦</div><h3>Spend smarter.</h3><p>Small steps today, better savings tomorrow.</p></div><div className="profile"><div className="avatar">PW</div><div><strong>My Account</strong><span>Personal Finance</span></div></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><p className="breadcrumb">Workspace / Dashboard</p><h1>Financial Overview</h1></div><button className="primary-button" onClick={openAdd}>＋ Add Expense</button></header>
      <section className="welcome-banner"><div><span className="eyebrow">YOUR MONEY, YOUR CONTROL</span><h2>Take charge of your finances.</h2><p>Track your spending and build better habits.</p></div><div className="banner-symbol">₹</div></section>

      {error && <p role="alert" className="error-message">{error} <button onClick={loadExpenses}>Retry</button></p>}
      <section className="stats-grid">
        <article className="stat-card"><div className="stat-top"><span>Total Spent This Month</span><div className="stat-icon purple">↗</div></div><h2>{money(total)}</h2><p className="muted">Your recorded monthly expenses</p></article>
        <article className="stat-card"><div className="stat-top"><span>Monthly Budget</span><div className="stat-icon blue">▤</div></div><h2>{money(budget)}</h2><p className="muted">Sample monthly budget</p></article>
        <article className="stat-card"><div className="stat-top"><span>Budget Remaining</span><div className="stat-icon green">✓</div></div><h2 className={budget-total < 0 ? "negative" : ""}>{money(budget-total)}</h2><p className="muted">Available this month</p></article>
        <article className="stat-card"><div className="stat-top"><span>Recorded Expenses</span><div className="stat-icon orange">≡</div></div><h2>{monthExpenses.length}</h2><p className="muted">Transactions this month</p></article>
      </section>

      <section className="panel expense-panel" id="expenses">
        <div className="panel-heading expense-heading"><div><h3>All Expenses</h3><p>Add, search, edit, and delete your records</p></div><button className="secondary-button" onClick={exportCSV}>↓ Export CSV</button></div>
        <div className="table-controls"><input className="search-input" type="search" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} /><select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}><option>All</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
        {loading ? <p className="empty-state">Loading expenses...</p> : <div className="table-wrapper"><table><thead><tr><th>EXPENSE</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th>ACTIONS</th></tr></thead><tbody>
          {filtered.map(e => <tr key={e._id}><td><strong>{e.title}</strong></td><td><span className="category-pill">{e.category}</span></td><td>{new Date(`${String(e.date).slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN")}</td><td className="amount-cell">{money(e.amount)}</td><td><div className="action-buttons"><button className="edit-action" onClick={() => openEdit(e)}>Edit</button><button className="delete-action" onClick={() => deleteExpense(e._id)}>Delete</button></div></td></tr>)}
          {filtered.length === 0 && <tr><td colSpan="5" className="empty-table">No expenses found. Add an expense to get started.</td></tr>}
        </tbody></table></div>}
      </section>
      <footer className="footer"><span>© {now.getFullYear()} PennyWise</span><span>Personal Expense Tracker · MFEF Project</span></footer>
    </main>

    {showForm && <div className="modal-overlay" onClick={() => setShowForm(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><h2>{editingId ? "Edit Expense" : "Add New Expense"}</h2><p>Enter your transaction details below.</p></div><button className="close-button" onClick={() => setShowForm(false)} aria-label="Close form">×</button></div>
      <form onSubmit={handleSubmit} className="expense-form"><label>Expense Name<input type="text" placeholder="e.g. Groceries" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength="100" required /></label><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Amount (₹)<input type="number" min="0.01" step="0.01" placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></label><label>Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></label><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button">{editingId ? "Save Changes" : "Add Expense"}</button></div></form>
    </div></div>}
  </div>;
}

export default App;