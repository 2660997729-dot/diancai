/**
 * 女友端 - 点单页面逻辑
 */

let currentCategory = 'all';
let cart = [];

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    renderCategories();
    renderProducts();
});

// ========== 分类渲染 ==========
function renderCategories() {
    const container = document.getElementById('categoryList');
    container.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) =>
        `<button class="cat-btn ${key === currentCategory ? 'active' : ''}" onclick="switchCategory('${key}')">
            ${cat.icon} ${cat.name}
        </button>`
    ).join('');
}

function switchCategory(cat) {
    currentCategory = cat;
    renderCategories();
    renderProducts();
}

// ========== 商品渲染 ==========
function renderProducts() {
    const products = getProducts();
    const filtered = currentCategory === 'all'
        ? products
        : products.filter(p => p.category === currentCategory);

    const container = document.getElementById('productsGrid');

    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">这个分类还没有商品哦~</p>';
        return;
    }

    container.innerHTML = filtered.map(p => `
        <div class="product-card" onclick="addToCart(${p.id})">
            <div class="product-emoji">${p.emoji || '🎁'}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price}</div>
            <div class="product-desc">${p.desc || ''}</div>
            <button class="product-add-btn" onclick="event.stopPropagation(); addToCart(${p.id})">
                <i class="fas fa-plus"></i> 加入购物车
            </button>
        </div>
    `).join('');
}

// ========== 购物车操作 ==========
function addToCart(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.productId === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            emoji: product.emoji,
            qty: 1
        });
    }

    saveCartToStorage();
    updateCartUI();
    showToast(`已添加 ${product.emoji} ${product.name}`, 'success');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartUI();
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    saveCartToStorage();
    updateCartUI();
}

function toggleCart() {
    const overlay = document.getElementById('cartOverlay');
    const sidebar = document.getElementById('cartSidebar');
    const isOpen = sidebar.classList.contains('show');

    if (isOpen) {
        overlay.classList.remove('show');
        sidebar.classList.remove('show');
    } else {
        overlay.classList.add('show');
        sidebar.classList.add('show');
        updateCartUI();
    }
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = count;

    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">购物车空空如也~ 快去选点什么吧！</p>';
        cartFooter.style.display = 'none';
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-emoji">${item.emoji || '🎁'}</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
                <button class="qty-btn" style="border-color:#ffcccc;color:#f5576c;" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');

        document.getElementById('cartCount').textContent = count;
        cartFooter.style.display = 'block';
    }
}

// ========== 下单 ==========
function submitOrder() {
    if (cart.length === 0) {
        showToast('购物车还是空的哦~', 'error');
        return;
    }

    const note = document.getElementById('cartNote').value.trim();

    const order = {
        items: JSON.parse(JSON.stringify(cart)),
        note: note
    };

    addOrder(order);

    // 显示成功动画
    showSuccessAnimation(() => {
        cart = [];
        document.getElementById('cartNote').value = '';
        saveCartToStorage();
        updateCartUI();
        toggleCart();
    });
}

function showSuccessAnimation(callback) {
    const div = document.createElement('div');
    div.className = 'success-animation';
    div.innerHTML = `
        <div class="success-icon">💖</div>
        <div class="success-text">下单成功！</div>
        <div class="success-sub">男朋友马上就会收到你的消息~</div>
    `;
    div.onclick = () => {
        div.remove();
        if (callback) callback();
    };
    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
        if (callback) callback();
    }, 2500);
}

// ========== 存储 ==========
function saveCartToStorage() {
    localStorage.setItem('menu_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const data = localStorage.getItem('menu_cart');
    if (data) {
        cart = JSON.parse(data);
    }
    updateCartUI();
}

// ========== Toast ==========
function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast ' + type + ' show';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}
