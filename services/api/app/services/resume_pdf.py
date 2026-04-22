"""Render a Resume's parsed_data into a styled PDF (Modern/Classic/Minimal)."""
from io import BytesIO
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)


TEMPLATES = {
    'modern': {'accent': HexColor('#2563eb'), 'heading_color': HexColor('#1e3a8a'), 'rule': True},
    'classic': {'accent': HexColor('#0f172a'), 'heading_color': HexColor('#0f172a'), 'rule': True},
    'minimal': {'accent': HexColor('#374151'), 'heading_color': HexColor('#111827'), 'rule': False},
}


def _style(name: str, **kw) -> ParagraphStyle:
    base = dict(fontName='Helvetica', fontSize=10, leading=13, alignment=TA_LEFT, textColor=HexColor('#1f2937'))
    base.update(kw)
    return ParagraphStyle(name, **base)


def _esc(s) -> str:
    if s is None:
        return ''
    return (
        str(s)
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
    )


def render_resume_pdf(parsed_data: dict, title: str = 'Resume') -> bytes:
    template_key = (parsed_data.get('_template') or 'modern').lower()
    tpl = TEMPLATES.get(template_key, TEMPLATES['modern'])

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=0.7 * inch,
        rightMargin=0.7 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title=title,
    )

    name_style = _style('name', fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=tpl['heading_color'])
    contact_style = _style('contact', fontSize=9.5, textColor=HexColor('#6b7280'))
    h2_style = _style('h2', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=tpl['accent'], spaceBefore=10, spaceAfter=4)
    role_style = _style('role', fontName='Helvetica-Bold', fontSize=10.5, textColor=HexColor('#0f172a'))
    meta_style = _style('meta', fontSize=9.5, textColor=HexColor('#6b7280'))
    body_style = _style('body', fontSize=10, leading=13)
    chip_label = _style('chip', fontSize=10, textColor=HexColor('#0f172a'))

    story = []

    # Header
    name = _esc(parsed_data.get('name') or 'Unnamed Candidate')
    story.append(Paragraph(name, name_style))

    contact_bits = [
        parsed_data.get('email'),
        parsed_data.get('phone'),
        parsed_data.get('_target_job_title') and f"Target: {parsed_data.get('_target_job_title')}",
    ]
    contact_line = '   |   '.join(_esc(b) for b in contact_bits if b)
    if contact_line:
        story.append(Paragraph(contact_line, contact_style))

    if tpl['rule']:
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width='100%', thickness=1, color=tpl['accent']))

    # Summary
    summary = parsed_data.get('summary') or parsed_data.get('suggested_summary')
    if summary:
        story.append(Paragraph('SUMMARY', h2_style))
        story.append(Paragraph(_esc(summary), body_style))

    # Skills
    skills = parsed_data.get('skills') or []
    if skills:
        story.append(Paragraph('SKILLS', h2_style))
        chip_text = '  •  '.join(_esc(s) for s in skills)
        story.append(Paragraph(chip_text, chip_label))

    # Experience
    experience = parsed_data.get('experience') or []
    if experience:
        story.append(Paragraph('EXPERIENCE', h2_style))
        for exp in experience:
            title_line = _esc(exp.get('title') or '')
            company = _esc(exp.get('company') or '')
            duration = _esc(exp.get('duration') or '')
            head = title_line
            if company:
                head += f"  —  <font color='#374151'>{company}</font>"
            story.append(Paragraph(head, role_style))
            if duration:
                story.append(Paragraph(duration, meta_style))
            desc = exp.get('description')
            if desc:
                story.append(Paragraph(_esc(desc), body_style))
            exp_skills = exp.get('skills') or []
            if exp_skills:
                story.append(Paragraph('<i>' + _esc(', '.join(exp_skills)) + '</i>', meta_style))
            story.append(Spacer(1, 6))

    # Projects
    projects = parsed_data.get('projects') or []
    if projects:
        story.append(Paragraph('PROJECTS', h2_style))
        for proj in projects:
            story.append(Paragraph(_esc(proj.get('title') or ''), role_style))
            if proj.get('description'):
                story.append(Paragraph(_esc(proj['description']), body_style))
            if proj.get('skills'):
                story.append(Paragraph('<i>' + _esc(', '.join(proj['skills'])) + '</i>', meta_style))
            story.append(Spacer(1, 6))

    # Education
    education = parsed_data.get('education') or []
    if education:
        story.append(Paragraph('EDUCATION', h2_style))
        for ed in education:
            line = _esc(ed.get('degree') or '')
            inst = _esc(ed.get('institution') or '')
            year = _esc(ed.get('year') or '')
            if inst:
                line += f"  —  {inst}"
            story.append(Paragraph(line, role_style))
            if year:
                story.append(Paragraph(year, meta_style))
            story.append(Spacer(1, 4))

    # Certifications
    certs = parsed_data.get('certifications') or []
    if certs:
        story.append(Paragraph('CERTIFICATIONS', h2_style))
        for c in certs:
            story.append(Paragraph('• ' + _esc(c), body_style))

    doc.build(story)
    return buf.getvalue()
