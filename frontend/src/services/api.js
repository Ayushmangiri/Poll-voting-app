import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, PlusCircle, Edit2, Trash2, LogOut, Lock, User, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// API Service with proper error handling
const api = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  signup: async (email, password, name) => {
    try {
      // Determine role based on email
      const role = email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
      
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Signup failed');
      }
      
      const data = await response.json();
      
      // Override role if backend doesn't set it based on email
      if (email.toLowerCase().includes('admin') && data.user.role !== 'ADMIN') {
        data.user.role = 'ADMIN';
      }
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  getPolls: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/polls`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }
      
      return response.json();
    } catch (error) {
      console.error('Get polls error:', error);
      throw error;
    }
  },

  createPoll: async (pollData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pollData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create poll. Admin access required.');
      }
      
      return response.json();
    } catch (error) {
      console.error('Create poll error:', error);
      throw error;
    }
  },
vote: async (pollId, optionId) => {
  console.log('API vote called:', pollId, optionId);
  
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
  
  const response = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ optionId: optionId })
  });
  
  console.log('Response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error data:', errorData);
    throw new Error(errorData.error || 'Failed to vote');
  }
  
  return response.json();
}


  deletePoll: async (pollId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/polls/${pollId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete poll');
      }
    } catch (error) {
      console.error('Delete poll error:', error);
      throw error;
    }
  }
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [polls, setPolls] = useState([]);
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Poll creation states
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('24');

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setView('polls');
    }
  }, []);

  // Load polls when user is logged in
  useEffect(() => {
    if (currentUser) {
      loadPolls();
    }
  }, [currentUser]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const data = await api.getPolls();
      setPolls(data);
      setError('');
    } catch (error) {
      setError('Failed to load polls. Please refresh the page.');
      console.error('Failed to load polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const result = await api.login(email, password);
      setCurrentUser(result.user);
      setView('polls');
      setEmail('');
      setPassword('');
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const result = await api.signup(email, password, name);
      setCurrentUser(result.user);
      setView('polls');
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      setError('Signup failed. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      setLoading(true);
      await api.vote(pollId, optionId);
      await loadPolls();
      setError('');
      alert('Vote submitted successfully!');
    } catch (error) {
      setError('Failed to submit vote. You may have already voted.');
      alert('Failed to submit vote. You may have already voted.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async () => {
    const trimmedOptions = newPollOptions.filter(o => o.trim());
    
    if (!newPollQuestion.trim()) {
      setError('Please provide a question');
      return;
    }
    
    if (trimmedOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }
    
    const closesAt = new Date();
    closesAt.setHours(closesAt.getHours() + parseInt(pollDuration));
    
    const pollData = {
      question: newPollQuestion,
      options: trimmedOptions,
      closesAt: closesAt.toISOString()
    };
    
    try {
      setLoading(true);
      setError('');
      await api.createPoll(pollData);
      await loadPolls();
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
      setPollDuration('24');
      setView('polls');
      alert('Poll created successfully!');
    } catch (error) {
      setError('Failed to create poll. Admin access required.');
      alert('Failed to create poll. Admin access required.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await api.deletePoll(pollId);
      await loadPolls();
      alert('Poll deleted successfully!');
    } catch (error) {
      setError('Failed to delete poll.');
      alert('Failed to delete poll.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setView('login');
    setPolls([]);
    setError('');
  };

  const addOption = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const updateOption = (index, value) => {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  };

  const removeOption = (index) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
    }
  };

  const getChartData = (options) => {
    return options.map(opt => ({
      name: opt.text.length > 15 ? opt.text.substring(0, 15) + '...' : opt.text,
      votes: opt.votes
    }));
  };

  // Login/Signup View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <Users className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Poll & Vote</h1>
            <p className="text-gray-600">Create and participate in polls</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setView('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                view === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setView('signup');
                setError('');
              }}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                view === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {view === 'login' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                💡 Tip: Use any email to login/signup
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Include "admin" in email for admin access (e.g., admin@example.com)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main App View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Poll & Vote</h1>
              <p className="text-xs text-gray-500">Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              currentUser.role === 'ADMIN' 
                ? 'bg-gradient-to-r from-purple-50 to-pink-50' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50'
            }`}>
              {currentUser.role === 'ADMIN' ? (
                <Lock className="text-purple-600" size={16} />
              ) : (
                <User className="text-blue-600" size={16} />
              )}
              <span className={`text-sm font-medium ${
                currentUser.role === 'ADMIN' ? 'text-purple-700' : 'text-blue-700'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView('polls')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              view === 'polls'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            All Polls
          </button>
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setView('create')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                view === 'create'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <PlusCircle size={18} />
              Create Poll
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading && view === 'polls' && polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading polls...</p>
          </div>
        ) : view === 'polls' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {polls.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <AlertCircle className="text-gray-400" size={40} />
                </div>
                <p className="text-gray-500 text-lg mb-2">No polls available yet.</p>
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={() => setView('create')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
                  >
                    <PlusCircle size={18} />
                    Create your first poll
                  </button>
                )}
              </div>
            ) : (
              polls.map((poll) => (
                <div key={poll.id} className="bg-white rounded-2xl shadow-lg p-6 space-y-4 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{poll.question}</h3>
                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        {poll.status === 'OPEN' ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Clock size={14} />
                            Open
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 font-medium">
                            <CheckCircle size={14} />
                            Closed
                          </span>
                        )}
                        <span className="text-gray-500">
                          Closes: {new Date(poll.closesAt).toLocaleString()}
                        </span>
                        <span className="text-gray-400">
                          Total votes: {poll.options.reduce((sum, opt) => sum + opt.votes, 0)}
                        </span>
                      </div>
                    </div>
                    {currentUser.role === 'ADMIN' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDeletePoll(poll.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Poll"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {poll.status === 'OPEN' && !poll.hasVoted ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600 mb-3">Select your choice:</p>
                      {poll.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleVote(poll.id, option.id)}
                          disabled={loading}
                          className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {option.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                        <TrendingUp size={16} />
                        Results {poll.hasVoted && '(You voted)'}
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getChartData(poll.options)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="votes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {poll.options.map((option) => {
                          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                          const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
                          const isUserVote = poll.userVote === option.id;
                          
                          return (
                            <div key={option.id} className={`p-3 rounded-lg ${isUserVote ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'}`}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-gray-700 flex items-center gap-2">
                                  {option.text}
                                  {isUserVote && <CheckCircle size={16} className="text-blue-600" />}
                                </span>
                                <span className="text-sm font-bold text-gray-600">
                                  {option.votes} votes ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${isUserVote ? 'bg-blue-500' : 'bg-gray-400'}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Poll</h2>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Question <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPollQuestion}
                    onChange={(e) => setNewPollQuestion(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What is your question?"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options <span className="text-red-500">*</span> (minimum 2)
                  </label>
                  <div className="space-y-3">
                    {newPollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Option ${index + 1}`}
                          disabled={loading}
                        />
                        {newPollOptions.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            disabled={loading}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addOption}
                    disabled={loading}
                    className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    <PlusCircle size={18} />
                    Add Option
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Duration (hours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={pollDuration}
                    onChange={(e) => setPollDuration(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="720"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Poll will automatically close after this duration</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreatePoll}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Poll'}
                  </button>
                  <button
                    onClick={() => {
                      setView('polls');
                      setNewPollQuestion('');
                      setNewPollOptions(['', '']);
                      setPollDuration('24');
                      setError('');
                    }}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;