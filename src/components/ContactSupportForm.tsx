import { useState } from "react";
import BtbLogo from "./Logo";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  referenceNumber: string;
  message: string;
}

export default function ContactSupportForm() {
  const [form, setForm] = useState<ContactFormData>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      name: params.get("name") || "",
      email: params.get("email") || "support@btbintl.com",
      phone: params.get("phone") || "",
      referenceNumber: params.get("referenceNumber") || "",
      message: "",
    };
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailBody = `Hi, my name is ${form.name}.\n\nBooking Reference: ${form.referenceNumber}\n\nMessage:\n${form.message}\n\nContact Information:\n- Phone: ${form.phone}\n- Email: ${form.email}`;

    const mailtoLink = `mailto:support@btbintl.com?subject=Booking Inquiry - ${
      form.referenceNumber
    }&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <BtbLogo width={100} height={88} />
      </div>
      <h2 className="text-2xl font-semibold text-[#221f60] mb-6 text-center">
        Contact Support
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking Reference <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="referenceNumber"
            value={form.referenceNumber}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#f37e24] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#f37e24] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#f37e24] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#f37e24] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Message <span className="text-red-500">*</span>
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please describe your issue or inquiry..."
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-[#221f60] text-white py-3 px-4 rounded-md hover:bg-[#1a174d] focus:outline-none focus:ring-2 focus:ring-[#f37e24] focus:ring-offset-2 transition-colors font-medium"
          >
            Send Message to Support
          </button>
        </div>
      </form>
    </div>
  );
}
