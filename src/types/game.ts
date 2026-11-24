export type GamePhase = 'intro' | 'sales' | 'warehouse' | 'accounting' | 'summary';

export interface Product {
    id: string;
    name: string;
    materialNumber: string;
    unitPrice: number;
    color: string;
    iconType: 'pc' | 'mug' | 'keyboard' | 'banana' | 'broken_printer' | 'duck';
    isDistractor?: boolean;
}

export interface OrderItem {
    product: Product;
    quantity: number;
}

export interface CustomerScenario {
    id: string;
    customerName: string;
    customerHandle: string;
    avatarBg: string;
    avatarInitials: string;
    openingMessage: string;
    items: OrderItem[];
    negotiationPrompt: string;
    options: {
        id: string;
        label: string;
        discountPercent: number;
        bonusItem?: OrderItem;
        customerReply: string;
        satisfactionDelta: number;
        scoreBonus: number;
    }[];
}

export interface SapLogEntry {
    id: string;
    module: 'SD' | 'MM' | 'EWM' | 'FI' | 'CO';
    tcode: string;
    message: string;
    timestamp: string;
}

export interface ReceiptPrintPayload {
    company: string;
    department: string;
    employeeName: string;
    customerName: string;
    orderNumber: string;
    invoiceNumber: string;
    items: {
        materialNumber: string;
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    grandTotal: number;
    durationSeconds: number;
    satisfactionScore: number;
    rankTitle: string;
    printedAt: string;
}