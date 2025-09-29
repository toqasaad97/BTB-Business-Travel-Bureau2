import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { usePopup } from "../context/PopupContext";
import apiService from "../services/api";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

// Schema: ccEmails is the recipients array, first item is required
const emailSchema = yup.object({
  subject: yup.string().required("Subject is required"),
  message: yup.string().required("Message is required"),
  hotelOptionCode: yup.string().optional(),
  ccEmails: yup
    .array()
    .of(yup.string().email("Invalid email").required("Email is required"))
    .min(1, "At least one recipient is required"),
});

type EmailFormData = yup.InferType<typeof emailSchema>;

export default function EmailPopup() {
  const { currentPopup, closePopup } = usePopup();
  const { id } = useParams();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmailFormData>({
    resolver: yupResolver(emailSchema),
    defaultValues: { ccEmails: [""] }, // ensure primary recipient input exists
  });

  // tell useFieldArray the form type and the field name
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ccEmails",
  });

  const onSubmit = async (data: EmailFormData) => {
    console.log(id)
    if (!id) return;


    const recipients = (data.ccEmails ?? [])
      .map((s) => (s ?? "").trim())
      .filter((s) => s !== "");

    if (recipients.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }

    try {
      await apiService.sendInvoiceEmail(id, {
        subject: data.subject,
        message: data.message,
        hotelOptionCode: data.hotelOptionCode ?? undefined,
        ccEmails: recipients,
      });

      toast.success("Email sent successfully!");
      reset();
      closePopup();
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Failed to send email");
    }
  };

  if (currentPopup !== "emailSend") return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Send Email</h2>

        <input
          type="text"
          placeholder="Subject"
          {...register("subject")}
          className="w-full mb-1 px-3 py-2 border rounded-lg"
        />
        {errors.subject && <p className="text-red-500">{errors.subject.message}</p>}

        {/* Recipients: index 0 is "To Email", others are CC */}
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2 mb-1">
            <input
              type="email"
              placeholder={index === 0 ? "To Email" : `CC Email ${index}`}
              {...register(`ccEmails.${index}` as const)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-600 text-sm px-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {/* show first recipient validation if present */}
        {Array.isArray(errors.ccEmails) && (errors.ccEmails as any)[0] && (
          <p className="text-red-500">{(errors.ccEmails as any)[0].message}</p>
        )}
        {/* array-level error (e.g. min(1)) */}
        {(!Array.isArray(errors.ccEmails) && (errors.ccEmails as any)?.message) && (
          <p className="text-red-500">{(errors.ccEmails as any).message}</p>
        )}

        <button
          type="button"
          onClick={() => append("")}
          className="text-sm text-blue-600 mb-3 hover:underline"
        >
          + Add Another CC
        </button>

        <textarea
          placeholder="Message"
          rows={4}
          {...register("message")}
          className="w-full mb-1 px-3 py-2 border rounded-lg"
        />
        {errors.message && <p className="text-red-500">{errors.message.message}</p>}

        <input
          type="text"
          placeholder="Hotel Option Code"
          {...register("hotelOptionCode")}
          className="w-full mb-4 px-3 py-2 border rounded-lg"
        />

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              reset({ ccEmails: [""] });
              closePopup();
            }}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#4e74b9] hover:bg-[#3e6cc0] text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Email"}
          </button>
        </div>
      </form>
    </div>
  );
}
