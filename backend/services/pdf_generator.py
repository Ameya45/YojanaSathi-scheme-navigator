from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import io
from datetime import datetime

def generate_pdf(schemes: list, user_profile: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )

    styles = getSampleStyleSheet()
    elements = []

    # Colors
    emerald = HexColor("#1D9E75")
    dark = HexColor("#1a1a2e")
    light_gray = HexColor("#f5f5f5")
    amber = HexColor("#f0a500")

    # Title style
    title_style = ParagraphStyle(
        "title",
        fontSize=22,
        textColor=white,
        backColor=dark,
        alignment=TA_CENTER,
        spaceAfter=4,
        spaceBefore=4,
        fontName="Helvetica-Bold",
        borderPadding=(10, 10, 10, 10),
    )

    subtitle_style = ParagraphStyle(
        "subtitle",
        fontSize=11,
        textColor=HexColor("#888888"),
        alignment=TA_CENTER,
        spaceAfter=12,
    )

    heading_style = ParagraphStyle(
        "heading",
        fontSize=13,
        textColor=white,
        backColor=emerald,
        fontName="Helvetica-Bold",
        spaceAfter=6,
        spaceBefore=10,
        borderPadding=(6, 6, 6, 6),
    )

    body_style = ParagraphStyle(
        "body",
        fontSize=10,
        textColor=dark,
        spaceAfter=4,
        leading=14,
    )

    label_style = ParagraphStyle(
        "label",
        fontSize=9,
        textColor=HexColor("#666666"),
        fontName="Helvetica-Bold",
        spaceAfter=2,
    )

    # Header
    elements.append(Paragraph("🏛️ Scheme Navigator", title_style))
    elements.append(Paragraph("AI-Powered Government Scheme Report", subtitle_style))
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%d %B %Y, %I:%M %p')}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=emerald))
    elements.append(Spacer(1, 8*mm))

    # User Profile Summary
    elements.append(Paragraph("Your Profile", heading_style))
    elements.append(Spacer(1, 3*mm))

    profile_data = [
        ["Age", str(user_profile.get("age", "")),
         "Gender", user_profile.get("gender", "").capitalize()],
        ["Caste", user_profile.get("caste", "").upper(),
         "Occupation", user_profile.get("occupation", "").capitalize()],
        ["Annual Income", f"Rs. {int(user_profile.get('income', 0)):,}",
         "State", user_profile.get("domicile_state", "")],
        ["Years in State", str(user_profile.get("domicile_years", "")), "", ""],
    ]

    profile_table = Table(profile_data, colWidths=[35*mm, 45*mm, 35*mm, 45*mm])
    profile_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), light_gray),
        ("TEXTCOLOR", (0, 0), (-1, -1), dark),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dddddd")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [light_gray, white]),
    ]))
    elements.append(profile_table)
    elements.append(Spacer(1, 6*mm))

    # Schemes count
    eligible = [s for s in schemes if s.get("domicile_status") == "eligible"]
    partial = [s for s in schemes if s.get("domicile_status") == "partial"]

    elements.append(Paragraph(
        f"Found <b>{len(schemes)} schemes</b> — "
        f"<font color='#1D9E75'>{len(eligible)} Fully Eligible</font> | "
        f"<font color='#f0a500'>{len(partial)} Check Domicile</font>",
        body_style
    ))
    elements.append(Spacer(1, 4*mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=HexColor("#dddddd")))
    elements.append(Spacer(1, 4*mm))

    # Schemes list
    elements.append(Paragraph("Your Eligible Schemes", heading_style))
    elements.append(Spacer(1, 4*mm))

    for i, scheme in enumerate(schemes, 1):
        is_partial = scheme.get("domicile_status") == "partial"
        status = "⚠ Check Domicile" if is_partial else "✓ Fully Eligible"
        status_color = amber if is_partial else emerald

        # Scheme title
        scheme_title_style = ParagraphStyle(
            f"scheme_title_{i}",
            fontSize=12,
            textColor=dark,
            fontName="Helvetica-Bold",
            spaceAfter=3,
        )
        elements.append(Paragraph(f"{i}. {scheme.get('title', '')}", scheme_title_style))

        # Status + State row
        status_style = ParagraphStyle(
            f"status_{i}",
            fontSize=9,
            textColor=status_color,
            fontName="Helvetica-Bold",
            spaceAfter=4,
        )
        elements.append(Paragraph(
            f"{status}  |  {scheme.get('state', 'Central')}  |  {scheme.get('ministry', '')}",
            status_style
        ))

        # Description
        elements.append(Paragraph(scheme.get("description", ""), body_style))

        # Benefits
        elements.append(Paragraph("Benefits:", label_style))
        elements.append(Paragraph(str(scheme.get("benefits", "")), body_style))

        # Documents
        docs = scheme.get("documents", [])
        if docs:
            elements.append(Paragraph("Documents Required:", label_style))
            elements.append(Paragraph(", ".join(docs), body_style))

        # Application
        elements.append(Paragraph("How to Apply:", label_style))
        elements.append(Paragraph(str(scheme.get("application_process", "")), body_style))

        # Eligibility reasons
        reasons = scheme.get("eligibility_reasons", [])
        if reasons:
            elements.append(Paragraph(
                "Why eligible: " + " • ".join(reasons),
                ParagraphStyle(f"reasons_{i}", fontSize=9,
                               textColor=HexColor("#1D9E75"), spaceAfter=4)
            ))

        elements.append(HRFlowable(width="100%", thickness=0.5,
                                    color=HexColor("#dddddd")))
        elements.append(Spacer(1, 4*mm))

    # Footer
    elements.append(Spacer(1, 4*mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=emerald))
    elements.append(Paragraph(
        "Generated by Scheme Navigator — AI-Powered Government Scheme Finder for Rural India",
        subtitle_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()