// main.js (updated) - Fiber Fit Aata - Main JavaScript File
// Handles shopping cart, product filtering, animations, and interactive features

// Global variables
let cart = JSON.parse(localStorage.getItem('fiberFitCart')) || [];
let products = [];
let recipes = [];
let blogPosts = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Load data from JSON files or fallback
        await loadData();

        // Initialize cart
        updateCartDisplay();

        // Initialize page-specific features
        const currentPage = getCurrentPage();
        switch(currentPage) {
            case 'index':
                initializeHomePage();
                break;
            case 'products':
                initializeProductsPage();
                break;
            case 'recipes':
                initializeRecipesPage();
                break;
            case 'why-millets':
                initializeWhyMilletsPage();
                break;
            case 'blog':
                initializeBlogPage();
                break;
        }

        // Initialize common features
        initializeAnimations();
        initializeScrollEffects();
        initializeNavigation();

    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Data loading functions
async function loadData() {
    try {
        // If the page is opened via file://, fetch() to local JSON is blocked by CORS in many browsers.
        // Load a local JS fallback that embeds the JSON instead (see data/fallback-data.js).
        if (window.location && window.location.protocol === 'file:') {
            await loadLocalFallbackScript();
            products = window.__fiberFit_fallback?.products || [];
            recipes = window.__fiberFit_fallback?.recipes || [];
            blogPosts = window.__fiberFit_fallback?.blogPosts || [];
            return;
        }

        // Production: fetch JSON files (keep content and images separate)
        const [productsResponse, recipesResponse, blogResponse] = await Promise.all([
            fetch('data/products.json'),
            fetch('data/recipes.json'),
            fetch('data/blog-posts.json')
        ]);

        products = (await productsResponse.json()).products || [];
        recipes = (await recipesResponse.json()).recipes || [];
        blogPosts = (await blogResponse.json()).blogPosts || [];
    } catch (error) {
        console.error('Error loading data:', error);
        // Use fallback data if fetch fails
        if (window.__fiberFit_fallback) {
            products = window.__fiberFit_fallback.products || [];
            recipes = window.__fiberFit_fallback.recipes || [];
            blogPosts = window.__fiberFit_fallback.blogPosts || [];
        } else {
            // Provide empty arrays as last resort
            products = [];
            recipes = [];
            blogPosts = [];
        }
    }
}

// Dynamically load a local JS file that defines window.__fiberFit_fallback
function loadLocalFallbackScript() {
    return new Promise((resolve, reject) => {
        if (window.__fiberFit_fallback) return resolve();
        const script = document.createElement('script');
        script.src = 'data/fallback-data.js';
        script.onload = () => resolve();
        script.onerror = (e) => {
            console.error('Failed to load local fallback data script', e);
            reject(e);
        };
        document.head.appendChild(script);
    });
}

// get current page slug
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('products')) return 'products';
    if (path.includes('recipes')) return 'recipes';
    if (path.includes('why-millets')) return 'why-millets';
    if (path.includes('blog')) return 'blog';
    if (path.includes('story')) return 'story';
    if (path.includes('contact')) return 'contact';
    return 'index';
}

// Shopping Cart Functions (unchanged behavior)
function addToCart(productId, quantity = 1, size = null) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId && item.size === size);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            quantity: quantity
        });
    }

    updateCartDisplay();
    saveCart();
    showCartNotification(product.name);
}

function removeFromCart(productId, size = null) {
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    updateCartDisplay();
    saveCart();
}

function updateCartQuantity(productId, size, newQuantity) {
    const item = cart.find(item => item.id === productId && item.size === size);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId, size);
        } else {
            item.quantity = newQuantity;
            updateCartDisplay();
            saveCart();
        }
    }
}

function updateCartDisplay() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Update cart count badge
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
        element.style.display = cartCount > 0 ? 'block' : 'none';
    });

    // Update cart total
    const cartTotalElements = document.querySelectorAll('.cart-total');
    cartTotalElements.forEach(element => {
        element.textContent = `₹${cartTotal.toFixed(2)}`;
    });

    // Update cart items in sidebar
    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        renderCartItems(cartItemsContainer);
    }
}

function renderCartItems(container) {
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-600">Your cart is empty</p>
                <p class="text-sm text-gray-500 mt-2">Add some delicious millets to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
            <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
            <div class="flex-1">
                <h4 class="font-medium text-sm text-gray-900">${item.name}</h4>
                ${item.size ? `<p class="text-xs text-gray-500">Size: ${item.size}</p>` : ''}
                <p class="text-sm font-semibold text-green-600">₹${item.price}</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="updateCartQuantity('${item.id}', '${item.size}', ${item.quantity - 1})" 
                        class="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300">-</button>
                <span class="text-sm font-medium">${item.quantity}</span>
                <button onclick="updateCartQuantity('${item.id}', '${item.size}', ${item.quantity + 1})" 
                        class="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300">+</button>
            </div>
            <button onclick="removeFromCart('${item.id}', '${item.size}')" 
                    class="text-red-500 hover:text-red-700 text-xs">×</button>
        </div>
    `).join('');
}

function saveCart() {
    localStorage.setItem('fiberFitCart', JSON.stringify(cart));
}

function showCartNotification(productName) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span>Added ${productName} to cart!</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Product Filtering and Search
function filterProducts(category = 'all', searchTerm = '') {
    let filteredProducts = products.slice();

    // Filter by category
    if (category !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === category);
    }

    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
            (product.name || '').toLowerCase().includes(term) ||
            (product.description || '').toLowerCase().includes(term) ||
            (product.healthBenefits || []).some(benefit => (benefit || '').toLowerCase().includes(term))
        );
    }

    return filteredProducts;
}

// Animation Functions (unchanged)
function initializeAnimations() {
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.fade-in',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            delay: anime.stagger(100),
            easing: 'easeOutQuart'
        });

        anime({
            targets: '.scale-in',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 600,
            delay: anime.stagger(50),
            easing: 'easeOutBack'
        });
    }
}

// Scroll effects (unchanged)
function initializeScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');

                if (entry.target.classList.contains('counter')) {
                    animateCounter(entry.target);
                }

                if (entry.target.classList.contains('progress-bar')) {
                    animateProgressBar(entry.target);
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-animate, .counter, .progress-bar').forEach(el => {
        observer.observe(el);
    });
}

function animateCounter(element) {
    const target = parseInt(element.dataset.target || '0');
    const duration = parseInt(element.dataset.duration) || 2000;

    if (typeof anime !== 'undefined') {
        anime({
            targets: element,
            innerHTML: [0, target],
            duration: duration,
            round: 1,
            easing: 'easeOutQuart'
        });
    } else {
        let current = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }
}

function animateProgressBar(element) {
    const target = parseInt(element.dataset.progress || '0');

    if (typeof anime !== 'undefined') {
        anime({
            targets: element,
            width: `${target}%`,
            duration: 1500,
            easing: 'easeOutQuart'
        });
    } else {
        element.style.width = `${target}%`;
    }
}

// Navigation (unchanged)
function initializeNavigation() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    const cartToggle = document.getElementById('cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.getElementById('cart-close');

    if (cartToggle && cartSidebar) {
        cartToggle.addEventListener('click', () => {
            cartSidebar.classList.toggle('translate-x-full');
        });
    }

    if (cartClose) {
        cartClose.addEventListener('click', () => {
            cartSidebar.classList.add('translate-x-full');
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Page-specific initialization functions
function initializeHomePage() {
    // keep for future home-specific features
}

function initializeProductsPage() {
    renderProducts();

    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
}

function applyFilters() {
    const category = document.getElementById('category-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-input')?.value || '';

    const filteredProducts = filterProducts(category, searchTerm);
    renderProducts(filteredProducts);
}

// Render products - updated to create .img-4-5 wrappers and set data-product-json
function renderProducts(productsToRender = products) {
    const container = document.getElementById('products-grid');
    if (!container) return;

    container.innerHTML = productsToRender.map(product => {
        // Ensure price display
        const priceDisplay = product.price ? `₹${product.price}` : '';
        const productJson = JSON.stringify({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            url: product.url || null
        });

        return `
        <div class="product-card" data-product-json='${productJson.replace(/'/g, "\\'")}'>
            <div style="padding: 0.75rem;">
                <div class="img-4-5">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" data-name="${product.name}" />
                </div>
                <div class="card-body">
                    <h3 class="product-name font-bold text-lg mb-1 text-gray-800">${product.name}</h3>
                    <p class="product-subtitle text-sm text-gray-600 mb-2">${product.subtitle || ''}</p>
                    <p class="product-desc text-xs text-gray-500 mb-3 line-clamp-2">${product.description || ''}</p>

                    <div class="flex flex-wrap gap-1 mb-3">
                        ${(product.healthBenefits || []).slice(0,3).map(b => `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${b}</span>`).join('')}
                    </div>

                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="product-price text-xl font-bold text-green-600" data-price="${product.price}">${priceDisplay}</span>
                            ${product.originalPrice ? `<span class="text-sm text-gray-500 line-through">₹${product.originalPrice}</span>` : ''}
                        </div>
                        <div class="flex items-center text-sm text-gray-500">
                            <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            ${product.rating || ''}
                        </div>
                    </div>

                    <div class="flex space-x-2">
                        <button onclick="addToCart('${product.id}')" 
                                class="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors duration-200 text-sm font-medium">
                            Add to Cart
                        </button>
                        <button data-quickview class="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors duration-200 text-sm">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // update results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) resultsCount.textContent = String(productsToRender.length);

    // normalize images and attach handlers (defensive)
    setTimeout(() => {
        if (window.productImageUtilities && typeof window.productImageUtilities.normalizeProductImages === 'function') {
            window.productImageUtilities.normalizeProductImages();
        }
        if (window.productImageUtilities && typeof window.productImageUtilities.attachDelegatedHandlers === 'function') {
            window.productImageUtilities.attachDelegatedHandlers();
        }
    }, 10);

    // Re-init animations for new products
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.product-card',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 600,
            delay: anime.stagger(100),
            easing: 'easeOutQuart'
        });
    }
}

function initializeRecipesPage() {
    renderRecipes();
    const recipeCards = document.querySelectorAll('.recipe-card');
    recipeCards.forEach(card => {
        const servingSlider = card.querySelector('.serving-slider');
        if (servingSlider) {
            servingSlider.addEventListener('input', (e) => {
                const recipeId = card.dataset.recipeId;
                const newServings = parseInt(e.target.value);
                updateRecipeIngredients(recipeId, newServings);
            });
        }
    });
}

function renderRecipes() {
    const container = document.getElementById('recipes-grid');
    if (!container) return;

    container.innerHTML = recipes.map(recipe => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden recipe-card" data-recipe-id="${recipe.id}">
            <img src="${recipe.image}" alt="${recipe.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${recipe.category}</span>
                    <div class="flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        ${recipe.rating}
                    </div>
                </div>

                <h3 class="font-bold text-lg mb-2">${recipe.name}</h3>
                <p class="text-sm text-gray-600 mb-3" style="min-height: 60px;">${recipe.description}</p>

                <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>⏱️ ${recipe.prepTime + recipe.cookTime} min</span>
                    <span>👥 ${recipe.servings} servings</span>
                    <span>📊 ${recipe.difficulty}</span>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Adjust Servings:</label>
                    <input type="range" min="1" max="10" value="${recipe.servings}" 
                           class="w-full serving-slider h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span class="font-medium current-servings">${recipe.servings} servings</span>
                        <span>10</span>
                    </div>
                </div>

                <div class="flex space-x-2">
                    <button onclick="addRecipeToCart('${recipe.id}')" 
                            class="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors duration-200 text-sm">
                        Add Ingredients to Cart
                    </button>
                    <button onclick="showRecipeDetails('${recipe.id}')" 
                            class="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors duration-200 text-sm">
                        View Recipe
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateRecipeIngredients(recipeId, newServings) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const card = document.querySelector(`[data-recipe-id="${recipeId}"]`);
    if (!card) return;

    const currentServingsSpan = card.querySelector('.current-servings');
    if (currentServingsSpan) {
        currentServingsSpan.textContent = `${newServings} servings`;
    }
}

function initializeWhyMilletsPage() {
    // placeholder for charts
}

function initializeNutritionCharts() {
    // placeholder
}

function initializeBlogPage() {
    renderBlogPosts();
    const categoryFilter = document.getElementById('blog-category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterBlogPosts);
    }
}

function renderBlogPosts(postsToRender = blogPosts) {
    const container = document.getElementById('blog-posts');
    if (!container) return;

    container.innerHTML = postsToRender.map(post => `
        <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <img src="${post.image}" alt="${post.title}" class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${post.category}</span>
                    <span class="text-sm text-gray-500">${post.readTime}</span>
                </div>

                <h2 class="text-xl font-bold mb-3 text-gray-900 hover:text-green-600 transition-colors">
                    <a href="#" onclick="showBlogPost('${post.id}')">${post.title}</a>
                </h2>

                <p class="text-gray-600 mb-4">${post.excerpt}</p>

                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <div>
                            <p class="text-sm font-medium text-gray-900">${post.author}</p>
                            <p class="text-xs text-gray-500">${formatDate(post.publishDate)}</p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                            </svg>
                            ${post.likes}
                        </span>
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                            </svg>
                            ${post.comments}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Modal functions
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modal = createModal();
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-2xl font-bold text-gray-900">${product.name}</h2>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <div class="img-4-5"><img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover rounded-lg"></div>
                    </div>

                    <div>
                        <p class="text-lg text-gray-600 mb-4">${product.subtitle}</p>
                        <p class="text-gray-700 mb-4">${product.description}</p>

                        <div class="mb-4">
                            <h3 class="font-semibold mb-2">Health Benefits:</h3>
                            <div class="flex flex-wrap gap-2">
                                ${(product.healthBenefits || []).map(benefit => `<span class="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">${benefit}</span>`).join('')}
                            </div>
                        </div>

                        <div class="mb-4">
                            <h3 class="font-semibold mb-2">Nutritional Information (per 100g):</h3>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div>Protein: ${product.nutritionalInfo?.protein || '-'}</div>
                                <div>Calcium: ${product.nutritionalInfo?.calcium || '-'}</div>
                                <div>Iron: ${product.nutritionalInfo?.iron || '-'}</div>
                                <div>Fiber: ${product.nutritionalInfo?.fiber || '-'}</div>
                                <div>Calories: ${product.nutritionalInfo?.calories || '-'}</div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h3 class="font-semibold mb-2">Available Sizes:</h3>
                            <div class="flex gap-2">
                                ${(product.sizes || []).map(size => `<button class="size-button border px-3 py-1 rounded text-sm hover:bg-green-100" onclick="selectSize('${size}')">${size}</button>`).join('')}
                            </div>
                        </div>

                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-2">
                                <span class="text-2xl font-bold text-green-600">₹${product.price}</span>
                                <span class="text-lg text-gray-500 line-through">₹${product.originalPrice || ''}</span>
                            </div>
                            <div class="text-sm text-gray-500">
                                ⭐ ${product.rating || ''} (${product.reviews || 0} reviews)
                            </div>
                        </div>

                        <button onclick="addToCart('${product.id}'); closeModal();" 
                                class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function createModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    return modal;
}

function closeModal() {
    const modal = document.querySelector('.fixed.inset-0.z-50');
    if (modal) {
        modal.remove();
    }
}

// Utility functions (unchanged)
function showRecipeDetails(recipeId) {
    alert('Recipe details modal would open here. This is a demo implementation.');
}

function showBlogPost(postId) {
    alert('Blog post modal would open here. This is a demo implementation.');
}

function selectSize(size) {
    // Remove active class from all size buttons
    document.querySelectorAll('.size-button').forEach(btn => {
        btn.classList.remove('bg-green-100', 'border-green-500');
    });

    // Add active class to selected button (event.target if used in click)
    if (window.event && window.event.target) {
        window.event.target.classList.add('bg-green-100', 'border-green-500');
    }
}

function compareNutrition() {
    alert('Nutrition comparison feature would open here. This is a demo implementation.');
}

function filterBlogPosts() {
    const category = document.getElementById('blog-category-filter')?.value || 'all';

    let filteredPosts = blogPosts;
    if (category !== 'all') {
        filteredPosts = blogPosts.filter(post => post.category === category);
    }

    renderBlogPosts(filteredPosts);
}

// Contact form handling
function handleContactForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
    event.target.reset();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Expose functions globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.showProductDetails = showProductDetails;
window.showRecipeDetails = showRecipeDetails;
window.showBlogPost = showBlogPost;
window.addRecipeToCart = addRecipeToCart;
window.updateRecipeIngredients = updateRecipeIngredients;
window.closeModal = closeModal;
window.selectSize = selectSize;
window.compareNutrition = compareNutrition;
window.handleContactForm = handleContactForm;
