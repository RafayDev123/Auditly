"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";

type ReportData = {
  domain: string;
  targetUrl: string;
  createdAt: string;
  scores: Array<{
    category: string;
    mobile: number | null;
    desktop: number | null;
  }>;
  metrics: Array<{
    label: string;
    value: number | null;
    unit: string;
    source: string;
  }>;
  recommendations: Array<{
    category: string;
    strategy: string;
    title: string;
    score: number | null;
    displayValue: string;
    recommendation: string;
    finalHost: string | null;
    diagnosticDetails: string | null;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function DownloadReportButton({ report }: { report: ReportData }) {
  const [loading, setLoading] = useState(false);

  function downloadReport() {
    setLoading(true);

    try {
      const document = new jsPDF();
      const pageWidth = document.internal.pageSize.getWidth();
      const pageHeight = document.internal.pageSize.getHeight();
      const margin = 42;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const ensureSpace = (height: number) => {
        if (y + height > pageHeight - margin) {
          document.addPage();
          y = margin;
        }
      };

      const addText = (text: string, size = 10, gap = 5) => {
        document.setFontSize(size);
        const lines = document.splitTextToSize(text, contentWidth) as string[];
        ensureSpace(lines.length * 14 + gap);
        document.text(lines, margin, y);
        y += lines.length * 14 + gap;
      };

      const addHeading = (text: string) => {
        ensureSpace(28);
        document.setFont("helvetica", "bold");
        addText(text, 13, 8);
        document.setFont("helvetica", "normal");
      };

      document.setFont("helvetica", "bold");
      addText("Google PageSpeed Insights Report", 20, 10);
      document.setFont("helvetica", "normal");
      addText(report.domain, 14, 3);
      addText(report.targetUrl, 10, 3);
      addText(`Scanned: ${formatDate(report.createdAt)}`, 10, 12);

      addHeading("Lighthouse category scores");
      report.scores.forEach((score) => {
        addText(`${score.category}: Mobile ${score.mobile ?? "-"}/100 | Desktop ${score.desktop ?? "-"}/100`, 10, 4);
      });

      addHeading("Google performance metrics");
      if (report.metrics.length) {
        report.metrics.forEach((metric) => {
          addText(`${metric.label}: ${metric.value ?? "-"} ${metric.unit} (${metric.source})`, 10, 4);
        });
      } else {
        addText("No Google performance metrics were collected.", 10, 6);
      }

      addHeading("Google Lighthouse issues and recommendations");
      if (report.recommendations.length) {
        report.recommendations.forEach((item, index) => {
          addText(`${index + 1}. ${item.title} (${item.category}, ${item.strategy})`, 10, 2);
          if (item.finalHost && item.finalHost !== report.domain) {
            addText(`Lighthouse followed a redirect and analyzed ${item.finalHost}.`, 9, 2);
          }
          addText(`Audit score: ${item.score ?? "-"}/100${item.displayValue ? ` | ${item.displayValue}` : ""}`, 9, 2);
          addText(item.recommendation, 9, 8);
          if (item.diagnosticDetails) {
            addText(`Diagnostic details:\n${item.diagnosticDetails}`, 8, 8);
          }
        });
      } else {
        addText("No failed Lighthouse recommendations were returned.", 10, 6);
      }

      const totalPages = document.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        document.setPage(page);
        document.setFontSize(8);
        document.setTextColor(110, 110, 110);
        document.text(`Google PageSpeed Insights | Page ${page} of ${totalPages}`, margin, pageHeight - 20);
        document.setTextColor(0, 0, 0);
      }

      const filename = `${report.domain.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "website"}-pagespeed-report.pdf`;
      document.save(filename);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={downloadReport} disabled={loading}>
      <Download className="h-4 w-4" aria-hidden="true" />
      {loading ? "Preparing PDF..." : "Download PDF"}
    </Button>
  );
}