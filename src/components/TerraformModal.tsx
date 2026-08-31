import { useState } from 'react';
import { FileCode, Copy, Check, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  code: string;
  onClose: () => void;
}

export default function TerraformModal({ isOpen, code, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Exported Terraform (HCL)</h2>
              <p className="text-xs text-slate-400">Infrastructure as Code definition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 border border-slate-700 shadow transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <pre className="text-xs font-mono text-indigo-300 overflow-y-auto max-h-[380px] pr-12 leading-relaxed">
            {code}
          </pre>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
