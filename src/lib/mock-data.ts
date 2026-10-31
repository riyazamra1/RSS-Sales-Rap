export type CustomerType = "Retail" | "Wholesale" | "Dealer" | "Corporate" | "Other";
export type CustomerStatus = "Active" | "Inactive" | "Blocked";

export type Customer = {
  id: string;
  name: string;
  company: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  type: CustomerType;
  creditLimit: number;
  paymentTerms: string;
  rep: string;
  openingBalance: number;
  outstanding: number;
  totalPurchases: number;
  totalPayments: number;
  lastOrderDate: string;
  lastPaymentDate: string;
  status: CustomerStatus;
};

export type Bill = {
  date: string;
  invoiceNo: string;
  orderNo: string;
  total: number;
  paid: number;
  status: "PAID" | "PARTIAL" | "UNPAID";
};

export type StockStatus = "IN STOCK" | "LOW STOCK" | "OUT OF STOCK";

export type Product = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  unit: string;
  purchasePrice: number;
  wholesalePrice: number;
  salesPrice: number;
  stock: number;
  minStock: number;
  supplier: string;
  warranty: string;
  status: "Active" | "Disabled";
};

export type OrderStatus =
  | "Draft"
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Completed"
  | "Cancelled"
  | "Returned";

export type Order = {
  id: string;
  invoiceId: string;
  date: string;
  customerId: string;
  customerName: string;
  rep: string;
  netTotal: number;
  payment: number;
  status: OrderStatus;
  sync: "SYNCED" | "PENDING SYNC" | "SYNC FAILED";
  items: { productId: string; name: string; qty: number; unitPrice: number; discount: number }[];
};

export type Payment = {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  amount: number;
  method: "Cash" | "Bank Transfer" | "Card" | "Cheque" | "Other";
  reference: string;
  receivedBy: string;
};

export const currentUser = {
  name: "Imran Razeen",
  employeeId: "REP-014",
  phone: "+94 77 412 8890",
  email: "imran@razeensecure.lk",
  role: "Sales Representative" as const,
  territory: "Colombo North / Wattala",
  target: 3_500_000,
  achieved: 2_612_500,
  commissionRate: 1.5,
};

export const company = {
  name: "RSS RAZEEN SECURE SOLUTIONS",
  short: "RSS Sales Manager",
  phone: "+94 11 234 5678",
  whatsapp: "+94 77 123 4567",
  email: "sales@razeensecure.lk",
  address: "No. 118, Negombo Road, Wattala, Sri Lanka",
};

export const customers: Customer[] = [
  {
    id: "CUS-1042",
    name: "Nuwan Perera",
    company: "Lanka Vision Systems",
    contactPerson: "Nuwan Perera",
    phone: "+94 77 556 1200",
    whatsapp: "+94 77 556 1200",
    email: "nuwan@lankavision.lk",
    address: "42 Galle Road",
    city: "Colombo 03",
    type: "Dealer",
    creditLimit: 500_000,
    paymentTerms: "30 Days",
    rep: "Imran Razeen",
    openingBalance: 0,
    outstanding: 320_000,
    totalPurchases: 4_180_000,
    totalPayments: 3_860_000,
    lastOrderDate: "2026-08-04",
    lastPaymentDate: "2026-07-29",
    status: "Active",
  },
  {
    id: "CUS-1077",
    name: "Fathima Hassan",
    company: "SecureTech Traders",
    contactPerson: "Fathima Hassan",
    phone: "+94 71 220 4488",
    whatsapp: "+94 71 220 4488",
    email: "info@securetech.lk",
    address: "18/A Main Street",
    city: "Wattala",
    type: "Wholesale",
    creditLimit: 350_000,
    paymentTerms: "15 Days",
    rep: "Imran Razeen",
    openingBalance: 25_000,
    outstanding: 412_500,
    totalPurchases: 2_260_000,
    totalPayments: 1_872_500,
    lastOrderDate: "2026-08-06",
    lastPaymentDate: "2026-08-01",
    status: "Active",
  },
  {
    id: "CUS-1103",
    name: "Sanjeewa Kumara",
    company: "NetLink Solutions (Pvt) Ltd",
    contactPerson: "Sanjeewa Kumara",
    phone: "+94 76 881 3321",
    whatsapp: "+94 76 881 3321",
    email: "accounts@netlink.lk",
    address: "Level 4, Orion City",
    city: "Colombo 09",
    type: "Corporate",
    creditLimit: 1_200_000,
    paymentTerms: "45 Days",
    rep: "Imran Razeen",
    openingBalance: 0,
    outstanding: 148_000,
    totalPurchases: 7_940_000,
    totalPayments: 7_792_000,
    lastOrderDate: "2026-08-02",
    lastPaymentDate: "2026-08-05",
    status: "Active",
  },
  {
    id: "CUS-1131",
    name: "Ranjith Silva",
    company: "Silva Electricals",
    contactPerson: "Ranjith Silva",
    phone: "+94 70 334 9910",
    whatsapp: "+94 70 334 9910",
    email: "silvaelec@gmail.com",
    address: "76 Station Road",
    city: "Negombo",
    type: "Retail",
    creditLimit: 100_000,
    paymentTerms: "Cash",
    rep: "Imran Razeen",
    openingBalance: 0,
    outstanding: 0,
    totalPurchases: 610_000,
    totalPayments: 610_000,
    lastOrderDate: "2026-07-28",
    lastPaymentDate: "2026-07-28",
    status: "Active",
  },
  {
    id: "CUS-1158",
    name: "Mohamed Rizwan",
    company: "Rizwan Computers",
    contactPerson: "Rizwan",
    phone: "+94 75 900 1122",
    whatsapp: "+94 75 900 1122",
    email: "rizwan.comp@gmail.com",
    address: "3rd Cross Street",
    city: "Colombo 11",
    type: "Wholesale",
    creditLimit: 250_000,
    paymentTerms: "30 Days",
    rep: "Imran Razeen",
    openingBalance: 40_000,
    outstanding: 96_400,
    totalPurchases: 1_320_000,
    totalPayments: 1_263_600,
    lastOrderDate: "2026-08-05",
    lastPaymentDate: "2026-08-03",
    status: "Active",
  },
  {
    id: "CUS-1190",
    name: "Chamara Dias",
    company: "Dias Security Hub",
    contactPerson: "Chamara Dias",
    phone: "+94 72 445 6677",
    whatsapp: "+94 72 445 6677",
    email: "chamara@diassecurity.lk",
    address: "12 Temple Road",
    city: "Ja-Ela",
    type: "Dealer",
    creditLimit: 200_000,
    paymentTerms: "15 Days",
    rep: "Imran Razeen",
    openingBalance: 0,
    outstanding: 18_500,
    totalPurchases: 880_000,
    totalPayments: 861_500,
    lastOrderDate: "2026-07-21",
    lastPaymentDate: "2026-07-25",
    status: "Inactive",
  },
];

export const billsByCustomer: Record<string, Bill[]> = {
  "CUS-1042": [
    { date: "2026-08-01", invoiceNo: "INV-2026-001001", orderNo: "ORD-2026-001001", total: 50_000, paid: 30_000, status: "PARTIAL" },
    { date: "2026-08-04", invoiceNo: "INV-2026-001008", orderNo: "ORD-2026-001008", total: 75_000, paid: 0, status: "UNPAID" },
    { date: "2026-07-18", invoiceNo: "INV-2026-000944", orderNo: "ORD-2026-000944", total: 225_000, paid: 0, status: "UNPAID" },
  ],
  "CUS-1077": [
    { date: "2026-08-06", invoiceNo: "INV-2026-001019", orderNo: "ORD-2026-001019", total: 187_500, paid: 50_000, status: "PARTIAL" },
    { date: "2026-07-22", invoiceNo: "INV-2026-000961", orderNo: "ORD-2026-000961", total: 275_000, paid: 0, status: "UNPAID" },
  ],
  "CUS-1103": [
    { date: "2026-08-02", invoiceNo: "INV-2026-001004", orderNo: "ORD-2026-001004", total: 148_000, paid: 0, status: "UNPAID" },
    { date: "2026-07-10", invoiceNo: "INV-2026-000902", orderNo: "ORD-2026-000902", total: 640_000, paid: 640_000, status: "PAID" },
  ],
  "CUS-1131": [
    { date: "2026-07-28", invoiceNo: "INV-2026-000988", orderNo: "ORD-2026-000988", total: 62_400, paid: 62_400, status: "PAID" },
  ],
  "CUS-1158": [
    { date: "2026-08-05", invoiceNo: "INV-2026-001012", orderNo: "ORD-2026-001012", total: 96_400, paid: 0, status: "UNPAID" },
  ],
  "CUS-1190": [
    { date: "2026-07-21", invoiceNo: "INV-2026-000957", orderNo: "ORD-2026-000957", total: 18_500, paid: 0, status: "UNPAID" },
  ],
};

export const products: Product[] = [
  {
    id: "PRD-2001",
    sku: "HIK-DS2CE16D",
    barcode: "4894123001274",
    name: "Hikvision 2MP Bullet Camera",
    brand: "Hikvision",
    model: "DS-2CE16D0T-IRF",
    category: "CCTV Cameras",
    description: "1080p HD analog bullet camera, 20m IR, IP66 weatherproof housing.",
    unit: "Piece",
    purchasePrice: 5_200,
    wholesalePrice: 6_400,
    salesPrice: 7_500,
    stock: 25,
    minStock: 10,
    supplier: "Vision Imports Lanka",
    warranty: "24 Months",
    status: "Active",
  },
  {
    id: "PRD-2014",
    sku: "DAH-XVR5108",
    barcode: "4894123008117",
    name: "Dahua 8CH Penta-brid DVR",
    brand: "Dahua",
    model: "XVR5108HS-I3",
    category: "Recorders",
    description: "8 channel 5MP-N penta-brid DVR with AI human/vehicle detection.",
    unit: "Piece",
    purchasePrice: 21_500,
    wholesalePrice: 25_000,
    salesPrice: 28_900,
    stock: 6,
    minStock: 8,
    supplier: "Vision Imports Lanka",
    warranty: "24 Months",
    status: "Active",
  },
  {
    id: "PRD-2033",
    sku: "TPL-ER605",
    barcode: "6935364052614",
    name: "TP-Link Omada Gigabit VPN Router",
    brand: "TP-Link",
    model: "ER605 v2",
    category: "Networking",
    description: "Multi-WAN gigabit VPN router with Omada SDN controller support.",
    unit: "Piece",
    purchasePrice: 14_800,
    wholesalePrice: 17_200,
    salesPrice: 19_500,
    stock: 0,
    minStock: 5,
    supplier: "Nexus Distribution",
    warranty: "36 Months",
    status: "Active",
  },
  {
    id: "PRD-2048",
    sku: "CAB-CAT6-305",
    barcode: "8901234500456",
    name: "Cat6 UTP Cable Box 305m",
    brand: "D-Link",
    model: "NCB-C6UGRYR-305",
    category: "Cables & Accessories",
    description: "Solid copper Cat6 UTP indoor cable, 23AWG, 305m pull box.",
    unit: "Box",
    purchasePrice: 31_000,
    wholesalePrice: 35_500,
    salesPrice: 39_000,
    stock: 14,
    minStock: 6,
    supplier: "Nexus Distribution",
    warranty: "12 Months",
    status: "Active",
  },
  {
    id: "PRD-2062",
    sku: "WD-PURPLE-2TB",
    barcode: "718037855448",
    name: "WD Purple 2TB Surveillance HDD",
    brand: "Western Digital",
    model: "WD23PURZ",
    category: "Storage",
    description: "Surveillance-class 3.5in hard disk rated for 24/7 recording.",
    unit: "Piece",
    purchasePrice: 18_200,
    wholesalePrice: 21_000,
    salesPrice: 23_500,
    stock: 32,
    minStock: 10,
    supplier: "Data Store Lanka",
    warranty: "36 Months",
    status: "Active",
  },
  {
    id: "PRD-2075",
    sku: "PWR-12V10A",
    barcode: "8809123456781",
    name: "CCTV Power Supply Box 12V 10A",
    brand: "SecurePower",
    model: "SP-1210B",
    category: "Power",
    description: "9-way distributed 12V DC power supply box with short-circuit protection.",
    unit: "Piece",
    purchasePrice: 4_100,
    wholesalePrice: 5_000,
    salesPrice: 5_900,
    stock: 4,
    minStock: 12,
    supplier: "SecurePower Agencies",
    warranty: "12 Months",
    status: "Active",
  },
];

export function stockStatus(p: Product): StockStatus {
  if (p.stock === 0) return "OUT OF STOCK";
  if (p.stock < p.minStock) return "LOW STOCK";
  return "IN STOCK";
}

export const orders: Order[] = [
  {
    id: "ORD-2026-001019",
    invoiceId: "INV-2026-001019",
    date: "2026-08-06",
    customerId: "CUS-1077",
    customerName: "SecureTech Traders",
    rep: "Imran Razeen",
    netTotal: 187_500,
    payment: 50_000,
    status: "Confirmed",
    sync: "SYNCED",
    items: [
      { productId: "PRD-2001", name: "Hikvision 2MP Bullet Camera", qty: 15, unitPrice: 6_400, discount: 0 },
      { productId: "PRD-2062", name: "WD Purple 2TB Surveillance HDD", qty: 4, unitPrice: 21_000, discount: 1_500 },
    ],
  },
  {
    id: "ORD-2026-001012",
    invoiceId: "INV-2026-001012",
    date: "2026-08-05",
    customerId: "CUS-1158",
    customerName: "Rizwan Computers",
    rep: "Imran Razeen",
    netTotal: 96_400,
    payment: 0,
    status: "Processing",
    sync: "PENDING SYNC",
    items: [
      { productId: "PRD-2048", name: "Cat6 UTP Cable Box 305m", qty: 2, unitPrice: 35_500, discount: 0 },
      { productId: "PRD-2075", name: "CCTV Power Supply Box 12V 10A", qty: 5, unitPrice: 5_000, discount: 100 },
    ],
  },
  {
    id: "ORD-2026-001008",
    invoiceId: "INV-2026-001008",
    date: "2026-08-04",
    customerId: "CUS-1042",
    customerName: "Lanka Vision Systems",
    rep: "Imran Razeen",
    netTotal: 75_000,
    payment: 0,
    status: "Confirmed",
    sync: "SYNCED",
    items: [{ productId: "PRD-2014", name: "Dahua 8CH Penta-brid DVR", qty: 3, unitPrice: 25_000, discount: 0 }],
  },
  {
    id: "ORD-2026-001004",
    invoiceId: "INV-2026-001004",
    date: "2026-08-02",
    customerId: "CUS-1103",
    customerName: "NetLink Solutions (Pvt) Ltd",
    rep: "Imran Razeen",
    netTotal: 148_000,
    payment: 0,
    status: "Completed",
    sync: "SYNCED",
    items: [{ productId: "PRD-2033", name: "TP-Link Omada Gigabit VPN Router", qty: 8, unitPrice: 18_500, discount: 0 }],
  },
  {
    id: "ORD-2026-001022",
    invoiceId: "—",
    date: "2026-08-07",
    customerId: "CUS-1131",
    customerName: "Silva Electricals",
    rep: "Imran Razeen",
    netTotal: 23_500,
    payment: 0,
    status: "Draft",
    sync: "PENDING SYNC",
    items: [{ productId: "PRD-2062", name: "WD Purple 2TB Surveillance HDD", qty: 1, unitPrice: 23_500, discount: 0 }],
  },
  {
    id: "ORD-2026-000988",
    invoiceId: "INV-2026-000988",
    date: "2026-07-28",
    customerId: "CUS-1131",
    customerName: "Silva Electricals",
    rep: "Imran Razeen",
    netTotal: 62_400,
    payment: 62_400,
    status: "Completed",
    sync: "SYNCED",
    items: [{ productId: "PRD-2001", name: "Hikvision 2MP Bullet Camera", qty: 8, unitPrice: 7_500, discount: 2_400 }],
  },
];

export const payments: Payment[] = [
  {
    id: "PAY-2026-000411",
    date: "2026-08-05",
    customerId: "CUS-1103",
    customerName: "NetLink Solutions (Pvt) Ltd",
    invoiceId: "INV-2026-000902",
    amount: 640_000,
    method: "Bank Transfer",
    reference: "BOC-778341",
    receivedBy: "Imran Razeen",
  },
  {
    id: "PAY-2026-000406",
    date: "2026-08-03",
    customerId: "CUS-1158",
    customerName: "Rizwan Computers",
    invoiceId: "INV-2026-000970",
    amount: 85_000,
    method: "Cheque",
    reference: "CHQ-220914",
    receivedBy: "Imran Razeen",
  },
  {
    id: "PAY-2026-000399",
    date: "2026-08-01",
    customerId: "CUS-1077",
    customerName: "SecureTech Traders",
    invoiceId: "INV-2026-001019",
    amount: 50_000,
    method: "Cash",
    reference: "—",
    receivedBy: "Imran Razeen",
  },
];

export const salesByDay = [
  { day: "Mon", sales: 118_000 },
  { day: "Tue", sales: 96_500 },
  { day: "Wed", sales: 204_000 },
  { day: "Thu", sales: 142_800 },
  { day: "Fri", sales: 311_500 },
  { day: "Sat", sales: 187_500 },
  { day: "Sun", sales: 42_000 },
];

export const salesByCategory = [
  { category: "CCTV", value: 1_240_000 },
  { category: "Networking", value: 620_000 },
  { category: "Storage", value: 415_000 },
  { category: "Cables", value: 248_000 },
  { category: "Power", value: 89_500 },
];

export const topProducts = [
  { name: "Hikvision 2MP Bullet Camera", units: 142, value: 946_000 },
  { name: "WD Purple 2TB HDD", units: 38, value: 812_000 },
  { name: "Cat6 UTP Cable Box 305m", units: 19, value: 690_500 },
  { name: "Dahua 8CH DVR", units: 14, value: 388_000 },
];

export const notifications = [
  { id: 1, kind: "stock", text: "TP-Link Omada Router is out of stock", time: "10 min ago" },
  { id: 2, kind: "payment", text: "Payment PAY-2026-000411 received — Rs. 640,000", time: "2 h ago" },
  { id: 3, kind: "credit", text: "SecureTech Traders exceeded credit limit", time: "5 h ago" },
  { id: 4, kind: "order", text: "ORD-2026-001019 confirmed", time: "Yesterday" },
];
