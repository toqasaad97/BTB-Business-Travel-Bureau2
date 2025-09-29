import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link, useNavigate, useParams } from "react-router-dom";
import BtbLogo from "./Logo";
import {
  invoiceSchema,
  type InvoiceFormData,
  CURRENCIES,
} from "../types/invoice";
import apiService from "../services/api";
import toast from "react-hot-toast";

const EditInvoiceForm = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const mockInvoiceId = "INV-001"; // A mock ID for demonstration

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<InvoiceFormData>({
    resolver: yupResolver(invoiceSchema),
    mode: "onTouched",
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
  const phoneFields = watch("phone") || [""];
  const emailFields = watch("email") || [""];

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

  // Simulate fetching invoice data on component mount
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
          customer: response.customer,
          invoiceNumber: response.invoiceNumber,
          phone: response.phone,
          email: response.email,
          checkInDate: response.checkInDate,
          checkOutDate: response.checkOutDate,
          totalRooms: response.totalRooms,
          totalNights: response.totalNights,
          numberOfAdults: response.numberOfAdults,
          table: response.table,
          // response may not declare `deposit` in its type; cast to any and provide a safe fallback
          deposit: (response as any).deposit ?? undefined,
          paymentMethod: response.paymentMethod,
          currency: response.currency,
          notes: response.notes?.toString(),
        };
        reset(apiData);
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
  }, [reset, mockInvoiceId]);

  // Handle form submission
  const onSubmit = async (data: InvoiceFormData) => {
    if (isSubmitting) return;

    console.log("Form submitted with data:", data);
    // Simulate API call success
    try {
      if (!id) {
        toast.error("id is not found")
        return
      }
      setIsSubmitting(true);
      const apiData: InvoiceFormData = {
        customer: data.customer,
        invoiceNumber: data.invoiceNumber,
        phone: Array.isArray(data.phone) ? data.phone.filter(Boolean) : [],
        email: Array.isArray(data.email) ? data.email.filter(Boolean) : [],
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        totalRooms: Number(data.totalRooms) || 1,
        deposit: data.deposit,
        totalNights:
          Number(data.totalNights) || Number(getValues("totalNights")) || 1,
        numberOfAdults: Number(data.numberOfAdults) || 1,
        table: (data.table || []).map((t) => ({
          customer: t.customer ?? "",
          roomType: t.roomType ?? "",
          bedType: t.bedType ?? "",
          smoking: t.smoking ?? "Non-smoking",
          breakfast: !!t.breakfast,
          extras: t.extras ?? "",
          nights: Number(t.nights) || Number(getValues("totalNights")) || 1,
          average: Number(t.average) || 0,
          checkInDate: t.checkInDate ?? data.checkInDate,
          checkOutDate: t.checkOutDate ?? data.checkOutDate,
        })),
        paymentMethod: data.paymentMethod ?? "",
        currency: data.currency ?? "USD",
        notes: data.notes ? String(data.notes) : "",
      };

      // Overwrite/mutate the form data object so the subsequent call uses the cleaned payload
      Object.assign(data, apiData);

      // Build a payload that matches the expected API shape and convert incompatible fields.
      // In particular, convert numeric/undefined deposit to a boolean (API expects boolean | undefined).
      const payload = {
        customer: data.customer,
        invoiceNumber: data.invoiceNumber,
        phone: Array.isArray(data.phone) ? data.phone.filter(Boolean) : [],
        email: Array.isArray(data.email) ? data.email.filter(Boolean) : [],
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        totalRooms: Number(data.totalRooms) || 1,
  // Keep deposit as numeric value (or undefined) for the API
  deposit: typeof data.deposit === "number" ? Number(data.deposit) : undefined,
        totalNights:
          Number(data.totalNights) || Number(getValues("totalNights")) || 1,
        numberOfAdults: Number(data.numberOfAdults) || 1,
        table: (data.table || []).map((t) => ({
          customer: t.customer ?? "",
          roomType: t.roomType ?? "",
          bedType: t.bedType ?? "",
          smoking: t.smoking ?? "Non-smoking",
          breakfast: !!t.breakfast,
          extras: t.extras ?? "",
          nights: Number(t.nights) || Number(getValues("totalNights")) || 1,
          average: Number(t.average) || 0,
          checkInDate: t.checkInDate ?? data.checkInDate,
          checkOutDate: t.checkOutDate ?? data.checkOutDate,
        })),
        paymentMethod: data.paymentMethod ?? "",
        currency: data.currency ?? "USD",
        notes: data.notes ? String(data.notes) : "",
      };

      // Cast to any to satisfy the service signature without changing service types here
      await apiService.editInvoice(id, payload as any);

    } catch (err) {
      console.error("Error loading invoice:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load invoice");

      if (err instanceof Error && err.message.includes("401")) {
        apiService.clearToken();
        navigate("/");
      }
    }
    navigate(`/reservation/${id}`)
    setIsSubmitting(false);
    toast.success("Invoice updated successfully!");
  };

  // Handle adding/removing phone numbers
  const {
    fields: phoneFieldItems,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control,
    name: "phone",
  });

  // Handle adding/removing email addresses
  const {
    fields: emailFieldItems,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control,
    name: "email",
  });

  // Handle total rooms change
  const handleTotalRoomsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalRooms = parseInt(e.target.value) || 0;
    const currentTotalRooms = getValues("totalRooms") || 0;

    if (newTotalRooms > currentTotalRooms) {
      // Add new rooms
      const roomsToAdd = newTotalRooms - currentTotalRooms;
      const newRooms = Array(roomsToAdd)
        .fill(null)
        .map(() => ({
          customer: "",
          roomType: "",
          bedType: "",
          smoking: "",
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
      for (let i = 0; i < roomsToRemove; i++) {
        remove(currentTotalRooms - 1 - i);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold">Edit Invoice</h1>
            </div>
          </div>

          {/* Main Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 md:p-8 space-y-6"
          >
            {/* Guest Information Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Guest Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Guest Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="customer"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Guest Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customer"
                    type="text"
                    {...register("customer")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="Guest Name"
                  />
                  {errors.customer && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customer.message}
                    </p>
                  )}
                </div>

                {/* Reservation Number */}
                <div className="space-y-2">
                  <label
                    htmlFor="invoiceNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Reservation Number
                  </label>
                  <input
                    id="invoiceNumber"
                    type="text"
                    {...register("invoiceNumber")}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                    placeholder="Reservation Number"
                  />
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Numbers <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => appendPhone("")}
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

                {phoneFieldItems.map((field, index) => (
                  <div key={field.id} className="flex gap-x-2">
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        {...register(`phone.${index}` as const)}
                        className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${errors.phone?.[index] ? "ring-2 ring-red-500" : ""
                          }`}
                        placeholder="+1 (555) 123-4567"
                      />
                      {errors.phone?.[index] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.phone?.[index]?.message}
                        </p>
                      )}
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removePhone(index)}
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
                    )}
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
                    onClick={() => appendEmail("")}
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

                {emailFieldItems.map((field, index) => (
                  <div key={field.id} className="flex gap-x-2">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        {...register(`email.${index}` as const)}
                        className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${errors.email?.[index] ? "ring-2 ring-red-500" : ""
                          }`}
                        placeholder="email@example.com"
                      />
                      {errors.email?.[index] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email?.[index]?.message}
                        </p>
                      )}
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeEmail(index)}
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
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stay Information Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Stay Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in Date */}
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
                    min={new Date().toISOString().split("T")[0]}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  />
                  {errors.checkInDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.checkInDate.message}
                    </p>
                  )}
                </div>

                {/* Check-out Date */}
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
                    min={checkInDate || new Date().toISOString().split("T")[0]}
                    className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  />
                  {errors.checkOutDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.checkOutDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Rooms */}
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

                {/* Total Nights */}
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
                    className="block w-full py-2.5 px-4 text-gray-900 bg-gray-100/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                  />
                </div>

                {/* Number of Adults */}
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Room Details
                </h2>
                <div className="text-sm text-gray-500">
                  {fields.length} {fields.length === 1 ? "Room" : "Rooms"}
                </div>
              </div>

              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-medium text-gray-900">
                        Room {index + 1}
                      </h3>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            remove(index);
                            setValue("totalRooms", Math.max(1, totalRooms - 1));
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Remove Room
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Guest Name */}
                      <div className="space-y-2">
                        <label
                          htmlFor={`table.${index}.customer`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Guest Name{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          id={`table.${index}.customer`}
                          {...register(`table.${index}.customer` as const)}
                          className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${errors.table?.[index]?.customer
                              ? "ring-2 ring-red-500"
                              : ""
                            }`}
                          placeholder="Guest Name"
                        />
                        {errors.table?.[index]?.customer && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.table?.[index]?.customer?.message}
                          </p>
                        )}
                      </div>

                      {/* Room Type */}
                      <div className="space-y-2">
                        <label
                          htmlFor={`table.${index}.roomType`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Room Type{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <select
                          id={`table.${index}.roomType`}
                          {...register(`table.${index}.roomType` as const)}
                          className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${errors.table?.[index]?.roomType
                              ? "ring-2 ring-red-500"
                              : ""
                            }`}
                        >
                          <option value="">Select room type</option>
                          <option value="Single">Single</option>
                          <option value="Double">Double</option>
                          <option value="Twin">Twin</option>
                          <option value="Suite">Suite</option>
                          <option value="Deluxe">Deluxe</option>
                        </select>
                        {errors.table?.[index]?.roomType && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.table?.[index]?.roomType?.message}
                          </p>
                        )}
                      </div>

                      {/* Bed Type */}
                      <div className="space-y-2">
                        <label
                          htmlFor={`table.${index}.bedType`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Bed Type{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <select
                          id={`table.${index}.bedType`}
                          {...register(`table.${index}.bedType` as const)}
                          className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${errors.table?.[index]?.bedType
                              ? "ring-2 ring-red-500"
                              : ""
                            }`}
                        >
                          <option value="">Select bed type</option>
                          <option value="Twin">Twin</option>
                          <option value="Full">Full</option>
                          <option value="Queen">Queen</option>
                          <option value="King">King</option>
                          <option value="California King">
                            California King
                          </option>
                        </select>
                        {errors.table?.[index]?.bedType && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.table?.[index]?.bedType?.message}
                          </p>
                        )}
                      </div>

                      {/* Smoking Preference */}
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
                          className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                        >
                          <option value="Non-smoking">Non-smoking</option>
                          <option value="Smoking">Smoking</option>
                        </select>
                      </div>

                      {/* Breakfast */}
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...register(`table.${index}.breakfast` as const)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Include Breakfast
                          </span>
                        </label>
                      </div>

                      {/* Special Requests */}
                      <div className="space-y-2 md:col-span-2">
                        <label
                          htmlFor={`table.${index}.extras`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Special Requests
                        </label>
                        <textarea
                          id={`table.${index}.extras`}
                          {...register(`table.${index}.extras` as const)}
                          rows={2}
                          className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                          placeholder="Any special requests or notes..."
                        />
                      </div>

                      {/* Nights */}
                      <div className="space-y-2">
                        <label
                          htmlFor={`table.${index}.nights`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Nights
                        </label>
                        <input
                          type="number"
                          id={`table.${index}.nights`}
                          {...register(`table.${index}.nights` as const, {
                            valueAsNumber: true,
                          })}
                          min="1"
                          className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                        />
                      </div>

                      {/* Average Rate */}
                      <div className="space-y-2">
                        <label
                          htmlFor={`table.${index}.average`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Average Rate
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            id={`table.${index}.average`}
                            {...register(`table.${index}.average` as const, {
                              valueAsNumber: true,
                            })}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2.5 px-4 text-gray-900 bg-white/50"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Total */}
                      <div className="space-y-2">
                        <div className="block text-sm font-medium text-gray-700">
                          Total
                        </div>
                        <div className="mt-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-md text-sm">
                          $
                          {(watch(`table.${index}.nights`) || 0) *
                            (watch(`table.${index}.average`) || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Payment Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Method */}
                <div className="space-y-2">
                  <label
                    htmlFor="paymentMethod"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="paymentMethod"
                    {...register("paymentMethod")}
                    className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${errors.paymentMethod ? "ring-2 ring-red-500" : ""
                      }`}
                  >
                    <option value="">Select payment method</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.paymentMethod && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.paymentMethod.message}
                    </p>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <label
                    htmlFor="currency"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="currency"
                    {...register("currency")}
                    className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${errors.currency ? "ring-2 ring-red-500" : ""
                      }`}
                  >
                    {Object.entries(CURRENCIES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name} ({code})
                      </option>
                    ))}
                  </select>
                  {errors.currency && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.currency.message}
                    </p>
                  )}
                </div>
              </div>
              {/* Deposit */}
              <div className="space-y-2">
                <label
                  htmlFor="deposit"
                  className="block text-sm font-medium text-gray-700"
                >
                  Deposit <span className="text-red-500">*</span>
                </label>
                <input
                  id="deposit"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("deposit", { valueAsNumber: true })}
                  className={`block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none ${errors.deposit ? "ring-2 ring-red-500" : ""}`}
                />
                {errors.deposit && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.deposit.message}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                Additional Notes
              </label>
              <textarea
                id="notes"
                {...register("notes")}
                rows={3}
                className="block w-full py-2.5 px-4 text-gray-900 bg-white/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm transition-all duration-200 border-none"
                placeholder="Any additional notes or special instructions..."
              />
            </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
      </div >
    </div >
  );
};

export default EditInvoiceForm;
