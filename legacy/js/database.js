/**
 * ==========================================
 * MediMart - Database Layer (API Version)
 * ==========================================
 * Handles all data operations using Backend API
 */

class Database {
    constructor() {
        this.API_URL = 'http://localhost:3001/api';
        this.currentUser = JSON.parse(localStorage.getItem('medimart_current_user')) || null;
    }

    // Helper for API calls
    async apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(`${this.API_URL}${endpoint}`, options);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error ${endpoint}:`, error);
            return { success: false, message: 'Network error' };
        }
    }

    // ==========================================
    // Product Operations
    // ==========================================

    async getProducts() {
        const res = await this.apiCall('/products');
        return res.success ? res.data : [];
    }

    async getProductById(id) {
        // Optimistic check? Or fetch fresh? Fetch fresh is safer.
        const res = await this.apiCall(`/products/${id}`);
        return res.success ? res.data : null;
    }

    async addProduct(product) {
        // Ensure seller info is attached
        if (this.currentUser) {
            product.seller_id = this.currentUser.id;
            product.seller_name = this.currentUser.name;
        }

        const res = await this.apiCall('/products', 'POST', product);
        return res.success ? res.data : null;
    }

    async updateProduct(id, product) {
        const res = await this.apiCall(`/products/${id}`, 'PUT', product);
        return res.success;
    }

    async deleteProduct(id) {
        const res = await this.apiCall(`/products/${id}`, 'DELETE');
        return res.success;
    }

    async searchProducts(query) {
        // Client-side filtering for MVP (fetch all, then filter)
        // Ideally backend search
        const products = await this.getProducts();
        const lowerQuery = query.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery)
        );
    }

    async getUserProducts() {
        if (!this.currentUser) return [];
        // Fetch all and filter (MVP)
        const products = await this.getProducts();
        return products.filter(p => String(p.seller_id) === String(this.currentUser.id));
    }

    // ==========================================
    // Cart Operations
    // ==========================================

    // Sync cart from DB
    async getCart() {
        if (!this.currentUser) return [];
        const res = await this.apiCall(`/cart/${this.currentUser.id}`);
        // Map backend response to expected frontend format
        // Backend: { id, product_id, quantity, name, price, ... }
        // Frontend expects: { productId, quantity, product: { ... } }
        if (res.success) {
            return res.data.map(item => ({
                productId: item.product_id,
                quantity: item.quantity,
                product: {
                    id: item.product_id,
                    name: item.product_name,
                    price: Number(item.price), // ensure number
                    stock: item.stock,
                    image: item.image,
                    icon: item.icon,
                    sellerId: item.seller_id,
                    sellerName: item.seller_name
                }
            }));
        }
        return [];
    }

    async addToCart(productId, quantity = 1) {
        if (!this.currentUser || this.currentUser.role === 'admin') return false;

        const res = await this.apiCall('/cart', 'POST', {
            userId: this.currentUser.id,
            productId,
            quantity
        });
        return res.success;
    }

    async updateCartQuantity(productId, quantity) {
        if (!this.currentUser) return false;

        const res = await this.apiCall('/cart', 'PUT', {
            userId: this.currentUser.id,
            productId,
            quantity
        });
        return res.success;
    }

    async getCartTotal() {
        const cart = await this.getCart();
        return cart.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);
    }

    async getCartItemCount() {
        const cart = await this.getCart();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    async clearCart() {
        if (!this.currentUser) return;
        await this.apiCall(`/cart/${this.currentUser.id}`, 'DELETE');
    }

    // ==========================================
    // Checkout & Orders
    // ==========================================

    async checkout(shippingInfo, paymentMethod, promo = null) {
        const items = await this.getCart();
        if (items.length === 0) return { success: false, message: 'Cart Empty' };

        const subtotal = await this.getCartTotal();
        let total = subtotal;
        let discount = 0;

        if (promo) {
            if (promo.discount < 1) {
                discount = subtotal * promo.discount;
            } else {
                discount = promo.discount;
            }
            total = subtotal - discount;
        }

        const payload = {
            userId: this.currentUser.id,
            items: items,
            total,
            subtotal,
            discount,
            shipping: shippingInfo,
            payment: paymentMethod,
            promoCode: promo ? promo.code : null
        };

        const res = await this.apiCall('/orders', 'POST', payload);

        if (res.success) {
            return {
                success: true,
                items,
                total,
                orderId: res.data.orderId
            };
        } else {
            return { success: false, message: res.message };
        }
    }

    async getUserOrders() {
        if (!this.currentUser) return [];
        const res = await this.apiCall(`/orders/${this.currentUser.id}`);
        // Backend returns orders with items array
        return res.success ? res.data : [];
    }

    // Cancel entire order
    async cancelOrder(orderId) {
        const res = await this.apiCall(`/orders/${orderId}/cancel`, 'POST');
        return res.success;
    }

    // Seller: Accept specific item
    async acceptSellerItem(orderId, productId, sellerId) {
        const res = await this.apiCall(`/orders/${orderId}/items/${productId}/status`, 'PUT', { status: 'success' });
        return res.success;
    }

    // Seller: Reject specific item
    async rejectSellerItem(orderId, productId, sellerId) {
        const res = await this.apiCall(`/orders/${orderId}/items/${productId}/status`, 'PUT', { status: 'rejected' });
        return res; // expect {success, message}
    }

    // Customer: Cancel specific item
    async cancelOrderItem(orderId, productId) {
        const res = await this.apiCall(`/orders/${orderId}/items/${productId}/status`, 'PUT', { status: 'cancelled' });
        return res;
    }


    // ==========================================
    // Authentication
    // ==========================================

    async authenticate(username, password) {
        const res = await this.apiCall('/auth/login', 'POST', { username, password });
        if (res.success) {
            this.currentUser = res.data;
            localStorage.setItem('medimart_current_user', JSON.stringify(this.currentUser));
            return {
                success: true,
                user: this.currentUser,
                message: 'Login successful'
            };
        }
        return {
            success: false,
            message: res.message || 'Login failed'
        };
    }

    // Alias for authenticate
    async login(username, password) {
        return this.authenticate(username, password);
    }

    async register(userData) {
        const res = await this.apiCall('/auth/register', 'POST', userData);
        return res.success;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('medimart_current_user');
        localStorage.removeItem('medimart_cart'); // Clear local cart cache if any
    }

    // ==========================================
    // Utils
    // ==========================================

    // Kept for compatibility, though we don't use localStorage for data anymore
    load(key) { return null; }
    save(key, data) { }
}

const db = new Database();
