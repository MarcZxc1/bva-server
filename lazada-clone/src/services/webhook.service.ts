// Webhook Service for Lazada-Clone
// Sends real-time updates to BVA Server when data changes

import axios from 'axios';

class WebhookService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.NEXT_PUBLIC_BVA_WEBHOOK_URL || 'http://localhost:3000/api/webhooks';
  }

  // Get user data from localStorage (browser only)
  private getUserData() {
    if (typeof window === 'undefined') {
      return { userId: null, shopId: null, token: null };
    }

    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) {
        return { userId: null, shopId: null, token: null };
      }

      const { state } = JSON.parse(authStorage);
      const { user, shops, token } = state || {};

      return {
        userId: user?.id,
        shopId: shops?.[0]?.id, // Use first shop
        token: token
      };
    } catch (error) {
      console.error('Failed to get user data:', error);
      return { userId: null, shopId: null, token: null };
    }
  }

  // Send webhook to BVA Server
  private async sendWebhook(endpoint: string, data: any) {
    const { shopId, token } = this.getUserData();

    if (!shopId || !token) {
      console.warn('⚠️ No shop or token found, skipping webhook');
      return;
    }

    try {
      console.log(`📤 Sending webhook to BVA: ${endpoint}`, { shopId, data });
      
      await axios.post(
        `${this.webhookUrl}${endpoint}`,
        { ...data, shopId }, // Include shopId in payload
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Webhook sent successfully: ${endpoint}`);
    } catch (error: any) {
      console.error('❌ Webhook failed:', error.response?.data || error.message);
    }
  }

  // ============================================
  // PRODUCT WEBHOOKS
  // ============================================

  async sendProductCreated(product: any) {
    await this.sendWebhook('/products/created', {
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      cost: product.cost,
      stock: product.stock || product.quantity,
      image: product.image || product.imageUrl,
      description: product.description,
      category: product.category,
      isActive: product.isActive ?? true
    });
  }

  async sendProductUpdated(product: any) {
    await this.sendWebhook('/products/updated', {
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      cost: product.cost,
      stock: product.stock || product.quantity,
      image: product.image || product.imageUrl,
      description: product.description,
      category: product.category,
      isActive: product.isActive ?? true
    });
  }

  async sendProductDeleted(productId: string) {
    await this.sendWebhook('/products/deleted', { id: productId });
  }

  // ============================================
  // ORDER WEBHOOKS
  // ============================================

  async sendOrderCreated(order: any) {
    await this.sendWebhook('/orders/created', {
      id: order.id || order._id,
      total: order.total,
      items: order.items,
      status: order.status || 'pending',
      buyerId: order.buyerId,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod
    });
  }

  async sendOrderUpdated(order: any) {
    await this.sendWebhook('/orders/updated', {
      id: order.id || order._id,
      total: order.total,
      items: order.items,
      status: order.status,
      buyerId: order.buyerId
    });
  }

  async sendOrderStatusChanged(orderId: string, status: string) {
    await this.sendWebhook('/orders/status-changed', { 
      id: orderId, 
      status 
    });
  }

  // ============================================
  // INVENTORY WEBHOOKS
  // ============================================

  async sendInventoryUpdated(productId: string, quantity: number) {
    await this.sendWebhook('/inventory/updated', { 
      productId, 
      quantity 
    });
  }

  // ============================================
  // BATCH SYNC WEBHOOK
  // ============================================

  async sendBatchSync(data: { products?: any[], orders?: any[] }) {
    await this.sendWebhook('/sync/batch', data);
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
