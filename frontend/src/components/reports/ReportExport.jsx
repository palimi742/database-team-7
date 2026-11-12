import { fmtDate } from "../../api.js";
import "../../css/manager/ReportPrint.css";

export default function ReportExport({ from, through, dateLabel }) {
  return (
    <>
      <button
        className="report-export-button"
        type="button"
        onClick={() => window.print()}
      >
        Export to PDF
      </button>
      <p className="report-print-dates">
        {dateLabel} {fmtDate(from)} through {fmtDate(through)}
      </p>
    </>
  );
}
