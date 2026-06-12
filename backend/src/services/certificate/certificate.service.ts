import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * Generates an A4 PDF certificate for a blood donation,
 * uploads it to Supabase Storage, and saves the signed URL + key to the database.
 * Returns the signed URL.
 */
export async function generate(donorId: string, historyId: string): Promise<string> {
  try {
    // 1. Fetch donor details
    const { data: donor, error: donorErr } = await supabaseAdmin
      .from('donors')
      .select('full_name')
      .eq('id', donorId)
      .single();

    if (donorErr || !donor) {
      throw new Error(`Donor not found: ${donorErr?.message || 'unknown'}`);
    }

    // 2. Fetch donation details with hospital name
    const { data: history, error: historyErr } = await supabaseAdmin
      .from('donation_history')
      .select('*, hospitals!inner(name)')
      .eq('id', historyId)
      .single();

    if (historyErr || !history) {
      throw new Error(`Donation history not found: ${historyErr?.message || 'unknown'}`);
    }

    const hospitalName = (history.hospitals as any)?.name || 'Partner Hospital';
    const donatedDate = new Date(history.donated_at);
    const formattedDate = format(donatedDate, 'dd MMMM yyyy');
    const certId = `BL-${historyId.slice(0, 8).toUpperCase()}`;

    // 3. Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Decorative Border
    const borderMargin = 25;
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - borderMargin * 2,
      height: height - borderMargin * 2,
      borderColor: rgb(0.75, 0.22, 0.17), // #C0392B
      borderWidth: 3,
      color: rgb(1, 1, 1),
    });

    // Inner thin border
    page.drawRectangle({
      x: borderMargin + 5,
      y: borderMargin + 5,
      width: width - (borderMargin + 5) * 2,
      height: height - (borderMargin + 5) * 2,
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    // Header Branding
    page.drawText('RedAid', {
      x: 50,
      y: height - 80,
      size: 24,
      font: boldFont,
      color: rgb(0.75, 0.22, 0.17),
    });

    // Certificate Title
    const titleText = 'CERTIFICATE OF BLOOD DONATION';
    const titleWidth = boldFont.widthOfTextAtSize(titleText, 22);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 150,
      size: 22,
      font: boldFont,
      color: rgb(0.11, 0.14, 0.19),
    });

    // Subtitle
    const subtitleText = 'This certificate is proudly presented to';
    const subtitleWidth = italicFont.widthOfTextAtSize(subtitleText, 14);
    page.drawText(subtitleText, {
      x: (width - subtitleWidth) / 2,
      y: height - 210,
      size: 14,
      font: italicFont,
      color: rgb(0.42, 0.45, 0.50),
    });

    // Donor Name (Centered & Highlighted)
    const donorName = donor.full_name;
    const nameWidth = boldFont.widthOfTextAtSize(donorName, 26);
    page.drawText(donorName, {
      x: (width - nameWidth) / 2,
      y: height - 260,
      size: 26,
      font: boldFont,
      color: rgb(0.75, 0.22, 0.17),
    });

    // Divider line under name
    const lineY = height - 280;
    page.drawLine({
      start: { x: (width - 200) / 2, y: lineY },
      end: { x: (width + 200) / 2, y: lineY },
      thickness: 1.5,
      color: rgb(0.75, 0.22, 0.17),
    });

    // Body Text
    const bodyText1 = 'in grateful recognition of their selfless act of donating blood,';
    const bodyText2 = 'helping to save lives and support the community.';
    const bodyWidth1 = regularFont.widthOfTextAtSize(bodyText1, 12);
    const bodyWidth2 = regularFont.widthOfTextAtSize(bodyText2, 12);
    page.drawText(bodyText1, {
      x: (width - bodyWidth1) / 2,
      y: height - 330,
      size: 12,
      font: regularFont,
      color: rgb(0.11, 0.14, 0.19),
    });
    page.drawText(bodyText2, {
      x: (width - bodyWidth2) / 2,
      y: height - 350,
      size: 12,
      font: regularFont,
      color: rgb(0.11, 0.14, 0.19),
    });

    // Details Grid (2-column layout)
    const gridY = height - 450;
    const col1X = 100;
    const col2X = 350;

    // Hospital Name
    page.drawText('Hospital:', { x: col1X, y: gridY, size: 12, font: boldFont, color: rgb(0.42, 0.45, 0.50) });
    page.drawText(hospitalName, { x: col1X, y: gridY - 20, size: 12, font: regularFont, color: rgb(0.11, 0.14, 0.19) });

    // Blood Group
    page.drawText('Blood Group:', { x: col2X, y: gridY, size: 12, font: boldFont, color: rgb(0.42, 0.45, 0.50) });
    page.drawText(history.blood_group, { x: col2X, y: gridY - 20, size: 12, font: regularFont, color: rgb(0.11, 0.14, 0.19) });

    // Date
    page.drawText('Date of Donation:', { x: col1X, y: gridY - 70, size: 12, font: boldFont, color: rgb(0.42, 0.45, 0.50) });
    page.drawText(formattedDate, { x: col1X, y: gridY - 90, size: 12, font: regularFont, color: rgb(0.11, 0.14, 0.19) });

    // Units
    page.drawText('Units Donated:', { x: col2X, y: gridY - 70, size: 12, font: boldFont, color: rgb(0.42, 0.45, 0.50) });
    page.drawText(`${String(history.units_donated)} Unit(s)`, { x: col2X, y: gridY - 90, size: 12, font: regularFont, color: rgb(0.11, 0.14, 0.19) });

    // Signatures
    const sigY = 150;
    page.drawLine({ start: { x: 80, y: sigY }, end: { x: 220, y: sigY }, thickness: 1, color: rgb(0.75, 0.22, 0.17) });
    page.drawText('RedAid Coordinator', { x: 95, y: sigY - 20, size: 10, font: boldFont, color: rgb(0.42, 0.45, 0.50) });

    page.drawLine({ start: { x: 375, y: sigY }, end: { x: 515, y: sigY }, thickness: 1, color: rgb(0.75, 0.22, 0.17) });
    page.drawText('Medical Officer', { x: 410, y: sigY - 20, size: 10, font: boldFont, color: rgb(0.42, 0.45, 0.50) });

    // Footer with ID
    page.drawText(`Certificate ID: ${certId}`, {
      x: 50,
      y: 50,
      size: 10,
      font: italicFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    // 4. Upload to Supabase Storage
    const key = `certificates/${donorId}/${historyId}.pdf`;
    const { error: uploadErr } = await supabaseAdmin.storage.from('certificates').upload(key, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (uploadErr) {
      throw new Error(`Failed to upload certificate to storage: ${uploadErr.message}`);
    }

    // 5. Generate signed URL valid for 7 days (604800 seconds)
    const { data: urlData, error: urlErr } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(key, 7 * 24 * 60 * 60);

    if (urlErr || !urlData?.signedUrl) {
      throw new Error(`Failed to generate signed URL: ${urlErr?.message || 'unknown'}`);
    }

    // 6. Update donation_history table with URL and Key
    const { error: updateErr } = await supabaseAdmin
      .from('donation_history')
      .update({
        certificate_url: urlData.signedUrl,
        certificate_key: key,
      })
      .eq('id', historyId);

    if (updateErr) {
      throw new Error(`Failed to update donation history certificate data: ${updateErr.message}`);
    }

    logger.info({ historyId, key }, 'Certificate generated and stored successfully');
    return urlData.signedUrl;
  } catch (err: any) {
    logger.error({ historyId, error: err.message }, 'Failed to generate certificate');
    throw err;
  }
}

/**
 * Regenerates a fresh 7-day signed URL for an existing certificate using the certificate_key.
 * Saves the new URL to the database and returns it.
 */
export async function regenerateUrl(historyId: string): Promise<string> {
  try {
    // 1. Fetch certificate key from donation_history
    const { data: history, error: fetchErr } = await supabaseAdmin
      .from('donation_history')
      .select('certificate_key')
      .eq('id', historyId)
      .single();

    if (fetchErr || !history?.certificate_key) {
      throw new Error(`Certificate key not found: ${fetchErr?.message || 'no key'}`);
    }

    const key = history.certificate_key;

    // 2. Generate new signed URL valid for 7 days (604800 seconds)
    const { data: urlData, error: urlErr } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(key, 7 * 24 * 60 * 60);

    if (urlErr || !urlData?.signedUrl) {
      throw new Error(`Failed to regenerate signed URL: ${urlErr?.message || 'unknown'}`);
    }

    // 3. Update donation_history table with new URL
    const { error: updateErr } = await supabaseAdmin
      .from('donation_history')
      .update({
        certificate_url: urlData.signedUrl,
      })
      .eq('id', historyId);

    if (updateErr) {
      throw new Error(`Failed to save updated signed URL: ${updateErr.message}`);
    }

    logger.info({ historyId }, 'Certificate signed URL regenerated successfully');
    return urlData.signedUrl;
  } catch (err: any) {
    logger.error({ historyId, error: err.message }, 'Failed to regenerate certificate signed URL');
    throw err;
  }
}
