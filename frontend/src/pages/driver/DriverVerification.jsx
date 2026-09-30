import { useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  ShieldCheck,
  Eye,
  Download,
  Calendar,
  Lock,
  ExternalLink,
  Award,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function DriverVerification() {
  const toast = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [activeUploadDocId, setActiveUploadDocId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [documents, setDocuments] = useState([
    {
      id: 'dl',
      name: 'Driving License (Commercial)',
      status: 'verified',
      number: 'RJ-27-2023-0094821',
      expiry: 'Dec 2028',
      issueDate: 'Jan 2023',
      desc: 'Valid Indian Commercial Driving License issued by RTO Udaipur',
      fileUrl: null,
      fileName: 'Driving_License_Sanghini_RTO.pdf',
    },
    {
      id: 'aadhar',
      name: 'Aadhaar Card (Govt Identity)',
      status: 'verified',
      number: user?.phone ? `5482 **** ${user.phone.slice(-4)}` : '5482 9102 3841',
      expiry: 'Lifetime',
      issueDate: 'UIDAI Govt of India',
      desc: 'Identity, Address & Women Safety Confirmation',
      fileUrl: null,
      fileName: 'Aadhaar_Card_Verified_UIDAI.pdf',
    },
    {
      id: 'bg',
      name: 'Background & Police Clearance',
      status: 'verified',
      number: 'PCC-UDAIPUR-2024-883',
      expiry: 'Oct 2025',
      issueDate: 'Oct 2024',
      desc: 'Police Verification Certificate by Rajasthan Police',
      fileUrl: null,
      fileName: 'Police_Clearance_Certificate.pdf',
    },
    {
      id: 'women',
      name: 'Women Driver Sanghini Verification',
      status: 'verified',
      number: 'SANGHINI-HUB-0491',
      expiry: 'Permanent',
      issueDate: 'In-Person Hub Verification',
      desc: 'Verified by Sanghini Women Safety Patrol at Udaipur Hub',
      fileUrl: null,
      fileName: 'Sanghini_Women_Partner_Badge.pdf',
    },
  ]);

  // Open File View Modal
  const handleViewFile = (doc) => {
    setSelectedDoc(doc);
  };

  // Trigger File Picker for re-upload
  const handleReuploadClick = (docId) => {
    setActiveUploadDocId(docId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle local file selection
  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const fileName = file.name;

    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id === activeUploadDocId) {
          return {
            ...doc,
            status: 'verified',
            fileName: fileName,
            fileUrl: fileUrl,
            issueDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          };
        }
        return doc;
      })
    );

    toast.success(`Successfully uploaded "${fileName}" for verification.`);
    setActiveUploadDocId(null);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*,application/pdf"
        className="hidden"
      />

      <PageHeader
        title="Document & KYC Verification"
        subtitle="View and manage your verified identity and compliance documents."
      />

      <Card className="p-6 border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200">
          <ShieldCheck className="w-9 h-9 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-extrabold text-emerald-950">Verified Sanghini Partner</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold tracking-wide uppercase">
              100% Active
            </span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            All your mandatory documents and women-only identity checks are fully verified by Sanghini Safety Systems.
          </p>
        </div>
      </Card>

      <div className="space-y-4 mt-6">
        <h3 className="text-sm font-bold text-slate-900 px-1 flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-700" /> Official Verified Documents
        </h3>

        {documents.map((doc) => (
          <Card key={doc.id} className="p-5 border border-slate-200/80 hover:border-purple-200 transition-all shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 shrink-0 border border-purple-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                    {doc.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        <AlertCircle className="w-3.5 h-3.5" /> Under Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{doc.desc}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      Doc #: {doc.number}
                    </span>
                    {doc.expiry && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 uppercase">
                        Valid till: {doc.expiry}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewFile(doc)}
                  className="w-full sm:w-auto font-medium hover:border-purple-400 hover:bg-purple-50/50"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-purple-700" /> View File
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReuploadClick(doc.id)}
                  className="w-full sm:w-auto text-xs text-slate-600 hover:text-purple-700"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1 text-slate-500" /> Re-upload
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ─── Working Document View Modal ───────────────────────────── */}
      {selectedDoc && (
        <Modal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          title={`Document Viewer — ${selectedDoc.name}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Document Title</div>
                <div className="font-bold text-slate-900 text-sm">{selectedDoc.name}</div>
                <div className="text-xs text-purple-700 font-mono mt-0.5">Ref: {selectedDoc.number}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Official Verified Document
                </span>
              </div>
            </div>

            {/* Simulated Visual Document / Image Canvas Preview */}
            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white overflow-hidden shadow-lg min-h-[220px] flex flex-col justify-between">
              {/* Background watermark */}
              <div className="absolute right-4 bottom-4 text-slate-700/20 text-8xl font-black select-none pointer-events-none">
                SANGHINI
              </div>

              {selectedDoc.fileUrl ? (
                <div className="z-10 text-center py-4">
                  <img
                    src={selectedDoc.fileUrl}
                    alt={selectedDoc.name}
                    className="max-h-56 mx-auto rounded-lg shadow-md object-contain border border-white/20"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-purple-300 font-bold uppercase tracking-wider">
                          Govt. Verified Identity
                        </div>
                        <div className="text-base font-extrabold">{selectedDoc.name}</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                      SEALED & VALID
                    </div>
                  </div>

                  <div className="z-10 space-y-2 my-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Number</span>
                        <span className="font-mono font-bold text-white">{selectedDoc.number}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Holder Name</span>
                        <span className="font-bold text-white">{user?.name || 'Anita Sharma'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Issuing Authority</span>
                        <span className="font-medium text-slate-200">{selectedDoc.issueDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Validity Expiry</span>
                        <span className="font-medium text-slate-200">{selectedDoc.expiry}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 z-10 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-purple-400" /> 256-Bit Encrypted Vault File: {selectedDoc.fileName}
                </span>
                <span className="font-mono text-emerald-400 font-bold">Status: ACTIVE</span>
              </div>
            </div>

            {/* Action buttons inside Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                Document is stored securely in Sanghini's MongoDB verification database.
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReuploadClick(selectedDoc.id)}
                  className="flex-1 sm:flex-initial"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1" /> Replace File
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    toast.info(`Downloading digital copy of ${selectedDoc.name}`);
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download Copy
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
