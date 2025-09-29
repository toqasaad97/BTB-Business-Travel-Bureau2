import { usePopup } from "../context/PopupContext";
export default function InvoiceActivitiesPopup() {
  const { currentPopup, closePopup } = usePopup();

  const activities = [
    { date: "September 28, 2025", time: "05:58:51" },
    { date: "September 28, 2025", time: "06:00:08" },
    { date: "September 28, 2025", time: "06:04:14" },
    { date: "September 28, 2025", time: "06:05:08" },
    { date: "September 28, 2025", time: "06:07:14" },
    { date: "September 28, 2025", time: "06:08:36" },
  ];
  return (
    <>
    
      {currentPopup === "activities" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Invoice Activities</h2>
              <button onClick={() => closePopup()}>✕</button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activities.map((act, i) => (
                <div
                  key={i}
                  className="flex justify-between border rounded p-3 shadow-sm"
                >
                  <span className="text-gray-600">Log Edited</span>
                  <span className="font-medium">
                    {act.date} {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
