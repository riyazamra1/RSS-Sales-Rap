export type CustomerType = "Retail" | "Wholesale" | "Dealer" | "Corporate" | "Other";
export type CustomerStatus = "Active" | "Inactive" | "Blocked";
export type Customer = {
  id: string; name: string; company: string; contactPerson: string; phone: string;
  whatsapp: string; email: string; address: string; city: string; type: CustomerType;
  creditLimit: number; paymentTerms: string; rep: string; openingBalance: number;
  outstanding: number; totalPurchases: number; totalPayments: number;
  lastOrderDate: string; lastPaymentDate: string; status: CustomerStatus;
};
export type Bill = { date: string; invoiceNo: string; orderNo: string; total: number; paid: number; status: "PAID" | "PARTIAL" | "UNPAID" };
export type StockStatus = "IN STOCK" | "LOW STOCK" | "OUT OF STOCK";
export type Product = {
  id: string; sku: string; barcode: string; name: string; brand: string; model: string;
  category: string; description: string; unit: string; purchasePrice: number;
  wholesalePrice: number; salesPrice: number; stock: number; minStock: number;
  supplier: string; warranty: string; status: "Active" | "Disabled";
};
export type OrderStatus = "Draft" | "Pending" | "Confirmed" | "Processing" | "Completed" | "Cancelled" | "Returned";
export type Order = {
  id: string; invoiceId: string; date: string; customerId: string; customerName: string;
  rep: string; netTotal: number; payment: number; status: OrderStatus;
  sync: "SYNCED" | "PENDING SYNC" | "SYNC FAILED";
  items: { productId: string; name: string; qty: number; unitPrice: number; discount: number }[];
};
export type Payment = {
  id: string; date: string; customerId: string; customerName: string; invoiceId: string;
  amount: number; method: "Cash" | "Bank Transfer" | "Card" | "Cheque" | "Other";
  reference: string; receivedBy: string;
};

// These exports are intentionally empty: production screens must display records from the
// authenticated database, never fabricated customer, order, payment, or reporting examples.
export const currentUser = {
  name: "", employeeId: "", phone: "", email: "",
  role: "Sales Representative" as const, territory: "", target: 0, achieved: 0, commissionRate: 0,
};
export const company = {
  name: "", short: "RSS Sales Manager", phone: "", whatsapp: "", email: "", address: "",
};
export const customers: Customer[] = [];
export const billsByCustomer: Record<string, Bill[]> = {};
export const products: Product[] = [];
export const orders: Order[] = [];
export const payments: Payment[] = [];
export const salesByDay: { day: string; sales: number }[] = [];
export const salesByCategory: { category: string; value: number }[] = [];
export const topProducts: { name: string; units: number; value: number }[] = [];
export const notifications: { id: number; kind: string; text: string; time: string }[] = [];

export function stockStatus(p: Product): StockStatus {
  if (p.stock === 0) return "OUT OF STOCK";
  if (p.stock < p.minStock) return "LOW STOCK";
  return "IN STOCK";
}
