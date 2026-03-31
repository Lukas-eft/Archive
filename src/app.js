// Storage Service
const LocalStorageService = {
  USERS_KEY: 'archive_users',
  CURRENT_USER_KEY: 'archive_current_user',
  WISHLIST_KEY: 'archive_wishlist_',

  getUsers: () => JSON.parse(localStorage.getItem(LocalStorageService.USERS_KEY) || '[]'),
  saveUser: (user) => {
    const users = LocalStorageService.getUsers();
    users.push(user);
    localStorage.setItem(LocalStorageService.USERS_KEY, JSON.stringify(users));
  },
  getCurrentUser: () => JSON.parse(localStorage.getItem(LocalStorageService.CURRENT_USER_KEY) || 'null'),
  setCurrentUser: (user) => localStorage.setItem(LocalStorageService.CURRENT_USER_KEY, JSON.stringify(user)),
  getWishlist: (userId) => JSON.parse(localStorage.getItem(LocalStorageService.WISHLIST_KEY + userId) || '[]'),
  saveWishlistItem: (userId, item) => {
    const wishlist = LocalStorageService.getWishlist(userId);
    if (wishlist.length >= 10) {
      alert('Archive limit reached (Max 10 items). Please remove an item to add a new one.');
      return false;
    }
    wishlist.push(item);
    localStorage.setItem(LocalStorageService.WISHLIST_KEY + userId, JSON.stringify(wishlist));
    return true;
  },
  saveWishlist: (userId, wishlist) => {
    localStorage.setItem(LocalStorageService.WISHLIST_KEY + userId, JSON.stringify(wishlist.slice(0, 10)));
  },
  removeWishlistItem: (userId, itemId) => {
    const wishlist = LocalStorageService.getWishlist(userId);
    const updated = wishlist.filter(i => i.id !== itemId);
    localStorage.setItem(LocalStorageService.WISHLIST_KEY + userId, JSON.stringify(updated));
  },
  updateWishlistItem: (userId, updatedItem) => {
    const wishlist = LocalStorageService.getWishlist(userId);
    const index = wishlist.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      wishlist[index] = updatedItem;
      localStorage.setItem(LocalStorageService.WISHLIST_KEY + userId, JSON.stringify(wishlist));
    }
  },
  updateUser: (updatedUser) => {
    const users = LocalStorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(LocalStorageService.USERS_KEY, JSON.stringify(users));
      LocalStorageService.setCurrentUser(updatedUser);
    }
  }
};

// Data
const FEATURED_ITEMS = [
  {
    id: '1',
    category: 'TECH',
    image: 'https://lukas-eft.github.io/Portfolio/le-logo.png',
    title: 'Abstract Tech',
    price: 'Curated',
    url: 'https://lukas-eft.github.io/LE-Portfolio/',
  },
  {
    id: '2',
    category: 'TECH',
    image: 'https://lukas-eft.github.io/Portfolio/le-logo.png',
    title: 'White Coiled Cable',
    price: 'Curated',
    url: 'https://lukas-eft.github.io/LE-Portfolio/',
  },
  {
    id: '3',
    category: 'MOTORCYCLE',
    image: 'https://lukas-eft.github.io/Portfolio/le-logo.png',
    title: 'Rider Back',
    price: 'Curated',
    url: 'https://lukas-eft.github.io/LE-Portfolio/',
  },
  {
    id: '4',
    category: 'MOTORCYCLE',
    image: 'https://lukas-eft.github.io/Portfolio/le-logo.png',
    title: 'Front View',
    price: 'Curated',
    url: 'https://lukas-eft.github.io/LE-Portfolio/',
  },
];

// App State
let state = {
  user: LocalStorageService.getCurrentUser(),
  wishlist: [],
  currentView: 'home',
  searchQuery: '',
  isAuthModalOpen: false,
  authType: 'login',
  editingItem: null,
  lastLikedId: null,
  previousView: 'home',
  isLoading: true,
  isMobileSearchOpen: false
};

function navigateTo(view, force = false) {
  const protectedViews = ['archive', 'wishlist', 'settings'];
  if (protectedViews.includes(view) && !state.user) {
    state.isAuthModalOpen = true;
    state.authType = 'login';
    render();
    return;
  }

  if (!force && state.currentView === view) {
    state.currentView = state.previousView || 'home';
  } else {
    state.previousView = state.currentView;
    state.currentView = view;
  }
  
  // Trigger loading animation on navigation
  state.isLoading = true;
  render();
  
  // Use a minimal delay to ensure skeleton is visible but doesn't feel sluggish
  // In a real app, this would be replaced by actual data fetching completion
  requestAnimationFrame(() => {
    setTimeout(() => {
      state.isLoading = false;
      render();
    }, 300); // 300ms is the sweet spot for perceived performance
  });
}

if (state.user) {
  state.wishlist = LocalStorageService.getWishlist(state.user.id);
}

// Render Functions
function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <main>
      ${renderView()}
    </main>
    <footer class="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-0 animate-fadeIn" style="animation-delay: 0.5s; animation-fill-mode: forwards;">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-serif italic text-white/40">Archive</h2>
        <span class="text-[10px] text-white/10 uppercase tracking-widest">© 2026 Digital Sanctuary</span>
      </div>
      <div class="flex items-center gap-8">
        <a href="#" class="text-[10px] text-white/20 hover:text-white transition-colors uppercase tracking-widest">Privacy</a>
        <a href="#" class="text-[10px] text-white/20 hover:text-white transition-colors uppercase tracking-widest">Terms</a>
        <a href="#" class="text-[10px] text-white/20 hover:text-white transition-colors uppercase tracking-widest">Contact</a>
      </div>
    </footer>
    ${renderAuthModal()}
    ${renderEditModal()}
    ${state.user ? `
      <button id="fab-add" class="fab-btn">
        <i data-lucide="plus" class="w-6 h-6"></i>
      </button>
    ` : ''}
    <button id="back-to-top" title="Back to top">
      <i data-lucide="arrow-up" class="w-5 h-5"></i>
    </button>
  `;
  lucide.createIcons();
  attachEventListeners();
  
  state.lastLikedId = null;
}

function renderNavbar() {
  return `
    <nav class="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-7xl nav-blur rounded-[17px]">
      <div class="liquid-glass rounded-[17px] px-4 md:px-6 py-3 flex items-center justify-between border border-white/10">
        <div class="flex items-center gap-4 md:gap-8">
          <div class="flex items-center gap-2 cursor-pointer group/logo transition-all duration-500 hover:scale-105 active:scale-95" id="nav-logo">
            <h1 class="text-xl md:text-2xl font-serif italic tracking-tighter text-white transition-all duration-700 group-hover/logo:tracking-normal">Archive</h1>
          </div>

          <div class="flex items-center gap-4 md:gap-6">
            <div class="relative group hidden sm:block">
              <button class="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1">
                Categories
                <i data-lucide="chevron-down" class="w-3 h-3 group-hover:rotate-180 transition-transform duration-500"></i>
              </button>
              <div class="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-2 transition-all duration-500 cubic-bezier(0.2, 0, 0, 1) shadow-2xl">
                <button class="category-filter w-full text-left px-4 py-2 text-[10px] text-white/60 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest" data-category="TECH">Tech</button>
                <button class="category-filter w-full text-left px-4 py-2 text-[10px] text-white/60 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest" data-category="MOTORCYCLE">Motorcycle</button>
                <button class="category-filter w-full text-left px-4 py-2 text-[10px] text-white/60 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest" data-category="">All</button>
              </div>
            </div>
          </div>
          
          <div class="relative hidden md:block w-72">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"></i>
            <input 
              type="text" 
              id="search-input"
              placeholder="Search collection..." 
              value="${state.searchQuery}"
              autocomplete="off"
              class="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-10 text-xs focus:outline-none focus:border-white/30 focus:bg-white/10 focus:w-80 transition-all duration-500 placeholder:text-white/20"
            />
            <button id="clear-search-btn" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-90 ${state.searchQuery ? '' : 'hidden'}">
              <i data-lucide="x" class="w-3 h-3 text-white/40"></i>
            </button>
            <div id="search-suggestions" class="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl py-2 hidden shadow-2xl z-[100]"></div>
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-4">
          <button id="mobile-search-trigger" class="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <i data-lucide="search" class="w-5 h-5"></i>
          </button>
          <button id="nav-archive" class="p-2 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${state.currentView === 'archive' ? 'text-white' : 'text-white/50'} hover:text-white">
            <i data-lucide="library" class="w-5 h-5"></i>
          </button>
          ${state.user ? `
            <div class="flex items-center gap-2 md:gap-3">
              <button id="nav-wishlist" class="p-2 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${state.currentView === 'wishlist' ? 'text-white' : 'text-white/50'} hover:text-white">
                <i data-lucide="heart" class="w-5 h-5 ${state.currentView === 'wishlist' ? 'fill-current' : ''}"></i>
              </button>
              <button id="nav-settings" class="p-2 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${state.currentView === 'settings' ? 'text-white' : 'text-white/50'} hover:text-white">
                <i data-lucide="settings" class="w-5 h-5"></i>
              </button>
              <div class="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>
              <div class="flex items-center gap-3">
                <div class="flex flex-col items-end hidden lg:flex">
                  <span class="text-xs font-medium text-white/90">${state.user.name}</span>
                  <span class="text-[8px] text-white/30 uppercase tracking-[0.2em]">Member</span>
                </div>
                <div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group/avatar relative cursor-pointer transition-all duration-300 hover:border-white/30">
                  <i data-lucide="user" class="w-4 h-4 text-white/40 group-hover/avatar:scale-110 transition-transform"></i>
                  <button id="logout-btn" class="absolute inset-0 bg-black/80 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <i data-lucide="log-out" class="w-3.5 h-3.5 text-white"></i>
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <div class="flex items-center gap-1 md:gap-2">
              <button id="login-nav-btn" class="px-2 md:px-4 py-2 text-[10px] md:text-xs font-medium text-white/50 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2">
                <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Login</span>
              </button>
              <button id="signup-nav-btn" class="px-3 md:px-5 py-2 bg-white text-black text-[10px] md:text-xs font-bold rounded-[10px] md:rounded-[12px] hover:bg-white/90 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 btn-glow">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Sign Up</span>
              </button>
            </div>
          `}
        </div>
      </div>

      <!-- Mobile Search Overlay -->
      <div id="mobile-search-overlay" class="fixed inset-0 bg-black/95 z-[60] flex flex-col p-6 transition-all duration-300 ${state.isMobileSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-serif italic text-white">Search</h2>
          <button id="close-mobile-search" class="p-2 hover:bg-white/10 rounded-full transition-colors">
            <i data-lucide="x" class="w-6 h-6 text-white"></i>
          </button>
        </div>
        <div class="relative">
          <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"></i>
          <input 
            type="text" 
            id="mobile-search-input"
            placeholder="Search collection..." 
            value="${state.searchQuery}"
            class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-lg focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20 text-white"
          />
          ${state.searchQuery ? `
            <button id="clear-mobile-search" class="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors">
              <i data-lucide="x" class="w-4 h-4 text-white/40"></i>
            </button>
          ` : ''}
        </div>
        <div id="mobile-search-suggestions" class="mt-6 space-y-2 overflow-y-auto flex-1"></div>
      </div>
    </nav>
  `;
}

function renderView() {
  if (state.isLoading) {
    switch (state.currentView) {
      case 'archive': return renderSkeletonArchive();
      case 'wishlist': return renderSkeletonWishlist();
      case 'settings': return renderSkeletonSettings();
      default: return renderSkeletonHome();
    }
  }

  switch (state.currentView) {
    case 'home': return renderHome();
    case 'archive': return renderArchive();
    case 'wishlist': return renderWishlist();
    case 'settings': return renderSettings();
    default: return renderHome();
  }
}

function renderSkeletonHome() {
  return `
    <div class="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <div class="max-w-4xl w-full space-y-8">
        <div class="skeleton h-20 w-3/4 mx-auto rounded-2xl"></div>
        <div class="skeleton h-6 w-1/2 mx-auto rounded-full"></div>
        <div class="flex gap-4 justify-center pt-8">
          <div class="skeleton h-12 w-40 rounded-xl"></div>
          <div class="skeleton h-12 w-40 rounded-xl"></div>
        </div>
      </div>
    </div>
  `;
}

function renderSkeletonArchive() {
  return `
    <div class="max-w-7xl mx-auto px-6 pt-40 md:pt-32 pb-24">
      <header class="mb-16">
        <div class="skeleton h-16 w-64 mb-4"></div>
        <div class="skeleton h-4 w-48"></div>
      </header>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        ${Array(8).fill(0).map(() => `
          <div class="skeleton-card">
            <div class="skeleton skeleton-image"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSkeletonWishlist() {
  return `
    <div class="max-w-4xl mx-auto px-6 pt-40 md:pt-32 pb-24">
      <header class="mb-16">
        <div class="skeleton h-16 w-64 mb-4"></div>
        <div class="skeleton h-4 w-48"></div>
      </header>
      <div class="space-y-6">
        ${Array(5).fill(0).map(() => `
          <div class="skeleton-wishlist-item">
            <div class="skeleton skeleton-wishlist-image"></div>
            <div class="flex-grow space-y-3">
              <div class="skeleton skeleton-text medium"></div>
              <div class="skeleton skeleton-text short"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSkeletonSettings() {
  return `
    <div class="max-w-4xl mx-auto px-6 pt-40 md:pt-32 pb-24">
      <header class="mb-16">
        <div class="skeleton h-16 w-64 mb-4"></div>
        <div class="skeleton h-4 w-48"></div>
      </header>
      <div class="space-y-12">
        <div class="skeleton h-64 w-full rounded-[2rem]"></div>
        <div class="skeleton h-64 w-full rounded-[2rem]"></div>
      </div>
    </div>
  `;
}

function renderHome() {
  return `
    <div class="max-w-7xl mx-auto px-6 pt-40 md:pt-32 pb-24">
      <section class="mb-40 mt-12">
        <div class="max-w-4xl">
          <h2 class="hero-title font-serif italic leading-[1.1] mb-14 text-6xl md:text-9xl">
            <div class="hero-reveal"><span>The Digital</span></div>
            <div class="hero-reveal" style="animation-delay: 0.1s;"><span class="text-white/20 tracking-normal">Sanctuary</span><span class="text-white">.</span></div>
          </h2>
          <p class="text-lg md:text-2xl text-white/40 max-w-2xl leading-relaxed mb-12 font-light">
            A minimal space to curate, save, and archive the pieces of the web that inspire you. 
            Designed for the modern collector who values precision and aesthetic.
          </p>
          <div class="flex flex-col sm:flex-row sm:items-center gap-8">
             <button id="start-archiving-btn" class="px-10 py-5 bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-white/90 transition-all shadow-2xl shadow-white/5 btn-glow">
               Start Archiving
             </button>
             <div class="flex items-center gap-4 group/scroll">
               <div class="h-px w-12 bg-white/10 group-hover/scroll:w-20 transition-all duration-700"></div>
               <span class="text-[10px] text-white/20 uppercase tracking-[0.3em] group-hover/scroll:text-white/40 transition-all duration-700">Scroll to explore</span>
             </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-16 py-24 border-t border-white/5">
        <div class="space-y-6 group/feature">
          <span class="text-[10px] text-white/20 uppercase tracking-[0.3em] group-hover/feature:text-white/60 transition-colors duration-500">01 / Sync</span>
          <h4 class="text-2xl font-serif italic group-hover/feature:translate-x-2 transition-transform duration-500">Seamless Access</h4>
          <p class="text-sm text-white/40 leading-relaxed">
            Your collection is tied to your account. Access your curated archive from any device, anywhere in the world.
          </p>
        </div>
        <div class="space-y-6 group/feature">
          <span class="text-[10px] text-white/20 uppercase tracking-[0.3em] group-hover/feature:text-white/60 transition-colors duration-500">02 / Design</span>
          <h4 class="text-2xl font-serif italic group-hover/feature:translate-x-2 transition-transform duration-500">Liquid Aesthetic</h4>
          <p class="text-sm text-white/40 leading-relaxed">
            Experience a interface that feels like glass. Minimal, fast, and focused on the content you love.
          </p>
        </div>
        <div class="space-y-6 group/feature">
          <span class="text-[10px] text-white/20 uppercase tracking-[0.3em] group-hover/feature:text-white/60 transition-colors duration-500">03 / Privacy</span>
          <h4 class="text-2xl font-serif italic group-hover/feature:translate-x-2 transition-transform duration-500">Private Archive</h4>
          <p class="text-sm text-white/40 leading-relaxed">
            Your wishlist is yours alone. We value your privacy and provide a secure space for your digital curation.
          </p>
        </div>
      </section>
      
      <section class="py-32 border-t border-white/5">
        <div class="text-center mb-20">
          <h3 class="text-4xl md:text-5xl font-serif italic mb-4">What's in Archive?</h3>
          <p class="text-white/40 tracking-[0.2em] text-[10px] uppercase">Everything you need to curate your digital life.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Card 1: Smart Curation -->
          <div class="feature-card group">
            <div class="feature-graphic">
              <div class="wireframe-box">
                <div class="flex items-center gap-2">
                  <div class="wireframe-circle"></div>
                  <div class="wireframe-line w-12"></div>
                </div>
                <div class="wireframe-line w-full"></div>
                <div class="wireframe-line w-2/3"></div>
                <div class="wireframe-line w-full opacity-30"></div>
              </div>
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <i data-lucide="sparkles" class="w-8 h-8 text-white/20"></i>
              </div>
            </div>
            <h4>Smart Curation</h4>
            <p>Automatic categorization and tagging for your saved items, making organization effortless.</p>
          </div>

          <!-- Card 2: Visual Sanctuary -->
          <div class="feature-card group">
            <div class="feature-graphic">
              <div class="relative">
                <div class="w-24 h-24 rounded-2xl border border-white/10 flex items-center justify-center">
                  <i data-lucide="layout" class="w-10 h-10 text-white/10 group-hover:text-white/30 transition-colors"></i>
                </div>
                <div class="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-white/5 border border-white/10"></div>
                <div class="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-white/5 border border-white/10"></div>
              </div>
            </div>
            <h4>Visual Sanctuary</h4>
            <p>A focused, distraction-free interface designed to let your curated content shine.</p>
          </div>

          <!-- Card 3: React Server Components (Nodes) -->
          <div class="feature-card group">
            <div class="feature-graphic">
              <div class="node-tree">
                <div class="node"><i data-lucide="database" class="w-4 h-4 text-white/20"></i></div>
                <div class="node-row">
                  <div class="node"><i data-lucide="cpu" class="w-4 h-4 text-white/20"></i></div>
                  <div class="node"><i data-lucide="monitor" class="w-4 h-4 text-white/20"></i></div>
                </div>
              </div>
            </div>
            <h4>Cross-Device Sync</h4>
            <p>Your archive is always with you, synced seamlessly across all your digital devices.</p>
          </div>

          <!-- Card 4: Privacy -->
          <div class="feature-card group">
            <div class="feature-graphic">
              <div class="relative w-20 h-20">
                <div class="absolute inset-0 border border-white/10 rounded-full animate-pulse"></div>
                <div class="absolute inset-4 border border-white/20 rounded-full"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <i data-lucide="shield-check" class="w-8 h-8 text-white/40"></i>
                </div>
              </div>
            </div>
            <h4>Privacy First</h4>
            <p>Secure, private storage for your most valued digital pieces. Your data stays yours.</p>
          </div>

          <!-- Card 5: Quick Search -->
          <div class="feature-card group">
            <div class="feature-graphic">
              <div class="w-32 h-10 bg-white/5 border border-white/10 rounded-full px-4 flex items-center gap-3">
                <i data-lucide="search" class="w-4 h-4 text-white/20"></i>
                <div class="h-2 w-16 bg-white/10 rounded-full"></div>
              </div>
            </div>
            <h4>Quick Search</h4>
            <p>Find any item in your archive instantly with our powerful, lightning-fast search engine.</p>
          </div>

          <!-- Card 6: Wishlist Priority -->
          <div class="feature-card group">
            <div class="feature-graphic">
              <div class="flex items-center gap-1">
                <i data-lucide="star" class="w-6 h-6 text-white/10 group-hover:text-yellow-500/40 transition-colors"></i>
                <i data-lucide="star" class="w-8 h-8 text-white/20 group-hover:text-yellow-500/60 transition-colors"></i>
                <i data-lucide="star" class="w-6 h-6 text-white/10 group-hover:text-yellow-500/40 transition-colors"></i>
              </div>
            </div>
            <h4>Wishlist Priority</h4>
            <p>Keep your top 10 most desired items at the forefront with a dedicated priority view.</p>
          </div>
        </div>
      </section>

      <section class="py-32 border-t border-white/5">
        <div class="max-w-2xl">
          <span class="text-[10px] text-white/20 uppercase tracking-[0.3em] mb-8 block">FAQ / Knowledge</span>
          <h3 class="text-4xl font-serif italic mb-16">Common Questions</h3>
          
          <div class="space-y-8">
            <div class="faq-item group cursor-pointer">
              <div class="flex items-center justify-between py-4 border-b border-white/5 group-hover:border-white/20 transition-colors">
                <h5 class="text-lg font-light text-white/80">What is Archive?</h5>
                <i data-lucide="plus" class="w-4 h-4 text-white/20 group-hover:text-white transition-all"></i>
              </div>
              <div class="faq-answer max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0">
                <p class="py-6 text-sm text-white/70 leading-relaxed">
                  Archive is a minimal digital sanctuary for curators. It allows you to save, organize, and prioritize the most inspiring pieces of the web in a beautiful, focused environment.
                </p>
              </div>
            </div>

            <div class="faq-item group cursor-pointer">
              <div class="flex items-center justify-between py-4 border-b border-white/5 group-hover:border-white/20 transition-colors">
                <h5 class="text-lg font-light text-white/80">How many items can I save?</h5>
                <i data-lucide="plus" class="w-4 h-4 text-white/20 group-hover:text-white transition-all"></i>
              </div>
              <div class="faq-answer max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0">
                <p class="py-6 text-sm text-white/70 leading-relaxed">
                  To maintain focus and curation quality, the Wishlist is limited to your top 10 items. Your general Archive can hold as many items as you wish to curate.
                </p>
              </div>
            </div>

            <div class="faq-item group cursor-pointer">
              <div class="flex items-center justify-between py-4 border-b border-white/5 group-hover:border-white/20 transition-colors">
                <h5 class="text-lg font-light text-white/80">Is my data private?</h5>
                <i data-lucide="plus" class="w-4 h-4 text-white/20 group-hover:text-white transition-all"></i>
              </div>
              <div class="faq-answer max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0">
                <p class="py-6 text-sm text-white/70 leading-relaxed">
                  Yes. Your curated collections and wishlist are tied to your private account. We believe in digital privacy and providing a secure space for your inspiration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderArchive() {
  const filtered = FEATURED_ITEMS.filter(item => 
    fuzzyMatch(item.title, state.searchQuery) || 
    fuzzyMatch(item.category, state.searchQuery)
  );

  return `
    <div class="max-w-7xl mx-auto px-6 pt-40 md:pt-32 pb-24">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 class="text-5xl md:text-7xl font-serif italic tracking-tighter mb-4">Archive</h1>
          <p class="text-white/50 tracking-[0.2em] text-[10px] uppercase">Curated Collection ${state.searchQuery ? `/ ${state.searchQuery}` : ''}</p>
        </div>
      </header>

      ${filtered.length === 0 ? `
        <div class="flex flex-col items-center justify-center py-40 text-center">
          <i data-lucide="search-x" class="w-12 h-12 text-white/5 mb-6"></i>
          <p class="text-white/20 text-sm font-light tracking-widest uppercase">No items found in archive</p>
          <button id="clear-search" class="mt-8 text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em] border-b border-white/10 pb-1">
            Clear all filters
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${filtered.map((item, index) => `
            <div class="stagger-item" style="animation-delay: ${index * 0.05}s">
              ${renderCard(item)}
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function renderWishlist() {
  return `
    <div class="max-w-4xl mx-auto px-6 pt-40 md:pt-32 pb-24">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 class="text-5xl md:text-7xl font-serif italic tracking-tighter mb-4">Wishlist</h1>
          <p class="text-white/50 tracking-[0.2em] text-[10px] uppercase">Your Top 10 Archive</p>
        </div>
        <button id="back-to-archive" class="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors flex items-center gap-2">
          <i data-lucide="arrow-left" class="w-3 h-3"></i>
          Back to Archive
        </button>
      </header>

      ${state.wishlist.length === 0 ? `
        <div class="flex flex-col items-center justify-center py-40 text-center">
          <i data-lucide="heart" class="w-12 h-12 text-white/5 mb-6"></i>
          <p class="text-white/20 text-sm font-light tracking-widest uppercase">Your archive is empty</p>
        </div>
      ` : `
        <div id="wishlist-grid" class="horizontal-wishlist">
          ${state.wishlist.map((item, index) => `
            <div class="wishlist-item-wrapper" draggable="true" data-index="${index}" style="animation-delay: ${index * 0.1}s">
              <div class="rank-number">${index + 1}</div>
              ${renderWishlistCard(item)}
            </div>
          `).join('')}
        </div>
        <div class="mt-12 flex justify-center">
          <p class="text-[10px] text-white/20 uppercase tracking-[0.3em]">Drag to reorder your priority</p>
        </div>
      `}
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="max-w-4xl mx-auto px-6 pt-40 md:pt-32 pb-24">
      <header class="mb-16">
        <h1 class="text-5xl md:text-7xl font-serif italic tracking-tighter mb-4">Settings</h1>
        <p class="text-white/50 tracking-[0.2em] text-[10px] uppercase">Account & Preferences</p>
      </header>

      <div class="space-y-12">
        <section class="liquid-glass rounded-[2rem] p-10 border border-white/10">
          <h3 class="text-xl font-serif italic mb-8">Profile Information</h3>
          <form id="update-profile-form" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Full Name</label>
                <input type="text" name="name" value="${state.user?.name || ''}" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Email Address</label>
                <input type="email" name="email" value="${state.user?.email || ''}" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors" />
              </div>
            </div>
            <div class="flex justify-end">
              <button type="submit" class="px-8 py-3 bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-white/90 transition-all">
                Update Profile
              </button>
            </div>
          </form>
        </section>

        <section class="liquid-glass rounded-[2rem] p-10 border border-white/10">
          <h3 class="text-xl font-serif italic mb-8">Security</h3>
          <form id="change-password-form" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">New Password</label>
                <input type="password" name="newPassword" placeholder="••••••••" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/10" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Confirm New Password</label>
                <input type="password" name="confirmPassword" placeholder="••••••••" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/10" />
              </div>
            </div>
            <div class="flex justify-end">
              <button type="submit" class="px-8 py-3 bg-white/10 text-white text-[10px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-white/20 transition-all border border-white/10">
                Change Password
              </button>
            </div>
          </form>
        </section>

        <section class="liquid-glass rounded-[2rem] p-10 border border-white/10">
          <h3 class="text-xl font-serif italic mb-8">Preferences</h3>
          <div class="space-y-6">
            <div class="flex items-center justify-between py-4 border-b border-white/5">
              <div>
                <h5 class="text-sm font-medium text-white/80">Email Notifications</h5>
                <p class="text-xs text-white/30">Receive updates about your archive</p>
              </div>
              <div class="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
                <div class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div class="flex items-center justify-between py-4 border-b border-white/5">
              <div>
                <h5 class="text-sm font-medium text-white/80">Public Profile</h5>
                <p class="text-xs text-white/30">Allow others to see your curated archive</p>
              </div>
              <div class="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
                <div class="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        <div class="flex justify-center">
          <button id="logout-settings-btn" class="text-[10px] font-bold tracking-[0.2em] uppercase text-red-500/60 hover:text-red-500 transition-colors">
            Logout from all devices
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderWishlistCard(item) {
  return `
    <div class="wishlist-card group" data-id="${item.id}">
      <div class="image-container">
        <img src="${item.image}" alt="${item.title}" referrerPolicy="no-referrer" />
      </div>
      <div class="content">
        <h3 class="text-xl font-serif italic text-white/90 mb-1">${item.title}</h3>
        <p class="text-[10px] text-white/20 uppercase tracking-widest">${item.price}</p>
      </div>
      <div class="flex gap-2">
        <div class="tooltip-container">
          <div class="tooltip">Visit</div>
          <button 
            onclick="window.open('${item.url}', '_blank')"
            class="p-3 bg-white/5 text-white/40 rounded-full hover:bg-white hover:text-black transition-all"
          >
            <i data-lucide="external-link" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="tooltip-container">
          <div class="tooltip">Remove</div>
          <button 
            class="save-btn p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
            data-id="${item.id}"
          >
            <i data-lucide="heart" class="w-4 h-4 fill-current"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderCard(item) {
  const isSaved = state.wishlist.some(i => i.id === item.id);
  const isArchiveView = state.currentView === 'archive';
  const isLastLiked = state.lastLikedId === item.id;
  
  return `
    <div class="archive-card group relative" data-id="${item.id}">
      <!-- Image Clipping Container -->
      <div class="absolute inset-0 rounded-[2rem] overflow-hidden z-0">
        <img 
          src="${item.image}" 
          alt="${item.title}" 
          class="archive-image absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <!-- Corner Action: Visit -->
      <div class="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <div class="tooltip-container tooltip-bottom">
          <div class="tooltip">Visit</div>
          <button 
            onclick="window.open('${item.url}', '_blank')"
            class="bg-black/40 backdrop-blur-xl text-white/70 p-2.5 rounded-full hover:bg-white hover:text-black transition-all border border-white/10"
          >
            <i data-lucide="external-link" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Bottom Info & Action Bar -->
      <div class="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div class="liquid-glass rounded-[1.25rem] p-3.5 flex items-center justify-between gap-3 border border-white/10 shadow-2xl relative">
          <div class="flex flex-col min-w-0 transition-all duration-500 group-hover:-translate-y-12 group-hover:opacity-0">
            <span class="text-[11px] font-serif italic text-white/90 truncate leading-tight">${item.title}</span>
            <span class="text-[8px] text-white/40 uppercase tracking-[0.2em] font-medium">${item.category}</span>
          </div>
          
          <!-- Hidden Actions that slide up -->
          <div class="absolute inset-x-4 flex items-center justify-end gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 cubic-bezier(0.2, 0, 0, 1)">
            ${isArchiveView ? `
              <div class="tooltip-container">
                <div class="tooltip">Edit</div>
                <button class="edit-btn p-2.5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-colors" data-id="${item.id}">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
              </div>
              <div class="tooltip-container">
                <div class="tooltip">Delete</div>
                <button class="delete-item-btn p-2.5 hover:bg-red-500/20 text-red-500/60 hover:text-red-500 rounded-xl transition-colors" data-id="${item.id}">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            ` : ''}
            <div class="tooltip-container">
              <div class="tooltip">${isSaved ? 'Unarchive' : 'Archive'}</div>
              <button 
                class="save-btn p-2.5 rounded-xl transition-colors ${isSaved ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-white/60 hover:text-white'}"
                data-id="${item.id}"
              >
                <i data-lucide="heart" class="w-4 h-4 ${isSaved ? 'fill-current' : ''} ${isLastLiked ? 'heart-pop' : ''}"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEditModal() {
  if (!state.editingItem) return '';
  const item = state.editingItem;
  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div class="absolute inset-0 bg-black/90 backdrop-blur-xl" id="edit-modal-overlay"></div>
      <div class="relative w-full max-w-md liquid-glass rounded-[2rem] p-10 border border-white/10">
        <button id="close-edit-modal" class="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <div class="text-center mb-10">
          <h2 class="text-3xl font-serif italic mb-2">Edit Item</h2>
          <p class="text-xs text-white/30 tracking-[0.2em] uppercase">Refine your curation</p>
        </div>

        <form id="edit-item-form" class="space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Item Name</label>
            <input type="text" name="title" value="${item.title}" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Image URL</label>
            <input type="url" name="image" value="${item.image}" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Price</label>
              <input type="text" name="price" value="${item.price}" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Category</label>
              <input type="text" name="category" value="${item.category}" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors" />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Product URL</label>
            <input type="url" name="url" value="${item.url}" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors" />
          </div>

          <button type="submit" class="w-full py-5 bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:bg-white/90 transition-all mt-4">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  `;
}

function renderAuthModal() {
  if (!state.isAuthModalOpen) return '';
  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div class="absolute inset-0 bg-black/90 backdrop-blur-xl" id="modal-overlay"></div>
      <div class="relative w-full max-w-md liquid-glass rounded-[2rem] p-10 border border-white/10">
        <button id="close-modal" class="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <div class="text-center mb-10">
          <h2 class="text-3xl font-serif italic mb-2">${state.authType === 'login' ? 'Welcome Back' : 'Join the Archive'}</h2>
          <p class="text-xs text-white/30 tracking-[0.2em] uppercase">${state.authType === 'login' ? 'Enter your credentials' : 'Create your sanctuary'}</p>
        </div>

        <form id="auth-form" class="space-y-6">
          ${state.authType === 'signup' ? `
            <div class="space-y-2">
              <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Full Name</label>
              <input type="text" name="name" placeholder="First Name Last Name" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/10" />
            </div>
          ` : ''}
          <div class="space-y-2">
            <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Email Address</label>
            <input type="email" name="email" placeholder="name@mail.com" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/10" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] text-white/20 uppercase tracking-[0.2em] ml-4">Password</label>
            <input type="password" name="password" placeholder="••••••••" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/10" />
            ${state.authType === 'signup' ? `
              <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                <div id="password-strength-bar" class="h-full w-0 bg-red-500 transition-all duration-500"></div>
              </div>
              <p id="password-hint" class="text-[8px] text-white/20 uppercase tracking-widest ml-4 mt-1">Strength: Weak</p>
            ` : ''}
          </div>

          <button type="submit" class="w-full py-5 bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:bg-white/90 transition-all mt-4">
            ${state.authType === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div class="mt-8 text-center">
          <button id="toggle-auth" class="text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-[0.2em]">
            ${state.authType === 'login' ? "Don't have an account? Sign Up" : "Already a member? Login"}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Event Handlers
// Fuzzy Search Helper
function fuzzyMatch(text, query) {
  query = query.toLowerCase();
  text = text.toLowerCase();
  let n = -1;
  for (let i = 0; i < query.length; i++) {
    if (!~(n = text.indexOf(query[i], n + 1))) return false;
  }
  return true;
}

function attachEventListeners() {
  // Navigation
  document.getElementById('nav-logo')?.addEventListener('click', () => {
    navigateTo('home');
  });
  document.getElementById('nav-archive')?.addEventListener('click', () => {
    state.searchQuery = '';
    navigateTo('archive');
  });

  // Category Filters
  document.querySelectorAll('.category-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      state.searchQuery = category;
      navigateTo('archive', true);
    });
  });

  // FAQ Toggles
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      const answer = item.querySelector('.faq-answer');
      const icon = item.querySelector('svg') || item.querySelector('i');
      
      if (!answer) return;
      
      const isOpen = item.classList.contains('is-open');
      
      // Close all other FAQs
      document.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('is-open');
        const ans = el.querySelector('.faq-answer');
        const icn = el.querySelector('svg') || el.querySelector('i');
        if (ans) {
          ans.style.maxHeight = '0px';
          ans.style.opacity = '0';
        }
        if (icn) icn.style.transform = 'rotate(0deg)';
      });

      if (!isOpen) {
        item.classList.add('is-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        answer.style.opacity = '1';
        if (icon) icon.style.transform = 'rotate(45deg)';
      }
    });
  });
  document.getElementById('nav-wishlist')?.addEventListener('click', () => {
    navigateTo('wishlist');
  });
  document.getElementById('nav-settings')?.addEventListener('click', () => {
    navigateTo('settings');
  });
  
  const updateProfileForm = document.getElementById('update-profile-form');
  if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(updateProfileForm);
      const data = Object.fromEntries(formData.entries());
      
      const updatedUser = {
        ...state.user,
        name: data.name,
        email: data.email
      };
      
      LocalStorageService.updateUser(updatedUser);
      state.user = updatedUser;
      alert('Profile updated successfully');
      render();
    });
  }

  const changePasswordForm = document.getElementById('change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(changePasswordForm);
      const data = Object.fromEntries(formData.entries());
      
      if (data.newPassword !== data.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      const updatedUser = {
        ...state.user,
        password: data.newPassword
      };
      
      LocalStorageService.updateUser(updatedUser);
      state.user = updatedUser;
      alert('Password changed successfully');
      render();
    });
  }

  document.getElementById('logout-settings-btn')?.addEventListener('click', () => {
    LocalStorageService.setCurrentUser(null);
    state.user = null;
    state.wishlist = [];
    state.currentView = 'home';
    render();
  });
  document.getElementById('start-archiving-btn')?.addEventListener('click', () => {
    navigateTo('archive', true);
  });
  document.getElementById('back-to-archive')?.addEventListener('click', () => {
    navigateTo('archive', true);
  });

  document.getElementById('clear-search')?.addEventListener('click', () => {
    state.searchQuery = '';
    render();
  });

  // Scroll events
  window.addEventListener('scroll', () => {
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  });

  document.getElementById('back-to-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Search
  const searchInput = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('search-suggestions');
  const clearBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      
      // Handle suggestions
      if (state.searchQuery.length > 0) {
        const matches = FEATURED_ITEMS.filter(item => 
          fuzzyMatch(item.title, state.searchQuery) || 
          fuzzyMatch(item.category, state.searchQuery)
        ).slice(0, 5);

        if (matches.length > 0 && suggestionsBox) {
          suggestionsBox.innerHTML = matches.map(item => `
            <button class="suggestion-item w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 group" data-id="${item.id}">
              <div class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                <img src="${item.image}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
              </div>
              <div class="flex flex-col">
                <span class="text-[11px] font-medium text-white/90">${item.title}</span>
                <span class="text-[8px] text-white/30 uppercase tracking-widest">${item.category}</span>
              </div>
            </button>
          `).join('');
          suggestionsBox.classList.remove('hidden');
          
          // Attach suggestion clicks
          document.querySelectorAll('.suggestion-item').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              const item = FEATURED_ITEMS.find(i => i.id === id);
              if (item) {
                state.searchQuery = item.title;
                suggestionsBox.classList.add('hidden');
                navigateTo('archive', true);
              }
            });
          });
        } else if (suggestionsBox) {
          suggestionsBox.classList.add('hidden');
        }
      } else if (suggestionsBox) {
        suggestionsBox.classList.add('hidden');
      }

      // Show/hide clear button without full re-render
      if (clearBtn) {
        if (state.searchQuery.length > 0) {
          clearBtn.classList.remove('hidden');
        } else {
          clearBtn.classList.add('hidden');
        }
      }

      // Live filter archive view
      const archiveView = document.querySelector('main .grid');
      if (state.currentView === 'archive' && archiveView) {
        const filtered = FEATURED_ITEMS.filter(item => 
          fuzzyMatch(item.title, state.searchQuery) || 
          fuzzyMatch(item.category, state.searchQuery)
        );
        
        if (filtered.length === 0) {
          // If we hit 0 results, we need to show the empty state
          // To keep focus, we only render the main content area
          const main = document.querySelector('main');
          if (main) {
            main.innerHTML = renderArchive();
            lucide.createIcons();
            attachEventListeners();
            // Restore focus
            document.getElementById('search-input')?.focus();
            // Set cursor to end
            const input = document.getElementById('search-input');
            if (input) {
              const val = input.value;
              input.value = '';
              input.value = val;
            }
          }
        } else {
          // If we have results, just update the grid to avoid full re-render
          archiveView.innerHTML = filtered.map(item => renderCard(item)).join('');
          lucide.createIcons();
          attachCardListeners();
        }
      }
    });

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestionsBox?.contains(e.target)) {
        suggestionsBox?.classList.add('hidden');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      render();
    });
  }

  // Mobile Search
  document.getElementById('mobile-search-trigger')?.addEventListener('click', () => {
    state.isMobileSearchOpen = true;
    document.body.style.overflow = 'hidden';
    render();
    setTimeout(() => document.getElementById('mobile-search-input')?.focus(), 100);
  });

  document.getElementById('close-mobile-search')?.addEventListener('click', () => {
    state.isMobileSearchOpen = false;
    document.body.style.overflow = '';
    render();
  });

  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSuggestionsBox = document.getElementById('mobile-search-suggestions');
  const mobileClearBtn = document.getElementById('clear-mobile-search');

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      
      // Handle suggestions
      if (state.searchQuery.length > 0) {
        const matches = FEATURED_ITEMS.filter(item => 
          fuzzyMatch(item.title, state.searchQuery) || 
          fuzzyMatch(item.category, state.searchQuery)
        ).slice(0, 8);

        if (matches.length > 0 && mobileSuggestionsBox) {
          mobileSuggestionsBox.innerHTML = matches.map(item => `
            <button class="mobile-suggestion-item w-full text-left p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group" data-id="${item.id}">
              <div class="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                <img src="${item.image}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-medium text-white/90">${item.title}</span>
                <span class="text-[10px] text-white/30 uppercase tracking-widest">${item.category}</span>
              </div>
            </button>
          `).join('');
          
          // Attach suggestion clicks
          document.querySelectorAll('.mobile-suggestion-item').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              const item = FEATURED_ITEMS.find(i => i.id === id);
              if (item) {
                state.searchQuery = item.title;
                state.isMobileSearchOpen = false;
                document.body.style.overflow = '';
                navigateTo('archive', true);
              }
            });
          });
        } else if (mobileSuggestionsBox) {
          mobileSuggestionsBox.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-center">
              <i data-lucide="search-x" class="w-12 h-12 text-white/5 mb-6"></i>
              <p class="text-white/20 text-sm font-light tracking-widest uppercase">No items found</p>
            </div>
          `;
          lucide.createIcons();
        }
      } else if (mobileSuggestionsBox) {
        mobileSuggestionsBox.innerHTML = '';
      }

      // Show/hide clear button
      if (mobileClearBtn) {
        if (state.searchQuery.length > 0) {
          mobileClearBtn.classList.remove('hidden');
        } else {
          mobileClearBtn.classList.add('hidden');
        }
      }
    });

    mobileSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        state.isMobileSearchOpen = false;
        document.body.style.overflow = '';
        navigateTo('archive', true);
      }
    });
  }

  if (mobileClearBtn) {
    mobileClearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      if (mobileSearchInput) mobileSearchInput.value = '';
      if (mobileSuggestionsBox) mobileSuggestionsBox.innerHTML = '';
      mobileClearBtn.classList.add('hidden');
    });
  }

  // Auth
  document.getElementById('login-nav-btn')?.addEventListener('click', () => {
    state.isAuthModalOpen = true;
    state.authType = 'login';
    render();
  });
  document.getElementById('signup-nav-btn')?.addEventListener('click', () => {
    state.isAuthModalOpen = true;
    state.authType = 'signup';
    render();
  });
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    LocalStorageService.setCurrentUser(null);
    state.user = null;
    state.wishlist = [];
    state.currentView = 'home';
    render();
  });

  // Modal
  document.getElementById('close-modal')?.addEventListener('click', () => {
    state.isAuthModalOpen = false;
    render();
  });
  document.getElementById('modal-overlay')?.addEventListener('click', () => {
    state.isAuthModalOpen = false;
    render();
  });
  document.getElementById('toggle-auth')?.addEventListener('click', () => {
    state.authType = state.authType === 'login' ? 'signup' : 'login';
    render();
  });

  // Edit Modal
  document.getElementById('close-edit-modal')?.addEventListener('click', () => {
    state.editingItem = null;
    render();
  });
  document.getElementById('edit-modal-overlay')?.addEventListener('click', () => {
    state.editingItem = null;
    render();
  });

  const editForm = document.getElementById('edit-item-form');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(editForm);
      const data = Object.fromEntries(formData.entries());
      
      const updatedItem = {
        ...state.editingItem,
        ...data
      };

      const isAlreadyIn = state.wishlist.some(i => i.id === updatedItem.id);
      if (isAlreadyIn) {
        LocalStorageService.updateWishlistItem(state.user.id, updatedItem);
        state.wishlist = state.wishlist.map(i => i.id === updatedItem.id ? updatedItem : i);
      } else {
        const saved = LocalStorageService.saveWishlistItem(state.user.id, updatedItem);
        if (saved) {
          state.wishlist.push(updatedItem);
          state.lastLikedId = updatedItem.id;
        }
      }
      
      state.editingItem = null;
      render();
    });
  }

  const authForm = document.getElementById('auth-form');
  if (authForm) {
    const passwordInput = authForm.querySelector('input[name="password"]');
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthHint = document.getElementById('password-hint');

    if (passwordInput && strengthBar && strengthHint) {
      passwordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        let strength = 0;
        if (val.length >= 6) strength += 25;
        if (val.match(/[A-Z]/)) strength += 25;
        if (val.match(/[0-9]/)) strength += 25;
        if (val.match(/[^A-Za-z0-9]/)) strength += 25;

        strengthBar.style.width = strength + '%';
        
        if (strength === 0) {
          strengthBar.className = 'h-full bg-red-500 transition-all duration-500';
          strengthHint.innerText = 'Strength: Very Weak';
          strengthHint.className = 'text-[8px] text-red-500/50 uppercase tracking-widest ml-4 mt-1';
        } else if (strength <= 25) {
          strengthBar.className = 'h-full bg-red-500 transition-all duration-500';
          strengthHint.innerText = 'Strength: Weak';
          strengthHint.className = 'text-[8px] text-red-500/50 uppercase tracking-widest ml-4 mt-1';
        } else if (strength <= 50) {
          strengthBar.className = 'h-full bg-orange-500 transition-all duration-500';
          strengthHint.innerText = 'Strength: Fair';
          strengthHint.className = 'text-[8px] text-orange-500/50 uppercase tracking-widest ml-4 mt-1';
        } else if (strength <= 75) {
          strengthBar.className = 'h-full bg-yellow-500 transition-all duration-500';
          strengthHint.innerText = 'Strength: Good';
          strengthHint.className = 'text-[8px] text-yellow-500/50 uppercase tracking-widest ml-4 mt-1';
        } else {
          strengthBar.className = 'h-full bg-emerald-500 transition-all duration-500';
          strengthHint.innerText = 'Strength: Secure';
          strengthHint.className = 'text-[8px] text-emerald-500/50 uppercase tracking-widest ml-4 mt-1';
        }
      });
    }

    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(authForm);
      const data = Object.fromEntries(formData.entries());

      if (state.authType === 'signup') {
        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          email: data.email,
          name: data.name,
          password: data.password
        };
        LocalStorageService.saveUser(newUser);
        LocalStorageService.setCurrentUser(newUser);
        state.user = newUser;
        state.wishlist = [];
      } else {
        const users = LocalStorageService.getUsers();
        const found = users.find(u => u.email === data.email && u.password === data.password);
        if (found) {
          LocalStorageService.setCurrentUser(found);
          state.user = found;
          state.wishlist = LocalStorageService.getWishlist(found.id);
        } else {
          alert('Invalid credentials');
          return;
        }
      }
      state.isAuthModalOpen = false;
      render();
    });
  }

  const fabAdd = document.getElementById('fab-add');
  if (fabAdd) {
    fabAdd.addEventListener('click', () => {
      state.editingItem = { id: Date.now().toString(), title: '', category: 'NEW', image: '', url: '', price: 'New Entry' };
      render();
    });
  }

  attachCardListeners();
}

function attachCardListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      
      if (!state.user) {
        state.isAuthModalOpen = true;
        state.authType = 'login';
        render();
        return;
      }

      const item = state.wishlist.find(i => i.id === id) || FEATURED_ITEMS.find(i => i.id === id);
      state.editingItem = item;
      render();
    });
  });

  document.querySelectorAll('.delete-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this item?')) {
        const wrapper = btn.closest('.wishlist-item-wrapper');
        if (wrapper) {
          wrapper.classList.add('removing');
          setTimeout(() => {
            LocalStorageService.removeWishlistItem(state.user.id, id);
            state.wishlist = state.wishlist.filter(i => i.id !== id);
            render();
          }, 300);
        } else {
          LocalStorageService.removeWishlistItem(state.user.id, id);
          state.wishlist = state.wishlist.filter(i => i.id !== id);
          render();
        }
      }
    });
  });

  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const item = FEATURED_ITEMS.find(i => i.id === id) || state.wishlist.find(i => i.id === id);
      
      if (!state.user) {
        state.isAuthModalOpen = true;
        state.authType = 'login';
        render();
        return;
      }

      const isAlreadyIn = state.wishlist.some(i => i.id === id);
      if (isAlreadyIn) {
        // Add removing class for animation
        const wrapper = btn.closest('.wishlist-item-wrapper');
        if (wrapper) {
          wrapper.classList.add('removing');
        }

        setTimeout(() => {
          LocalStorageService.removeWishlistItem(state.user.id, id);
          state.wishlist = state.wishlist.filter(i => i.id !== id);
          
          // Update UI directly to avoid flash
          btn.classList.remove('bg-red-500/80', 'text-white');
          btn.classList.add('bg-black/40', 'text-white/80');
          const icon = btn.querySelector('i');
          if (icon) icon.classList.remove('fill-current', 'heart-pop');
          
          // Update tooltip
          const tooltip = btn.closest('.tooltip-container')?.querySelector('.tooltip');
          if (tooltip) tooltip.textContent = 'Archive';

          // We still need to render if we are in wishlist view to remove the item
          if (state.currentView === 'wishlist') {
            render();
          }
        }, 300); // Match CSS transition duration
      } else {
        const saved = LocalStorageService.saveWishlistItem(state.user.id, item);
        if (saved) {
          state.wishlist.push(item);
          state.lastLikedId = id;
          
          // Update UI directly to avoid flash
          btn.classList.add('bg-red-500/80', 'text-white');
          btn.classList.remove('bg-black/40', 'text-white/80');
          const icon = btn.querySelector('i');
          if (icon) {
            icon.classList.add('fill-current', 'heart-pop');
          }
          
          // Update tooltip
          const tooltip = btn.closest('.tooltip-container')?.querySelector('.tooltip');
          if (tooltip) tooltip.textContent = 'Unarchive';
        }
      }
      // We still need to render if we are in wishlist view to remove the item
      if (state.currentView === 'wishlist') {
        render();
      }
    });
  });

  if (state.currentView === 'wishlist') {
    attachDragAndDropListeners();
  }
}

function attachDragAndDropListeners() {
  const grid = document.getElementById('wishlist-grid');
  if (!grid) return;

  let draggedItem = null;
  let placeholder = document.createElement('div');
  placeholder.className = 'drag-placeholder';

  grid.querySelectorAll('.wishlist-item-wrapper').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      e.dataTransfer.effectAllowed = 'move';
      
      // Use setTimeout to hide the item after the drag image is created
      setTimeout(() => {
        item.classList.add('dragging');
        grid.classList.add('dragging-active');
        document.body.classList.add('is-dragging');
        item.parentNode.insertBefore(placeholder, item);
      }, 0);
    });

    item.addEventListener('dragend', () => {
      if (draggedItem) {
        draggedItem.classList.remove('dragging');
        grid.classList.remove('dragging-active');
        document.body.classList.remove('is-dragging');
        if (placeholder.parentNode) {
          placeholder.parentNode.insertBefore(draggedItem, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        }
        
        // Finalize order based on DOM
        const newOrder = Array.from(grid.querySelectorAll('.wishlist-item-wrapper'))
          .filter(el => !el.classList.contains('drag-placeholder'))
          .map(el => {
            const card = el.querySelector('.wishlist-card');
            const id = card ? card.getAttribute('data-id') : null;
            return state.wishlist.find(i => i.id === id);
          })
          .filter(Boolean);
        
        if (newOrder.length === state.wishlist.length) {
          state.wishlist = newOrder;
          LocalStorageService.saveWishlist(state.user.id, state.wishlist);
          render();
        }
        draggedItem = null;
      }
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (item === draggedItem) return;
      
      const rect = item.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      
      if (e.clientY < midpoint) {
        grid.insertBefore(placeholder, item);
      } else {
        grid.insertBefore(placeholder, item.nextSibling);
      }
    });
  });
}

// Initial Render
render();

// Hide skeleton and overlay as soon as the window (including all assets) is fully loaded
window.addEventListener('load', () => {
  state.isLoading = false;
  render();
  
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 700); // Matches the duration-700 class
  }
});
