import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportOptions {
  title: string;
  content: string;
  type: 'notes' | 'flashcards' | 'roadmap' | 'mentor';
  author?: string;
}

export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const { title, content, type, author = 'StarPath User' } = options;

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Add header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, margin);

    // Add metadata
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const date = new Date().toLocaleDateString();
    pdf.text(`Generated on ${date}`, margin, margin + 8);
    pdf.text(`Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`, margin, margin + 13);

    // Add line separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, margin + 18, pageWidth - margin, margin + 18);

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    let yPosition = margin + 28;

    if (type === 'flashcards') {
      // Special handling for flashcards
      try {
        const flashcards = JSON.parse(content);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Flashcards', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        flashcards.forEach((card: any, index: number) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          // Card number
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Card ${index + 1}`, margin, yPosition);
          yPosition += 7;

          // Question
          pdf.setFont('helvetica', 'bold');
          pdf.text('Q:', margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          const questionLines = pdf.splitTextToSize(card.question, contentWidth - 10);
          pdf.text(questionLines, margin + 7, yPosition);
          yPosition += questionLines.length * 5 + 2;

          // Answer
          pdf.setFont('helvetica', 'bold');
          pdf.text('A:', margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          const answerLines = pdf.splitTextToSize(card.answer, contentWidth - 10);
          pdf.text(answerLines, margin + 7, yPosition);
          yPosition += answerLines.length * 5 + 5;

          // Separator
          pdf.setDrawColor(220, 220, 220);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        });
      } catch (e) {
        // Fallback to plain text if JSON parsing fails
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(content, contentWidth);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        });
      }
    } else {
      // For notes, roadmap, and mentor - convert markdown to plain text with formatting
      pdf.setFontSize(10);
      const lines = content.split('\n');

      lines.forEach((line) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        // Handle markdown headers
        if (line.startsWith('# ')) {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(line.substring(2), margin, yPosition);
          yPosition += 8;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
        } else if (line.startsWith('## ')) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(line.substring(3), margin, yPosition);
          yPosition += 7;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
        } else if (line.startsWith('### ')) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(line.substring(4), margin, yPosition);
          yPosition += 6;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          // Bullet points
          pdf.text('•', margin + 2, yPosition);
          const textLines = pdf.splitTextToSize(line.substring(2), contentWidth - 5);
          pdf.text(textLines, margin + 7, yPosition);
          yPosition += textLines.length * 5;
        } else if (line.match(/^\d+\. /)) {
          // Numbered lists
          const splitLines = pdf.splitTextToSize(line, contentWidth);
          pdf.text(splitLines, margin + 2, yPosition);
          yPosition += splitLines.length * 5;
        } else if (line.trim()) {
          // Regular text
          const textLines = pdf.splitTextToSize(line, contentWidth);
          pdf.text(textLines, margin, yPosition);
          yPosition += textLines.length * 5;
        } else {
          // Empty line
          yPosition += 3;
        }
      });
    }

    // Add footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text('Generated by StarPath', pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Set metadata
    pdf.setProperties({
      title: title,
      subject: `${type} generated by StarPath`,
      author: author,
      creator: 'StarPath AI Tools',
    });

    // Save the PDF
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to generate PDF');
  }
}

// Alternative method using html2canvas for more complex layouts
export async function exportElementToPDF(
  elementId: string,
  title: string
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to generate PDF from element');
  }
}
