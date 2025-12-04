import { Request, Response } from "express";
export declare class NotificationController {
    getNotifications(req: Request, res: Response): Promise<void>;
    markAsRead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    markAllAsRead(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=notification.controller.d.ts.map