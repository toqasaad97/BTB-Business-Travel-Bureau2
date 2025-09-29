import { createContext, useContext, useState, type ReactNode } from "react";

type PopupType = "creditVoucher" | "emailSend" | "activities" | null;

interface PopupContextType {
  openPopup: (type: PopupType) => void;
  closePopup: () => void;
  currentPopup: PopupType;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [currentPopup, setCurrentPopup] = useState<PopupType>(null);

  const openPopup = (type: PopupType) => setCurrentPopup(type);
  const closePopup = () => setCurrentPopup(null);

  return (
    <PopupContext.Provider value={{ openPopup, closePopup, currentPopup }}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used within PopupProvider");
  return ctx;
};
