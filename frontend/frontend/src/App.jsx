import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import { FaTrash, FaStar, FaCheckCircle, FaRegCircle, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Confetti from 'react-confetti';

const API = 'https://to-do-app-5-7owd.onrender.com/api';

const priorityColors = {
  Low: '#4ade80',
  Medium: '#fbbf24',
  High: '#f87171'
};

const priorityWeights = {
  Low: 1,
  Medium: 2,
  High: 3
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [search, setSearch] = useState('');
  const [user_name, setUserName] = useState('');
  const [user_pass, setUserPass] = useState('');
  const [user_email, setUserEmail] = useState('');
  const [confirm_pass, setConfirmPass] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [totalStars, setTotalStars] = useState(0);
  const [level, setLevel] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Track window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/todos`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setTodos(res.data);
          calculateStarsAndLevel(res.data);
        })
        .catch(() => setTodos([]));
    }
  }, [token]);

  const calculateStarsAndLevel = (todos) => {
    const stars = todos.reduce((sum, t) => sum + (t.completed ? (t.reward || priorityWeights[t.priority] || 1) : 0), 0);
    setTotalStars(stars);
    setLevel(Math.floor(stars / 10) + 1);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (isLogin) {
      try {
        const res = await axios.post(`${API}/login`, { user_name, user_pass });
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
      } catch (err) {
        setErrorMsg(err.response?.data?.error || 'Login failed');
      }
    } else {
      if (user_pass !== confirm_pass) {
        setErrorMsg('Passwords do not match!');
        return;
      }
      try {
        await axios.post(`${API}/register`, { user_name, user_pass, user_email });
        alert('Registration successful! Please login.');
        setIsLogin(true);
        setUserPass('');
        setConfirmPass('');
        setUserEmail('');
        setUserName('');
      } catch (err) {
        setErrorMsg(err.response?.data?.error || 'Registration failed');
      }
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await axios.post(`${API}/todos`, { text, description, priority }, { headers: { Authorization: `Bearer ${token}` } });
      setText('');
      setDescription('');
      setPriority('Medium');
      const res = await axios.get(`${API}/todos`, { headers: { Authorization: `Bearer ${token}` } });
      setTodos(res.data);
      calculateStarsAndLevel(res.data);
    } catch (err) {
      setErrorMsg('Failed to add todo');
    }
  };

  const toggleTodo = async (id) => {
    try {
      await axios.put(`${API}/todos/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API}/todos`, { headers: { Authorization: `Bearer ${token}` } });
      setTodos(res.data);

      const completedTodo = res.data.find(t => t.todo_id === id && t.completed);
      if (completedTodo) {
        const starsEarned = priorityWeights[completedTodo.priority] || 1;
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      calculateStarsAndLevel(res.data);
    } catch (err) {
      setErrorMsg('Failed to update todo');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API}/todos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API}/todos`, { headers: { Authorization: `Bearer ${token}` } });
      setTodos(res.data);
      calculateStarsAndLevel(res.data);
    } catch (err) {
      setErrorMsg('Failed to delete todo');
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setTodos([]);
    setTotalStars(0);
    setLevel(1);
  };

  const particlesInit = async (main) => {
    await loadFull(main);
  };

  const particlesOptions = {
    background: { color: "transparent" },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: true, mode: "repulse" },
        resize: true
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 100, duration: 0.4 }
      }
    },
    particles: {
      color: { value: "#ffffff" },
      links: { color: "#ffffff", distance: 150, enable: true, opacity: 0.5, width: 1 },
      collisions: { enable: true },
      move: { direction: "none", enable: true, outModes: { default: "bounce" }, random: false, speed: 2, straight: false },
      number: { density: { enable: true, area: 800 }, value: 50 },
      opacity: { value: 0.5 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 5 } }
    },
    detectRetina: true
  };


  const filteredTodos = todos.filter(todo => {
    const matchesSearch = 
      todo.text.toLowerCase().includes(search.toLowerCase()) ||
      (todo.description || '').toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && !todo.completed;
    if (activeTab === 'completed') return matchesSearch && todo.completed;
    return matchesSearch;
  });

  if (!token) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Gradient Background */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: 0
        }} />
        
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={particlesOptions}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
        
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card shadow-lg border-0" 
            style={{ 
              width: 400, 
              background: 'rgba(255,255,255,0.95)', 
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <motion.img 
                  src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" 
                  alt="logo" 
                  style={{ width: 80 }}
                  animate={{ rotate: 360 }}
                  transition={{ 
                    rotate: { 
                      repeat: Infinity, 
                      duration: 20, 
                      ease: "linear" 
                    } 
                  }}
                />
                <h2 className="mt-3" style={{ 
                  fontWeight: 700, 
                  color: "#4a00e0",
                  background: 'linear-gradient(90deg, #4a00e0, #8e2de2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {isLogin ? 'Welcome Back!' : 'Create Account'}
                </h2>
                <p className="text-muted">
                  {isLogin ? 'Login to manage your tasks' : 'Join us to start your productivity journey'}
                </p>
              </div>
              
              <form onSubmit={handleAuth}>
                <div className="mb-3">
                  <input
                    className="form-control form-control-lg"
                    placeholder="Username"
                    value={user_name}
                    onChange={e => setUserName(e.target.value)}
                    required
                    style={{ borderRadius: '50px', padding: '12px 20px' }}
                  />
                </div>
                <div className="mb-3">
                  <input
                    className="form-control form-control-lg"
                    placeholder="Password"
                    type="password"
                    value={user_pass}
                    onChange={e => setUserPass(e.target.value)}
                    required
                    style={{ borderRadius: '50px', padding: '12px 20px' }}
                  />
                </div>
                {!isLogin && (
                  <>
                    <div className="mb-3">
                      <input
                        className="form-control form-control-lg"
                        placeholder="Confirm Password"
                        type="password"
                        value={confirm_pass}
                        onChange={e => setConfirmPass(e.target.value)}
                        required
                        style={{ borderRadius: '50px', padding: '12px 20px' }}
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        className="form-control form-control-lg"
                        placeholder="Email"
                        type="email"
                        value={user_email}
                        onChange={e => setUserEmail(e.target.value)}
                        required
                        style={{ borderRadius: '50px', padding: '12px 20px' }}
                      />
                    </div>
                  </>
                )}
                
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="alert alert-danger"
                  >
                    {errorMsg}
                  </motion.div>
                )}
                
                <motion.button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3 py-3" 
                  style={{ 
                    fontWeight: 600, 
                    letterSpacing: 1,
                    borderRadius: '50px',
                    fontSize: '1.1rem'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLogin ? 'Login' : 'Register'}
                </motion.button>
              </form>
              
              <div className="text-center mt-3">
                <button
                  className="btn btn-link"
                  onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
                  style={{ 
                    color: "#4a00e0", 
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }


  return (
    <div className="container py-4" style={{ maxWidth: '1200px' }}>
      {/* Confetti effect */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}
      
      {}
      <motion.div 
        className="mb-4 p-4 rounded-4 shadow"
        style={{ 
          background: 'linear-gradient(135deg, #6e8efb, #a777e3)',
          color: '#fff',
          border: 'none'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2" style={{ fontWeight: 700 }}>Task Master</h2>
            <p className="mb-0">Complete tasks to earn stars and level up!</p>
          </div>
          
          <div className="text-end">
            <div className="d-flex align-items-center justify-content-end mb-1">
              <span style={{ fontSize: 18, marginRight: 8 }}>Level {level}</span>
              <div className="progress" style={{ width: '100px', height: '10px', backgroundColor: 'rgba(255,255,255,0.3)' }}>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ 
                    width: `${(totalStars % 10) * 10}%`,
                    backgroundColor: '#fff'
                  }}
                />
              </div>
            </div>
            
            <div className="d-flex align-items-center justify-content-end">
              <span style={{ fontSize: 18, marginRight: 8 }}>Stars:</span>
              <span style={{ fontSize: 24, color: "#FFD700" }}>
                {totalStars}
                <FaStar className="ms-1" />
              </span>
            </div>
            
            <motion.button 
              className="btn btn-light btn-sm mt-2" 
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaSignOutAlt className="me-1" /> Logout
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Add Todo Form */}
      <motion.div 
        className="card shadow mb-4 border-0"
        style={{ borderRadius: '16px', overflow: 'hidden' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <form className="row g-3 align-items-end" onSubmit={addTodo}>
            <div className="col-md-4">
              <label className="form-label small text-muted">Task Title</label>
              <input
                className="form-control"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What needs to be done?"
                required
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Description</label>
              <input
                className="form-control"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add details..."
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Priority</label>
              <select 
                className="form-select" 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
                style={{ 
                  borderRadius: '8px', 
                  padding: '12px',
                  borderLeft: `4px solid ${priorityColors[priority]}`
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="col-md-2">
              <motion.button 
                type="submit" 
                className="btn btn-primary w-100 py-3"
                style={{ borderRadius: '8px' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaPlus className="me-1" /> Add Task
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
      
      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-md-8">
          <input
            className="form-control"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            style={{ borderRadius: '8px', padding: '12px' }}
          />
        </div>
        <div className="col-md-4">
          <div className="btn-group w-100">
            <button 
              className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('active')}
            >
              Active
            </button>
            <button 
              className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
          </div>
        </div>
      </div>
      
      {/* Todos List */}
      <div className="row">
        {filteredTodos.length === 0 ? (
          <div className="col-12 text-center py-5">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" 
              alt="No tasks" 
              style={{ width: 120, opacity: 0.5 }} 
            />
            <h5 className="mt-3 text-muted">No tasks found</h5>
            <p className="text-muted">Add a new task or try a different search</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTodos.map(todo => (
              <motion.div 
                key={todo.todo_id}
                className="col-md-6 col-lg-4 mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <div 
                  className={`card h-100 border-0 shadow-sm ${todo.completed ? 'bg-light' : ''}`}
                  style={{ 
                    borderRadius: '12px',
                    borderLeft: `5px solid ${priorityColors[todo.priority]}`,
                    transition: 'all 0.3s ease',
                    transform: todo.completed ? 'scale(0.98)' : 'scale(1)'
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <motion.span
                        style={{
                          fontSize: 24,
                          color: todo.completed ? "#43ea6b" : "#ddd",
                          cursor: "pointer",
                          flexShrink: 0
                        }}
                        onClick={() => toggleTodo(todo.todo_id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        data-tooltip-id="complete-tooltip"
                        data-tooltip-content={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                      >
                        {todo.completed ? <FaCheckCircle /> : <FaRegCircle />}
                      </motion.span>
                      
                      <Tooltip id="complete-tooltip" />
                      
                      <span 
                        className="ms-3 flex-grow-1" 
                        style={{
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          fontWeight: 600,
                          fontSize: 18,
                          color: todo.completed ? "#aaa" : "#222",
                          wordBreak: 'break-word'
                        }}
                      >
                        {todo.text}
                      </span>
                      
                      <div className="d-flex">
                        {Array.from({ length: priorityWeights[todo.priority] || 1 }).map((_, i) => (
                          <FaStar 
                            key={i} 
                            style={{ 
                              color: todo.completed ? "#FFD700" : "#ddd", 
                              fontSize: 16,
                              marginLeft: 2
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                    
                    {todo.description && (
                      <div 
                        className="mb-3 p-2 rounded" 
                        style={{ 
                          fontSize: 15, 
                          color: "#555",
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          borderLeft: '3px solid #dee2e6'
                        }}
                      >
                        {todo.description}
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span 
                          className={`badge me-2`}
                          style={{ 
                            backgroundColor: priorityColors[todo.priority],
                            color: '#fff',
                            padding: '5px 10px',
                            borderRadius: '20px',
                            fontWeight: 500
                          }}
                        >
                          {todo.priority || 'Medium'}
                        </span>
                        
                        <small className="text-muted">
                          {todo.created_at ? new Date(todo.created_at).toLocaleDateString() : ''}
                        </small>
                      </div>
                      
                      <motion.button 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={() => deleteTodo(todo.todo_id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        data-tooltip-id="delete-tooltip"
                        data-tooltip-content="Delete task"
                      >
                        <FaTrash />
                      </motion.button>
                      <Tooltip id="delete-tooltip" />
                    </div>
                    
                    {todo.completed && (
                      <motion.div 
                        className="mt-2 text-end"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <small className="text-success">
                          +{priorityWeights[todo.priority] || 1} star{todo.priority !== 'Low' ? 's' : ''} earned!
                        </small>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      
      {/* Stats Footer */}
      <div className="mt-5 pt-4 text-center text-muted small border-top">
        <p>
          <strong>{todos.filter(t => t.completed).length}</strong> of <strong>{todos.length}</strong> tasks completed
          {' '}({todos.length > 0 ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0}%)
        </p>
        <p>Level {level} • {totalStars} stars collected</p>
      </div>
    </div>
  );
}

export default App;
