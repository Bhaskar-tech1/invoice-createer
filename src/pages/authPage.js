import { supabase } from '../utils/supabase.js';
import { createIcons, Mail, Chrome, Zap } from 'lucide';

export function renderAuthPage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="auth-split-screen">
      <!-- Left side: Graphic / Value Prop -->
      <div class="auth-graphic-side">
        <div class="auth-graphic-content">
          <div class="logo logo-large">
            <i data-lucide="zap" class="logo-icon logo-icon-large"></i>
            <span>InvoiceAI</span>
          </div>
          <h1 class="auth-hero-title">Professional invoicing, elevated.</h1>
          <p class="auth-hero-subtitle">Create, manage, and track stunning invoices in seconds with our dark-themed dashboard.</p>
          
          <!-- Decorative abstract graphic -->
          <div class="abstract-cards">
            <div class="abs-card abs-card-1"></div>
            <div class="abs-card abs-card-2"></div>
            <div class="abs-card abs-card-3"></div>
          </div>
        </div>
      </div>

      <!-- Right side: Authentication Form -->
      <div class="auth-form-side">
        <div class="auth-form-wrapper">
          <h2 id="auth-title" class="auth-form-title">Welcome back</h2>
          <p id="auth-subtitle" class="auth-form-subtitle">Log in to access your dashboard</p>

          <button id="auth-google-btn" class="btn btn-primary btn-google">
            <i data-lucide="chrome"></i> Continue with Google
          </button>
          
          <div class="auth-divider"><span>or continue with email</span></div>
          
          <form id="auth-form">
            <div class="input-group">
              <label>Email Address</label>
              <input type="email" id="auth-email" class="input" placeholder="you@company.com" required />
            </div>
            <div class="input-group">
              <label>Password</label>
              <input type="password" id="auth-pwd" class="input" placeholder="••••••••" required minlength="6"/>
            </div>
            
            <div id="auth-error" class="auth-error-msg hidden"></div>
            
            <button type="submit" id="auth-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
              <i data-lucide="mail"></i> <span id="auth-action-text">Log In</span>
            </button>
          </form>

          <p class="auth-toggle">
            <span id="auth-toggle-prompt">Don't have an account?</span> 
            <a href="#" id="auth-toggle-btn">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `;

  createIcons({ icons: { Mail, Chrome, Zap } });

  let isLogin = true;

  const toggleBtn = document.getElementById('auth-toggle-btn');
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const actionText = document.getElementById('auth-action-text');
  const promptText = document.getElementById('auth-toggle-prompt');
  const form = document.getElementById('auth-form');
  const errorMsg = document.getElementById('auth-error');
  const googleBtn = document.getElementById('auth-google-btn');

  // Toggle Mode
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    title.textContent = isLogin ? 'Welcome back' : 'Create an account';
    subtitle.textContent = isLogin ? 'Log in to access your dashboard' : 'Enter your details to get started';
    actionText.textContent = isLogin ? 'Log In' : 'Sign Up';
    promptText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleBtn.textContent = isLogin ? 'Sign up' : 'Log in';
    errorMsg.classList.add('hidden');
  });

  // Google Login
  googleBtn.addEventListener('click', async () => {
    // Attempt OAuth login
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  });

  // Email Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('auth-submit-btn');
    const email = document.getElementById('auth-email').value;
    const pwd = document.getElementById('auth-pwd').value;
    
    errorMsg.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="animation: glowPulse 1s infinite">Processing...</span>';

    try {
      let error;
      if (isLogin) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pwd });
        error = signInErr;
      } else {
        const { error: signUpErr } = await supabase.auth.signUp({ email, password: pwd });
        error = signUpErr;
      }

      if (error) throw error;
      // successful login triggers supabase onAuthStateChange, main.js will hide auth page
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="mail"></i> <span id="auth-action-text">${isLogin ? 'Log In' : 'Sign Up'}</span>`;
      createIcons({ icons: { Mail }, attrs: { 'data-lucide': 'mail' } });
    }
  });
}
