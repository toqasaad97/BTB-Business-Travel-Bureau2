import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
  defaultFormValues,
  invoiceSchema,
  type InvoiceFormData,
} from "../types/invoice";
import BtbLogo from "./Logo";
import { apiService } from "../services/api";
import toast from "react-hot-toast";

const CreateInvoiceForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<InvoiceFormData>({
    resolver: yupResolver(invoiceSchema),
    defaultValues: defaultFormValues,
    mode: "onTouched", // Enable real-time validation
  });

  // For dynamic room fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: "table",
  });

  // Watch values for calculations
  const totalRooms = watch("totalRooms") || 0;
  const checkInDate = watch("checkInDate");
  const checkOutDate = watch("checkOutDate");

  // Calculate total nights when check-in/out dates change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setValue("totalNights", diffDays > 0 ? diffDays : 1);
    }
  }, [checkInDate, checkOutDate, setValue]);

  // Update the default form values to pre-fill the first room
  useEffect(() => {
    // Set default values for the first room
    if (fields.length === 0) {
      append({
        customer: "",
        roomType: "Double",
        bedType: "Queen",
        smoking: "Non-smoking",
        breakfast: false,
        extras: "",
        nights: getValues("totalNights") || 1,
        average: 0,
        checkInDate: getValues("checkInDate") || "",
        checkOutDate: getValues("checkOutDate") || "",
      });

      // Set default total rooms to 1
      setValue("totalRooms", 1);
    }
  }, [append, getValues, setValue, fields.length]);

  // Update the total rooms handler to manage the number of rooms
  const handleTotalRoomsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalRooms = parseInt(e.target.value) || 0;
    const currentTotalRooms = getValues("totalRooms") || 0;

    if (newTotalRooms > currentTotalRooms) {
      // Add new rooms
      const roomsToAdd = newTotalRooms - currentTotalRooms;
      const newRooms = Array(roomsToAdd)
        .fill(null)
        .map((_, i) => ({
          customer: "",
          roomType: "",
          bedType: "",
          smoking: "Non-smoking",
          breakfast: false,
          extras: "",
          nights: getValues("totalNights") || 1,
          average: 0,
          checkInDate: getValues("checkInDate") || "",
          checkOutDate: getValues("checkOutDate") || "",
        }));

      append(newRooms);
    } else if (newTotalRooms < currentTotalRooms) {
      // Remove rooms from the end
      const roomsToRemove = currentTotalRooms - newTotalRooms;
      const newLength = Math.max(0, fields.length - roomsToRemove);

      // Store the current rooms
      const currentRooms = getValues("table").slice(0, newLength);

      // Reset the table with the remaining rooms
      remove();
      if (currentRooms.length > 0) {
        append(currentRooms);
      }
    }

    // Update the total rooms value
    setValue("totalRooms", newTotalRooms);
  };

  // Update room fields when totalRooms changes
  useEffect(() => {
    const currentTable = getValues("table") || [];
    const newTable = [];

    for (let i = 0; i < totalRooms; i++) {
      newTable[i] = {
        ...(currentTable[i] || {}),
        customer: currentTable[i]?.customer || "",
        checkInDate: currentTable[i]?.checkInDate || checkInDate || "",
        checkOutDate: currentTable[i]?.checkOutDate || checkOutDate || "",
        roomType: currentTable[i]?.roomType || "",
        bedType: currentTable[i]?.bedType || "",
        smoking: currentTable[i]?.smoking || "Non-smoking",
        breakfast: currentTable[i]?.breakfast || false,
        extras: currentTable[i]?.extras || "",
        nights: currentTable[i]?.nights || getValues("totalNights") || 1,
        average: currentTable[i]?.average || 0,
      };
    }

    setValue("table", newTable);
  }, [totalRooms, checkInDate, checkOutDate, setValue, getValues]);

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);

    try {
      // Check authentication
      if (!apiService.isAuthenticated()) {
        navigate("/");
        return;
      }

      // Transform form data to API format
      const apiData = {
        invoiceNumber: data.invoiceNumber || "",
        invoiceTo: data.invoiceTo || "",
        customer: data.customer || "",
        company: data.company || "",
        address: data.address || "",
        phone: data.phone?.filter((p) => p?.trim()) || [],
        email: data.email?.filter((e) => e?.trim()) || [],
        hotelName: data.hotelName || "",
        hotelAddress: data.hotelAddress || "",
        hotelPhone: data.hotelPhone || "",
        checkInDate: data.checkInDate || "",
        checkOutDate: data.checkOutDate || "",
        modificationDate: data.modificationDate || "",
        remainingBalanceDue: data.remainingBalanceDue || "",
        taxInPrecent: parseFloat(data.taxInPercent || "0"),
        totalRooms: parseInt(data.totalRooms || "0"),
        totalNights:
          data.table?.reduce((sum, room) => sum + (room.nights || 0), 0) || 0,
        collectedAmount: parseFloat(data.collectedAmount?.toString() || "0"),
        refundAmount: 0,
        penaltyFees: parseFloat(data.penaltyFees || "0"),
        penaltyFeesName: "Penalty Fee",
        currency: data.currency || "USD",
        referenceNumber: data.referenceNumber || "",
        attrition: data.attrition || "",
        cancellation: data.cancellation || "",
        cutOffDate: data.cutOffDate || "",
        hotelCheckOut: data.checkOutDate || "",
        hotelCheckIn: data.checkInDate || "",
        numberOfAdults: 1,
        creditCard: "",
        deposit: data.deposit,
        table:
          data.table?.map((room) => ({
            nights: room.nights || 1,
            average: room.averagePrice || 0,
            guestName: room.guestName || "",
            checkInDate: room.checkInDate || "",
            checkOutDate: room.checkOutDate || "",
            smoking: room.smoking || "Non-smoking",
            breakfast: room.breakfast || false,
            roomType: room.roomType || "",
            bedType: room.bedType || "",
            extras: room.extras || "",
          })) || [],
      };

      const result = await apiService.createInvoice(apiData);
      toast.success("Invoice created successfully!");

      // Redirect to the created invoice detail page
      if (result._id) {
        navigate(`/reservation/${result._id}`);
      } else {
        navigate("/home");
      }
    } catch (err) {
      console.error("Error creating invoice:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to add a new phone/email field
  const addField = (type: "phone" | "email") => {
    const currentValues = getValues(type) || [];
    setValue(type, [...currentValues, ""]);
  };

  // Helper function to remove a phone/email field
  const removeField = (type: "phone" | "email", index: number) => {
    const currentValues = [...(getValues(type) || [])];
    currentValues.splice(index, 1);
    setValue(type, currentValues);
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get min date for check-out (must be after check-in)
  const getMinCheckOutDate = () => {
    return checkInDate || getTodayDate();
  };

  // Add these state variables at the top of your component
  const [showCustomRoomType, setShowCustomRoomType] = useState<{
    [key: number]: boolean;
  }>({});
  const [showCustomBedType, setShowCustomBedType] = useState<{
    [key: number]: boolean;
  }>({});

  // Add these handler functions
  const handleRoomTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (value === "Other") {
      setShowCustomRoomType((prev) => ({ ...prev, [index]: true }));
      setValue(`table.${index}.roomType` as const, "");
    } else {
      setShowCustomRoomType((prev) => ({ ...prev, [index]: false }));
      setValue(`table.${index}.roomType` as const, value);
    }
  };

  const handleBedTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (value === "Other") {
      setShowCustomBedType((prev) => ({ ...prev, [index]: true }));
      setValue(`table.${index}.bedType` as const, "");
    } else {
      setShowCustomBedType((prev) => ({ ...prev, [index]: false }));
      setValue(`table.${index}.bedType` as const, value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2d2b8c] to-[#1a1940] p-6 md:p-8 text-white">
            <div className="flex flex-col items-center text-center space-y-4">
              <BtbLogo
                width={150}
                height={60}
                primaryColor="#ffffff"
                secondaryColor="#ffffff"
                accentColor="#ff7e29"
              />
              <h1 className="text-2xl font-bold">Create Invoice</h1>
            </div>
          </div>

          {/* Main Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 md:p-8 space-y-6"
          >
            {/* Invoice Details Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Invoice Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invoice Number */}
                <div className="space-y-2">
                  <label
                    htmlFor="invoiceNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="invoiceNumber"
                    type="text"
                    {...register("invoiceNumber")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="e.g., INV-001"
                  />
                  {errors.invoiceNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.invoiceNumber.message}
                    </p>
                  )}
                </div>

                {/* Invoice To */}
                <div className="space-y-2">
                  <label
                    htmlFor="invoiceTo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Invoice To <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="invoiceTo"
                    type="text"
                    {...register("invoiceTo")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="Customer/Company Name"
                  />
                  {errors.invoiceTo && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.invoiceTo.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="customer"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customer"
                    type="text"
                    {...register("customer")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="Customer Name"
                  />
                  {errors.customer && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customer.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Company
                  </label>
                  <input
                    id="company"
                    type="text"
                    {...register("company")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="Company Name"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <div className="relative">
                  <input
                    id="address"
                    type="text"
                    {...register("address")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="Street Address, City, State, ZIP"
                  />
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Numbers
                  </label>
                  <button
                    type="button"
                    onClick={() => addField("phone")}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600"
                  >
                    <svg
                      className="-ml-0.5 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Add Phone
                  </button>
                </div>

                {(watch("phone") || []).map((phone, index) => (
                  <div key={index} className="flex gap-x-2">
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        {...register(`phone.${index}` as const)}
                        className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeField("phone", index)}
                      className="inline-flex items-center gap-x-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.74v-.443c0-.573.124-1.054.325-1.432.217-.408.526-.726.913-.898.373-.164.768-.24 1.11-.24h2.304c.342 0 .736.076 1.11.24.386.172.696.49.912.898.202.378.326.86.326 1.432v.443A2.75 2.75 0 0015.25 6h.5a.75.75 0 010 1.5h-.5a1.25 1.25 0 01-1.25-1.25v-.443c0-.57-.125-.988-.243-1.227a.856.856 0 00-.206-.275.364.364 0 00-.177-.09c-.081-.02-.23-.034-.49-.034h-2.268c-.26 0-.409.014-.49.035a.363.363 0 00-.177.09.86.86 0 00-.205.274c-.119.24-.244.657-.244 1.227v.443A1.25 1.25 0 018 6.25h4.5v1.5H8A2.75 2.75 0 015.25 5v-.5c0-.573.124-1.054.325-1.432.217-.408.526-.726.913-.898.373-.164.768-.24 1.11-.24h2.304c.342 0 .736.076 1.11.24.386.172.696.49.912.898.202.378.326.86.326 1.432V6h-1.5V3.75z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M14.5 6h-9v10.25c0 .647.22 1.28.645 1.707.426.426 1.06.646 1.707.646h4.296c.646 0 1.28-.22 1.707-.646.426-.426.645-1.06.645-1.707V6zM7.25 6.75v9.5c0 .138.112.25.25.25h4.5a.25.25 0 00.25-.25v-9.5h-5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Email Addresses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Addresses
                  </label>
                  <button
                    type="button"
                    onClick={() => addField("email")}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600"
                  >
                    <svg
                      className="-ml-0.5 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Add Email
                  </button>
                </div>

                {(watch("email") || []).map((email, index) => (
                  <div key={index} className="flex gap-x-2">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        {...register(`email.${index}` as const)}
                        className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                        placeholder="email@example.com"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeField("email", index)}
                      className="inline-flex items-center gap-x-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.74v-.443c0-.573.124-1.054.325-1.432.217-.408.526-.726.913-.898.373-.164.768-.24 1.11-.24h2.304c.342 0 .736.076 1.11.24.386.172.696.49.912.898.202.378.326.86.326 1.432v.443A2.75 2.75 0 0015.25 6h.5a.75.75 0 010 1.5h-.5a1.25 1.25 0 01-1.25-1.25v-.443c0-.57-.125-.988-.243-1.227a.856.856 0 00-.206-.275.364.364 0 00-.177-.09c-.081-.02-.23-.034-.49-.034h-2.268c-.26 0-.409.014-.49.035a.363.363 0 00-.177.09.86.86 0 00-.205.274c-.119.24-.244.657-.244 1.227v.443A1.25 1.25 0 018 6.25h4.5v1.5H8A2.75 2.75 0 015.25 5v-.5c0-.573.124-1.054.325-1.432.217-.408.526-.726.913-.898.373-.164.768-.24 1.11-.24h2.304c.342 0 .736.076 1.11.24.386.172.696.49.912.898.202.378.326.86.326 1.432V6h-1.5V3.75z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M14.5 6h-9v10.25c0 .647.22 1.28.645 1.707.426.426 1.06.646 1.707.646h4.296c.646 0 1.28-.22 1.707-.646.426-.426.645-1.06.645-1.707V6zM7.25 6.75v9.5c0 .138.112.25.25.25h4.5a.25.25 0 00.25-.25v-9.5h-5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Information Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Hotel Information
              </h2>

              <div className="space-y-2">
                <label
                  htmlFor="hotelName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Hotel Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="hotelName"
                  type="text"
                  {...register("hotelName")}
                  className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  placeholder="Hotel Name"
                />
                {errors.hotelName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.hotelName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="hotelAddress"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Hotel Address
                  </label>
                  <input
                    id="hotelAddress"
                    type="text"
                    {...register("hotelAddress")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="Hotel Street Address"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="hotelPhone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Hotel Phone
                  </label>
                  <input
                    id="hotelPhone"
                    type="tel"
                    {...register("hotelPhone")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="checkInDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Check-in Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkInDate"
                    type="date"
                    {...register("checkInDate")}
                    min={getTodayDate()}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  />
                  {errors.checkInDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.checkInDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="checkOutDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Check-out Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkOutDate"
                    type="date"
                    {...register("checkOutDate")}
                    min={getMinCheckOutDate()}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  />
                  {errors.checkOutDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.checkOutDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="hotelCheckIn"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Hotel Check-in Time
                  </label>
                  <input
                    id="hotelCheckIn"
                    type="time"
                    {...register("hotelCheckIn")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    defaultValue="15:00"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="hotelCheckOut"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Hotel Check-out Time
                  </label>
                  <input
                    id="hotelCheckOut"
                    type="time"
                    {...register("hotelCheckOut")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    defaultValue="11:00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="totalRooms"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Rooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="totalRooms"
                    type="number"
                    min="1"
                    {...register("totalRooms", {
                      valueAsNumber: true,
                      onChange: (e) => handleTotalRoomsChange(e),
                    })}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  />
                  {errors.totalRooms && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.totalRooms.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="totalNights"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Nights
                  </label>
                  <input
                    id="totalNights"
                    type="number"
                    min="1"
                    {...register("totalNights")}
                    readOnly
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="numberOfAdults"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Number of Adults
                  </label>
                  <input
                    id="numberOfAdults"
                    type="number"
                    min="1"
                    {...register("numberOfAdults")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    defaultValue="2"
                  />
                </div>
              </div>
            </div>

            {/* Room Details Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Room Details
              </h2>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Room {index + 1}</h3>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Room
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor={`table.${index}.customer`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Guest Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`table.${index}.customer`}
                        type="text"
                        {...register(`table.${index}.customer` as const)}
                        className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                      />
                      {errors.table?.[index]?.customer && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.table[index]?.customer?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`table.${index}.roomType`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Room Type
                      </label>
                      <div className="flex space-x-2">
                        <select
                          id={`table.${index}.roomType`}
                          className="block w-full py-2.5 pl-4 pr-10 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                          onChange={(e) => handleRoomTypeChange(e, index)}
                          value={
                            showCustomRoomType[index]
                              ? "Other"
                              : watch(`table.${index}.roomType`) || ""
                          }
                        >
                          <option value="">Select Room Type</option>
                          <option value="Single">Single</option>
                          <option value="Double">Double</option>
                          <option value="Twin">Twin</option>
                          <option value="Suite">Suite</option>
                          <option value="Deluxe">Deluxe</option>
                          <option value="Other">Other (please specify)</option>
                        </select>
                      </div>
                      {showCustomRoomType[index] && (
                        <div className="mt-2">
                          <input
                            type="text"
                            {...register(`table.${index}.roomType` as const, {
                              required: "Please specify the room type",
                            })}
                            className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                            placeholder="Enter room type"
                          />
                          {errors.table?.[index]?.roomType && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.table[index]?.roomType?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor={`table.${index}.bedType`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Bed Type
                      </label>
                      <div className="flex space-x-2">
                        <select
                          id={`table.${index}.bedType`}
                          className="block w-full py-2.5 pl-4 pr-10 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                          onChange={(e) => handleBedTypeChange(e, index)}
                          value={
                            showCustomBedType[index]
                              ? "Other"
                              : watch(`table.${index}.bedType`) || ""
                          }
                        >
                          <option value="">Select Bed Type</option>
                          <option value="Twin">Twin</option>
                          <option value="Double">Double</option>
                          <option value="Queen">Queen</option>
                          <option value="King">King</option>
                          <option value="California King">
                            California King
                          </option>
                          <option value="Other">Other (please specify)</option>
                        </select>
                      </div>
                      {showCustomBedType[index] && (
                        <div className="mt-2">
                          <input
                            type="text"
                            {...register(`table.${index}.bedType` as const, {
                              required: "Please specify the bed type",
                            })}
                            className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                            placeholder="Enter bed type"
                          />
                          {errors.table?.[index]?.bedType && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.table[index]?.bedType?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`table.${index}.smoking`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Smoking Preference
                      </label>
                      <select
                        id={`table.${index}.smoking`}
                        {...register(`table.${index}.smoking` as const)}
                        className="block w-full py-2.5 pl-4 pr-10 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                      >
                        <option value="Non-smoking">Non-smoking</option>
                        <option value="Smoking">Smoking</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor={`table.${index}.nights`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nights
                      </label>
                      <input
                        id={`table.${index}.nights`}
                        type="number"
                        min="1"
                        {...register(`table.${index}.nights` as const)}
                        className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`table.${index}.average`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Average Rate
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          id={`table.${index}.average`}
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`table.${index}.average` as const)}
                          className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2.5 py-1.5"
                        />
                      </div>
                    </div>

                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <div className="flex items-center h-5">
                          <input
                            id={`table.${index}.breakfast`}
                            type="checkbox"
                            {...register(`table.${index}.breakfast` as const)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={`table.${index}.breakfast`}
                            className="ml-2 block text-sm text-gray-700"
                          >
                            Breakfast Included
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor={`table.${index}.extras`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Extras
                    </label>
                    <input
                      id={`table.${index}.extras`}
                      type="text"
                      {...register(`table.${index}.extras` as const)}
                      className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                      placeholder="e.g., Extra bed, Early check-in, etc."
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    append({
                      customer: "",
                      roomType: "",
                      bedType: "",
                      smoking: "Non-smoking",
                      breakfast: false,
                      extras: "",
                      nights: watch("totalNights") || 1,
                      average: 0,
                      checkInDate: checkInDate || "",
                      checkOutDate: checkOutDate || "",
                    });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-indigo-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Another Room
                </button>
              </div>
            </div>

            {/* Payment & Additional Information Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Payment & Additional Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="currency"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl">
                    <select
                      id="currency"
                      {...register("currency")}
                      className="block w-full py-2.5 pl-4 pr-10 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                      aria-invalid={!!errors.currency}
                    >
                      <option value="">Choose Currency</option>
                      <option value="£" className="flex jcfs aic g10">
                        Pound (£)
                      </option>
                      <option value="€" className="flex jcfs aic g10">
                        Euro (€)
                      </option>
                      <option value="$" className="flex jcfs aic g10">
                        USD ($)
                      </option>
                      <option value="CA$" className="flex jcfs aic g10">
                        Canadian USD (CA$)
                      </option>
                    </select>
                    <svg
                      className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiNativeSelect-icon MuiNativeSelect-iconOutlined"
                      focusable="false"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      data-testid="ArrowDropDownIcon"
                      style={{
                        right: "8px",
                        position: "absolute",
                        pointerEvents: "none",
                        color: "rgba(0, 0, 0, 0.54)",
                        width: "1em",
                        height: "1em",
                        display: "inline-block",
                        fontSize: "1.5rem",
                        transition:
                          "fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                        flexShrink: 0,
                        userSelect: "none",
                      }}
                    >
                      <path d="M7 10l5 5 5-5z" fill="currentColor"></path>
                    </svg>
                    <fieldset
                      aria-hidden="true"
                      className="MuiOutlinedInput-notchedOutline"
                    >
                      <legend className="css-ihdtdm">
                        <span className="notranslate">​</span>
                      </legend>
                    </fieldset>
                  </div>
                  {errors.currency && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.currency.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="collectedAmount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Collected Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                        {watch("currency") || "$"}
                      </span>
                    </div>
                    <input
                      id="collectedAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("collectedAmount")}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="deposit"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Deposit
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      id="deposit"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("deposit")}
                      className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2.5 py-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="taxInPercent"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tax (%)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="taxInPercent"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("taxInPercent")}
                      className="block w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2.5 py-1.5"
                      defaultValue="0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span
                        className="text-gray-500 sm:text-sm"
                        id="price-currency"
                      >
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="penaltyFees"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Penalty Fees
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      id="penaltyFees"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("penaltyFees")}
                      className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2.5 py-1.5"
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="penaltyFeesName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Penalty Type
                  </label>
                  <select
                    id="penaltyFeesName"
                    {...register("penaltyFeesName")}
                    className="block w-full py-2.5 pl-4 pr-10 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    aria-invalid={!!errors.penaltyFeesName}
                  >
                    <option value="Penalty Fees">Penalty Fees</option>
                    <option
                      value="Transaction Fees"
                      className="flex jcfs aic g10"
                    >
                      Transaction Fees
                    </option>
                    <option
                      value="Refunded Amount"
                      className="flex jcfs aic g10"
                    >
                      Refunded Amount
                    </option>
                  </select>
                  {errors.penaltyFeesName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.penaltyFeesName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="referenceNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Reference Number
                  </label>
                  <input
                    id="referenceNumber"
                    type="text"
                    {...register("referenceNumber")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="e.g., REF-001"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="creditCard"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Credit Card Last 4 Digits
                  </label>
                  <input
                    id="creditCard"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    {...register("creditCard")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="Last 4 digits"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="attrition"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Attrition Policy
                  </label>
                  <input
                    id="attrition"
                    type="text"
                    {...register("attrition")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="e.g., 10%"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cancellation"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Cancellation Policy
                  </label>
                  <input
                    id="cancellation"
                    type="text"
                    {...register("cancellation")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="e.g., 48 hours"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cutOffDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Cut-off Date
                  </label>
                  <div className="relative">
                    <input
                      id="cutOffDate"
                      type="date"
                      {...register("cutOffDate", {
                        validate: (value) => {
                          if (!value) return true;

                          const today = new Date();
                          today.setHours(0, 0, 0, 0);

                          const checkInDate = getValues("checkInDate");
                          const selectedDate = new Date(value);

                          if (selectedDate < today) {
                            return "Cut-off date cannot be in the past";
                          }

                          if (
                            checkInDate &&
                            new Date(checkInDate) < selectedDate
                          ) {
                            return "Cut-off date cannot be after check-in date";
                          }

                          return true;
                        },
                      })}
                      min={new Date().toISOString().split("T")[0]}
                      max={watch("checkInDate")}
                      className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${
                        errors.cutOffDate ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.cutOffDate && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.cutOffDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.cutOffDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="cancellationPolicy"
                  className="block text-sm font-medium text-gray-700"
                >
                  Cancellation Policy Details
                </label>
                <textarea
                  id="cancellationPolicy"
                  rows={3}
                  {...register("cancellationPolicy")}
                  className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  placeholder="Full cancellation policy details..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200 mt-8">
              <Link
                to="/home"
                className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Dashboard
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceForm;
