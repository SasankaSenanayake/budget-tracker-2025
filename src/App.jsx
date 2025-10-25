import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Inline SVG Icons
const Plus = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Trash2 = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const DollarSign = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const TrendingUp = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const TrendingDown = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

const Calendar = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const PieChartIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
  </svg>
);

const BarChart3 = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"></path>
    <path d="M18 17V9"></path>
    <path d="M13 17V5"></path>
    <path d="M8 17v-3"></path>
  </svg>
);

export default function BudgetTracker() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Budget data state
  const [currentMonth, setCurrentMonth] = useState('August');
  const [monthlyData, setMonthlyData] = useState({});

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser ? currentUser.email : 'No user');
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load user's budget data from Firestore with real-time sync
  useEffect(() => {
    if (!user) return;

    console.log('Setting up Firestore listener for user:', user.uid);
    const docRef = doc(db, 'budgets', user.uid);

    // Real-time listener - data syncs automatically across devices!
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        console.log('Data loaded from Firestore');
        setMonthlyData(docSnap.data().monthlyData || {});
      } else {
        console.log('No existing data found, initializing empty budget');
        // Initialize with empty data for new user
        const emptyData = {
          'August': {
            income: [],
            expenses: []
          }
        };
        setMonthlyData(emptyData);
        saveToFirestore(emptyData);
      }
    }, (error) => {
      console.error('Error loading data from Firestore:', error);
      setError('Failed to load data. Please try refreshing.');
    });

    return unsubscribe;
  }, [user]);

  // Save to Firestore
  const saveToFirestore = async (data) => {
    if (!user) return;

    try {
      await setDoc(doc(db, 'budgets', user.uid), {
        monthlyData: data,
        lastUpdated: new Date().toISOString()
      });
      console.log('Data saved to Firestore successfully');
      setSaveStatus('Saved ✓');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      setSaveStatus('Error saving!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Auto-save when data changes (with debouncing)
  useEffect(() => {
    if (user && monthlyData && Object.keys(monthlyData).length > 0) {
      const timeoutId = setTimeout(() => {
        saveToFirestore(monthlyData);
      }, 1000); // Save 1 second after last change

      return () => clearTimeout(timeoutId);
    }
  }, [monthlyData, user]);

  // Handle login/signup
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Try signing up!');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try signing in instead.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(error.message);
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMonthlyData({});
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700 max-w-md w-full">
          <div className="text-center mb-6">
            <DollarSign size={48} className="text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Monthly Budget Tracker</h1>
            <p className="text-slate-400">{isSignUp ? 'Create your account' : 'Sign in to access your finances'}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-6 text-center text-slate-500 text-xs">
            <p>Your data syncs automatically across all devices</p>
          </div>
        </div>
      </div>
    );
  }

  // Budget tracker functions
  const getMonthData = (month) => {
    if (!monthlyData[month]) {
      return { income: [], expenses: [] };
    }
    return monthlyData[month];
  };

  const updateMonthData = (month, type, data) => {
    setMonthlyData(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [type]: data
      }
    }));
  };

  const currentData = getMonthData(currentMonth);
  const income = currentData.income || [];
  const expenses = currentData.expenses || [];

  const addIncome = () => {
    const newIncome = [...income, { id: Date.now(), name: '', amount: 0 }];
    updateMonthData(currentMonth, 'income', newIncome);
  };

  const addExpense = () => {
    const newExpenses = [...expenses, { id: Date.now(), name: '', amount: 0 }];
    updateMonthData(currentMonth, 'expenses', newExpenses);
  };

  const updateIncome = (id, field, value) => {
    const updated = income.map(item =>
      item.id === id ? { ...item, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : item
    );
    updateMonthData(currentMonth, 'income', updated);
  };

  const updateExpense = (id, field, value) => {
    const updated = expenses.map(item =>
      item.id === id ? { ...item, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : item
    );
    updateMonthData(currentMonth, 'expenses', updated);
  };

  const deleteIncome = (id) => {
    updateMonthData(currentMonth, 'income', income.filter(item => item.id !== id));
  };

  const deleteExpense = (id) => {
    updateMonthData(currentMonth, 'expenses', expenses.filter(item => item.id !== id));
  };

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpenses;

  const getAllMonthsStats = () => {
    const stats = [];
    months.forEach(month => {
      const data = getMonthData(month);
      if (data.income.length > 0 || data.expenses.length > 0) {
        const inc = data.income.reduce((sum, item) => sum + item.amount, 0);
        const exp = data.expenses.reduce((sum, item) => sum + item.amount, 0);
        stats.push({ month, income: inc, expenses: exp, balance: inc - exp });
      }
    });
    return stats;
  };

  const copyPreviousMonth = () => {
    const currentIndex = months.indexOf(currentMonth);
    if (currentIndex > 0) {
      const previousMonth = months[currentIndex - 1];
      const previousData = getMonthData(previousMonth);
      if (previousData.income.length > 0 || previousData.expenses.length > 0) {
        const copiedIncome = previousData.income.map(item => ({ ...item, id: Date.now() + Math.random() }));
        const copiedExpenses = previousData.expenses.map(item => ({ ...item, id: Date.now() + Math.random() }));
        setMonthlyData(prev => ({
          ...prev,
          [currentMonth]: {
            income: copiedIncome,
            expenses: copiedExpenses
          }
        }));
      }
    }
  };

  const getMonthStatus = (month) => {
    const data = getMonthData(month);
    if (!data.income.length && !data.expenses.length) return null;
    const inc = data.income.reduce((sum, item) => sum + item.amount, 0);
    const exp = data.expenses.reduce((sum, item) => sum + item.amount, 0);
    return inc - exp;
  };

  const getExpenseBreakdown = () => {
    return expenses
      .filter(e => e.amount > 0)
      .map(e => ({ name: e.name, value: e.amount }))
      .sort((a, b) => b.value - a.value);
  };

  const getTrendData = () => {
    return getAllMonthsStats().map(stat => ({
      month: stat.month.slice(0, 3),
      Income: stat.income,
      Expenses: stat.expenses,
      Balance: stat.balance
    }));
  };

  const getTopExpenses = () => {
    return expenses
      .filter(e => e.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(e => ({ name: e.name, amount: e.amount }));
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const avgMonthlyIncome = getAllMonthsStats().length > 0
    ? getAllMonthsStats().reduce((sum, s) => sum + s.income, 0) / getAllMonthsStats().length
    : 0;

  const avgMonthlyExpenses = getAllMonthsStats().length > 0
    ? getAllMonthsStats().reduce((sum, s) => sum + s.expenses, 0) / getAllMonthsStats().length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">{user.email}</span>
                {saveStatus && (
                  <span className="text-sm text-emerald-400">{saveStatus}</span>
                )}
              </div>
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Monthly Budget Tracker</h1>
              <p className="text-slate-400">Synced across all your devices ☁️</p>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Month Tabs */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-4 mb-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Select Month</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {months.map(month => {
              const status = getMonthStatus(month);
              return (
                <button
                  key={month}
                  onClick={() => setCurrentMonth(month)}
                  className={`px-3 py-2 rounded-lg font-medium transition relative ${currentMonth === month
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {month.slice(0, 3)}
                  {status !== null && (
                    <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${status >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                      }`} />
                  )}
                </button>
              );
            })}
          </div>
          {months.indexOf(currentMonth) > 0 && (
            <button
              onClick={copyPreviousMonth}
              className="mt-3 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition"
            >
              Copy from {months[months.indexOf(currentMonth) - 1]}
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Income Section */}
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-emerald-400">Income</h2>
              <button
                onClick={addIncome}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus size={20} />
                Add
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {income.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No income entries yet</p>
              ) : (
                income.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateIncome(item.id, 'name', e.target.value)}
                      placeholder="Income source"
                      className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateIncome(item.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-32 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => deleteIncome(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-slate-300">Total Income</span>
                <span className="text-emerald-400">£{totalIncome.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-rose-400">Expenditures</h2>
              <button
                onClick={addExpense}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus size={20} />
                Add
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {expenses.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No expense entries yet</p>
              ) : (
                expenses.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateExpense(item.id, 'name', e.target.value)}
                      placeholder="Expense name"
                      className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-rose-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateExpense(item.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-32 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-rose-500 focus:outline-none"
                    />
                    <button
                      onClick={() => deleteExpense(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-slate-300">Total Expenses</span>
                <span className="text-rose-400">£{totalExpenses.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 mb-6 border border-slate-700">
          <div className="flex items-center justify-center gap-3 mb-6">
            <DollarSign size={32} className="text-blue-400" />
            <h2 className="text-3xl font-bold text-white">{currentMonth} Summary</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp size={20} className="text-emerald-400" />
                <p className="text-slate-400">Total Income</p>
              </div>
              <p className="text-3xl font-bold text-emerald-400">£{totalIncome.toFixed(2)}</p>
              {avgMonthlyIncome > 0 && (
                <p className="text-sm text-slate-500 mt-2">
                  Avg: £{avgMonthlyIncome.toFixed(2)}
                </p>
              )}
            </div>

            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown size={20} className="text-rose-400" />
                <p className="text-slate-400">Total Expenses</p>
              </div>
              <p className="text-3xl font-bold text-rose-400">£{totalExpenses.toFixed(2)}</p>
              {avgMonthlyExpenses > 0 && (
                <p className="text-sm text-slate-500 mt-2">
                  Avg: £{avgMonthlyExpenses.toFixed(2)}
                </p>
              )}
            </div>

            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign size={20} className={balance >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                <p className="text-slate-400">Balance</p>
              </div>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                £{balance.toFixed(2)}
              </p>
              {totalIncome > 0 && (
                <p className="text-sm text-slate-500 mt-2">
                  {((balance / totalIncome) * 100).toFixed(1)}% savings rate
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Expense Breakdown Pie Chart */}
          {getExpenseBreakdown().length > 0 && (
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={24} className="text-rose-400" />
                <h2 className="text-2xl font-bold text-white">Expense Breakdown</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getExpenseBreakdown()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getExpenseBreakdown().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `£${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Expenses Bar Chart */}
          {getTopExpenses().length > 0 && (
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={24} className="text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Top Expenses</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTopExpenses()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value) => `£${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Bar dataKey="amount" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Income vs Expenses Trend */}
        {getTrendData().length > 1 && (
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 mb-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={24} className="text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Income vs Expenses Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  formatter={(value) => `£${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={2} />
                <Line type="monotone" dataKey="Balance" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Year Overview Table */}
        {getAllMonthsStats().length > 1 && (
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Year Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 text-slate-400 font-medium">Month</th>
                    <th className="pb-3 text-slate-400 font-medium text-right">Income</th>
                    <th className="pb-3 text-slate-400 font-medium text-right">Expenses</th>
                    <th className="pb-3 text-slate-400 font-medium text-right">Balance</th>
                    <th className="pb-3 text-slate-400 font-medium text-right">Savings %</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllMonthsStats().map(stat => (
                    <tr key={stat.month} className="border-b border-slate-700/50">
                      <td className="py-3 text-white font-medium">{stat.month}</td>
                      <td className="py-3 text-emerald-400 text-right">${stat.income.toFixed(2)}</td>
                      <td className="py-3 text-rose-400 text-right">${stat.expenses.toFixed(2)}</td>
                      <td className={`py-3 text-right font-bold ${stat.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        £{stat.balance.toFixed(2)}
                      </td>
                      <td className="py-3 text-slate-300 text-right">
                        {stat.income > 0 ? ((stat.balance / stat.income) * 100).toFixed(1) : '0.0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}