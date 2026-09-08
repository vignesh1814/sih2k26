import React, { useState } from 'react'
import { 
  BookOpen, 
  Scale, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react'

const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rule6' | 'usp_calc' | 'units' | 'rule7' | 'exemptions' | 'timeline'>('rule6')

  // USP Calculator state
  const [calcMrp, setCalcMrp] = useState<string>('250')
  const [calcQty, setCalcQty] = useState<string>('400')
  const [calcUnit, setCalcUnit] = useState<string>('g')

  const computeUsp = () => {
    const mrp = parseFloat(calcMrp)
    const qty = parseFloat(calcQty)
    if (isNaN(mrp) || isNaN(qty) || qty <= 0 || mrp <= 0) return null

    let baseUnit = ''
    let pricePerUnit = 0

    if (calcUnit === 'g') {
      if (qty < 1000) {
        baseUnit = 'g'
        pricePerUnit = mrp / qty
      } else {
        baseUnit = 'kg'
        pricePerUnit = mrp / (qty / 1000)
      }
    } else if (calcUnit === 'kg') {
      baseUnit = 'kg'
      pricePerUnit = mrp / qty
    } else if (calcUnit === 'ml') {
      if (qty < 1000) {
        baseUnit = 'ml'
        pricePerUnit = mrp / qty
      } else {
        baseUnit = 'L'
        pricePerUnit = mrp / (qty / 1000)
      }
    } else if (calcUnit === 'L') {
      baseUnit = 'L'
      pricePerUnit = mrp / qty
    } else if (calcUnit === 'N') {
      baseUnit = 'piece'
      pricePerUnit = mrp / qty
    }

    return {
      price: pricePerUnit.toFixed(2),
      unit: baseUnit,
      statutoryText: `₹${pricePerUnit.toFixed(2)} / ${baseUnit}`
    }
  }

  const uspResult = computeUsp()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gov-navy to-gov-blue rounded-xl shadow-md p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Scale className="h-8 w-8 text-gov-gold" />
          <h1 className="text-2xl font-bold">Legal Metrology Statutory Documentation</h1>
        </div>
        <p className="text-blue-100 text-sm max-w-3xl">
          Comprehensive compliance manual for field officers and manufacturers under the Legal Metrology Act, 2009 
          and Legal Metrology (Packaged Commodities) Rules, 2011 (with 2022 &amp; 2023 Amendments).
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('rule6')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'rule6'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Rule 6 Mandatory Declarations</span>
        </button>

        <button
          onClick={() => setActiveTab('usp_calc')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'usp_calc'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Unit Sale Price (USP) Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'units'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Rule 13 SI Units Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('rule7')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'rule7'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Rule 7 PDP &amp; Font Sizes</span>
        </button>

        <button
          onClick={() => setActiveTab('exemptions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'exemptions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Rule 26 Exemptions</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Amendment Timeline</span>
        </button>
      </div>

      {/* TAB 1: RULE 6 MANDATORY DECLARATIONS */}
      {activeTab === 'rule6' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
            <h2 className="text-base font-semibold text-blue-900">Rule 6: Declarations to be Made on Every Package</h2>
            <p className="text-sm text-blue-700 mt-1">
              Every package shall bear thereon or on label securely affixed thereto definite, plain and conspicuous declarations.
              Omission of any mandatory field constitutes a statutory offense under Section 36 of the Legal Metrology Act, 2009.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule 6(1)(a) */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Rule 6(1)(a)</span>
                <span className="text-xs text-red-600 font-semibold uppercase">Mandatory</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Manufacturer / Packer Details</h3>
              <p className="text-sm text-gray-600 mt-2">
                The name and complete registered address of the manufacturer, or where the manufacturer is not the packer,
                the name and address of the manufacturer and packer. For imported goods, the name and address of the importer.
              </p>
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                <strong>Statutory standard:</strong> Must contain full pin code, city, and state. Merely mentioning brand name is non-compliant.
              </div>
            </div>

            {/* Rule 6(1)(b) */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Rule 6(1)(b)</span>
                <span className="text-xs text-red-600 font-semibold uppercase">Mandatory</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Generic or Common Name</h3>
              <p className="text-sm text-gray-600 mt-2">
                The common or generic name of the commodity contained in the package. If the commodity has a trade name,
                the generic name must be conspicuously displayed alongside.
              </p>
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                <strong>Example:</strong> "Parle-G" (Trade name) + "Biscuits" (Common/Generic name).
              </div>
            </div>

            {/* Rule 6(1)(c) */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Rule 6(1)(c)</span>
                <span className="text-xs text-red-600 font-semibold uppercase">Mandatory</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Net Quantity in SI Units</h3>
              <p className="text-sm text-gray-600 mt-2">
                The net quantity, in terms of standard unit of weight or measure of the commodity.
                Must use standard SI symbols (<code className="text-blue-600 font-bold">g, kg, ml, L, m</code>).
              </p>
              <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                <strong>Critical Violation:</strong> Colloquial abbreviations such as "gms", "gm", "ltrs", "kgs" violate Rule 13 &amp; Section 11 of the Act.
              </div>
            </div>

            {/* Rule 6(1)(d) */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Rule 6(1)(d)</span>
                <span className="text-xs text-red-600 font-semibold uppercase">Mandatory</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Month &amp; Year of Manufacture / Packing</h3>
              <p className="text-sm text-gray-600 mt-2">
                The month and the year in which the commodity is manufactured, pre-packed, or imported.
                Must follow clear MM/YYYY or DD/MM/YYYY formatting.
              </p>
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                <strong>Format requirement:</strong> Letters or words (e.g. "MFD 08/2026" or "Packed AUG 2026").
              </div>
            </div>

            {/* Rule 6(1)(e) */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Rule 6(1)(e)</span>
                <span className="text-xs text-red-600 font-semibold uppercase">Mandatory</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Maximum Retail Price (MRP)</h3>
              <p className="text-sm text-gray-600 mt-2">
                The retail sale price of the package in Indian Rupees (₹ or Rs.).
                Must strictly include the statutory phrase: <span className="font-semibold text-blue-800">"Inclusive of all taxes"</span>.
              </p>
              <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                <strong>Enforcement note:</strong> Writing only "MRP: Rs. 100/-" without the inclusive phrase is an explicit statutory violation.
              </div>
            </div>

            {/* Rule 6(1)(f) */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Rule 6(1)(f)</span>
                <span className="text-xs text-red-600 font-semibold uppercase">Mandatory</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Consumer Care Details</h3>
              <p className="text-sm text-gray-600 mt-2">
                Name, address, telephone number, and e-mail address of the person or office who can be contacted
                in case of consumer complaints.
              </p>
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                <strong>Completeness:</strong> Must provide both a telephone/helpline number AND an email ID.
              </div>
            </div>

            {/* Rule 6(11) */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">Rule 6(11) [2022 Amendment]</span>
                <span className="text-xs text-red-600 font-semibold uppercase">Mandatory Post-Oct 2022</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Unit Sale Price (USP)</h3>
              <p className="text-sm text-gray-600 mt-2">
                Effective from 1st October 2022, every pre-packaged commodity must declare the Unit Sale Price (USP)
                to allow consumers to make informed comparison. The price must be rounded to two decimal places.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="p-3 bg-gray-50 rounded text-xs">
                  <p className="font-bold text-gray-800">Weight &lt; 1 kg:</p>
                  <p className="text-gray-600 mt-1">Declare price per gram (e.g. ₹0.25 / g)</p>
                </div>
                <div className="p-3 bg-gray-50 rounded text-xs">
                  <p className="font-bold text-gray-800">Weight &gt;= 1 kg:</p>
                  <p className="text-gray-600 mt-1">Declare price per kilogram (e.g. ₹180.00 / kg)</p>
                </div>
                <div className="p-3 bg-gray-50 rounded text-xs">
                  <p className="font-bold text-gray-800">Volume &lt; 1 L:</p>
                  <p className="text-gray-600 mt-1">Declare price per milliliter (e.g. ₹0.08 / ml)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE USP CALCULATOR */}
      {activeTab === 'usp_calc' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <Calculator className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Interactive Unit Sale Price (USP) Statutory Calculator</h2>
                <p className="text-sm text-gray-600">
                  Verify whether a manufacturer's printed Unit Sale Price matches the official statutory mathematical formula.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Retail Price (MRP in ₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={calcMrp}
                    onChange={(e) => setCalcMrp(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="250.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Net Quantity (Numeric)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={calcQty}
                  onChange={(e) => setCalcQty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Measurement Unit
                </label>
                <select
                  value={calcUnit}
                  onChange={(e) => setCalcUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="g">Gram (g)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="L">Litre (L)</option>
                  <option value="N">Number / Pieces (N)</option>
                </select>
              </div>
            </div>

            {uspResult ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                  Statutory Rule 6(11) Required Declaration
                </p>
                <div className="flex items-baseline space-x-3">
                  <p className="text-3xl font-extrabold text-blue-900">{uspResult.statutoryText}</p>
                  <span className="text-xs text-blue-600">(Rounded strictly to 2 decimals)</span>
                </div>
                <div className="mt-3 text-xs text-blue-800 space-y-1">
                  <p>• Mathematical computation: ₹{calcMrp} ÷ {calcQty} {calcUnit} = ₹{uspResult.price} per {uspResult.unit}.</p>
                  <p>• Both the MRP and Unit Sale Price must appear on the Principal Display Panel in close proximity.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                Please enter valid positive values for MRP and Net Quantity.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RULE 13 SI UNITS MATRIX */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Rule 13: Standard Units of Weight, Measure or Number</h2>
            <p className="text-sm text-gray-600 mb-6">
              Under Section 11 of the Legal Metrology Act, 2009, no person shall use in any transaction or contract any unit of mass or measure
              other than the standard units specified. Colloquial Indian abbreviations are strictly unlawful.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <th className="py-3 px-4 border border-gray-200">Physical Dimension</th>
                    <th className="py-3 px-4 border border-gray-200">Statutory Symbol (Permitted)</th>
                    <th className="py-3 px-4 border border-gray-200">Prohibited Colloquial Terms (Violation)</th>
                    <th className="py-3 px-4 border border-gray-200">Legal Citation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900">Mass / Weight (&lt; 1 kg)</td>
                    <td className="py-3 px-4 text-green-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>g</span>
                    </td>
                    <td className="py-3 px-4 text-red-600 font-semibold">
                      <span className="bg-red-50 px-2 py-0.5 rounded">gms</span>, <span className="bg-red-50 px-2 py-0.5 rounded">gm</span>, <span className="bg-red-50 px-2 py-0.5 rounded">gms.</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">Rule 13(1)(a)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900">Mass / Weight (&gt;= 1 kg)</td>
                    <td className="py-3 px-4 text-green-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>kg</span>
                    </td>
                    <td className="py-3 px-4 text-red-600 font-semibold">
                      <span className="bg-red-50 px-2 py-0.5 rounded">kgs</span>, <span className="bg-red-50 px-2 py-0.5 rounded">KG.</span>, <span className="bg-red-50 px-2 py-0.5 rounded">kilos</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">Rule 13(1)(a)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900">Volume / Liquid (&lt; 1 L)</td>
                    <td className="py-3 px-4 text-green-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>ml</span> or <span>mL</span>
                    </td>
                    <td className="py-3 px-4 text-red-600 font-semibold">
                      <span className="bg-red-50 px-2 py-0.5 rounded">ml.</span>, <span className="bg-red-50 px-2 py-0.5 rounded">mls</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">Rule 13(1)(b)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900">Volume / Liquid (&gt;= 1 L)</td>
                    <td className="py-3 px-4 text-green-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>l</span> or <span>L</span>
                    </td>
                    <td className="py-3 px-4 text-red-600 font-semibold">
                      <span className="bg-red-50 px-2 py-0.5 rounded">ltrs</span>, <span className="bg-red-50 px-2 py-0.5 rounded">ltr</span>, <span className="bg-red-50 px-2 py-0.5 rounded">litres</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">Rule 13(1)(b)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900">Length / Dimension</td>
                    <td className="py-3 px-4 text-green-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>m, cm, mm</span>
                    </td>
                    <td className="py-3 px-4 text-red-600 font-semibold">
                      <span className="bg-red-50 px-2 py-0.5 rounded">mtrs</span>, <span className="bg-red-50 px-2 py-0.5 rounded">cms</span>, <span className="bg-red-50 px-2 py-0.5 rounded">m.</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">Rule 13(1)(c)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900">Count / Number</td>
                    <td className="py-3 px-4 text-green-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>N</span> or <span>U</span>
                    </td>
                    <td className="py-3 px-4 text-red-600 font-semibold">
                      <span className="bg-red-50 px-2 py-0.5 rounded">pcs</span>, <span className="bg-red-50 px-2 py-0.5 rounded">no.</span>, <span className="bg-red-50 px-2 py-0.5 rounded">units</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">Rule 13(1)(d)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RULE 7 PRINCIPAL DISPLAY PANEL & FONT SIZES */}
      {activeTab === 'rule7' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Rule 7: Principal Display Panel (PDP) &amp; Minimum Font Heights</h2>
            <p className="text-sm text-gray-600 mb-6">
              The Principal Display Panel is the face of a package most likely to be displayed or examined by consumers.
              Rule 7 specifies geometric area ratios and absolute minimum numeral heights in millimeters.
            </p>

            <h3 className="font-semibold text-gray-800 text-sm mb-3">1. Mathematical PDP Area Determination</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-bold text-gray-900 text-sm">Rectangular Carton / Box</p>
                <p className="text-2xl font-extrabold text-blue-600 mt-2">100%</p>
                <p className="text-xs text-gray-600 mt-1">
                  100% of height multiplied by width of one entire principal side.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-bold text-gray-900 text-sm">Cylindrical / Bottle</p>
                <p className="text-2xl font-extrabold text-blue-600 mt-2">40%</p>
                <p className="text-xs text-gray-600 mt-1">
                  40% of the total cylindrical surface area (Height × Circumference × 0.40).
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-bold text-gray-900 text-sm">Other Polyhedral Shapes</p>
                <p className="text-2xl font-extrabold text-blue-600 mt-2">20%</p>
                <p className="text-xs text-gray-600 mt-1">
                  20% of the total surface area of the package.
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 text-sm mb-3">2. Minimum Height of Numerals &amp; Letters (Table I &amp; II)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <th className="py-3 px-4 border border-gray-200">Net Quantity (Weight / Volume)</th>
                    <th className="py-3 px-4 border border-gray-200">Minimum Height (Normal Case)</th>
                    <th className="py-3 px-4 border border-gray-200">Blown / Molded / Perforated Surfaces</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-gray-900">Up to 50 g / 50 ml</td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">1.0 mm</td>
                    <td className="py-2.5 px-4 text-gray-600">2.0 mm</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-gray-900">Above 50 g/ml up to 200 g/ml</td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">2.0 mm</td>
                    <td className="py-2.5 px-4 text-gray-600">4.0 mm</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-gray-900">Above 200 g/ml up to 1 kg / 1 L</td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">4.0 mm</td>
                    <td className="py-2.5 px-4 text-gray-600">6.0 mm</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-gray-900">Above 1 kg / 1 L</td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">6.0 mm</td>
                    <td className="py-2.5 px-4 text-gray-600">8.0 mm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RULE 26 EXEMPTIONS */}
      {activeTab === 'exemptions' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Rule 26: Statutory Exemptions in Respect of Certain Packages</h2>
            <p className="text-sm text-gray-600 mb-6">
              Nothing in these rules shall apply to the following commodities and package classifications:
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Packages with Net Weight &lt;= 10g or Volume &lt;= 10ml</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Packages containing 10 grams or 10 milliliters or less are exempt from declarations of manufacture date, MRP, and consumer care details (except tobacco products).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Agricultural Produce Exceeding 50 kg</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Packages containing agricultural produce in quantities exceeding 50 kilograms packed in bags.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Industrial / Institutional Consumers</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Packaged commodities meant for industrial consumers who buy packaged commodities directly from manufacturers for use in industry or institutional consumers (hotels, hospitals, railways).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AMENDMENT TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Legislative Evolution &amp; Amendment Timeline</h2>
            <p className="text-sm text-gray-600 mb-6">
              Compliance audits evaluate commodities against the specific rules active at the date of packaging.
            </p>

            <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                <span className="text-xs font-bold text-blue-600">2011</span>
                <h4 className="text-base font-semibold text-gray-900">Enactment of LMPC Rules, 2011</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Baseline legal framework governing pre-packaged commodities in India under the Legal Metrology Act, 2009.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                <span className="text-xs font-bold text-blue-600">2015</span>
                <h4 className="text-base font-semibold text-gray-900">Amendment Rules, 2015</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Adjustments to Principal Display Panel placement guidelines and grouping of mandatory declarations.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                <span className="text-xs font-bold text-blue-600">November 2021</span>
                <h4 className="text-base font-semibold text-gray-900">Amendment Rules, 2021</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Notification standardizing declaration formatting, net quantity tolerances, and e-commerce display rules.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow"></div>
                <span className="text-xs font-bold text-purple-600">October 2022</span>
                <h4 className="text-base font-semibold text-gray-900">Unit Sale Price Mandate</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Rule 6(11) enforced: Mandatory declaration of Unit Sale Price rounded to two decimals on all packaged goods.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow"></div>
                <span className="text-xs font-bold text-emerald-600">2023</span>
                <h4 className="text-base font-semibold text-gray-900">Amendment Rules, 2023</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Refinements to standard pack sizes and clarification of loose commodity packaging exemptions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Documentation
