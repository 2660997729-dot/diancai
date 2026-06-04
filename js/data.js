/**
 * 数据层 - 商品和订单的增删改查，使用localStorage存储
 */

// ========== 默认商品数据 ==========
const DEFAULT_PRODUCTS = [
    { id: 1, name: '冰淇淋', category: 'food', price: '一个抱抱', emoji: '🍦', desc: '夏天到了，来个冰淇淋吧~' },
    { id: 2, name: '珍珠奶茶', category: 'drink', price: '亲一口', emoji: '🧋', desc: '少糖去冰，加珍珠！' },
    { id: 3, name: '草莓蛋糕', category: 'food', price: '陪我看电影', emoji: '🍰', desc: '甜甜的草莓蛋糕，心情美美哒' },
    { id: 4, name: '打视频电话', category: 'love', price: '免费', emoji: '📹', desc: '想你了，打视频看看你~' },
    { id: 5, name: '一起散步', category: 'activity', price: '30分钟', emoji: '🚶', desc: '饭后一起散散步，聊聊天' },
    { id: 6, name: '分享日常', category: 'love', price: '免费', emoji: '📸', desc: '今天发生了什么有趣的事？' },
    { id: 7, name: '抱抱', category: 'love', price: '免费', emoji: '🤗', desc: '就要抱抱！' },
    { id: 8, name: '一起追剧', category: 'activity', price: '2小时', emoji: '📺', desc: '窝在沙发一起看剧~' },
    { id: 9, name: '芒果冰沙', category: 'drink', price: '说爱我', emoji: '🥭', desc: '冰冰凉凉，超级解暑' },
    { id: 10, name: '做一顿饭', category: 'activity', price: '夸我漂亮', emoji: '🍳', desc: '给你做顿好吃的！' },
    { id: 11, name: '晚安故事', category: 'love', price: '免费', emoji: '🌙', desc: '睡前讲个小故事给我听~' },
    { id: 12, name: '巧克力', category: 'food', price: '一个亲亲', emoji: '🍫', desc: '心情不好就要吃巧克力' },
];

// ========== 分类配置 ==========
const CATEGORIES = {
    all: { name: '全部', icon: '🌟' },
    food: { name: '好吃的', icon: '🍔' },
    drink: { name: '好喝的', icon: '🥤' },
    activity: { name: '想做的事', icon: '🎯' },
    love: { name: '恋爱互动', icon: '💕' },
};

// ========== 产品CRUD ==========
function getProducts() {
    const data = localStorage.getItem('menu_products');
    if (!data) {
        saveProducts(DEFAULT_PRODUCTS);
        return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    }
    return JSON.parse(data);
}

function saveProducts(products) {
    localStorage.setItem('menu_products', JSON.stringify(products));
}

function addProduct(product) {
    const products = getProducts();
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    product.id = newId;
    products.push(product);
    saveProducts(products);
    return product;
}

function updateProduct(id, updates) {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...updates };
        saveProducts(products);
    }
}

function deleteProduct(id) {
    let products = getProducts();
    products = products.filter(p => p.id !== id);
    saveProducts(products);
}

// ========== 订单CRUD ==========
function getOrders() {
    const data = localStorage.getItem('menu_orders');
    return data ? JSON.parse(data) : [];
}

function saveOrders(orders) {
    localStorage.setItem('menu_orders', JSON.stringify(orders));
}

function addOrder(order) {
    const orders = getOrders();
    const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    order.id = newId;
    order.status = 'pending'; // pending | done
    order.time = new Date().toLocaleString('zh-CN');
    orders.unshift(order);
    saveOrders(orders);
    return order;
}

function markOrderDone(id) {
    const orders = getOrders();
    const order = orders.find(o => o.id === id);
    if (order) {
        order.status = 'done';
        saveOrders(orders);
    }
}

function deleteOrder(id) {
    let orders = getOrders();
    orders = orders.filter(o => o.id !== id);
    saveOrders(orders);
}

function getPendingCount() {
    return getOrders().filter(o => o.status === 'pending').length;
}
