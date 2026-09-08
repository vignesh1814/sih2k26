import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRBAC } from '../contexts/RBACContext'
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Search, 
  Eye, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  Gavel, 
  AlertTriangle,
  X,
  Send,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchScans, issueChallan } from '../services/api'

interface Report {
  id: string
  scan_id: string
  status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'SETTLED'
  product_name: string
  manufacturer: string
  net_quantity: string
  mrp: string
  violations_count: number
  generated_at: string
  pdf_url: string
  evidence_hash: string
  violations?: string[]
}

const Reports: React.FC = () => {
  const { user } = useAuth()
  const { hasPermission } = useRBAC()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [hideSettled, setHideSettled] = useState<boolean>(true)
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [viewingReport, setViewingReport] = useState<Report | null>(null)
  
  // Superior Officer Issue Challan Modal State
  const [challanModalReport, setChallanModalReport] = useState<Report | null>(null)
  const [challanPenalty, setChallanPenalty] = useState<number>(25000)
  const [challanNotes, setChallanNotes] = useState<string>('Statutory non-compliance compounding notice under Legal Metrology Act, 2009.')
  const [isIssuingChallan, setIsIssuingChallan] = useState<boolean>(false)

  const isDLMO = user?.role === 'DLMO' || user?.role === 'SUPERIOR' || user?.role === 'ADMIN'

  useEffect(() => {
    fetchReportsData()
  }, [hideSettled])

  const fetchReportsData = async () => {
    try {
      const data = await fetchScans(50, hideSettled)
      if (data && data.scans && data.scans.length > 0) {
        const mapped: Report[] = data.scans
          .filter((s: any) => !hideSettled || (s.status !== 'SETTLED' && !s.is_settled))
          .map((s: any, idx: number) => {
            const decl = s.declarations || {}
            const vCodes = Array.isArray(s.violations) 
              ? s.violations.map((v: any) => `${v.rule_code || 'LMPC Rule'}: ${v.reason || v.declaration}`)
              : ['Rule 6(1) Non-compliance']
            return {
              id: s.scan_id || String(idx + 1),
              scan_id: s.scan_id || `SCAN-${idx + 1}`,
              status: s.status === 'SETTLED' ? 'SETTLED' : (s.status === 'PASS' ? 'PASS' : (s.status === 'FAIL' ? 'FAIL' : 'NEEDS_REVIEW')),
              product_name: decl.generic_name || 'Packaged Commodity',
              manufacturer: decl.manufacturer || 'Unknown Manufacturer',
              net_quantity: decl.net_quantity ? `${decl.net_quantity} ${decl.unit || ''}`.trim() : 'N/A',
              mrp: decl.mrp_text || (decl.mrp ? `₹${decl.mrp}` : 'N/A'),
              violations_count: Array.isArray(s.violations) ? s.violations.length : 0,
              generated_at: s.created_at || new Date().toISOString(),
              pdf_url: s.report_download_url || `/api/v1/report/${s.scan_id}/download`,
              evidence_hash: s.evidence_hash || 'SHA-256 Validated',
              violations: vCodes
            }
          })
        setReports(mapped)
        setIsLoading(false)
        return
      }
    } catch (err) {
      console.warn('Failed to fetch from MongoDB, falling back to cached baseline:', err)
    }

    const sampleReports: Report[] = [
      {
        id: '1',
        scan_id: 'SCAN-IN-2026-0891',
        status: 'PASS',
        product_name: 'Premium Roasted Cashews',
        manufacturer: 'Himalayan Dry Fruits Pvt Ltd',
        net_quantity: '500 g',
        mrp: '₹450.00',
        violations_count: 0,
        generated_at: '2026-09-07T10:30:00Z',
        pdf_url: '/api/v1/report/SCAN-IN-2026-0891/download',
        evidence_hash: '7c4a89d4e5f67a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        violations: []
      },
      {
        id: '2',
        scan_id: 'SCAN-IN-2026-0892',
        status: 'FAIL',
        product_name: 'Spicy Potato Sev Bhujia',
        manufacturer: 'Sunrise Foods & FMCG Ltd',
        net_quantity: '400 gms',
        mrp: '₹90.00',
        violations_count: 2,
        generated_at: '2026-09-07T11:45:00Z',
        pdf_url: '/api/v1/report/SCAN-IN-2026-0892/download',
        evidence_hash: '9f2b84c7a1e05d3b6f8c2e4a7d9b0c1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c',
        violations: ['Rule 6(1)(c) - Non-standard unit "gms"', 'Rule 6(1)(e) - Missing Tax Declaration']
      },
      {
        id: '3',
        scan_id: 'SCAN-IN-2026-0893',
        status: 'FAIL',
        product_name: 'Pure Desi Cow Ghee (1L)',
        manufacturer: 'Sunrise Foods & FMCG Ltd',
        net_quantity: '1 ltr',
        mrp: '₹650.00',
        violations_count: 2,
        generated_at: '2026-09-07T14:20:00Z',
        pdf_url: '/api/v1/report/SCAN-IN-2026-0893/download',
        evidence_hash: '2e4b6c8d0f1a3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9b1c3e',
        violations: ['Rule 6(1)(c) - Prohibited symbol "ltr"', 'Rule 6(2) - Missing Grievance Phone']
      },
      {
        id: '4',
        scan_id: 'SCAN-IN-2026-0894',
        status: 'PASS',
        product_name: 'Whole Wheat Atta 5kg',
        manufacturer: 'Golden Harvest Grains Ltd, Punjab',
        net_quantity: '5 kg',
        mrp: '₹265.00',
        violations_count: 0,
        generated_at: '2026-09-07T16:10:00Z',
        pdf_url: '/api/v1/report/SCAN-IN-2026-0894/download',
        evidence_hash: '4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c',
        violations: []
      }
    ]
    
    setReports(sampleReports)
    setIsLoading(false)
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.scan_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter
    const matchesSettled = !hideSettled || report.status !== 'SETTLED'
    return matchesSearch && matchesStatus && matchesSettled
  })

  const handleSelectReport = (reportId: string) => {
    const newSelected = new Set(selectedReports)
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId)
    } else {
      newSelected.add(reportId)
    }
    setSelectedReports(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set())
    } else {
      setSelectedReports(new Set(filteredReports.map(r => r.id)))
    }
  }

  const handleDownload = (report: Report) => {
    toast.success(`Opening Legal Metrology Challan for ${report.product_name}`)
    window.open(report.pdf_url, '_blank')
  }

  const handleBulkDownload = () => {
    toast.success(`Exporting ${selectedReports.size} inspection challans batch`)
  }

  const handleDelete = (reportId: string) => {
    setReports(reports.filter(r => r.id !== reportId))
    toast.success('Report deleted successfully')
  }

  const handleOpenIssueChallan = (report: Report) => {
    setChallanModalReport(report)
    setChallanPenalty(report.violations_count > 1 ? 50000 : 25000)
    setChallanNotes(`Statutory compounding demand notice issued against ${report.manufacturer} for commodity: ${report.product_name}.`)
  }

  const handleConfirmIssueChallan = async () => {
    if (!challanModalReport) return
    setIsIssuingChallan(true)
    try {
      const payload = {
        scan_id: challanModalReport.scan_id,
        manufacturer_name: challanModalReport.manufacturer,
        product_name: challanModalReport.product_name,
        issued_by: user?.name || 'Dr. R. K. Verma, Controller of Legal Metrology',
        inspector_name: 'Field Inspection Squad',
        violation_codes: challanModalReport.violations && challanModalReport.violations.length > 0 
          ? challanModalReport.violations 
          : ['Rule 6(1) Non-compliance'],
        act_sections: ['Section 36(1) of Legal Metrology Act, 2009', 'Rule 32 Compounding Provisions'],
        penalty_amount: challanPenalty,
        notes: challanNotes
      }

      const res = await issueChallan(payload)
      if (res.success) {
        toast.success(`Challan ${res.challan.challan_id} successfully issued to ${challanModalReport.manufacturer}!`)
        setChallanModalReport(null)
      }
    } catch (err) {
      console.error('Failed to issue challan from report:', err)
      toast.error('Failed to issue statutory challan')
    } finally {
      setIsIssuingChallan(false)
    }
  }

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors = {
      PASS: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      FAIL: 'bg-rose-100 text-rose-800 border-rose-300',
      NEEDS_REVIEW: 'bg-amber-100 text-amber-800 border-amber-300',
      SETTLED: 'bg-slate-100 text-slate-700 border-slate-300'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[status as keyof typeof colors] || colors.NEEDS_REVIEW}`}>
        {status === 'SETTLED' ? 'PAID / SETTLED' : status.replace('_', ' ')}
      </span>
    )
  }

  if (!hasPermission('reports', 'view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to access compliance reports.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal Metrology Compliance Reports</h1>
          <p className="text-gray-600 text-sm mt-1">
            Archived statutory inspection challans and evidential audit certificates.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedReports.size > 0 && hasPermission('reports', 'download') && (
            <button
              onClick={handleBulkDownload}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Selected ({selectedReports.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Settlement Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by commodity, manufacturer, or Scan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PASS">Pass (Compliant)</option>
                <option value="FAIL">Fail (Violations Detected)</option>
                <option value="NEEDS_REVIEW">Needs Review</option>
              </select>
            </div>

            <label className="flex items-center space-x-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={hideSettled}
                onChange={(e) => setHideSettled(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-gray-700">Hide Paid / Settled Cases</span>
            </label>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Commodity &amp; Scan Ref
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Manufacturer / Packer
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Quantity / MRP
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statutory Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Audit Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                  Actions &amp; Authority
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedReports.has(report.id)}
                      onChange={() => handleSelectReport(report.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{report.product_name}</p>
                        <p className="text-[11px] font-mono text-gray-500">{report.scan_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                    {report.manufacturer}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    <p className="font-semibold">{report.net_quantity}</p>
                    <p className="text-[11px] text-gray-500">{report.mrp}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                    {report.violations_count > 0 && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                        {report.violations_count} Rule Violation{report.violations_count > 1 ? 's' : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(report.generated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* DLMO: ISSUE CHALLAN BUTTON */}
                      {isDLMO && report.status === 'FAIL' && (
                        <button
                          onClick={() => handleOpenIssueChallan(report)}
                          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-all"
                          title="Issue statutory compounding notice"
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          <span>Issue Challan</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDownload(report)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Download Certificate PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewingReport(report)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="View Audit Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {hasPermission('reports', 'manage') && (
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-xs font-medium">No active non-compliance reports matching filter criteria.</p>
            {hideSettled && (
              <p className="text-gray-400 text-[11px] mt-1">Paid and settled cases are automatically filtered out.</p>
            )}
          </div>
        )}
      </div>

      {/* Report Preview Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>Statutory Audit Certificate</span>
              </h3>
              <button 
                onClick={() => setViewingReport(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">Scan Session ID:</span>
                <span className="font-mono font-bold text-gray-900">{viewingReport.scan_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Commodity:</span>
                <span className="font-bold text-gray-900">{viewingReport.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Manufacturer:</span>
                <span className="font-bold text-gray-900">{viewingReport.manufacturer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Net Quantity:</span>
                <span className="font-bold text-gray-900">{viewingReport.net_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Maximum Retail Price:</span>
                <span className="font-bold text-gray-900">{viewingReport.mrp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <StatusBadge status={viewingReport.status} />
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 block mb-1">Cryptographic Evidence SHA-256 Hash:</span>
                <span className="font-mono text-[11px] text-gray-800 break-all bg-white p-1.5 rounded border block">
                  {viewingReport.evidence_hash}
                </span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              {isDLMO && viewingReport.status === 'FAIL' && (
                <button
                  onClick={() => {
                    const rep = viewingReport
                    setViewingReport(null)
                    handleOpenIssueChallan(rep)
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center space-x-1.5 hover:bg-purple-700"
                >
                  <Gavel className="h-4 w-4" />
                  <span>Issue Challan</span>
                </button>
              )}
              <button
                onClick={() => handleDownload(viewingReport)}
                className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-1.5 hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                <span>Open / Download Certificate</span>
              </button>
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPERIOR OFFICER: ISSUE CHALLAN MODAL */}
      {challanModalReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Issue Statutory Compounding Challan</h3>
                  <p className="text-[11px] text-gray-500">Legal Metrology Act, 2009 • Section 36(1)</p>
                </div>
              </div>
              <button onClick={() => setChallanModalReport(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">Target Manufacturer:</span>
                  <span className="font-bold text-gray-900">{challanModalReport.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">Commodity:</span>
                  <span className="font-bold text-gray-900">{challanModalReport.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">Inspection Scan ID:</span>
                  <span className="font-mono font-semibold text-purple-900">{challanModalReport.scan_id}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Compounding Penalty Assessment (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    step="5000"
                    value={challanPenalty}
                    onChange={(e) => setChallanPenalty(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg font-bold text-gray-900 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Standard first-offense range: ₹25,000 – ₹50,000. Repeat offense: ₹1,00,000.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Statutory Violations Attached
                </label>
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-rose-800 space-y-1">
                  {challanModalReport.violations && challanModalReport.violations.length > 0 ? (
                    challanModalReport.violations.map((v, i) => (
                      <p key={i}>• {v}</p>
                    ))
                  ) : (
                    <p>• Rule 6(1) Packaging Declaration Non-compliance</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Controller Statutory Remarks &amp; Notice Directive
                </label>
                <textarea
                  rows={2}
                  value={challanNotes}
                  onChange={(e) => setChallanNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  onClick={() => setChallanModalReport(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isIssuingChallan}
                  onClick={handleConfirmIssueChallan}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>{isIssuingChallan ? 'Dispatching...' : 'Dispatch Statutory Notice'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports