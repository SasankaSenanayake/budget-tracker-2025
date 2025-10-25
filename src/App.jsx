import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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

const Target = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const CheckCircle = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
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
  const [currentView, setCurrentView] = useState('actual');
  const [monthlyData, setMonthlyData] = useState({});

  // Track manual changes and prevent save loop
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isFromFirestore = useRef(false);

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

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      isFromFirestore.current = true; // Mark update as coming from Firestore

      if (docSnap.exists()) {
        console.log('Data loaded from Firestore');
        const loadedData = docSnap.data().monthlyData || {};
        // Ensure data structure has expected and actual
        Object.keys(loadedData).forEach(month => {
          if (!loadedData[month].expected) {
            loadedData[month] = {
              expected: { income: [], expenses: [] },
              actual: loadedData[month]
            };
          }
        });
        setMonthlyData(loadedData);
      } else {
        console.log('No existing data found, initializing empty budget');
        const emptyData = {
          'August': {
            expected: { income: [], expenses: [] },
            actual: { income: [], expenses: [] }
          }
        };
        setMonthlyData(emptyData);
      }
    }, (error) => {
      console.error('Error loading data from Firestore:', error);
      setError('Failed to load data. Please try refreshing.');
    });

    return unsubscribe;
  }, [user]);

  // Save to Firestore (only when there are manual changes)
  const saveToFirestore = async (data) => {
    if (!user || !hasUnsavedChanges) return;

    try {
      await setDoc(doc(db, 'budgets', user.uid), {
        monthlyData: data,
        lastUpdated: new Date().toISOString()
      });
      console.log('Data saved to Firestore successfully');
      setSaveStatus('Saved ✓');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus(''), 1500);
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      setSaveStatus('Error saving!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Auto-save when data changes (with debouncing) - only if changes are manual
  useEffect(() => {
    if (user && monthlyData && Object.keys(monthlyData).length > 0 && !isFromFirestore.current) {
      const timeoutId = setTimeout(() => {
        saveToFirestore(monthlyData);
      }, 2000); // Save 2 seconds after last change

      return () => clearTimeout(timeoutId);
    }
    isFromFirestore.current = false; // Reset flag after processing
  }, [monthlyData, user, hasUnsavedChanges]);

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
      setHasUnsavedChanges(false);
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
  const getMonthData = (month, view) => {
    if (!monthlyData[month]) {
      return { income: [], expenses: [] };
    }
    if (!monthlyData[month].expected) {
      return monthlyData[month];
    }
    return monthlyData[month][view] || { income: [], expenses: [] };
  };

  const updateMonthData = (month, view, type, data) => {
    setMonthlyData(prev => {
      const monthData = prev[month] || { expected: { income: [], expenses: [] }, actual: { income: [], expenses: [] } };
      return {
        ...prev,
        [month]: {
          ...monthData,
          [view]: {
            ...monthData[view],
            [type]: data
          }
        }
      };
    });
  };

  const currentData = getMonthData(currentMonth, currentView);
  const income = currentData.income || [];
  const expenses = currentData.expenses || [];

  const addIncome = () => {
    const newIncome = [...income, { id: Date.now(), name: '', amount: 0 }];
    updateMonthData(currentMonth, currentView, 'income', newIncome);
    setHasUnsavedChanges(true);
  };

  const addExpense = () => {
    const newExpenses = [...expenses, { id: Date.now(), name: '', amount: 0 }];
    updateMonthData(currentMonth, currentView, 'expenses', newExpenses);
    setHasUnsavedChanges(true);
  };

  const updateIncome = (id, field, value) => {
    const updated = income.map(item =>
      item.id === id ? { ...item, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : item
    );
    updateMonthData(currentMonth, currentView, 'income', updated);
    setHasUnsavedChanges(true);
  };

  const updateExpense = (id, field, value) => {
    const updated = expenses.map(item =>
      item.id === id ? { ...item, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : item
    );
    updateMonthData(currentMonth, currentView, 'expenses', updated);
    setHasUnsavedChanges(true);
  };

  const deleteIncome = (id) => {
    updateMonthData(currentMonth, currentView, 'income', income.filter(item => item.id !== id));
    setHasUnsavedChanges(true);
  };

  const deleteExpense = (id) => {
    updateMonthData(currentMonth, currentView, 'expenses', expenses.filter(item => item.id !== id));
    setHasUnsavedChanges(true);
  };

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpenses;

  const getComparison = () => {
    const expectedData = getMonthData(currentMonth, 'expected');
    const actualData = getMonthData(currentMonth, 'actual');

    const expectedIncome = expectedData.income.reduce((sum, item) => sum + item.amount, 0);
    const expectedExpenses = expectedData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const actualIncome = actualData.income.reduce((sum, item) => sum + item.amount, 0);
    const actualExpenses = actualData.expenses.reduce((sum, item) => sum + item.amount, 0);

    return {
      expectedIncome,
      expectedExpenses,
      expectedBalance: expectedIncome - expectedExpenses,
      actualIncome,
      actualExpenses,
      actualBalance: actualIncome - actualExpenses,
      incomeDiff: actualIncome - expectedIncome,
      expensesDiff: actualExpenses - expectedExpenses,
      balanceDiff: (actualIncome - actualExpenses) - (expectedIncome - expectedExpenses)
    };
  };

  const getAllMonthsStats = (view) => {
    const stats = [];
    months.forEach(month => {
      const data = getMonthData(month, view);
      if (data.income.length > 0 || data.expenses.length > 0) {
        const inc = data.income.reduce((sum, item) => sum + item.amount, 0);
        const exp = data.expenses.reduce((sum, item) => sum + item.amount, 0);
        stats.push({ month, income: inc, expenses: exp, balance: inc - exp });
      }
    });
    return stats;
  };

  const copyFromExpected = () => {
    const expectedData = getMonthData(currentMonth, 'expected');
    if (expectedData.income.length > 0 || expectedData.expenses.length > 0) {
      const copiedIncome = expectedData.income.map(item => ({ ...item, id: Date.now() + Math.random() }));
      const copiedExpenses = expectedData.expenses.map(item => ({ ...item, id: Date.now() + Math.random() }));
      updateMonthData(currentMonth, 'actual', 'income', copiedIncome);
      updateMonthData(currentMonth, 'actual', 'expenses', copiedExpenses);
      setHasUnsavedChanges(true);
    }
  };

  const copyPreviousMonth = () => {
    const currentIndex = months.indexOf(currentMonth);
    if (currentIndex > 0) {
      const previousMonth = months[currentIndex - 1];
      const previousData = getMonthData(previousMonth, currentView);
      if (previousData.income.length > 0 || previousData.expenses.length > 0) {
        const copiedIncome = previousData.income.map(item => ({ ...item, id: Date.now() + Math.random() }));
        const copiedExpenses = previousData.expenses.map(item => ({ ...item, id: Date.now() + Math.random() }));
        updateMonthData(currentMonth, currentView, 'income', copiedIncome);
        updateMonthData(currentMonth, currentView, 'expenses', copiedExpenses);
        setHasUnsavedChanges(true);
      }
    }
  };

  const getMonthStatus = (month) => {
    const actualData = getMonthData(month, 'actual');
    if (!actualData.income.length && !actualData.expenses.length) return null;
    const inc = actualData.income.reduce((sum, item) => sum + item.amount, 0);
    const exp = actualData.expenses.reduce((sum, item) => sum + item.amount, 0);
    return inc - exp;
  };

  const getExpenseBreakdown = () => {
    return expenses
      .filter(e => e.amount > 0)
      .map(e => ({ name: e.name, value: e.amount }))
      .sort((a, b) => b.value - a.value);
  };

  const getTrendData = () => {
    const expectedStats = getAllMonthsStats('expected');
    const actualStats = getAllMonthsStats('actual');

    const allMonths = [...new Set([...expectedStats.map(s => s.month), ...actualStats.map(s => s.month)])];

    return allMonths.map(month => {
      const expected = expectedStats.find(s => s.month === month);
      const actual = actualStats.find(s => s.month === month);

      return {
        month: month.slice(0, 3),
        'Expected Income': expected?.income || 0,
        'Expected Expenses': expected?.expenses || 0,
        'Actual Income': actual?.income || 0,
        'Actual Expenses': actual?.expenses || 0
      };
    });
  };

  const getTopExpenses = () => {
    return expenses
      .filter(e => e.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(e => ({ name: e.name, amount: e.amount }));
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const avgMonthlyIncome = getAllMonthsStats(currentView).length > 0
    ? getAllMonthsStats(currentView).reduce((sum, s) => sum + s.income, 0) / getAllMonthsStats(currentView).length
    : 0;

  const avgMonthlyExpenses = getAllMonthsStats(currentView).length > 0
    ? getAllMonthsStats(currentView).reduce((sum, s) => sum + s.expenses, 0) / getAllMonthsStats(currentView).length
    : 0;

  const comparison = getComparison();

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
        </div>

        {/* Expected vs Actual Tabs */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-4 mb-6 border border-slate-700">
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('expected')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${currentView === 'expected'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              <Target size={20} />
              Expected Budget
            </button>
            <button
              onClick={() => setCurrentView('actual')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${currentView === 'actual'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              <CheckCircle size={20} />
              Actual Spending
            </button>
          </div>

          {/* Quick actions */}
          <div className="mt-3 flex gap-2">
            {months.indexOf(currentMonth) > 0 && (
              <button
                onClick={copyPreviousMonth}
                className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition"
              >
                Copy from {months[months.indexOf(currentMonth) - 1]}
              </button>
            )}
            {currentView === 'actual' && (
              <button
                onClick={copyFromExpected}
                className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition"
              >
                Copy from Expected
              </button>
            )}
          </div>
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
            <h2 className="text-3xl font-bold text-white">{currentMonth} Summary - {currentView === 'expected' ? 'Expected' : 'Actual'}</h2>
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

        {/* Expected vs Actual Comparison */}
        {comparison.expectedIncome > 0 || comparison.actualIncome > 0 ? (
          <div className="bg-slate-800 rounded-xl shadow-2xl p-8 mb-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Expected vs Actual Comparison</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-700 rounded-lg p-6">
                <p className="text-slate-400 text-center mb-2">Income</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-400">Expected:</span>
                  <span className="text-amber-400 font-bold">£{comparison.expectedIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Actual:</span>
                  <span className="text-emerald-400 font-bold">£{comparison.actualIncome.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Difference:</span>
                    <span className={`font-bold ${comparison.incomeDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {comparison.incomeDiff >= 0 ? '+' : ''}£{comparison.incomeDiff.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-6">
                <p className="text-slate-400 text-center mb-2">Expenses</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-400">Expected:</span>
                  <span className="text-amber-400 font-bold">£{comparison.expectedExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Actual:</span>
                  <span className="text-rose-400 font-bold">£{comparison.actualExpenses.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Difference:</span>
                    <span className={`font-bold ${comparison.expensesDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {comparison.expensesDiff >= 0 ? '+' : ''}£{comparison.expensesDiff.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-6">
                <p className="text-slate-400 text-center mb-2">Balance</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-400">Expected:</span>
                  <span className={`font-bold ${comparison.expectedBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                    £{comparison.expectedBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Actual:</span>
                  <span className={`font-bold ${comparison.actualBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    £{comparison.actualBalance.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Difference:</span>
                    <span className={`font-bold ${comparison.balanceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {comparison.balanceDiff >= 0 ? '+' : ''}£{comparison.balanceDiff.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Analytics Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
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

        {getTrendData().length > 1 && (
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 mb-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={24} className="text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Expected vs Actual Trend</h2>
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
                <Line type="monotone" dataKey="Expected Income" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="Actual Income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Expected Expenses" stroke="#fca5a5" strokeWidth={2} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="Actual Expenses" stroke="#f43f5e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {getAllMonthsStats(currentView).length > 1 && (
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Year Overview - {currentView === 'expected' ? 'Expected' : 'Actual'}</h2>
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
                  {getAllMonthsStats(currentView).map(stat => (
                    <tr key={stat.month} className="border-b border-slate-700/50">
                      <td className="py-3 text-white font-medium">{stat.month}</td>
                      <td className="py-3 text-emerald-400 text-right">£{stat.income.toFixed(2)}</td>
                      <td className="py-3 text-rose-400 text-right">£{stat.expenses.toFixed(2)}</td>
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