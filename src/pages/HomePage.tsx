import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormListItem } from "../types/invoice";
import BtbLogo from "../components/Logo";
import { apiService } from "../services/api";

const HomePage: React.FC = () => {
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  const navigate = useNavigate();

  const setFormsFromResponse = useCallback((invoices: unknown) => {
    if (Array.isArray(invoices)) {
      setForms(invoices as FormListItem[]);
      return;
    }

    if (invoices && typeof invoices === "object") {
      const response = invoices as { data?: unknown };
      if (Array.isArray(response.data)) {
        setForms(response.data as FormListItem[]);
        return;
      }
    }

    console.warn("Unexpected API response format:", invoices);
    setForms([]);
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!apiService.isAuthenticated()) {
        navigate("/");
        return;
      }

      const invoices = await apiService.listInvoices();
      setFormsFromResponse(invoices);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError(err instanceof Error ? err.message : "Failed to load invoices");
      setForms([]);

      if (err instanceof Error && err.message.includes("401")) {
        apiService.clearToken();
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, setFormsFromResponse]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Pagination calculations
  const totalPages = Math.ceil(forms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentForms = forms.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top on page change
  };

  const handleLogout = () => {
    console.log("User logged out (Simulated)");
    navigate("/");
  };

  const handleDuplicate = async (form: FormListItem) => {
    if (!apiService.isAuthenticated()) {
      navigate("/");
      return;
    }

    const oldInvoiceNumber = form.invoiceNumber;

    if (!oldInvoiceNumber) {
      alert(
        "This invoice is missing an invoice number and can't be duplicated."
      );
      return;
    }

    const invoiceNumberInput = window.prompt(
      "Enter invoice number for the duplicated invoice",
      `${oldInvoiceNumber}-copy`
    );

    if (invoiceNumberInput === null) {
      return;
    }

    const invoiceNumber = invoiceNumberInput.trim();

    if (!invoiceNumber) {
      alert("Invoice number is required to duplicate.");
      return;
    }

    const referenceNumberInput = window.prompt(
      "Enter reference number for the duplicated invoice",
      form.referenceNumber ? `${form.referenceNumber}-copy` : ""
    );

    if (referenceNumberInput === null) {
      return;
    }

    const referenceNumber = referenceNumberInput.trim();

    if (!referenceNumber) {
      alert("Reference number is required to duplicate.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiService.duplicateInvoice({
        invoiceNumber,
        referenceNumber,
        oldInvoiceNumber,
      });

      const updatedInvoices = await apiService.listInvoices();
      setFormsFromResponse(updatedInvoices);

      alert("Invoice duplicated successfully!");
    } catch (err) {
      console.error("Error duplicating invoice:", err);
      alert(err instanceof Error ? err.message : "Failed to duplicate invoice");

      if (err instanceof Error && err.message.includes("401")) {
        apiService.clearToken();
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <BtbLogo width={150} height={130} className="mb-6" />
        <div className="text-gray-600">Loading your invoices...</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logo and actions */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <BtbLogo width={100} height={50} className="mr-3" />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/create")}
              className="px-4 py-2 bg-[#ff7e29] hover:bg-[#e57125] text-white rounded-md transition-colors flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Invoice
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md transition-colors flex items-center text-sm"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        {forms.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No invoices yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first invoice
            </p>
            <button
              onClick={() => navigate("/create")}
              className="px-4 py-2 bg-[#ff7e29] hover:bg-[#e57125] text-white rounded-md transition-colors inline-flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Invoice
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(currentForms) && currentForms.length > 0 ? (
                currentForms.map((form) => (
                  <div
                    key={form._id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    <div className="p-5 flex-grow">
                      {/* Email and Initial */}
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2d2b8c] to-[#1a1940] flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                          {form.email[0]
                            ? form.email[0].charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {form.email[0] || "No Email"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {form.invoiceNumber
                              ? `Invoice #${form.invoiceNumber}`
                              : "No ID"}
                          </p>
                        </div>
                      </div>

                      {/* Reference Number */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Reference Number
                        </p>
                        <p className="text-sm text-gray-700 font-medium break-all">
                          {form.referenceNumber || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="px-5 pb-4 space-y-2">
                      <button
                        onClick={() => handleDuplicate(form)}
                        disabled={!form.invoiceNumber}
                        className={`w-full py-1.5 rounded-md transition-colors duration-200 flex items-center justify-center text-sm mb-2 ${
                          form.invoiceNumber
                            ? "bg-[#2d2b8c] hover:bg-[#ff7e29] text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <svg
                          className="w-3.5 h-3.5 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Duplicate
                      </button>
                      <button
                        onClick={() => navigate(`/reservation/${form._id}`)}
                        className="w-full py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors duration-200 flex items-center justify-center text-sm mb-2"
                      >
                        <svg
                          className="w-3.5 h-3.5 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/edit/${form._id}`)}
                        className="w-full py-1.5 bg-[#2d2b8c] hover:bg-[#ff7e29] text-white rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
                      >
                        <svg
                          className="w-3.5 h-3.5 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
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
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No invoices found
                  </h3>
                  <p className="text-gray-500">
                    {Array.isArray(forms)
                      ? "You don't have any invoices yet."
                      : "Unable to load invoices."}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {Array.isArray(forms) && forms.length > itemsPerPage && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  {/* Previous button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-[#5a75d4] text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            )}

            {/* Page info */}
            {Array.isArray(forms) && forms.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, forms.length)}{" "}
                of {forms.length} invoices
              </div>
            )}
          </>
        )}
      </main>
      {/* Footer with larger logo */}
      <footer className="mt-12 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <BtbLogo width={170} height={160} className="mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} BTB International. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
