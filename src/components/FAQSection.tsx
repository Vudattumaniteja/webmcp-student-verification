import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-webmcp',
    question: 'What is WebMCP?',
    answer:
      'Web Model Context Protocol (WebMCP) allows web applications to register structured tools directly on document.modelContext. In-browser AI agents discover and execute these tools with precise JSON schemas, enabling secure local automation without browser extension hacks.',
  },
  {
    id: 'zero-pii',
    question: 'How does zero-PII verification work?',
    answer:
      'The Student Vault stores sensitive academic documents locally in your browser sandbox. When verification occurs, the vault yields ephemeral claim-check handles (under 300 chars). The agent orchestrates verification without ever viewing or transferring raw PII to third-party LLM providers.',
  },
  {
    id: 's3-uploads',
    question: 'How do pre-signed S3 uploads work?',
    answer:
      'The verification engine issues a short-lived pre-signed S3 upload URL during the docUpload phase. The client transfers binary document assets directly to the verification provider\'s bucket, ensuring end-to-end encryption and compliance.',
  },
  {
    id: 'agent-automation',
    question: 'Can AI agents automate verification?',
    answer:
      'Yes. Autonomous browser agents query registered WebMCP tools to search accredited institutions, submit student enrollment credentials, upload necessary documents, and poll for registrar approval in seconds.',
  },
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="faq">
      <div className="bg-white border border-black shadow-[4px_4px_0px_0px_#000000]">
        {/* Header Label */}
        <div className="px-6 py-4 border-b border-black bg-[#FBFBFA] flex items-center justify-between">
          <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <span>—</span>
            <span>FREQUENTLY ASKED</span>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="divide-y divide-black">
          {FAQ_ITEMS.map((item) => {
            const isOpen = !!openItems[item.id];

            return (
              <div key={item.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-neutral-50 cursor-pointer group"
                >
                  <span className="font-serif-editorial text-base sm:text-lg font-medium text-neutral-900 group-hover:text-[#0066FF] transition-colors">
                    {item.question}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-[#0066FF]' : 'group-hover:translate-x-0.5'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-neutral-700 font-sans leading-relaxed border-t border-neutral-100 bg-[#FAFAF8]">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
