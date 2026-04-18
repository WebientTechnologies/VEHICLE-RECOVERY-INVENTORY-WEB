"use client";
import { useState } from 'react';
import { User, Lock, Loader2 } from 'lucide-react';
import { loginAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginAPI(username, password);
      
      // Based on API response format:
      if (data.success) {
        // Construct user object combining staf/yardStaff info + role
        const userData = {
          ...(data.yardStaff || data.staf || {}),
          role: data.role,
        };
        
        login(userData);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
      
      <form onSubmit={handleLogin} className={`glass-panel ${styles.loginCard}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Vinayak Associates</h1>
          <p className={styles.subtitle}>Inventory Management Portal</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.label}>Username</label>
          <div className={styles.inputWrapper}>
            <User className={styles.inputIcon} />
            <input
              type="text"
              className={styles.input}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} />
            <input
              type="password"
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 className="animate-spin" size={20} />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}
