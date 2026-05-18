import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_deliverables_pdf():
    pdf_path = "AtomQuest_Hackathon_Submission.pdf"
    
    # Setup document with 0.5 inch margins for standard corporate look
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom high-end corporate styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E1B4B'), # Deep Indigo
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0F766E'), # Teal Accent
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E1B4B'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#374151'), # Dark Gray
        spaceAfter=8
    )
    
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.white
    )
    
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1F2937')
    )
    
    td_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1F2937')
    )
    
    td_code_style = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#111827')
    )

    story = []
    
    # ── TITLE & HEADER ──────────────────────────────────────────
    story.append(Paragraph("🎯 ATOMQUEST PORTAL", title_style))
    story.append(Paragraph("HACKATHON 1.0 — SUBMISSION DELIVERABLES", subtitle_style))
    
    # Horizontal rule
    hr_table = Table([[""]], colWidths=[540])
    hr_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#E5E7EB')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(hr_table)
    story.append(Spacer(1, 10))
    
    # ── SECTION 1: OVERVIEW ──────────────────────────────────────
    story.append(Paragraph("🚀 Executive Overview", h1_style))
    overview_text = (
        "<b>AtomQuest</b> is a high-performance full-stack enterprise performance and OKR "
        "tracking portal. The system is designed to streamline quarterly reviews, ensure goal "
        "weightage compliance (perfectly summing to 100%), and maintain immutable, audit-ready "
        "SLA logs using Postgres row-level locks and advisory locks. The following deliverables "
        "comprise the official submission package for Hackathon 1.0."
    )
    story.append(Paragraph(overview_text, body_style))
    story.append(Spacer(1, 6))
    
    # ── SECTION 2: DELIVERABLES ─────────────────────────────────
    story.append(Paragraph("💎 Core Submission Deliverables", h1_style))
    
    # Deliverables table
    deliv_data = [
        [
            Paragraph("Deliverable", th_style),
            Paragraph("Access Link & Details", th_style)
        ],
        [
            Paragraph("<b>1. Live Hosted Demo</b>", td_bold_style),
            Paragraph("<font color='#2563EB'><u>https://atom-quest-ten.vercel.app/</u></font><br/>"
                      "<font color='#6B7280'>Vercel frontend integrated with Render REST APIs and Neon DB</font>", td_style)
        ],
        [
            Paragraph("<b>2. Source Code Repo</b>", td_bold_style),
            Paragraph("<font color='#2563EB'><u>https://github.com/NikhilMamilla/AtomQuest</u></font><br/>"
                      "<font color='#6B7280'>100% clean, warning-free TypeScript repository</font>", td_style)
        ],
        [
            Paragraph("<b>3. Architecture Specs</b>", td_bold_style),
            Paragraph("<font color='#2563EB'><u>https://github.com/NikhilMamilla/AtomQuest/blob/main/ARCHITECTURE.md</u></font><br/>"
                      "<font color='#6B7280'>Immutable JSONB audits, row-locking schemas, cron advisory specs</font>", td_style)
        ],
        [
            Paragraph("<b>4. System Diagram</b>", td_bold_style),
            Paragraph("<font color='#2563EB'><u>https://github.com/NikhilMamilla/AtomQuest/blob/main/System-Architecture.png</u></font><br/>"
                      "<font color='#6B7280'>Detailed engineering flowchart & ERD</font>", td_style)
        ]
    ]
    
    deliv_table = Table(deliv_data, colWidths=[150, 390])
    deliv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E1B4B')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F9FAFB')),
        ('BACKGROUND', (0,3), (-1,3), colors.HexColor('#F9FAFB')),
    ]))
    story.append(deliv_table)
    story.append(Spacer(1, 10))
    
    # ── SECTION 3: CREDENTIALS ──────────────────────────────────
    story.append(Paragraph("👥 Interactive Sandbox Credentials", h1_style))
    story.append(Paragraph(
        "Evaluators can log in using these preset credentials on the landing page or leverage the "
        "one-click interactive copy sandbox widgets to test all user journeys:",
        body_style
    ))
    
    cred_data = [
        [
            Paragraph("Role", th_style),
            Paragraph("Test User", th_style),
            Paragraph("Email Credentials", th_style),
            Paragraph("Password", th_style),
            Paragraph("Testing Journey Scope", th_style)
        ],
        [
            Paragraph("<b>Employee</b>", td_bold_style),
            Paragraph("Sreemouna", td_style),
            Paragraph("sreemouna@atomquest.com", td_code_style),
            Paragraph("AtomQuest2026!", td_code_style),
            Paragraph("Create goals, validate weight sums, log actuals, submit quarterly metrics.", td_style)
        ],
        [
            Paragraph("<b>Manager</b>", td_bold_style),
            Paragraph("Hansika", td_style),
            Paragraph("hansika@atomquest.com", td_code_style),
            Paragraph("AtomQuest2026!", td_code_style),
            Paragraph("Approve/lock goal sheets, edit weights, review quarters, view team analytics.", td_style)
        ],
        [
            Paragraph("<b>Admin / HR</b>", td_bold_style),
            Paragraph("Nikhil", td_style),
            Paragraph("nikhil@atomquest.com", td_code_style),
            Paragraph("AtomQuest2026!", td_code_style),
            Paragraph("Assign users/managers, unlock goals, view JSONB audit logs, trigger escalations.", td_style)
        ]
    ]
    
    cred_table = Table(cred_data, colWidths=[65, 60, 145, 80, 190])
    cred_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F766E')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F9FAFB')),
        ('BACKGROUND', (0,3), (-1,3), colors.HexColor('#F9FAFB')),
    ]))
    story.append(cred_table)
    story.append(Spacer(1, 15))
    
    # Footer notice
    footer_style = ParagraphStyle(
        'FooterNotice',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#9CA3AF'),
        alignment=1, # Center
        spaceBefore=25
    )
    story.append(Paragraph("Copyright © 2026 AtomQuest Portal by Nikhil Mamilla. All Rights Reserved.", footer_style))

    # Build PDF
    doc.build(story)
    print(f"Success! PDF created at: {pdf_path}")

if __name__ == "__main__":
    create_deliverables_pdf()
