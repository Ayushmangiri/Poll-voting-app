import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, PlusCircle, Edit2, Trash2, LogOut, Lock, User, CheckCircle, Clock, TrendingUp, AlertCircle, Save, X, Eye } from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// API Service
const api = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  signup: async (email, password, name) => {
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
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  getPolls: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/polls`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch polls');
    return response.json();
  },

  createPoll: async (pollData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pollData)
    });
    if (!response.ok) throw new Error('Failed to create poll');
    return response.json();
  },

  updatePoll: async (pollId, pollData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pollData)
    });
    if (!response.ok) throw new Error('Failed to update poll');
    return response.json();
  },

  closePoll: async (pollId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}/close`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to close poll');
    return response.json();
  },

  vote: async (pollId, optionId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ optionId })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to vote');
    }
    return response.json();
  },

  deletePoll: async (pollId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete poll');
  }
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [polls, setPolls] = useState([]);
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingPoll, setEditingPoll] = useState(null);
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [detectedRole, setDetectedRole] = useState('USER');
  
  // Poll creation/edit states
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('24');

  // Detect role when email changes
  useEffect(() => {
    if (email.toLowerCase().includes('admin')) {
      setDetectedRole('ADMIN');
    } else {
      setDetectedRole('USER');
    }
  }, [email]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
      setView('polls');
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadPolls();
      const interval = setInterval(loadPolls, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadPolls = async () => {
    try {
      const data = await api.getPolls();
      setPolls(data);
    } catch (error) {
      console.error('Failed to load polls:', error);
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
      setError('Invalid email or password');
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
      setError(error.message || 'Email already exists');
    } finally {
      setLoading(false);
    }
  };

  // 
 const handleVote = async (pollId, optionId) => {
  console.log('Voting on poll:', pollId, 'option:', optionId);
  
  try {
    setLoading(true);
    setError('');
    
    const response = await api.vote(pollId, optionId);
    console.log('Vote response:', response);
    
    await loadPolls();
    alert(' Vote submitted successfully!');
    
  } catch (error) {
    console.error('Vote error:', error);
    const errorMessage = error.message || 'Failed to vote';
    setError(errorMessage);
    alert(' ' + errorMessage);
  } finally {
    setLoading(false);
  }
};

  const handleCreatePoll = async () => {
    const trimmedOptions = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim()) {
      setError('Please enter a question');
      return;
    }
    if (trimmedOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }
    
    const closesAt = new Date();
    closesAt.setHours(closesAt.getHours() + parseInt(pollDuration));
    
    try {
      setLoading(true);
      setError('');
      await api.createPoll({
        question: pollQuestion,
        options: trimmedOptions,
        closesAt: closesAt.toISOString()
      });
      await loadPolls();
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollDuration('24');
      setView('polls');
      alert(' Poll created successfully!');
    } catch (error) {
      setError('Failed to create poll');
      alert('Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPoll = (poll) => {
    setEditingPoll(poll);
    setPollQuestion(poll.question);
    setPollOptions(poll.options.map(o => o.text));
    setView('edit');
  };

  const handleUpdatePoll = async () => {
    const trimmedOptions = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || trimmedOptions.length < 2) {
      setError('Please provide valid question and at least 2 options');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await api.updatePoll(editingPoll.id, {
        question: pollQuestion,
        options: trimmedOptions
      });
      await loadPolls();
      setPollQuestion('');
      setPollOptions(['', '']);
      setEditingPoll(null);
      setView('polls');
      alert(' Poll updated successfully!');
    } catch (error) {
      setError('Failed to update poll');
      alert('Failed to update poll');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePoll = async (pollId) => {
    if (!window.confirm('Close this poll now? No more votes will be accepted.')) return;
    try {
      setLoading(true);
      await api.closePoll(pollId);
      await loadPolls();
      alert(' Poll closed successfully!');
    } catch (error) {
      alert(' Failed to close poll');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Delete this poll permanently?')) return;
    try {
      setLoading(true);
      await api.deletePoll(pollId);
      await loadPolls();
      alert(' Poll deleted successfully!');
    } catch (error) {
      alert(' Failed to delete poll');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => setPollOptions([...pollOptions, '']);
  const updateOption = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };
  const removeOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const getChartData = (options) => {
    return options.map(opt => ({
      name: opt.text.length > 20 ? opt.text.substring(0, 20) + '...' : opt.text,
      votes: opt.votes || 0
    }));
  };

  // AUTH VIEW
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
              onClick={() => { setView('login'); setError(''); }}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                view === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setView('signup'); setError(''); }}
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
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
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
                />
                {email && (
                  <div className={`mt-2 p-2 rounded-lg text-sm ${
                    detectedRole === 'ADMIN' 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <strong>Registering as: {detectedRole}</strong>
                    {detectedRole === 'ADMIN' 
                      ? ' - Can create, edit, delete polls' 
                      : ' - Can vote on polls'
                    }
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                 Include "admin" in email for admin access (e.g., admin@example.com)
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
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN APP VIEW
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
              onClick={() => {
                localStorage.clear();
                setCurrentUser(null);
                setView('login');
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView('polls')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              view === 'polls' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            All Polls
          </button>
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => {
                setView('create');
                setPollQuestion('');
                setPollOptions(['', '']);
                setPollDuration('24');
                setEditingPoll(null);
              }}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                view === 'create' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <PlusCircle size={18} />
              Create Poll
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {view === 'polls' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {polls.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <AlertCircle className="mx-auto text-gray-400" size={48} />
                <p className="text-gray-500 text-lg mt-4">No polls available</p>
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={() => setView('create')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first poll →
                  </button>
                )}
              </div>
            ) : (
              polls.map((poll) => (
                <div key={poll.id} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{poll.question}</h3>
                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        {poll.status === 'OPEN' ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Clock size={14} /> Open
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 font-medium">
                            <CheckCircle size={14} /> Closed
                          </span>
                        )}
                        <span className="text-gray-500">
                          Closes: {new Date(poll.closesAt).toLocaleDateString()}
                        </span>
                        <span className="text-gray-400 font-semibold">
                          {poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0)} votes
                        </span>
                      </div>
                    </div>
                    {currentUser.role === 'ADMIN' && (
                      <div className="flex gap-2">
                        {poll.status === 'OPEN' && (
                          <>
                            <button
                              onClick={() => handleEditPoll(poll)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit Poll"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleClosePoll(poll.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                              title="Close Poll"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeletePoll(poll.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Poll"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {poll.status === 'OPEN' && !poll.hasVoted && currentUser.role !== 'ADMIN' ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600 mb-3">Cast your vote:</p>
                      {poll.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleVote(poll.id, option.id)}
                          disabled={loading}
                          className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium text-gray-700 disabled:opacity-50"
                        >
                          {option.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                          <TrendingUp size={16} />
                          {currentUser.role === 'ADMIN' ? 'Live Results' : 'Results'}
                        </div>
                        {currentUser.role === 'ADMIN' && poll.status === 'OPEN' && (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            <Eye size={12} /> Admin View
                          </span>
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={getChartData(poll.options)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="votes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {poll.options.map((option) => {
                          const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
                          const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
                          const isUserVote = poll.userVote === option.id;
                          return (
                            <div key={option.id} className={`p-3 rounded-lg ${isUserVote ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-700 flex items-center gap-2">
                                  {option.text}
                                  {isUserVote && <CheckCircle size={16} className="text-blue-600" />}
                                </span>
                                <span className="text-sm font-bold text-gray-600">
                                  {option.votes || 0} votes ({percentage}%)
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
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingPoll ? 'Edit Poll' : 'Create New Poll'}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Question *
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="What is your question?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options * (minimum 2)
                  </label>
                  <div className="space-y-3">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addOption}
                    className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <PlusCircle size={18} /> Add Option
                  </button>
                </div>
                {!editingPoll && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (hours) *
                    </label>
                    <input
                      type="number"
                      value={pollDuration}
                      onChange={(e) => setPollDuration(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={editingPoll ? handleUpdatePoll : handleCreatePoll}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingPoll ? ' Update Poll' : ' Create Poll'}
                  </button>
                  <button
                    onClick={() => {
                      setView('polls');
                      setPollQuestion('');
                      setPollOptions(['', '']);
                      setEditingPoll(null);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
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