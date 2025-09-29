import type { FormListItem } from "../types/invoice";

const BASE_URL = "http://45.87.80.139:3056/api";

// Additional types for API responses
interface InvoiceResponse {
  data: {
    notes: string | undefined;
    _id: string;
    invoiceNumber: string;
    invoiceTo: string;
    customer: string;
    company: string;
    address: string;
    phone: string[];
    email: string[];
    hotelName: string;
    hotelAddress: string;
    hotelPhone: string;
    checkInDate: string;
    checkOutDate: string;
    modificationDate: string;
    remainingBalanceDue: string;
    taxInPrecent: number;
    totalRooms: number;
    totalNights: number;
    collectedAmount: number;
    refundAmount: number;
    penaltyFees: number;
    penaltyFeesName: string;
    currency: string;
    referenceNumber: string;
    attrition: string;
    cancellation: string;
    cutOffDate: string;
    table: InvoiceItem[];
    Actions?: Array<{
      date: string;
      action: string;
      _id: string;
    }>;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface EmailResponse {
  success: boolean;
  message: string;
}

// Types for API responses and requests
interface LoginRequest {
  userName: string;
  password: string;
}

interface LoginResponse {
  token: string;
  message?: string;
}

interface DuplicateInvoiceRequest {
  invoiceNumber: string;
  referenceNumber: string;
  oldInvoiceNumber: string;
}

interface InvoiceItem {
  nights: number;
  average: number;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  smoking: string;
  breakfast: boolean;
  roomType: string;
  bedType: string;
  extras: string;
}

interface CreateInvoiceRequest {
  invoiceNumber: string;
  invoiceTo: string;
  customer: string;
  company: string;
  address: string;
  phone: string[];
  email: string[];
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  checkInDate: string;
  checkOutDate: string;
  modificationDate: string;
  remainingBalanceDue: string;
  taxInPrecent: number;
  totalRooms: number;
  totalNights: number;
  collectedAmount: number;
  refundAmount: number;
  penaltyFees: number;
  penaltyFeesName: string;
  currency: string;
  referenceNumber: string;
  attrition: string;
  cancellation: string;
  cutOffDate: string;
  hotelCheckOut: string;
  hotelCheckIn: string;
  numberOfAdults: number;
  creditCard: string;
  deposit: boolean;
  table: InvoiceItem[];
}

interface SendEmailRequest {
  subject: string;
  message: string;
  ccEmails?: string[];
  hotelOptionCode?: string;
}

interface GenerateVoucherRequest {
  details: string;
  validUntil: string;
  amount: number;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    this.token = localStorage.getItem("invoice_token");
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    // For PDF or other binary responses
    return response.blob() as unknown as T;
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/invoicesLogin`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials),
    });

    const result = await this.handleResponse<LoginResponse>(response);

    // Store token for future requests
    if (result.token) {
      this.token = result.token;
      localStorage.setItem("invoice_token", result.token);
    }

    return result;
  }

  // Invoice Management
  async listInvoices(): Promise<FormListItem[]> {
    const response = await fetch(`${BASE_URL}/listForms`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<FormListItem[]>(response);
  }

  async getInvoice(id: string): Promise<InvoiceResponse> {
    const response = await fetch(`${BASE_URL}/displayForm/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<InvoiceResponse>(response);
  }

  async getClientInvoice(id: string): Promise<InvoiceResponse> {
    const response = await fetch(`${BASE_URL}/clientInvoice/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<InvoiceResponse>(response);
  }

  async createInvoice(
    invoiceData: CreateInvoiceRequest
  ): Promise<InvoiceResponse> {
    const response = await fetch(`${BASE_URL}/addForm`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(invoiceData),
    });

    return this.handleResponse<InvoiceResponse>(response);
  }

  async editInvoice(
    id: string,
    updateData: Partial<CreateInvoiceRequest>
  ): Promise<InvoiceResponse> {
    const response = await fetch(`${BASE_URL}/editForm/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    return this.handleResponse<InvoiceResponse>(response);
  }

  async duplicateInvoice(
    duplicateData: DuplicateInvoiceRequest
  ): Promise<InvoiceResponse> {
    const response = await fetch(`${BASE_URL}/duplicateForm`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(duplicateData),
    });

    return this.handleResponse<InvoiceResponse>(response);
  }

  // PDF and Email Operations
  async generateInvoicePdf(
    invoiceData: InvoiceResponse["data"]
  ): Promise<Blob> {
    if (!invoiceData) {
      throw new Error("Invoice data is required to generate PDF");
    }

    const normalizedInvoice = {
      ...invoiceData,
      table: Array.isArray(invoiceData.table) ? invoiceData.table : [],
    };

    const response = await fetch(`${BASE_URL}/generateFormPdf`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(normalizedInvoice),
    });

    return this.handleResponse<Blob>(response);
  }

  async generateVoucher(
    id: string,
    voucherData: GenerateVoucherRequest
  ): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/generateVoucher/${id}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(voucherData),
    });

    return this.handleResponse<Blob>(response);
  }

  async sendInvoiceEmail(
    id: string,
    emailData: SendEmailRequest
  ): Promise<EmailResponse> {
    const response = await fetch(`${BASE_URL}/sendInvoiceEmail/${id}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(emailData),
    });

    return this.handleResponse<EmailResponse>(response);
  }

  // Utility methods
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem("invoice_token", token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem("invoice_token");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
