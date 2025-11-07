// Fiber Fit Aata - Main JavaScript (Fixed & Improved)
// Global variables
let cart = JSON.parse(localStorage.getItem('fiberFitCart')) || [];
let products = [];
let recipes = [];
let blogPosts = [];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Fiber Fit Aata...');
    initializeApp();
});

// Main initialization
async function initializeApp() {
    try {
        showLoadingState();
        await loadData();
        updateCartDisplay();
        
        const currentPage = getCurrentPage();
        console.log('Current page:', currentPage);
        
        // Initialize page-specific features
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
            case 'blog':
                initializeBlogPage();
                break;
        }
        
        initializeCommonFeatures();
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showErrorMessage('Failed to load application. Please refresh the page.');
    }
}

// Load JSON data with proper error handling
async function loadData() {
    try {
        console.log('Loading data from JSON files...');
        
        const responses = await Promise.allSettled([
            fetch('data/products.json'),
            fetch('data/recipes.json'),
            fetch('data/blog-posts.json')
        ]);
        
        // Handle products
        if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
            const data = await responses[0].value.json();
            products = data.products || [];
            console.log(`Loaded ${products.length} products`);
        } else {
            console.error('Failed to load products');
        }

        // Handle recipes
        if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
            const data = await responses[1].value.json();
            recipes = data.recipes || [];
            console.log(`Loaded ${recipes.length} recipes`);
        } else {
            console.error('Failed to load recipes');
        }
        
        // Handle blog posts
        if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
            const data = await responses[2].value.json();
            blogPosts = data.blogPosts || [];
            console.log(`Loaded ${blogPosts.length} blog posts`);
        } else {
            console.error('Failed to load blog posts');
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';
    return page;
}

// Shopping Cart Functions
function addToCart(productId, quantity = 1, size = '500g') {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        showErrorMessage('Product not found');
        return;
    }
    
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
    
    // Update cart count badges
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
        element.classList.toggle('hidden', cartCount === 0);
    });
    
    // Update cart total
    const cartTotalElements = document.querySelectorAll('.cart-total');
    cartTotalElements.forEach(element => {
        element.textContent = `₹${cartTotal.toFixed(2)}`;
    });
    
    // Update cart items container
    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        renderCartItems(cartItemsContainer);
    }
}

function renderCartItems(container) {
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <p class="text-gray-600 font-medium">Your cart is empty</p>
                <p class="text-sm text-gray-500 mt-2">Add some nutritious millets to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm mb-2">
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
                    class="text-red-500 hover:text-red-700 text-lg font-bold">×</button>
        </div>
    `).join('');
}

function saveCart() {
    localStorage.setItem('fiberFitCart', JSON.stringify(cart));
}

function showCartNotification(productName) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="font-medium">Added ${productName} to cart!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Recipe Functions
function addRecipeToCart(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    let addedCount = 0;
    recipe.ingredients.forEach(ingredient => {
        if (ingredient.productId) {
            addToCart(ingredient.productId);
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        showCartNotification(`${addedCount} ingredients from ${recipe.name}`);
    }
}

// Common Features
function initializeCommonFeatures() {
    initializeNavigation();
    initializeAnimations();
    initializeScrollEffects();
}

function initializeNavigation() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', () => {
            // You can implement a cart sidebar here
            console.log('Cart clicked');
        });
    }
}

function initializeAnimations() {
    // Initialize Typed.js for hero text
    if (typeof Typed !== 'undefined') {
        const heroTyped = document.getElementById('hero-typed');
        if (heroTyped) {
            new Typed('#hero-typed', {
                strings: [
                    'Millets in Every Meal',
                    'Ancient Wisdom, Modern Health',
                    'Sustainable Nutrition for All'
                ],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true
            });
        }
    }
}

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
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.scroll-animate, .counter').forEach(el => {
        observer.observe(el);
    });
}

function animateCounter(element) {
    const target = parseInt(element.dataset.target);
    const duration = parseInt(element.dataset.duration) || 2000;
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

// Page-specific initialization
function initializeHomePage() {
    console.log('Initializing home page...');
    
    // Initialize product carousel
    if (typeof Splide !== 'undefined') {
        const productCarousel = document.getElementById('product-carousel');
        if (productCarousel) {
            new Splide('#product-carousel', {
                type: 'loop',
                perPage: 4,
                perMove: 1,
                gap: '1rem',
                autoplay: true,
                interval: 3000,
                breakpoints: {
                    1024: { perPage: 3 },
                    768: { perPage: 2 },
                    480: { perPage: 1 }
                }
            }).mount();
        }
    }
}

function initializeProductsPage() {
    console.log('Initializing products page...');
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

function filterProducts(category = 'all', searchTerm = '') {
    let filtered = products;
    
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term)
        );
    }
    
    return filtered;
}

function renderProducts(productsToRender = products) {
    const container = document.getElementById('products-grid');
    if (!container) return;
    
    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="text-center col-span-full text-gray-500">No products found</p>';
        return;
    }

    container.innerHTML = productsToRender.map(product => `
        <div class="product-card">
            <div class="relative">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="absolute top-2 right-2 product-badge">
                    Save ₹${product.originalPrice - product.price}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${product.name}</h3>
                <p class="text-sm text-gray-600 mb-2">${product.subtitle}</p>
                <p class="text-xs text-gray-500 mb-3 line-clamp-2">${product.description}</p>
                
                <div class="flex flex-wrap gap-1 mb-3">
                    ${product.healthBenefits.slice(0, 3).map(benefit => 
                        `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${benefit}</span>`
                    ).join('')}
                </div>
                
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <span class="product-price">₹${product.price}</span>
                        <span class="text-sm text-gray-500 line-through ml-2">₹${product.originalPrice}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        ${product.rating}
                    </div>
                </div>
                
                <button onclick="addToCart('${product.id}')" 
                        class="w-full btn-primary text-center">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function initializeRecipesPage() {
    console.log('Initializing recipes page...');
    renderRecipes();
}

function renderRecipes() {
    const container = document.getElementById('recipes-grid');
    if (!container) return;
    
    if (recipes.length === 0) {
        container.innerHTML = '<p class="text-center col-span-full text-gray-500">No recipes found</p>';
        return;
    }

    container.innerHTML = recipes.map(recipe => `
        <div class="card">
            <img src="${recipe.image}" alt="${recipe.name}" class="w-full h-48 object-cover rounded-lg mb-4">
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
            
            <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>⏱️ ${recipe.prepTime + recipe.cookTime} min</span>
                <span>👥 ${recipe.servings} servings</span>
                <span>📊 ${recipe.difficulty}</span>
            </div>
            
            <button onclick="addRecipeToCart('${recipe.id}')" 
                    class="w-full btn-primary text-center">
                Add Ingredients to Cart
            </button>
        </div>
    `).join('');
}

function initializeBlogPage() {
    console.log('Initializing blog page...');
    renderBlogPosts();
}

function renderBlogPosts() {
    const container = document.getElementById('blog-posts');
    if (!container) return;
    
    if (blogPosts.length === 0) {
        container.innerHTML = '<p class="text-center col-span-full text-gray-500">No blog posts found</p>';
        return;
    }
    
    container.innerHTML = blogPosts.map(post => `
        <article class="card">
            <img src="${post.image}" alt="${post.title}" class="w-full h-48 object-cover rounded-lg mb-4">
            <div class="flex items-center justify-between mb-2">
                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${post.category}</span>
                <span class="text-sm text-gray-500">${post.readTime}</span>
            </div>
            
            <h2 class="text-xl font-bold mb-3">${post.title}</h2>
            <p class="text-gray-600 mb-4">${post.excerpt}</p>
            
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div>
                        <p class="text-sm font-medium">${post.author}</p>
                        <p class="text-xs text-gray-500">${formatDate(post.publishDate)}</p>
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

// Utility Functions
function showLoadingState() {
    const loader = document.getElementById('app-loader');
    if (loader) loader.classList.remove('hidden');
}

function hideLoadingState() {
    const loader = document.getElementById('app-loader');
    if (loader) loader.classList.add('hidden');
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-20 right-4 alert-error z-50 max-w-md';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => document.body.removeChild(errorDiv), 5000);
}

console.log('Main.js loaded successfully');
