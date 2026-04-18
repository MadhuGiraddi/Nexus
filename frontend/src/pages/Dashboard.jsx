import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar          from '../components/layout/TopBar';
import NetWorthHero    from '../components/nexus/NetWorthHero';
import AccountsPanel   from '../components/nexus/AccountsPanel';
import TransactionFeed from '../components/nexus/TransactionFeed';
import SpendingDonut   from '../components/nexus/SpendingDonut';
import CashFlowChart   from '../components/nexus/CashFlowChart';
import CryptoTicker    from '../components/nexus/CryptoTicker';
import ConnectBankModal from '../components/nexus/ConnectBankModal';
import SimulateSpendModal from '../components/nexus/SimulateSpendModal';
import { useBanking }  from '../hooks/useBanking';
import { useMarket }   from '../hooks/useMarket';
import PortfolioWidget from '../components/nexus/PortfolioWidget';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

// Safety: only register if running in browser
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [spendModalOpen, setSpendModalOpen] = useState(false);
  const banking = useBanking();
  const market  = useMarket();

  const comp = useRef(null);

  useEffect(() => {
    // If cards are still loading, don't trigger animations on skeleton loaders 
    // because they get deleted from the DOM, resulting in 'no change'.
    if (banking.loading) return;

    let ctx = gsap.context(() => {
      
      // 1. VORTEX-Style Massive Hero Reveal Sequence
      const tl = gsap.timeline();
      tl.fromTo(".hero-amount", 
        { scale: 2.5, opacity: 0, y: 80, filter: "blur(15px)" },
        { scale: 1, opacity: 1, y: 0, filter: "blur(0px)", duration: 2, ease: "expo.out" }
      )
      .fromTo(".hero-meta, .hero-widget h3", 
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1, stagger: 0.1, ease: "power3.out" },
        "-=1.4"
      )
      .fromTo(".hero-chart", 
        { opacity: 0, scale: 0.8, x: 50 },
        { opacity: 1, scale: 1, x: 0, duration: 1.5, ease: "back.out(1.2)" },
        "-=1.5"
      );

      // 2. VORTEX-Style Physics Scrubbing (Cards fold into screen on scroll!)
      try {
        const rows = gsap.utils.toArray(".dash-row");
        if (rows.length > 0) {
          rows.forEach((row) => {
            gsap.fromTo(row, 
              { opacity: 0, y: 150, rotationX: 45, scale: 0.9, transformOrigin: "top center" },
              {
                scrollTrigger: {
                  trigger: row,
                  scroller: document.querySelector(".app-main") ? ".app-main" : null,
                  start: "top 100%",  // Start animating as soon as it hits the bottom
                  end: "top 65%",     // Finish animating when it reaches 65% up the screen
                  scrub: 1.5          // 1.5 seconds of lag for that buttery VORTEX physics feel
                },
                opacity: 1,
                y: 0,
                rotationX: 0,
                scale: 1,
                ease: "none"
              }
            );
          });
        }
      } catch(e) {
        console.error("ScrollTrigger Error:", e);
      }
    }, comp);

    return () => ctx.revert();
  }, [banking.loading, market.loading]);

  useEffect(() => {
    const handleReload = () => {
      console.log("Nexus Reload Triggered...");
      banking.refresh();
    };
    window.addEventListener('nexus-reload-data', handleReload);
    return () => window.removeEventListener('nexus-reload-data', handleReload);
  }, [banking]);

  return (
    <>
      <div className="dashboard" ref={comp}>
        <TopBar onSync={banking.forceSync} syncing={banking.syncing} />

        <div className="dash-grid">
          {/* Row 1 — Hero */}
          <div className="dash-row-full">
            <NetWorthHero
              netWorth={banking.netWorth}
              cashflow={banking.cashflow}
              loading={banking.loading}
            />
          </div>

          {/* Row 2 — Accounts + CryptoTicker */}
          <div className="dash-row">
            <div className="dash-col-wide">
              <AccountsPanel
                accounts={banking.accounts}
                netWorth={banking.netWorth}
                loading={banking.loading}
                onConnect={() => setModalOpen(true)}
                onSpend={() => setSpendModalOpen(true)}
              />
            </div>
            <div className="dash-col-narrow">
              <CryptoTicker crypto={market.crypto} loading={market.loading} />
            </div>
          </div>

          {/* Row 3 — Transactions + Spending */}
          <div className="dash-row">
            <div className="dash-col-wide">
              <TransactionFeed
                transactions={banking.transactions}
                loading={banking.loading}
              />
            </div>
            <div className="dash-col-narrow" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <PortfolioWidget />
              <SpendingDonut
                spending={banking.spending}
                loading={banking.loading}
              />
            </div>
          </div>

          {/* Row 4 — Cashflow */}
          <div className="dash-row-full">
            <CashFlowChart
              cashflow={banking.cashflow}
              loading={banking.loading}
            />
          </div>
        </div>
      </div>

      <ConnectBankModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnected={() => banking.refresh()}
      />

      <SimulateSpendModal
        open={spendModalOpen}
        onClose={() => setSpendModalOpen(false)}
        onSuccess={() => banking.refresh()}
        accounts={banking.accounts}
      />
    </>
  );
}
