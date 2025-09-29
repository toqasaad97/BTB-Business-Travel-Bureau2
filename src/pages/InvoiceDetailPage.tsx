import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BtbLogo from "../components/Logo";
import { apiService } from "../services/api";
// Import will be used when we replace the mock data

interface InvoiceData {
  invoiceNumber: string;
  customer: string;
  company: string;
  email: string;
  phone: string;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  totalRooms: string;
  checkInDate: string;
  checkOutDate: string;
  modificationDate: string;
  taxInPercent: string;
  currency: string;
  referenceNumber: string;
  attrition: string;
  cancellation: string;
  cutOffDate: string;
  penaltyFees: string;
  remainingBalanceDue: string;
  collectedAmount: number;
  refundAmount: number;
  remainingBalance: number;
  items: Array<{
    customer: string;
    description: string;
    dateRange: string;
    taxAndFees: number;
    averagePrice: number;
    total: number;
  }>;
}

const InvoiceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoiceData = async () => {
      if (!id) {
        setError("Invoice ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (!apiService.isAuthenticated()) {
          navigate("/");
          return;
        }

        const response = (await apiService.getClientInvoice(id)).data;

        // Transform API response to match our interface
        const transformedData: InvoiceData = {
          invoiceNumber: response.invoiceNumber || "",
          customer: response.customer || "",
          company: response.company || "",
          email: response.email?.[0] || "",
          phone: response.phone?.[0] || "",
          hotelName: response.hotelName || "",
          hotelAddress: response.hotelAddress || "",
          hotelPhone: response.hotelPhone || "",
          totalRooms: response.totalRooms?.toString() || "0",
          checkInDate: response.checkInDate || "",
          checkOutDate: response.checkOutDate || "",
          modificationDate: response.modificationDate || "",
          taxInPercent: response.taxInPrecent?.toString() || "0",
          currency: response.currency || "$",
          referenceNumber: response.referenceNumber || "",
          attrition: response.attrition || "",
          cancellation: response.cancellation || "",
          cutOffDate: response.cutOffDate || "",
          penaltyFees: response.penaltyFees?.toString() || "",
          remainingBalanceDue: response.remainingBalanceDue || "",
          collectedAmount: response.collectedAmount || 0,
          refundAmount: response.refundAmount || 0,
          remainingBalance: calculateRemainingBalance(response),
          items: transformTableItems(response.table || []),
        };

        setInvoiceData(transformedData);
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError(err instanceof Error ? err.message : "Failed to load invoice");

        if (err instanceof Error && err.message.includes("401")) {
          apiService.clearToken();
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceData();
  }, [id, navigate]);

  const calculateRemainingBalance = (data: any): number => {
    const subtotal =
      data.table?.reduce(
        (sum: number, item: any) => sum + item.nights * item.average,
        0
      ) || 0;
    const penaltyFees = data.penaltyFees || 0;
    const collectedAmount = data.collectedAmount || 0;
    const refundAmount = data.refundAmount || 0;

    return subtotal + penaltyFees - collectedAmount - refundAmount;
  };

  const transformTableItems = (tableData: any[]) => {
    return tableData.map((item) => ({
      customer: item.guestName || "",
      description: `(${item.checkInDate} - ${item.checkOutDate})\n${
        item.smoking || ""
      }${item.breakfast ? "\nBreakfast included" : ""}`,
      dateRange: `${item.nights} nights`,
      taxAndFees: 0, // This might need to be calculated based on your business logic
      averagePrice: item.average || 0,
      total: (item.nights || 0) * (item.average || 0),
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/");
  };

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  const handleDownloadPDF = async () => {
    if (!invoiceData || !id) return;

    try {
      // Get the full invoice data for PDF generation
      const fullInvoiceData = await apiService.getClientInvoice(id);
      const invoicePayload = fullInvoiceData?.data;

      if (!invoicePayload) {
        throw new Error("Invoice data is unavailable for PDF generation.");
      }

      const blob = await apiService.generateInvoicePdf(invoicePayload);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceData.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF");
    }
  };

  const handleCreditVoucher = async () => {
    if (!id) return;

    const details = prompt("Enter voucher details:");
    const validUntil = prompt("Valid until (MM-DD-YYYY):");
    const amount = prompt("Amount:");

    if (details && validUntil && amount) {
      try {
        const blob = await apiService.generateVoucher(id, {
          details,
          validUntil,
          amount: parseFloat(amount),
        });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `voucher-${invoiceData?.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Error generating voucher:", err);
        alert("Failed to generate voucher");
      }
    }
  };

  const handleActivities = () => {
    // Implement activities functionality - this might need more API endpoints
    console.log("Activities");
    alert("Activities feature coming soon");
  };

  const handleSendEmail = async () => {
    if (!id) return;

    const subject = prompt("Email subject:");
    const message = prompt("Email message:");

    if (subject && message) {
      try {
        await apiService.sendInvoiceEmail(id, {
          subject,
          message,
          ccEmails: [], // Could be extended to allow CC emails
        });

        alert("Email sent successfully!");
      } catch (err) {
        console.error("Error sending email:", err);
        alert("Failed to send email");
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5a75d4] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
        <BtbLogo width={120} height={100} className="mb-4" />
        <div className="text-center text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#2d2b8c] text-white rounded-md hover:bg-[#1a1940] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No data state
  if (!invoiceData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
        <BtbLogo width={120} height={100} className="mb-4" />
        <div className="text-center text-gray-500 mb-4">Invoice not found</div>
        <button
          onClick={() => navigate("/home")}
          className="px-4 py-2 bg-[#2d2b8c] text-white rounded-md hover:bg-[#1a1940] transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <BtbLogo width={40} height={40} className="mr-3" />
            <span className="text-xl font-semibold text-[#5a75d4]">
              Invoices
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/home")}
              className="px-4 py-2 bg-[#5a75d4] hover:bg-[#4a65c4] text-white rounded-md transition-colors flex items-center text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back Home
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#5a75d4] hover:bg-[#4a65c4] text-white rounded-md transition-colors flex items-center text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Invoice Header */}
          <div className="text-center py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-[#5a75d4] mb-2">
              Invoice # {invoiceData.invoiceNumber}
            </h1>
          </div>

          {/* Invoice Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Invoice To :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.customer}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Company :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.company}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Email :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.email}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Hotel Name :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.hotelName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Hotel Phone :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.hotelPhone}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Check In Date :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.checkInDate}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Modification Date :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.modificationDate}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Tax In Precent Per Night :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.taxInPercent}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Currency :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.currency}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Attrition :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 h-16">
                      <span className="text-gray-600">
                        {invoiceData.attrition}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Cut Off Date :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-gray-600">
                        {invoiceData.cutOffDate}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Penalty Fees :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-gray-600">
                        {invoiceData.penaltyFees}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Customer :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.customer}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Address :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.hotelAddress}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Phone :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.phone}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Hotel Address :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.hotelAddress}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Total Rooms :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.totalRooms}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Check Out Date :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.checkOutDate}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Remaining Balance Due :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.remainingBalanceDue}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Collected Amount :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-gray-600">
                        {invoiceData.collectedAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Reference Number :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <span className="text-[#5a75d4] font-medium">
                        {invoiceData.referenceNumber}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Cancellation :
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1">
                      <span className="text-[#5a75d4] text-sm">
                        {invoiceData.cancellation}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-8">
              <div className="bg-[#5a75d4] text-white">
                <div className="grid grid-cols-5 gap-4 px-4 py-3 font-medium text-sm">
                  <div>Items</div>
                  <div>Description</div>
                  <div>Tax & Fees Per Night</div>
                  <div>Average Price Per Night</div>
                  <div>Total</div>
                </div>
              </div>

              {invoiceData.items.map((item, index) => (
                <div key={index} className="border-l border-r border-gray-200">
                  <div className="grid grid-cols-5 gap-4 px-4 py-4 border-b border-gray-200">
                    <div className="text-center">
                      <div className="font-medium">{item.customer}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.dateRange}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm">{item.description}</div>
                    </div>
                    <div className="text-center font-medium">
                      $ {item.taxAndFees.toFixed(2)}
                    </div>
                    <div className="text-center font-medium">
                      $ {item.averagePrice.toFixed(2)}
                    </div>
                    <div className="text-center font-medium">
                      $ {item.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="border border-gray-200 bg-gray-50">
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Balance</span>
                    <span className="font-medium">
                      $ {invoiceData.remainingBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Collected Amount</span>
                    <span>{invoiceData.collectedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Refund Amount</span>
                    <span>{invoiceData.refundAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Remaining Balance</span>
                    <span>$ {invoiceData.remainingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={handleEdit}
                className="w-full py-3 bg-[#5a75d4] hover:bg-[#4a65c4] text-white rounded-md transition-colors flex items-center justify-center font-medium"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>

              <button
                onClick={handleDownloadPDF}
                className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors flex items-center justify-center font-medium"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </button>

              <button
                onClick={handleCreditVoucher}
                className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors flex items-center justify-center font-medium"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Credit Voucher
              </button>

              <button
                onClick={handleActivities}
                className="w-full py-3 bg-[#5a75d4] hover:bg-[#4a65c4] text-white rounded-md transition-colors flex items-center justify-center font-medium"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Activities
              </button>

              <button
                onClick={handleSendEmail}
                className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors flex items-center justify-center font-medium col-span-2"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"
                  />
                </svg>
                Send Email
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoiceDetailPage;
