// src/services/webhook.service.ts
// Service to send webhooks to BVA server when data changes in Shopee-Clone

const BVA_WEBHOOK_BASE_URL = import.meta.env.VITE_BVA_WEBHOOK_URL || '/api/webhooks';

class WebhookService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
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

      await fetch(`${BVA_WEBHOOK_BASE_URL}/products/created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: product.id,
          productId: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          sku: product.sku,
          category: product.category,
          image: product.imageUrl,
          imageUrl: product.imageUrl,
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

      await fetch(`${BVA_WEBHOOK_BASE_URL}/products/updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: product.id,
          productId: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
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

      await fetch(`${BVA_WEBHOOK_BASE_URL}/products/deleted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: productId,
          productId,
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

      await fetch(`${BVA_WEBHOOK_BASE_URL}/orders/created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: order.id,
          orderId: order.id,
          shopId: order.shopId, // Include shopId from order
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

      await fetch(`${BVA_WEBHOOK_BASE_URL}/orders/updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: order.id,
          orderId: order.id,
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

      await fetch(`${BVA_WEBHOOK_BASE_URL}/orders/status-changed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: orderId,
          orderId,
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

      await fetch(`${BVA_WEBHOOK_BASE_URL}/inventory/updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
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

