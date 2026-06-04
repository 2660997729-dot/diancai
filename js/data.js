/**
 * 数据层 - Firebase Firestore 云同步版
 * 女友下单 → 云数据库 → 男友秒收！
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

// ========== Firebase 初始化 ==========
let db = null;
let firebaseReady = false;

function initFirebase() {
    try {
        firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.firestore();
        db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        firebaseReady = true;
        console.log('✅ Firebase 云同步已连接');
    } catch (e) {
        console.warn('Firebase 连接失败，使用本地存储:', e.message);
        firebaseReady = false;
    }
}

async function initDefaultProducts() {
    if (!firebaseReady) return;
    try {
        const snapshot = await db.collection('products').limit(1).get();
        if (snapshot.empty) {
            const batch = db.batch();
            DEFAULT_PRODUCTS.forEach(p => {
                const ref = db.collection('products').doc(String(p.id));
                batch.set(ref, p);
            });
            await batch.commit();
            console.log('✅ 默认商品已写入云端');
        }
    } catch (e) { console.warn('初始化商品失败:', e.message); }
}

// ========== 产品CRUD ==========
async function getProducts() {
    if (!firebaseReady) {
        const d = localStorage.getItem('menu_products');
        return d ? JSON.parse(d) : DEFAULT_PRODUCTS;
    }
    try {
        const snapshot = await db.collection('products').orderBy('id').get();
        const products = [];
        snapshot.forEach(doc => products.push(doc.data()));
        return products.length > 0 ? products : DEFAULT_PRODUCTS;
    } catch (e) { return DEFAULT_PRODUCTS; }
}

async function addProduct(product) {
    if (!firebaseReady) {
        const ps = JSON.parse(localStorage.getItem('menu_products') || '[]');
        product.id = ps.length > 0 ? Math.max(...ps.map(p => p.id)) + 1 : 1;
        ps.push(product);
        localStorage.setItem('menu_products', JSON.stringify(ps));
        return product;
    }
    const snapshot = await db.collection('products').orderBy('id', 'desc').limit(1).get();
    product.id = snapshot.empty ? 1 : snapshot.docs[0].data().id + 1;
    await db.collection('products').doc(String(product.id)).set(product);
    return product;
}

async function updateProduct(id, updates) {
    if (!firebaseReady) {
        const ps = JSON.parse(localStorage.getItem('menu_products') || '[]');
        const i = ps.findIndex(p => p.id === id);
        if (i !== -1) { ps[i] = { ...ps[i], ...updates }; localStorage.setItem('menu_products', JSON.stringify(ps)); }
        return;
    }
    await db.collection('products').doc(String(id)).update(updates);
}

async function deleteProduct(id) {
    if (!firebaseReady) {
        const ps = JSON.parse(localStorage.getItem('menu_products') || '[]').filter(p => p.id !== id);
        localStorage.setItem('menu_products', JSON.stringify(ps));
        return;
    }
    await db.collection('products').doc(String(id)).delete();
}

// ========== 订单CRUD ==========
async function getOrders() {
    if (!firebaseReady) {
        const d = localStorage.getItem('menu_orders');
        return d ? JSON.parse(d) : [];
    }
    try {
        const snapshot = await db.collection('orders').orderBy('time', 'desc').get();
        const orders = [];
        snapshot.forEach(doc => orders.push({ _firestoreId: doc.id, ...doc.data() }));
        return orders;
    } catch (e) { return []; }
}

async function addOrder(order) {
    order.status = 'pending';
    order.time = new Date().toISOString();
    order.timeDisplay = new Date().toLocaleString('zh-CN');

    if (!firebaseReady) {
        const orders = JSON.parse(localStorage.getItem('menu_orders') || '[]');
        order.id = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
        orders.unshift(order);
        localStorage.setItem('menu_orders', JSON.stringify(orders));
        return order;
    }
    const docRef = await db.collection('orders').add(order);
    order._firestoreId = docRef.id;
    return order;
}

async function markOrderDone(firestoreId) {
    if (!firebaseReady) {
        const orders = JSON.parse(localStorage.getItem('menu_orders') || '[]');
        const o = orders.find(x => x.id == firestoreId || x._firestoreId === firestoreId);
        if (o) { o.status = 'done'; localStorage.setItem('menu_orders', JSON.stringify(orders)); }
        return;
    }
    await db.collection('orders').doc(firestoreId).update({ status: 'done' });
}

async function deleteOrder(firestoreId) {
    if (!firebaseReady) {
        const orders = JSON.parse(localStorage.getItem('menu_orders') || '[]')
            .filter(x => x.id != firestoreId && x._firestoreId !== firestoreId);
        localStorage.setItem('menu_orders', JSON.stringify(orders));
        return;
    }
    await db.collection('orders').doc(firestoreId).delete();
}

async function getPendingCount() {
    if (!firebaseReady) {
        const orders = JSON.parse(localStorage.getItem('menu_orders') || '[]');
        return orders.filter(o => o.status === 'pending').length;
    }
    try {
        const snapshot = await db.collection('orders').where('status', '==', 'pending').get();
        return snapshot.size;
    } catch (e) { return 0; }
}

// 实时监听订单变化（后台用）
function onOrdersSnapshot(callback) {
    if (!firebaseReady) return () => {};
    return db.collection('orders').orderBy('time', 'desc')
        .onSnapshot(snapshot => {
            const orders = [];
            snapshot.forEach(doc => orders.push({ _firestoreId: doc.id, ...doc.data() }));
            callback(orders);
        }, err => console.warn('订单监听出错:', err.message));
}

// 初始化
initFirebase();
