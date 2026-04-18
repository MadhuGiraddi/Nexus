import re

with open("generate_pdf.py", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update Problem Scope (Lines 178-187)
old_scope = """    [Paragraph(
        "Nexus is scoped as a full-stack Fintech Super-App consolidating five verticals. The <b>Core (Nexus "
        "Dashboard)</b> is an open-banking control center providing real-time net-worth aggregation. "
        "<b>Strong Modules:</b> FinAgent (AI Assistant powered by LangChain/LangGraph) and InvestPro "
        "(automated SIP and multi-asset investment hub). <b>Utility Modules:</b> Loans (EMI calculator + "
        "curated offers), Card Offers (debit/credit deal engine), Sunscribe (subscription tracker). "
        "The <b>CA Contacts</b> module is the platform's monetization cornerstone — direct consultation "
        "with verified Chartered Accountants is an <b>exclusive premium-subscription feature</b>, "
        "establishing a clear freemium-to-revenue boundary. An <b>App-wide Notification System</b> "
        "drives timely user actions across all modules.",
        S("wb2",8.5,DGRAY,leading=13,align=TA_JUSTIFY))],"""
new_scope = """    [Paragraph(
        "Nexus is scoped as a full-stack Fintech Super-App consolidating <b>6 strong application modules</b> plus the "
        "<b>Nexus Core</b> dashboard. The <b>Core</b> is an open-banking control center providing real-time net-worth aggregation. "
        "<b>The 6 Modules:</b> 1) FinAgent (AI Assistant powered by LangChain), "
        "2) InvestPro (automated SIP and wealth hub), "
        "3) Loans (EMI calculator + curated credit), "
        "4) Card Offers (debit/credit deal engine), "
        "5) Sunscribe (hidden subscription tracker), and "
        "6) CA Contacts (direct verified accounting consultations). The <b>CA Contacts</b> module is the platform's "
        "monetization cornerstone — expert consultation is an <b>exclusive premium feature</b>.",
        S("wb2",8.5,DGRAY,leading=13,align=TA_JUSTIFY))],"""
text = text.replace(old_scope, new_scope)

# 2. Extract and remove the Architecture block
start_marker = "# ══════════════════════════════════════════════════════════════════════════════\n# PAGE 3 — SYSTEM ARCHITECTURE\n# ══════════════════════════════════════════════════════════════════════════════"
end_marker = "# ══════════════════════════════════════════════════════════════════════════════\n# PAGE 4 — WHAT + ADDITIONAL CONTEXT\n# ══════════════════════════════════════════════════════════════════════════════"

arch_block = text[text.find(start_marker):text.find(end_marker)]
text = text.replace(arch_block, "")

# rename PAGE 4 back to PAGE 3
text = text.replace("# PAGE 4 — WHAT + ADDITIONAL CONTEXT", "# PAGE 3 — WHAT + ADDITIONAL CONTEXT")

# 3. Text replacements
text = text.replace('5 financial verticals<br/>unified', '6 modules + Nexus Core<br/>unified')
text = text.replace('1 dashboard replaces 5 apps.', '1 core dashboard replaces 6 utility apps.')
text = text.replace('fragmenting wealth across 5+ ', 'fragmenting wealth across 6+ ')
text = text.replace('Consolidates 5 fragmented app workflows', 'Consolidates 6 fragmented app workflows')

# 4. Add Architecture block at the end (Page 4 / 5)
arch_code = """
# ══════════════════════════════════════════════════════════════════════════════
# PAGE 4 — SYSTEM ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())

story.append(Paragraph("SYSTEM ARCHITECTURE &amp; DATA FLOW", S("at_h",14,NAVY,bold=True,align=TA_CENTER,leading=18)))
story.append(Spacer(1,3*mm))
story.append(Paragraph("A modular, low-latency stack explicitly handling all 6 user modules in parallel", S("at_s",9,MGRAY,align=TA_CENTER,italic=True)))
story.append(Spacer(1,10*mm))

gw = 3*mm
bw = (CW - 5*gw) / 6
c_widths = [bw, gw, bw, gw, bw, gw, bw, gw, bw, gw, bw]
E = ""
arrow = Paragraph("<font color='#64748B'><b>|<br/>v</b></font>", S("arr", 9, colors.HexColor("#64748B"), align=TA_CENTER, leading=8))

arch_data = [
    [Paragraph("<b>CLIENT INTERFACE</b><br/>React Dashboard", S("ac",10,WHITE,align=TA_CENTER,leading=14)), E,E,E,E,E,E,E,E,E,E],
    [arrow, E,E,E,E,E,E,E,E,E,E],
    [Paragraph("<b>API GATEWAY (NEXUS CORE)</b><br/>Node.js &middot; FastAPI &middot; JWT Auth", S("ag",10,WHITE,align=TA_CENTER,leading=14)), E,E,E,E,E,E,E,E,E,E],
    [arrow, E, arrow, E, arrow, E, arrow, E, arrow, E, arrow],
    [Paragraph("<b>InvestPro</b><br/><font size='6' color='#CBD5E1'>Auto SIPs</font>", S("as1",7.5,WHITE,align=TA_CENTER,leading=9)), E,
     Paragraph("<b>FinAgent</b><br/><font size='6' color='#CBD5E1'>AI Advisor</font>", S("as2",7.5,WHITE,align=TA_CENTER,leading=9)), E,
     Paragraph("<b>Loans</b><br/><font size='6' color='#CBD5E1'>Credit</font>", S("as3",7.5,WHITE,align=TA_CENTER,leading=9)), E,
     Paragraph("<b>Offers</b><br/><font size='6' color='#CBD5E1'>Card Deals</font>", S("as4",7.5,WHITE,align=TA_CENTER,leading=9)), E,
     Paragraph("<b>CA Hub</b><br/><font size='6' color='#CBD5E1'>Premium</font>", S("as5",7.5,WHITE,align=TA_CENTER,leading=9)), E,
     Paragraph("<b>Sunscribe</b><br/><font size='6' color='#CBD5E1'>Trackers</font>", S("as6",7.5,WHITE,align=TA_CENTER,leading=9))],
    [arrow, E, arrow, E, arrow, E, arrow, E, arrow, E, arrow],
    [Paragraph("<b>DATABASES</b><br/>PostgreSQL &middot; MongoDB", S("ad1",9,WHITE,align=TA_CENTER,leading=14)), E,E,E,E,E,
     Paragraph("<b>SECURE APIs</b><br/>Plaid &middot; Crypto &middot; Alpha Vantage", S("ad2",9,WHITE,align=TA_CENTER,leading=14)), E,E,E,E],
]

arch_tbl = Table(arch_data, colWidths=c_widths)
arch_tbl.setStyle(TableStyle([
    ("SPAN", (0,0), (10,0)),
    ("BACKGROUND", (0,0), (10,0), TEAL),
    ("BOX", (0,0), (10,0), 1, BORDER),
    ("TOPPADDING", (0,0), (10,0), 10), ("BOTTOMPADDING", (0,0), (10,0), 9),
    
    ("SPAN", (0,1), (10,1)),
    ("BOTTOMPADDING", (0,1), (10,1), 4), ("TOPPADDING", (0,1), (10,1), 4),
    
    ("SPAN", (0,2), (10,2)),
    ("BACKGROUND", (0,2), (10,2), BLUE),
    ("BOX", (0,2), (10,2), 1, BORDER),
    ("TOPPADDING", (0,2), (10,2), 10), ("BOTTOMPADDING", (0,2), (10,2), 9),
    
    ("BOTTOMPADDING", (0,3), (10,3), 4), ("TOPPADDING", (0,3), (10,3), 4),
    
    ("BACKGROUND", (0,4), (0,4), INDIGO), ("BOX", (0,4), (0,4), 0.8, BORDER),
    ("BACKGROUND", (2,4), (2,4), INDIGO), ("BOX", (2,4), (2,4), 0.8, BORDER),
    ("BACKGROUND", (4,4), (4,4), INDIGO), ("BOX", (4,4), (4,4), 0.8, BORDER),
    ("BACKGROUND", (6,4), (6,4), INDIGO), ("BOX", (6,4), (6,4), 0.8, BORDER),
    ("BACKGROUND", (8,4), (8,4), GOLD),   ("BOX", (8,4), (8,4), 0.8, BORDER),
    ("BACKGROUND", (10,4), (10,4), INDIGO),("BOX", (10,4), (10,4), 0.8, BORDER),
    ("TOPPADDING", (0,4), (10,4), 8), ("BOTTOMPADDING", (0,4), (10,4), 7),
    
    ("BOTTOMPADDING", (0,5), (10,5), 4), ("TOPPADDING", (0,5), (10,5), 4),
    
    ("SPAN", (0,6), (4,6)),
    ("SPAN", (6,6), (10,6)),
    ("BACKGROUND", (0,6), (4,6), DARKGR),
    ("BOX", (0,6), (4,6), 1, BORDER),
    ("BACKGROUND", (6,6), (10,6), colors.HexColor("#0F1F45")),
    ("BOX", (6,6), (10,6), 1, BORDER),
    ("TOPPADDING", (0,6), (10,6), 10), ("BOTTOMPADDING", (0,6), (10,6), 9),
    
    ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
]))

arch_pnl = panel([
    [arch_tbl]
], dark=True)
story.append(two_col(badge("HOW","Architecture"), arch_pnl))

doc.build(story)
print("SUCCESS: idea_submission.pdf generated")
"""

text = text.replace('doc.build(story)\nprint("SUCCESS: idea_submission.pdf generated")', arch_code)

with open("generate_pdf.py", "w", encoding="utf-8") as f:
    f.write(text)

print("SUCCESS")
