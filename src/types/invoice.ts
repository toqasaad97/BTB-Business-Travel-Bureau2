import * as yup from 'yup';

// Room/Table Item Schema
export interface Room {
  nights: number;
  average: number;
  customer?: string;
  checkInDate?: string;
  checkOutDate?: string;
  smoking?: string | boolean;
  breakfast?: boolean;
  roomType?: string;
  bedType?: string;
  extras?: string;
}

export interface InvoiceFormData {
  invoiceNumber?: string;
  invoiceTo?: string;
  customer?: string;
  company?: string;
  address?: string;
  phone?: string[];
  email?: string[];
  hotelName?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  checkInDate?: string;
  checkOutDate?: string;
  modificationDate?: string;
  remainingBalanceDue?: string;
  taxInPercent?: number;
  totalRooms?: number;
  totalNights?: number;
  collectedAmount?: number;
  refundAmount?: number;
  penaltyFees?: number;
  penaltyFeesName?: string;
  paymentMethod?: string;
  currency?: string;
  referenceNumber?: string;
  attrition?: string;
  cancellation?: string;
  notes?: string;
  cutOffDate?: string;
  hotelCheckIn?: string; // Changed to string for time input
  hotelCheckOut?: string; // Changed to string for time input
  numberOfAdults?: number;
  creditCard?: string;
  deposit?: number; // Changed from boolean to number
  cancellationPolicy?: string;
  table?: Room[];
}

// Room/Table Item Schema
export const tableItemSchema = yup.object().shape({
  customer: yup.string(),
  checkInDate: yup.string(),
  checkOutDate: yup.string(),
  roomType: yup.string(),
  bedType: yup.string(),
  smoking: yup.string(),
  breakfast: yup.boolean(),
  extras: yup.string(),
  nights: yup.number()
    .min(1, 'At least 1 night is required')
    .default(1),
  average: yup.number()
    .min(0, 'Must be 0 or more')
    .default(0),
});

export const invoiceSchema = yup.object().shape({
  invoiceNumber: yup.string()
    .min(3, 'Invoice number must be at least 3 characters'),
  invoiceTo: yup.string()
    .min(3, 'Must be at least 3 characters'),
  customer: yup.string()
    .min(3, 'Name must be at least 3 characters'),
  company: yup.string(),
  address: yup.string()
    .min(5, 'Address must be at least 5 characters'),
  phone: yup.array()
    .of(yup.string()),
  email: yup.array()
    .of(yup.string().email('Invalid email format')),
  hotelName: yup.string()
    .min(3, 'Hotel name must be at least 3 characters'),
  hotelAddress: yup.string()
    .min(5, 'Address must be at least 5 characters'),
  hotelPhone: yup.string(),
  checkInDate: yup
    .string()
    .test('is-future-date', 'Check-in date must be today or in the future', function (value) {
      if (!value) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(value);
      return selectedDate >= today;
    }),
  hotelCheckIn: yup.string(),
  checkOutDate: yup
    .string()
    .test('is-after-checkin', 'Check-out date must be after check-in date', function (value) {
      const { checkInDate } = this.parent;
      if (!checkInDate || !value) return true;
      return new Date(value) > new Date(checkInDate);
    }),
  hotelCheckOut: yup.string(),
  modificationDate: yup.string(),
  remainingBalanceDue: yup.string(),
  taxInPercent: yup.number().min(0, 'Must be positive').max(100, 'Cannot exceed 100%').default(0),
  totalRooms: yup.number()
    .min(0, 'Cannot be negative')
    .default(0),
  totalNights: yup.number()
    .min(1, 'At least 1 night is required')
    .default(1),
  collectedAmount: yup.number().min(0, 'Cannot be negative').default(0),
  refundAmount: yup.number().min(0, 'Cannot be negative').default(0),
  penaltyFees: yup.number().min(0, 'Cannot be negative').default(0),
  penaltyFeesName: yup.string().default('Penalty Fees'),
  currency: yup.string(),
  referenceNumber: yup.string(),
  attrition: yup.string(),
  cancellation: yup.string(),
  cutOffDate: yup
    .string()
    .test('is-before-checkin', 'Cut-off date must be on or before check-in date', function (value) {
      if (!value) return true; // Optional field
      const { checkInDate } = this.parent;
      if (!checkInDate) return true; // If no check-in date, let other validation handle it
      return new Date(value) <= new Date(checkInDate);
    })
    .test('is-future-date', 'Cut-off date must be today or in the future', function (value) {
      if (!value) return true; // Optional field
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(value);
      return selectedDate >= today;
    }),
  numberOfAdults: yup.number()
    .min(1, 'At least 1 adult is required')
    .default(1),
  creditCard: yup.string(),
  deposit: yup.number().min(0, 'Cannot be negative').default(0),
  cancellationPolicy: yup.string(),
  table: yup
    .array()
    .of(tableItemSchema)
    .default(() => ([{ // Default with one empty room for initial form state
      customer: '',
      roomType: '',
      bedType: '',
      smoking: 'Non-smoking',
      breakfast: false,
      extras: '',
      nights: 1,
      average: 0,
      checkInDate: '',
      checkOutDate: '',
    }]))
});

export const defaultFormValues: InvoiceFormData = {
  invoiceNumber: "",
  invoiceTo: "",
  customer: "",
  company: "",
  address: "",
  phone: [""],
  email: [""],
  hotelName: "",
  hotelAddress: "",
  hotelPhone: "",
  checkInDate: "",
  checkOutDate: "",
  modificationDate: "",
  remainingBalanceDue: "",
  taxInPercent: 0,
  totalRooms: 1,
  totalNights: 1,
  collectedAmount: 0,
  refundAmount: 0,
  penaltyFees: 0,
  penaltyFeesName: "Penalty Fees",
  currency: "USD",
  referenceNumber: "",
  attrition: "",
  cancellation: "",
  cutOffDate: "",
  hotelCheckIn: "", // Default for time input
  hotelCheckOut: "", // Default for time input
  numberOfAdults: 1,
  creditCard: "",
  deposit: 0,
  cancellationPolicy: "",
  table: [
    {
      customer: "",
      roomType: "",
      bedType: "",
      smoking: "Non-smoking",
      breakfast: false,
      extras: "",
      nights: 1,
      average: 0,
      checkInDate: "",
      checkOutDate: "",
    },
  ],
};

export const CURRENCIES: { [key: string]: string } = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
};

// Simplified type for the form list
export interface FormListItem {
  _id: string;
  email: string[];
  referenceNumber?: string;
  invoiceNumber?: string; // Optional, based on your data sample
  totalAmount?: number;
  currency?: string;
}
