import { useState, useRef, useEffect } from "react";
import ContactSupportForm from "./ContactSupportForm";
import BtbLogo from "./Logo";
import type { InvoiceFormData } from "../types/invoice";
import apiService from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import toast from "react-hot-toast";

interface RoomDetail {
  customer: string;
  roomType: string;
  bedType: string;
  smoking: string;
  breakfast: boolean;
  extras: string;
  nights: number;
  average: number;
  checkInDate: string;
  checkOutDate: string;
}

export interface ReservationData {
  _id?: string;
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
  taxInPercent: number;
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
  deposit: number;
  table: RoomDetail[];
  status?: string;
  taxInPrecent?: number;
  Actions?: Array<{
    date: string;
    action: string;
    _id: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

const BusinessReservationConfirmation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"details" | "contact">("details");
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const contactFormRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const {openPopup} = usePopup();

  const [reservation, setReservation] = useState<InvoiceFormData>({
    invoiceNumber: "BRC-2025-001",
    invoiceTo: "BTB International",
    customer: "Alice Smith",
    company: "Acme Corp",
    address: "123 Business Rd, Suite 400, Business City, BC 12345",
    phone: ["+1 (555) 987-6543"],
    email: ["alice.smith@example.com"],
    hotelName: "Grand Hyatt Downtown",
    hotelAddress: "123 Main St, Cityville, CA 90210",
    hotelPhone: "+1 (555) 123-4567",
    checkInDate: "2025-10-10",
    checkOutDate: "2025-10-15",
    modificationDate: "2025-09-01",
    remainingBalanceDue: "2025-09-30",
    taxInPercent: 8.5,
    totalRooms: 2,
    totalNights: 5,
    collectedAmount: 500.0,
    refundAmount: 0,
    penaltyFees: 0,
    penaltyFeesName: "",
    currency: "USD",
    referenceNumber: "REF-XYZ-789",
    attrition: "Standard",
    cancellation: "24 hours prior",
    cutOffDate: "2025-09-20",
    hotelCheckOut: "11:00 AM",
    hotelCheckIn: "03:00 PM",
    numberOfAdults: 3,
    creditCard: "**** **** **** 1234",
    deposit: 100.0,
    table: [
      {
        customer: "Alice Smith",
        roomType: "Deluxe King",
        bedType: "King",
        smoking: "Non-smoking",
        breakfast: true,
        extras: "",
        nights: 5,
        average: 250.0,
        checkInDate: "2025-10-10",
        checkOutDate: "2025-10-15",
      },
      {
        customer: "Bob Johnson",
        roomType: "Standard Double",
        bedType: "Queen",
        smoking: "Non-smoking",
        breakfast: false,
        extras: "",
        nights: 5,
        average: 180.0,
        checkInDate: "2025-10-10",
        checkOutDate: "2025-10-15",
      },
    ],
  } as InvoiceFormData);
  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);

        if (!apiService.isAuthenticated()) {
          navigate("/");
          return;
        }
        const response = (await apiService.getInvoice(id)).data; // Simulate network delay
        // Map API response to InvoiceFormData structure
        const apiData: InvoiceFormData = {
          invoiceNumber: response?.invoiceNumber,
          invoiceTo: response?.invoiceTo ?? "",
          customer: response?.customer ?? "",
          company: response?.company ?? "",
          address: response?.address ?? "",
          phone: Array.isArray(response?.phone) ? response.phone : response?.phone ? [response.phone] : [],
          email: Array.isArray(response?.email) ? response.email : response?.email ? [response.email] : [],
          hotelName: response?.hotelName ?? "",
          hotelAddress: response?.hotelAddress ?? "",
          hotelPhone: response?.hotelPhone ?? "",
          checkInDate: response?.checkInDate ?? "",
          checkOutDate: response?.checkOutDate ?? "",
          modificationDate: response?.modificationDate ?? "",
          remainingBalanceDue: response?.remainingBalanceDue ?? "",
          taxInPercent: typeof response?.taxInPercent === "number" ? response.taxInPercent : Number(response?.taxInPercent) || 0,
          totalRooms: typeof response?.totalRooms === "number" ? response.totalRooms : Number(response?.totalRooms) || 0,
          totalNights: typeof response?.totalNights === "number" ? response.totalNights : Number(response?.totalNights) || 0,
          collectedAmount: typeof response?.collectedAmount === "number" ? response.collectedAmount : Number(response?.collectedAmount) || 0,
          refundAmount: typeof response?.refundAmount === "number" ? response.refundAmount : Number(response?.refundAmount) || 0,
          penaltyFees: typeof response?.penaltyFees === "number" ? response.penaltyFees : Number(response?.penaltyFees) || 0,
          penaltyFeesName: response?.penaltyFeesName ?? "",
          currency: response?.currency ?? "USD",
          referenceNumber: response?.referenceNumber ?? "",
          attrition: response?.attrition ?? "",
          cancellation: response?.cancellation ?? "",
          cutOffDate: response?.cutOffDate ?? "",
          hotelCheckOut: response?.hotelCheckOut ?? "",
          hotelCheckIn: response?.hotelCheckIn ?? "",
          numberOfAdults: typeof response?.numberOfAdults === "number" ? response.numberOfAdults : Number(response?.numberOfAdults) || 0,
          creditCard: response?.creditCard ?? "",
          deposit: typeof response?.deposit === "number" ? response.deposit : Number(response?.deposit) || 0,
          table: Array.isArray(response?.table) ? response.table : [],
          status: response?.status ?? "",
          paymentMethod: response?.paymentMethod ?? "",
          notes: response?.notes ? String(response.notes) : "",
          // preserve any audit fields if present
          createdAt: response?.createdAt ?? undefined,
          updatedAt: response?.updatedAt ?? undefined,
          Actions: Array.isArray(response?.Actions) ? response.Actions : undefined,
        };
        setReservation(apiData);
      }
      catch (err) {
        console.error("Error loading invoice:", err);
        toast.error(err instanceof Error ? err.message : "Failed to load invoice");

        if (err instanceof Error && err.message.includes("401")) {
          apiService.clearToken();
          navigate("/");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadInvoice();
  }, [id, navigate]);
  const handleSendEmail = () => {
    openPopup("emailSend")
  };
  const scrollToContact = () => {
    setActiveTab("contact");
    setShowSupportForm(true);
    setTimeout(() => {
      contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleTabChange = (tab: "details" | "contact") => {
    setActiveTab(tab);
    if (tab === "contact") {
      setShowSupportForm(true);
    }
  };

  const addToGoogleCalendar = (reservation: ReservationData) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const startDate = formatDate(reservation.checkInDate);
    const endDate = formatDate(reservation.checkOutDate);

    const eventDetails =
      `Check-in: ${reservation.checkInDate}\n` +
      `Check-out: ${reservation.checkOutDate}\n` +
      `Hotel: ${reservation.hotelName}\n` +
      `Address: ${reservation.hotelAddress}\n` +
      `Phone: ${reservation.hotelPhone}\n` +
      `Confirmation #: ${reservation.invoiceNumber}`;

    const baseUrl = "https://calendar.google.com/calendar/render";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Reservation at ${reservation.hotelName}`,
      dates: `${startDate}/${endDate}`,
      details: eventDetails,
      location: reservation.hotelAddress,
    });

    window.open(`${baseUrl}?${params.toString()}`, "_blank");
  };
  const handleDownloadPDF = async () => {
    if (!reservation || !id) return;

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
      link.download = `invoice-${reservation.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleCreditVoucher = async () => {
    if (!id) return;
    openPopup("creditVoucher")
  };

  const handleActivities = () => {
    openPopup("activities")
  };

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f9fafc] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#221f60] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your reservation details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f9fafc] to-white">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Reservation
          </h2>
          <p className="text-gray-600 mb-6">
            Unable to load reservation details. Please try again later.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { }}
              className="px-4 py-2 bg-[#2d2b8c] text-white rounded-md hover:bg-[#1a1940] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => { }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calculateTotalAmount = () => {
    return reservation.table.reduce((total, room) => {
      return total + room.average * room.nights;
    }, 0);
  };

  const totalAmount = calculateTotalAmount();
  const taxAmount = totalAmount * (reservation.taxInPercent / 100);
  const grandTotal = totalAmount + taxAmount + (reservation.penaltyFees || 0);

  return (
    <div className="min-h-screen bg-[#f4f7f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-[#221f60] to-[#3a3a8f] p-6 sm:p-8 text-white text-center rounded-t-xl">
            <BtbLogo className="h-12 w-auto mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Business Reservation Confirmed!
          </h1>
          <p className="text-lg sm:text-xl font-medium">
            Your Corporate Travel Details
          </p>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange("details")}
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "details"
                    ? "border-[#f37e24] text-[#221f60]"
                    : "border-transparent text-gray-500 hover:text-[#221f60] hover:border-gray-300"
                  }`}
              >
                <span className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Reservation Details
                </span>
              </button>
              <button
                onClick={() => handleTabChange("contact")}
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "contact"
                    ? "border-[#f37e24] text-[#221f60]"
                    : "border-transparent text-gray-500 hover:text-[#221f60] hover:border-gray-300"
                  }`}
              >
                <span className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"
                    />
                  </svg>
                  Contact Support
                </span>
              </button>
            </nav>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === "details" ? (
                <div className="space-y-8 max-w-6xl mx-auto">
                <div className="bg-[#f9fafc] p-8 rounded-xl border border-gray-100">
                  <h2 className="text-2xl font-bold text-[#221f60] mb-6">
                  Booking Summary
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Booking Reference
                    </h3>
                    <p className="font-medium text-lg">
                    #{reservation.invoiceNumber}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Check-in
                    </h3>
                    <p className="font-medium">
                    {new Date(reservation.checkInDate).toLocaleDateString(
                      "en-US",
                      {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      }
                    )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Check-out
                    </h3>
                    <p className="font-medium">
                    {new Date(reservation.checkOutDate).toLocaleDateString(
                      "en-US",
                      {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      }
                    )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Total Stay
                    </h3>
                    <p className="font-medium">
                    {reservation.totalNights}{" "}
                    {reservation.totalNights === 1 ? "Night" : "Nights"}
                    </p>
                  </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-[#221f60] mb-4">
                  Guest Information
                  </h2>
                  <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Primary Guest
                    </h3>
                    <p className="font-medium text-lg">{reservation.customer}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Company
                    </h3>
                    <p className="font-medium text-lg">{reservation.company}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Address
                    </h3>
                    <p className="font-medium">{reservation.address}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Invoice To
                    </h3>
                    <p className="font-medium">{reservation.invoiceTo}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Emails
                    </h3>
                    <div className="font-medium space-y-1">
                      {reservation.email.map((email, index) => (
                      <p key={index} className="text-sm">
                        {email}
                      </p>
                      ))}
                    </div>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Phone Numbers
                    </h3>
                    <div className="font-medium space-y-1">
                      {reservation.phone.map((phone, index) => (
                      <p key={index} className="text-sm">
                        {phone}
                      </p>
                      ))}
                    </div>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Reference Number
                    </h3>
                    <p className="font-medium">{reservation.referenceNumber}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Currency
                    </h3>
                    <p className="font-medium">{reservation.currency}</p>
                    </div>
                  </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-[#221f60] mb-4">
                  Hotel Information
                  </h2>
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-[#221f60] mb-2">
                    {reservation.hotelName}
                    </h3>
                    <p className="text-gray-600 mb-4">{reservation.hotelAddress}</p>
                    <div className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {reservation.hotelPhone}
                    </div>
                  </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-[#221f60] mb-4">
                  Additional Details
                  </h2>
                  <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Modification Date
                    </h3>
                    <p className="font-medium">
                      {new Date(reservation.modificationDate).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Remaining Balance Due
                    </h3>
                    <p className="font-medium">
                      {new Date(reservation.remainingBalanceDue).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Total Rooms
                    </h3>
                    <p className="font-medium">{reservation.totalRooms}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Collected Amount
                    </h3>
                    <p className="font-medium">
                      {reservation.currency}
                      {reservation.collectedAmount.toFixed(2)}
                    </p>
                    </div>
                    {reservation.deposit !== undefined &&
                    reservation.deposit !== null && (
                      <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Deposit
                      </h3>
                      <p className="font-medium">
                        {reservation.currency}
                        {reservation.deposit.toFixed(2)}
                      </p>
                      </div>
                    )}
                    {reservation.cutOffDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Cut Off Date
                      </h3>
                      <p className="font-medium">
                      {new Date(reservation.cutOffDate).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                      </p>
                    </div>
                    )}
                  </div>
                  </div>
                </div>

                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <h2 className="text-2xl font-bold text-[#221f60]">
                    Room Details ({reservation.table.length} Rooms)
                  </h2>
                  {reservation.table.length > 1 && (
                    <button
                    onClick={() => setShowAllRooms(!showAllRooms)}
                    className="text-sm font-medium text-[#f37e24] hover:text-[#e06a11] flex items-center"
                    >
                    {showAllRooms ? (
                      <>
                      <span>Show Less</span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 15l7-7 7 7"
                        />
                      </svg>
                      </>
                    ) : (
                      <>
                      <span>Show All Rooms</span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      </>
                    )}
                    </button>
                  )}
                  </div>

                  <div className="space-y-4">
                  {reservation.table
                    .slice(0, showAllRooms ? reservation.table.length : 3)
                    .map((room, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                    >
                      <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-4 md:mb-0">
                        <h3 className="text-lg font-bold text-[#221f60]">
                          Room {index + 1}: {room.roomType} Room
                        </h3>
                        <p className="text-gray-600">
                          {room.bedType} Bed • {room.smoking}
                        </p>
                        </div>
                        <div className="text-right">
                        <p className="text-lg font-bold text-[#221f60]">
                          {reservation.currency}
                          {room.average}{" "}
                          <span className="text-sm font-normal text-gray-500">
                          / night
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {room.nights}{" "}
                          {room.nights === 1 ? "Night" : "Nights"}
                        </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Guest Name
                          </h4>
                          <p className="font-medium">{room.customer}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Check-in Date
                          </h4>
                          <p className="font-medium">
                          {new Date(room.checkInDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Check-out Date
                          </h4>
                          <p className="font-medium">
                          {new Date(room.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Extras
                          </h4>
                          <p className="font-medium">
                          {room.breakfast ? "Breakfast Included • " : ""}
                          {room.extras || "No extras"}
                          </p>
                        </div>
                        </div>
                      </div>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-[#221f60] mb-6">
                  Price Summary
                  </h2>

                  <div className="space-y-4">
                  {reservation.table.map((room, index) => (
                    <div
                    key={index}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
                    >
                    <div className="mb-2 sm:mb-0">
                      <p className="font-medium">
                      Room {index + 1}: {room.roomType}
                      </p>
                      <p className="text-sm text-gray-500">
                      {room.nights} {room.nights === 1 ? "Night" : "Nights"} ×{" "}
                      {reservation.currency}
                      {room.average}/night
                      </p>
                    </div>
                    <p className="font-medium">
                      {reservation.currency}
                      {(room.average * room.nights).toFixed(2)}
                    </p>
                    </div>
                  ))}

                  <div className="border-t border-gray-300 my-4"></div>

                  <div className="flex justify-between items-center">
                    <p className="font-medium">Subtotal</p>
                    <p className="font-medium">
                    {reservation.currency}
                    {totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="font-medium">Tax ({reservation.taxInPercent}%)</p>
                    <p className="font-medium">
                    {reservation.currency}
                    {taxAmount.toFixed(2)}
                    </p>
                  </div>

                  {reservation.penaltyFees > 0 && (
                    <div className="flex justify-between items-center">
                    <p className="font-medium">{reservation.penaltyFeesName}</p>
                    <p className="font-medium">
                      {reservation.currency}
                      {reservation.penaltyFees.toFixed(2)}
                    </p>
                    </div>
                  )}

                  <div className="border-t-2 border-gray-400 my-4"></div>

                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold">Total Amount</p>
                    <p className="text-2xl font-bold text-[#f37e24]">
                    {reservation.currency}
                    {grandTotal.toFixed(2)}
                    </p>
                  </div>

                  {(reservation.refundAmount ?? 0) > 0 ? (
                    <div className="bg-green-50 p-4 rounded-lg mt-4 border border-green-100">
                    <div className="flex justify-between items-center">
                      <div>
                      <p className="text-sm font-medium text-green-800">
                        Refund Amount
                      </p>
                      <p className="text-xl font-bold text-green-900">
                        {reservation.currency}
                        {reservation.refundAmount?.toFixed(2)}
                      </p>
                      </div>
                    </div>
                    </div>
                  ) : null}

                  {(reservation.collectedAmount ?? 0) > 0 ? (
                    <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <div>
                      <p className="text-sm font-medium text-blue-800">
                        Amount Collected
                      </p>
                      <p className="text-xl font-bold text-blue-900">
                        {reservation.currency}
                        {reservation.collectedAmount?.toFixed(2)}
                      </p>
                      </div>
                    </div>
                    </div>
                  ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <button
                  onClick={() => addToGoogleCalendar(reservation)}
                  className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-base shadow-sm flex items-center justify-center"
                  >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Add to Calendar
                  </button>

                  <button
                  onClick={handleEdit}
                  className="w-full py-3 bg-[#f37e24] hover:bg-[#e06a11] text-white rounded-md transition-colors flex items-center justify-center font-medium"
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
                  className="w-full py-3 bg-[#f37e24] hover:bg-[#e06a11] text-white rounded-md transition-colors flex items-center justify-center font-medium"
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
                  className="w-full col-span-1 sm:col-span-2 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors flex items-center justify-center font-medium"
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
            ) : (
              <div ref={contactFormRef}>
                {showSupportForm && <ContactSupportForm />}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 text-center border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => addToGoogleCalendar(reservation)}
              className="bg-[#221f60] hover:bg-[#3a3a8f] text-white py-3 px-6 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Add to Calendar
            </button>
            <button
              onClick={() => window.print()}
              className="bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold text-lg hover:bg-gray-50 hover:shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 012 2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 012 2h2m2-4h6a2 2 0 012-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 012 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Confirmation
            </button>
          </div>
          <p className="mt-6 text-gray-600 text-sm">
            A detailed confirmation has been sent to your registered email
            address.
          </p>
        </div>

        <div className="bg-gray-100 p-4 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} BTB International. All rights
            reserved.
          </p>
        </div>
      </div>

      <button
        onClick={scrollToContact}
        className="fixed bottom-8 right-8 bg-[#f37e24] hover:bg-[#e06a11] text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-all duration-200 z-50"
        aria-label="Need help? Contact support"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v7a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span className="ml-2 font-medium hidden sm:inline">Need Support?</span>
      </button>
    </div>
  );
};

export default BusinessReservationConfirmation;
