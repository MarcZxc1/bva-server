// src/services/webhook.service.ts
// Service to send webhooks to BVA server when data changes in Shopee-Clone

const BVA_WEBHOOK_BASE_URL = import.meta.env.VITE_BVA_WEBHOOK_URL || '/api/webhooks';

class WebhookService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getUserData(): { shopId: string | null; userId: string | null } {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return { shopId: null, userId: null };
      
      const user = JSON.parse(userStr);
      const shopId = user?.shops?.[0]?.id || null;
      const userId = user?.id || null;
      
      return { shopId, userId };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return { shopId: null, userId: null };
    }
  }

  /**
   * Send product created webhook to BVA server
   */
  async sendProductCreated(product: any): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for webhook');
        return;
      }

      const { shopId } = this.getUserData();
      if (!shopId) {
        console.warn('No shop ID available for webhook');
        return;
      }

      await fetch(`${BVA_WEBHOOK_BASE_URL}/products/created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: product.id,
          productId: product.id,
          shopId: shopId, // Include shopId from user context
          name: product.name,
          description: product.description,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          sku: product.sku,
          category: product.category,
          image: product.imageUrl,
          imageUrl: product.imageUrl,
          expiryDate: product.expiryDate,
        }),
      });
    } catch (error) {
      console.error('Error sending product created webhook:', error);
      // Don't throw - webhook failures shouldn't break the main flow
    }
  }

  /**
   * Send product updated webhook to BVA server
   */
  async sendProductUpdated(product: any): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for webhook');
        return;
      }

      const { shopId } = this.getUserData();
      if (!shopId) {
        console.warn('No shop ID available for webhook');
        return;
      }

      await fetch(`${BVA_WEBHOOK_BASE_URL}/products/updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: product.id,
          productId: product.id,
          shopId: shopId, // Include shopId from user context
          name: product.name,
          description: product.description,
          price: product.price,
          expiryDate: product.expiryDate,
          cost: product.cost,
          stock: product.stock,
          sku: product.sku,
          category: product.category,
          image: product.imageUrl,
          imageUrl: product.imageUrl,
        }),
      });
    } catch (error) {
      console.error('Error sending product updated webhook:', error);
    }
  }

  /**
   * Send product deleted webhook to BVA server
   */
  async sendProductDeleted(productId: string): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for webhook');
        return;
      }

      const { shopId } = this.getUserData();
      if (!shopId) {
        console.warn('No shop ID available for webhook');
        return;
      }

      await fetch(`${BVA_WEBHOOK_BASE_URL}/products/deleted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: productId,
          productId,
          shopId: shopId, // Include shopId from user context
        }),
      });
    } catch (error) {
      console.error('Error sending product deleted webhook:', error);
    }
  }

  /**
   * Send order created webhook to BVA server
   */
  async sendOrderCreated(order: any): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for webhook');
        return;
      }

      // Get shopId from order or user context
      const { shopId: userShopId } = this.getUserData();
      const shopId = order.shopId || userShopId;
      
      if (!shopId) {
        console.warn('No shop ID available for webhook');
        return;
      }

      await fetch(`${BVA_WEBHOOK_BASE_URL}/orders/created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: order.id,
          orderId: order.id,
          shopId: shopId, // Include shopId from order or user context
          items: order.items || [],
          total: order.total || order.totalPrice,
          totalPrice: order.total || order.totalPrice,
          status: order.status,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          createdAt: order.createdAt,
        }),
      });
    } catch (error) {
      console.error('Error sending order created webhook:', error);
    }
  }

  /**
   * Send order updated webhook to BVA server
   */
  async sendOrderUpdated(order: any): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for webhook');
        return;
      }

      const { shopId: userShopId } = this.getUserData();
      const shopId = order.shopId || userShopId;
      
      if (!shopId) {
        console.warn('No shop ID available for webhook');
        return;
      }

      await fetch(`${BVA_WEBHOOK_BASE_URL}/orders/updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: order.id,
          orderId: order.id,
          shopId: shopId, // Include shopId
          items: order.items || [],
          total: order.total || order.totalPrice,
          totalPrice: order.total || order.totalPrice,
          status: order.status,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
        }),
      });
    } catch (error) {
      console.error('Error sending order updated webhook:', error);
    }
  }

  /**
   * Send order status changed webhook to BVA server
   */
  async sendOrderStatusChanged(orderId: string, status: string): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for webhook');
        return;
      }

      const { shopId } = this.getUserData();
      if (!shopId) {
        console.warn('No shop ID available for webhook');
        return;
      }

      await fetch(`${BVA_WEBHOOK_BASE_URL}/orders/status-changed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: orderId,
          orderId,
          shopId: shopId, // Include shopId
          status,
        }),
      });
    } catch (error) {
      console.error('Error sending order status changed webhook:', error);
    }
  }

  /**
   * Send inventory updated webhook to BVA server
   */
  async sendInventoryUpdated(productId: string, quantity: number, threshold?: number): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for webhook');
        return;
      }

      const { shopId } = this.getUserData();
      if (!shopId) {
        console.warn('No shop ID available for webhook');
        return;
      }

      await fetch(`${BVA_WEBHOOK_BASE_URL}/inventory/updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          shopId: shopId, // Include shopId
          quantity,
          stock: quantity,
          threshold,
        }),
      });
    } catch (error) {
      console.error('Error sending inventory updated webhook:', error);
    }
  }
}

export const webhookService = new WebhookService();
export default webhookService;

