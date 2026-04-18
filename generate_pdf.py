from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line, String, Group
from reportlab.graphics import renderPDF

# ── Page Setup ─────────────────────────────────────────────────────────────────
W, H = landscape(A4)
LM = RM = 10*mm # Minimized margins
CW = W - LM - RM

doc = SimpleDocTemplate(
    "Fidel Castro.pdf",
    pagesize=landscape(A4),
    leftMargin=LM, rightMargin=RM,
    topMargin=8*mm, bottomMargin=12*mm,
)

# ── Colors ─────────────────────────────────────────────────────────────────────
NAVY   = colors.HexColor("#000048")
DNAV   = colors.HexColor("#0D1B3E")
BLUE   = colors.HexColor("#1A56DB")
GOLD   = colors.HexColor("#F59E0B")
WHITE  = colors.white
BG     = colors.HexColor("#F3F4F6")
DGRAY  = colors.HexColor("#1F2937")
MGRAY  = colors.HexColor("#6B7280")
LGRAY  = colors.white
BORDER = colors.HexColor("#D1D5DB")
TEAL   = colors.HexColor("#0D9488")
INDIGO = colors.HexColor("#4338CA")
DARKGR = colors.HexColor("#14532D")

# ── Style helper ───────────────────────────────────────────────────────────────
_STYLES = {}
def S(name, size, color, bold=False, italic=False, align=TA_LEFT, leading=None, indent=0):
    key = f"{name}_{size}_{bold}_{italic}_{align}_{indent}"
    if key not in _STYLES:
        fname = "Helvetica"
        if bold and italic: fname = "Helvetica-BoldOblique"
        elif bold:          fname = "Helvetica-Bold"
        elif italic:        fname = "Helvetica-Oblique"
        _STYLES[key] = ParagraphStyle(
            name, fontSize=size, textColor=color, fontName=fname,
            alignment=align, leading=leading or size*1.15, leftIndent=indent)
    return _STYLES[key]

def bp(txt, size=7.0): # Slightly smaller font
    return Paragraph(f"<bullet>&bull;</bullet> {txt}", S("bull",size,DGRAY,leading=size*1.2,indent=8))

# ── Components ────────────────────────────────────────────────────────────────

def draw_header(canvas, doc, title):
    canvas.saveState()
    canvas.setFont('Helvetica-Bold', 16)
    canvas.setFillColor(NAVY)
    canvas.drawString(LM, H - 15*mm, title)
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(LM, H - 19*mm, W - RM, H - 19*mm)
    canvas.setFont('Helvetica-Bold', 11)
    canvas.drawRightString(W - RM, H - 14*mm, "cognizant")
    canvas.restoreState()

def template_box(label, sub, width=38*mm, height=10*mm):
    t = Table([[Paragraph(label, S("lbl",13,WHITE,True,align=TA_CENTER))],
               [Paragraph(sub,   S("sub", 6.5,WHITE,False,True,TA_CENTER))]],
              colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),NAVY),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),1),("BOTTOMPADDING",(0,0),(-1,-1),1),
    ]))
    return t

def content_panel(rows, width, padding=6):
    t = Table(rows, colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),LGRAY),
        ("BOX",(0,0),(-1,-1),0.4,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),padding),("BOTTOMPADDING",(0,0),(-1,-1),padding),
        ("LEFTPADDING",(0,0),(-1,-1),padding),("RIGHTPADDING",(0,0),(-1,-1),padding),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    return t

def draw_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(MGRAY)
    canvas.drawString(LM + 30*mm, 8*mm, "© 2026–2027 Cognizant | Private")
    canvas.drawString(LM, 8*mm, str(doc.page))
    canvas.setFont('Helvetica-Bold', 9)
    canvas.setFillColor(NAVY)
    canvas.drawRightString(W - RM, 8*mm, "cognizant")
    canvas.restoreState()

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.restoreState()
    if doc.page > 1:
        titles = ["", "Nexus Fintech Super-App | Business Plan (1/2)", "Nexus Fintech Super-App | Business Plan (2/2)", "Financials & Timelines | Business Plan (2/2)", "System Architecture & Data Flow"]
        if doc.page <= len(titles):
            draw_header(canvas, doc, titles[doc.page-1])
        draw_footer(canvas, doc)

# ══════════════════════════════════════════════════════════════════════════════
# DATA & STORY
# ══════════════════════════════════════════════════════════════════════════════
story = []

# PAGE 1: COVER
cover = []
cover.append(Spacer(1, 40*mm))
cover.append(Paragraph("Technoverse Hackathon", S("c1", 22, NAVY, bold=True, align=TA_CENTER)))
cover.append(Paragraph("2026", S("c2", 16, NAVY, align=TA_CENTER)))
cover.append(Spacer(1, 25*mm))
cover.append(Paragraph("Idea submission", S("c3", 36, NAVY, bold=True, align=TA_CENTER)))
cover.append(Spacer(1, 30*mm))
cover.append(Paragraph("Team: <font color='#000048'>FIDEL CASTRO</font>", S("c4", 16, NAVY, align=TA_CENTER)))
cover.append(Paragraph("Members: Mayuri Kadolli, Rohit Lokare, Vikas Kannur, Madhu Giraddi", S("c5", 11, MGRAY, align=TA_CENTER)))
cover.append(Spacer(1, 40*mm))
cover.append(Paragraph("cognizant", S("c6", 13, NAVY, bold=True, align=TA_RIGHT)))
story.extend(cover)
story.append(PageBreak())

# PAGE 2: WHY & HOW (1)
p2_content = [
    [template_box("WHY", "Explain the Problem"), content_panel([
        [Paragraph("<b>Problem Description & Business Scenario:</b>", S("h", 8.5, NAVY, bold=True))],
        [bp("<b>Fragmentation:</b> India's financial ecosystem is critically fragmented; industry data confirms 78% of consumers manage banking, investments, loans, and subscriptions across 3 or more separate apps, creating costly 'financial blind spots' and decision fatigue.")],
        [bp("<b>Savings & Costs:</b> India's personal savings rate has fallen to a historic low of 3.8%, while households unknowingly lose $200+ every year to untracked 'vampire' subscriptions.")],
        [bp("<b>Market Opportunity:</b> The global Wealth-Tech market is projected to reach $137 Billion by 2028 and is pivoting aggressively toward unified Super-App ecosystems.")],
        [bp("<b>Incumbent Gap:</b> Incumbent banks — holding 85% of retail deposits — remain purely transactional, offering no proactive behavioral wealth-building tools.")],
        [bp("<b>Unified Demand:</b> The market demands one platform that aggregates data, automates micro-investments, and connects users with expert advisory — all in one trusted, real-time environment.")],
        [Spacer(1, 1.5*mm)],
        [Paragraph("<b>Problem Scope:</b>", S("h", 8.5, NAVY, bold=True))],
        [bp("<b>Core Platform:</b> Nexus is scoped as a full-stack Fintech Super-App consolidating 6 highly differentiated modules plus the Nexus Core dashboard.")],
        [bp("<b>Dashboard Layer:</b> The Core is an open-banking control center providing real-time net-worth aggregation.")],
        [bp("<b>The 6 Modules:</b> 1) FinCoach, 2) InvestPro, 3) CreditCanvas, 4) CarbonCash, 5) Subscribe, 6) CA Contacts. Experts consultation is an exclusive premium feature.")],
        [Spacer(1, 1.5*mm)],
        [Paragraph("<b>Target Users/Stakeholders:</b>", S("h", 8.5, NAVY, bold=True))],
        [bp("<b>Young Urban Professionals (22–35):</b> Time-poor and managing multiple apps. They leverage <b>Nexus Core</b>, automated micro-savings, and monitor their footprint with <b>CarbonCash</b>.")],
        [bp("<b>First-Time Investors & Credit Seekers:</b> Overwhelmed by generic advice. <b>FinCoach</b> delivers gamified literacy, while <b>CreditCanvas</b> projects today's spending impacts.")],
    ], CW - 42*mm)],
    [Spacer(1, 3*mm), Spacer(1,3*mm)],
    [template_box("HOW", "Explain the solve"), content_panel([
        [Paragraph("<b>Solution Overview:</b>", S("h", 8.5, NAVY, bold=True))],
        [bp("<b>Unified Ecosystem:</b> Nexus eliminates financial fragmentation by unifying open banking, AI predictive credit, automated investing, gamified literacy, ESG, and expert CA consultation.")],
        [bp("<b>Active Lifecycle Management:</b> <b>FinCoach</b> delivers timely contextual learning, <b>CreditCanvas</b> projects AI 'What-If' scenarios, <b>CarbonCash</b> scores environmental impact, and <b>InvestPro</b> automates wealth routines.")],
        [bp("<b>Seamless Operation:</b> The entire ecosystem operates seamlessly in the background.")],
    ], CW - 42*mm)]
]
t2 = Table(p2_content, colWidths=[40*mm, CW - 40*mm])
t2.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP")]))
story.append(t2)
story.append(PageBreak())

# PAGE 3: HOW (2) & WHAT
p3_content = [
    [template_box("HOW", "Technical solve"), content_panel([
        [Paragraph("<b>Technical Details:</b>", S("h", 8.5, NAVY, bold=True))],
        [bp("<b>Stack:</b> Python, JS/TS, Next.js, Node.js, MongoDB, PostgreSQL, LangChain + LangGraph, Socket.io.")],
        [bp("<b>Frontend:</b> glassmorphic UI, sub-200ms WebSocket DOM re-renders via Vite/React 19.")],
        [bp("<b>AI Reasoning:</b> Agentic loop for FinCoach and CreditCanvas (Cognizant-preferred).")],
        [bp("<b>Data Pipelines:</b> Plaid (banking), CoinGecko (crypto), Alpha Vantage (equities).")],
        [Spacer(1, 1.5*mm)],
        [Paragraph("<b>Why these technologies:</b>", S("h", 8.5, NAVY, bold=True))],
        [bp("<b>Node.js:</b> Event-driven non-blocking I/O enables multi-API data pulls without latency.")],
        [bp("<b>Next.js:</b> Virtual DOM diffing keeps 10+ concurrent WebSocket feeds flicker-free.")],
    ], CW - 42*mm)],
    [Spacer(1, 3*mm), Spacer(1,3*mm)],
    [template_box("WHAT", "Value proposition"), content_panel([
        [Paragraph("<b>Innovation:</b>", S("h", 8.5, NAVY, bold=True))],
        [bp("<b>Inclusive AI Forecasting:</b> Uses real-time cash flow to build an alternative trust score.")],
        [bp("<b>ESG & Sustainability:</b> CarbonCash assigns a live 'Carbon Score' to users' spending habits.")],
        [bp("<b>Hyper-Contextual Learning:</b> FinCoach modules triggered by actual banking events.")],
        [Spacer(1, 1.5*mm)],
        [Paragraph("<b>Market Potential:</b>", S("h", 8.5, NAVY, bold=True))],
        [bp("<b>Market:</b> Converges Open Banking ($43B), Wealth-Tech ($137B), and CA Advisory Services.")],
        [bp("<b>Demographic:</b> Gen-Z and Millennials commanding $1.4 Trillion in spending power.")],
    ], CW - 42*mm)]
]
t3 = Table(p3_content, colWidths=[40*mm, CW - 40*mm])
t3.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP")]))
story.append(t3)
story.append(PageBreak())

# PAGE 4: FINANCIALS & TIMELINES (Smaller padding to fit)
p4_content = [
    [template_box("Investments", "Project costs"), content_panel([
        [bp("<b>Cloud & Mock:</b> Minimal CapEx. Scalable cloud (AWS). Consumption OpEx for LLM and Plaid.")],
    ], CW - 42*mm, padding=4)],
    [Spacer(1, 2*mm), Spacer(1, 2*mm)],
    [template_box("Returns", "Benefits realized"), content_panel([
        [bp("<b>Metrics:</b> 10x UX gain, 15% savings uplift, 10x literacy impact.")],
        [bp("<b>Revenue:</b> Freemium conversion & recurring subscription paywalls for CA advisory.")],
    ], CW - 42*mm, padding=4)],
    [Spacer(1, 2*mm), Spacer(1, 2*mm)],
    [template_box("Timelines", "Roadmap"), content_panel([
        [bp("<b>Phase 0:</b> MVP Demo Day. Next.js 15, Plaid sandbox, FinCoach logic.")],
        [bp("<b>Phase 1-3:</b> Onboard 10K users, SubScrub activation, InvestPro launch, CA Scale.")],
    ], CW - 42*mm, padding=4)]
]
t4 = Table(p4_content, colWidths=[40*mm, CW - 40*mm])
t4.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP")]))
story.append(t4)
story.append(PageBreak())

# PAGE 5: ARCHITECTURE
story.append(Spacer(1, 10*mm))
arch_box = template_box("Architecture", "System Blueprint")
arch_pnl = content_panel([
    [Paragraph("<b>Unified Fintech Infrastructure:</b>", S("h", 9, NAVY, bold=True))],
    [bp("<b>Frontend:</b> Next.js 15 + React 19 glassmorphism dashboard.")],
    [bp("<b>Logic:</b> Node.js Event-driven API Gateway managing 6 modular services.")],
    [bp("<b>AI:</b> LangChain + LangGraph agentic reasoning loop.")],
    [bp("<b>Data:</b> MongoDB & PostgreSQL persistent layers with Plaid integration.")],
    [Spacer(1, 5*mm)],
    [Paragraph("CLIENT &#x2192; GATEWAY &#x2192; MODULES (Invest/Coach/Credit/Carbon/Sub/CA) &#x2192; DATA", S("ar", 12, NAVY, align=TA_CENTER))],
], CW - 42*mm)
t5 = Table([[arch_box, arch_pnl]], colWidths=[40*mm, CW - 40*mm])
t5.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP")]))
story.append(t5)

doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print("SUCCESS: Fidel Castro.pdf generated (Official Template Applied)")
