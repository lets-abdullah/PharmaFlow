import { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Package, ReceiptText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const reports = [
  {
    type: 'sales',
    title: 'Sales Report',
    description: 'All invoices with customer, item, sales amount, and estimated profit.',
    icon: ReceiptText,
    color: 'blue',
  },
  {
    type: 'purchases',
    title: 'Purchase Report',
    description: 'Inventory inward history with supplier costs and purchase totals.',
    icon: FileSpreadsheet,
    color: 'green',
  },
  {
    type: 'profit',
    title: 'Profit Report',
    description: 'Daily, weekly, and monthly sales and profit shown separately.',
    icon: TrendingUp,
    color: 'indigo',
  },
  {
    type: 'inventory',
    title: 'Inventory Report',
    description: 'Current stock, expiry, purchase value, and retail valuation.',
    icon: Package,
    color: 'orange',
  },
];

const colors: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
};

export default function Reports() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadReport = async (type: string, title: string) => {
    try {
      setDownloading(type);
      const response = await fetch(`/api/reports/${type}`);
      if (!response.ok) throw new Error('Report could not be generated');

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || `${type}-report.csv`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`${title} downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Report download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>
          <p className="text-gray-500">Generate CSV reports for sales, purchases, profit, and inventory.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
          <BarChart3 size={18} />
          <span>CSV Export</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(report => (
          <ReportCard
            key={report.type}
            report={report}
            downloading={downloading === report.type}
            onDownload={() => downloadReport(report.type, report.title)}
          />
        ))}
      </div>
    </div>
  );
}

function ReportCard({ report, downloading, onDownload }: any) {
  const Icon = report.icon;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className={`p-3 rounded-xl border ${colors[report.color]}`}>
          <Icon size={24} />
        </div>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} />
          <span>{downloading ? 'Generating' : 'Download'}</span>
        </button>
      </div>
      <h3 className="mt-5 text-lg font-bold text-gray-900">{report.title}</h3>
      <p className="mt-1 text-sm text-gray-500 leading-6">{report.description}</p>
    </div>
  );
}
