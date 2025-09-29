import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { usePopup } from "../context/PopupContext";
import * as Yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const schema = Yup.object().shape({
  details: Yup.string().required("Details are required"),
  validUntil: Yup.string().required("Valid until date is required"), // <-- string, not date
  amount: Yup.number()
    .typeError("Amount must be a number")
    .positive("Must be positive")
    .required("Amount is required"),
});


type InvoiceData = {
  invoiceNumber?: string;
};

export default function VoucherPopup() {
  const { currentPopup, closePopup } = usePopup();
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Fetch invoice data when popup opens
  useEffect(() => {
    if (!id || currentPopup !== "creditVoucher") return;

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = (await apiService.getClientInvoice(id)).data;
        setInvoiceData({
          invoiceNumber: response.invoiceNumber || "",
        });
      } catch (err: any) {
        console.error("Error loading invoice:", err);
        setError(err?.message || "Failed to load invoice");

        if (err?.message?.includes("401")) {
          apiService.clearToken();
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, currentPopup, navigate]);

  const onSubmit = async (data: {
    details: string;
    validUntil: string;
    amount: number;
  }) => {
    if (!id) return;

    try {
      const blob = await apiService.generateVoucher(id, {
        details: data.details,
        validUntil: data.validUntil,
        amount: data.amount,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `voucher-${invoiceData?.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Voucher downloaded successfully!");
      reset();
      closePopup();
    } catch (err) {
      console.error("Error generating voucher:", err);
      toast.error("Failed to generate voucher");
    }
  };

  if (currentPopup !== "creditVoucher") return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Download Credit Voucher</h2>
          <button onClick={closePopup}>✕</button>
        </div>

        {loading && <p>Loading invoice...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm">Details</label>
            <input
              {...register("details")}
              placeholder="Details"
              className="w-full border rounded px-3 py-2"
            />
            {errors.details && (
              <p className="text-red-500 text-sm">{errors.details.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm">Valid Until</label>
            <input
              type="date"
              {...register("validUntil")}
              className="w-full border rounded px-3 py-2"
            />
            {errors.validUntil && (
              <p className="text-red-500 text-sm">{errors.validUntil.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm">Amount</label>
            <input
              type="number"
              {...register("amount")}
              placeholder="Amount"
              className="w-full border rounded px-3 py-2"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={closePopup}
              className="px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#4e74b9] hover:bg-[#3e6cc0] text-white rounded "
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
