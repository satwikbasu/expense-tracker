import React, { useState, useEffect } from 'react';

// Helper to evaluate arithmetic expressions safely
function evaluateExpression(expr: string): number | null {
  try {
    // Only allow numbers and arithmetic operators
    if (!/^[-+*/().\d\s]+$/.test(expr)) return null;
    // eslint-disable-next-line no-eval
    const result = Function(`"use strict";return (${expr})`)();
    if (typeof result === 'number' && !isNaN(result)) return result;
    return null;
  } catch {
    return null;
  }
}

const LOCAL_KEYS = {
  salary: 'et_salary',
  savings: 'et_savings',
  categories: 'et_categories',
  expenses: 'et_expenses',
  dark: 'et_dark',
};

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Expense {
  id: string;
  label: string;
  amount: number;
  categoryId: string;
  date: string;
}

const defaultCategories: Category[] = [
  { id: 'food', name: 'Food', color: 'bg-teal-500 text-white', icon: '🍔' },
  { id: 'transport', name: 'Transport', color: 'bg-indigo-500 text-white', icon: '🚗' },
];

function App() {
  // State
  const [salary, setSalary] = useState<number>(0);
  const [savingsGoal, setSavingsGoal] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseInput, setExpenseInput] = useState('');
  const [expenseLabel, setExpenseLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategories[0].id);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('bg-gray-700 text-white');
  const [newCategoryIcon, setNewCategoryIcon] = useState('💡');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const s = localStorage.getItem(LOCAL_KEYS.salary);
    if (s) setSalary(Number(s));
    const sg = localStorage.getItem(LOCAL_KEYS.savings);
    if (sg) setSavingsGoal(Number(sg));
    const cats = localStorage.getItem(LOCAL_KEYS.categories);
    if (cats) setCategories(JSON.parse(cats));
    const exps = localStorage.getItem(LOCAL_KEYS.expenses);
    if (exps) setExpenses(JSON.parse(exps));
    const dark = localStorage.getItem(LOCAL_KEYS.dark);
    if (dark === '1') setDarkMode(true);
  }, []);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(LOCAL_KEYS.salary, String(salary)); }, [salary]);
  useEffect(() => { localStorage.setItem(LOCAL_KEYS.savings, String(savingsGoal)); }, [savingsGoal]);
  useEffect(() => { localStorage.setItem(LOCAL_KEYS.categories, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(LOCAL_KEYS.expenses, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(LOCAL_KEYS.dark, '1');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(LOCAL_KEYS.dark, '0');
    }
  }, [darkMode]);

  // Calculations
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingFunds = salary - totalExpenses;
  const savingsProgress = salary > 0 && savingsGoal > 0 ? Math.min(100, Math.round(((salary - totalExpenses) / savingsGoal) * 100)) : 0;

  // Handlers
  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    const amount = evaluateExpression(expenseInput);
    if (!expenseLabel.trim() || amount === null || amount <= 0) return;
    setExpenses([
      { id: Date.now().toString(), label: expenseLabel, amount, categoryId: selectedCategory, date: new Date().toISOString() },
      ...expenses,
    ]);
    setExpenseInput('');
    setExpenseLabel('');
    setShowExpenseModal(false);
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const id = newCategoryName.toLowerCase().replace(/\s+/g, '-');
    setCategories([
      ...categories,
      { id, name: newCategoryName, color: newCategoryColor, icon: newCategoryIcon },
    ]);
    setNewCategoryName('');
    setNewCategoryColor('bg-gray-700 text-white');
    setNewCategoryIcon('💡');
    setShowAddCategory(false);
  }

  function handleEditCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory || !newCategoryName.trim()) return;
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id 
        ? { ...cat, name: newCategoryName, color: newCategoryColor, icon: newCategoryIcon }
        : cat
    ));
    setNewCategoryName('');
    setNewCategoryColor('bg-gray-700 text-white');
    setNewCategoryIcon('💡');
    setEditingCategory(null);
    setShowEditCategory(false);
  }

  function handleDeleteCategory(categoryId: string) {
    if (categories.length <= 1) return; // Don't delete the last category
    setCategories(categories.filter(cat => cat.id !== categoryId));
    // Update expenses to use the first available category
    if (selectedCategory === categoryId) {
      const remainingCategories = categories.filter(cat => cat.id !== categoryId);
      if (remainingCategories.length > 0) {
        setSelectedCategory(remainingCategories[0].id);
      }
    }
    setExpenses(expenses.map(exp => 
      exp.categoryId === categoryId 
        ? { ...exp, categoryId: categories.find(cat => cat.id !== categoryId)?.id || defaultCategories[0].id }
        : exp
    ));
  }

  function startEditCategory(category: Category) {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setNewCategoryIcon(category.icon);
    setShowEditCategory(true);
  }

  function getCategoryById(id: string) {
    return categories.find(c => c.id === id) || defaultCategories[0];
  }

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:bg-gray-900 flex flex-col">
      {/* Header Bar */}
      <header className="w-full bg-gradient-to-r from-teal-700 to-indigo-800 shadow text-white py-4 px-6 flex items-center justify-between sticky top-0 z-20">
        <h1 className="text-xl font-bold tracking-tight">Expense Tracker</h1>
        <button
          className="rounded-full p-2 bg-white/10 hover:bg-white/20 transition"
          onClick={() => setDarkMode(dm => !dm)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 6.66l-.71-.71M4.05 4.93l-.71-.71" /></svg>
          )}
        </button>
      </header>
      <main className="flex-1 w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
        {/* Salary & Remaining Funds */}
        <section className="rounded-2xl shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-teal-900/10 dark:border-gray-700/40 p-5 flex flex-col gap-2 relative overflow-hidden">
          <h2 className="font-semibold text-base flex items-center gap-2">Monthly Salary <span className="text-xs text-gray-400">(₹)</span></h2>
          <div className="flex items-center gap-3">
            <input
              type="number"
              className="input input-bordered w-full max-w-xs focus:ring-2 focus:ring-teal-400 bg-white/80 dark:bg-gray-900/60"
              placeholder="Enter your salary"
              value={salary || ''}
              onChange={e => setSalary(Number(e.target.value))}
              min={0}
            />
            <span className="text-teal-600 dark:text-teal-300 font-bold text-lg bg-teal-100/80 dark:bg-teal-900/40 rounded px-3 py-1 transition-all">₹{remainingFunds.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-400">Remaining funds after expenses</div>
        </section>
        {/* Savings Goal */}
        <section className="rounded-2xl shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-indigo-900/10 dark:border-gray-700/40 p-5 flex flex-col gap-2 relative overflow-hidden">
          <h2 className="font-semibold text-base flex items-center gap-2">Savings Goal <span className="text-xs text-gray-400">(₹)</span></h2>
          <input
            type="number"
            className="input input-bordered w-full max-w-xs focus:ring-2 focus:ring-indigo-400 bg-white/80 dark:bg-gray-900/60"
            placeholder="Set your monthly savings goal"
            value={savingsGoal || ''}
            onChange={e => setSavingsGoal(Number(e.target.value))}
            min={0}
          />
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
            <div
              className="bg-gradient-to-r from-teal-400 to-indigo-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, savingsProgress)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400">{savingsGoal > 0 ? `${savingsProgress}% of goal` : 'Set a goal to track savings'}</div>
        </section>
        {/* Categories */}
        <section className="rounded-2xl shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-purple-900/10 dark:border-gray-700/40 p-5 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-base">Categories</h2>
            <button
              className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-700 text-sm hover:bg-purple-200 dark:hover:bg-purple-800/60 transition"
              onClick={() => setShowAddCategory(true)}
              type="button"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map(cat => (
              <div
                key={cat.id}
                className={`flex items-center gap-1 px-3 py-2 rounded-full cursor-pointer border ${cat.color} ${selectedCategory === cat.id ? 'ring-2 ring-purple-400 dark:ring-purple-300' : ''} transition shadow-sm`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="font-medium text-sm">{cat.name}</span>
                {/* Edit/Delete buttons - always visible on mobile */}
                <div className="flex gap-1 ml-2">
                  <button
                    className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs hover:bg-white/30 transition"
                    onClick={(e) => { e.stopPropagation(); startEditCategory(cat); }}
                    title="Edit category"
                  >
                    ✏️
                  </button>
                  {categories.length > 1 && (
                    <button
                      className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-xs hover:bg-red-600/80 transition"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {showAddCategory && (
            <form className="flex flex-col gap-2 mb-2 bg-purple-50 dark:bg-purple-900/40 p-3 rounded-xl border border-purple-200 dark:border-purple-700" onSubmit={handleAddCategory}>
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                placeholder="Category name"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                required
              />
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                placeholder="Icon (emoji)"
                value={newCategoryIcon}
                onChange={e => setNewCategoryIcon(e.target.value)}
                maxLength={2}
              />
              <select
                className="input input-bordered w-full max-w-xs"
                value={newCategoryColor}
                onChange={e => setNewCategoryColor(e.target.value)}
              >
                <option value="bg-teal-500 text-white">Teal</option>
                <option value="bg-indigo-500 text-white">Indigo</option>
                <option value="bg-purple-500 text-white">Purple</option>
                <option value="bg-pink-500 text-white">Pink</option>
                <option value="bg-gray-700 text-white">Gray</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded shadow transition">Add</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddCategory(false)}>Cancel</button>
              </div>
            </form>
          )}
          {showEditCategory && editingCategory && (
            <form className="flex flex-col gap-2 mb-2 bg-purple-50 dark:bg-purple-900/40 p-3 rounded-xl border border-purple-200 dark:border-purple-700" onSubmit={handleEditCategory}>
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                placeholder="Category name"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                required
              />
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                placeholder="Icon (emoji)"
                value={newCategoryIcon}
                onChange={e => setNewCategoryIcon(e.target.value)}
                maxLength={2}
              />
              <select
                className="input input-bordered w-full max-w-xs"
                value={newCategoryColor}
                onChange={e => setNewCategoryColor(e.target.value)}
              >
                <option value="bg-teal-500 text-white">Teal</option>
                <option value="bg-indigo-500 text-white">Indigo</option>
                <option value="bg-purple-500 text-white">Purple</option>
                <option value="bg-pink-500 text-white">Pink</option>
                <option value="bg-gray-700 text-white">Gray</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded shadow transition">Update</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowEditCategory(false); setEditingCategory(null); }}>Cancel</button>
              </div>
            </form>
          )}
        </section>
        {/* Expenses */}
        <section className="rounded-2xl shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-pink-900/10 dark:border-gray-700/40 p-5 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-base">Expenses</h2>
            <button
              className="w-10 h-10 bg-gradient-to-br from-pink-500 to-teal-500 text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all"
              onClick={() => setShowExpenseModal(true)}
              aria-label="Add Expense"
            >
              +
            </button>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.length === 0 && <li className="py-4 text-gray-400 text-center">No expenses yet.</li>}
            {expenses.map(exp => (
              <li key={exp.id} className="py-3 flex justify-between items-center hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded transition">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryById(exp.categoryId).color}`}>{getCategoryById(exp.categoryId).icon}</span>
                  <span className="font-medium">{exp.label}</span>
                  <span className="text-xs text-gray-400 ml-2">({getCategoryById(exp.categoryId).name})</span>
                </div>
                <span className="font-semibold text-pink-600 dark:text-pink-300">₹{exp.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          {/* Modal for Adding Expense */}
          {showExpenseModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <form className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 flex flex-col gap-3 w-full max-w-sm animate-fade-in" onSubmit={handleAddExpense}>
                <h3 className="font-semibold text-lg mb-2">Add Expense</h3>
                <input
                  type="text"
                  className="input input-bordered w-full focus:ring-2 focus:ring-pink-400"
                  placeholder="e.g. 12.5+7.3 (supports math)"
                  value={expenseInput}
                  onChange={e => setExpenseInput(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="input input-bordered w-full focus:ring-2 focus:ring-pink-400"
                  placeholder="Label (e.g. Lunch)"
                  value={expenseLabel}
                  onChange={e => setExpenseLabel(e.target.value)}
                  required
                />
                <select
                  className="input input-bordered w-full max-w-xs"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name} {cat.icon}</option>
                  ))}
                </select>
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="btn btn-primary bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded shadow transition flex-1">Add</button>
                  <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-500 mt-2 border-t pt-2">
            <span>Total:</span>
            <span className="font-semibold text-pink-600 dark:text-pink-300">₹{totalExpenses.toFixed(2)}</span>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="w-full text-center text-xs text-gray-400 py-4 border-t mt-8 bg-white/70 dark:bg-gray-900/80">© {new Date().getFullYear()} Expense Tracker. All rights reserved.</footer>
    </div>
  );
}

export default App;
