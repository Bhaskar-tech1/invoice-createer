import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDF(elementId, invoiceNum) {
  const element = document.getElementById(elementId);
  const btn = document.getElementById('download-pdf-btn');
  const originalText = btn.innerHTML;
  
  try {
    // Show loading state
    btn.innerHTML = `<span style="animation: glowPulse 1s infinite">Generating PDF...</span>`;
    btn.disabled = true;

    // Small delay to ensure rendering is complete
    await new Promise(r => setTimeout(r, 100));

    // Force exact dimensions for html2canvas
    element.classList.add('no-transform-for-print');
    await new Promise(r => setTimeout(r, 100));

    // Capture canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    element.classList.remove('no-transform-for-print');

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${invoiceNum || 'Draft'}.pdf`);

  } catch (err) {
    console.error('Error generating PDF', err);
    alert('Failed to generate PDF');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

export async function generateAssets(elementId) {
  const element = document.getElementById(elementId);
  // Force exact dimensions for html2canvas
  element.classList.add('no-transform-for-print');
  await new Promise(r => setTimeout(r, 100));

  // Capture canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Higher resolution
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });
  
  element.classList.remove('no-transform-for-print');

  return new Promise((resolve) => {
    canvas.toBlob((imageBlob) => {
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      resolve({ imageBlob, pdfBlob });
    }, 'image/png');
  });
}

