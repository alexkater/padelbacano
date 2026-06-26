// ─── UBL 2.1 XML Generator — DIAN-ready Colombian electronic invoice ─────
//
// PádelBacano NO es emisor DIAN. El XML generado es para que el club lo
// exporte y envíe a su contador o software DIAN autorizado.
//
// Todos los valores monetarios están en centavos COP (enteros).
// Se convierten a pesos dividiendo por 100 para el XML.
// ───────────────────────────────────────────────────────────────────────────

import type { Invoice, InvoiceItem } from "@/core/entities/invoice";

/** Mapa de tipos de documento DIAN a códigos del esquema */
const DIAN_DOC_TYPE_MAP: Record<string, string> = {
  CC: "13",
  NIT: "31",
  CE: "22",
  PP: "05",
};

/** Mapa de tipos de documento DIAN a schemeName */
const DIAN_SCHEME_NAME_MAP: Record<string, string> = {
  CC: "06",   // Cédula de Ciudadanía
  NIT: "01",  // NIT
  CE: "07",   // Cédula de Extranjería
  PP: "08",   // Pasaporte
};

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function centsToPesos(cents: number): string {
  return (cents / 100).toFixed(2);
}

function buildDocumentId(
  docType: string | null | undefined,
  docNumber: string | null | undefined,
  isSupplier: boolean,
): string {
  const type = docType || "CC";
  const schemeId = DIAN_DOC_TYPE_MAP[type] || "13";
  const schemeName = isSupplier ? "31" : DIAN_SCHEME_NAME_MAP[type] || "13";

  // Para NIT del proveedor: schemeID="4" schemeName="31"
  if (isSupplier && type === "NIT") {
    return `      <cbc:CompanyID schemeID="4" schemeName="31">${xmlEscape(docNumber || "")}</cbc:CompanyID>`;
  }

  return `      <cbc:CompanyID schemeID="${schemeId}" schemeName="${schemeName}">${xmlEscape(docNumber || "")}</cbc:CompanyID>`;
}

export interface UblInvoiceData {
  invoice: Invoice;
  supplierNit: string | null;
  supplierName: string;
  supplierAddress: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
}

/**
 * Genera XML UBL 2.1 para una factura electrónica colombiana.
 *
 * @returns string XML con encoding UTF-8, lista para enviar a DIAN o descargar.
 */
export function generateUblXml(data: UblInvoiceData): string {
  const { invoice, supplierNit, supplierName, supplierAddress, supplierPhone, supplierEmail } = data;
  const items: InvoiceItem[] = invoice.items || [];

  const issueDate = formatDate(invoice.issueDate);
  const dueDate = formatDate(invoice.dueDate);
  const subtotalPesos = centsToPesos(invoice.subtotal);
  const taxPesos = centsToPesos(invoice.taxAmount);
  const totalPesos = centsToPesos(invoice.total);
  const taxRatePct = ((invoice.taxRate || 1900) / 100).toFixed(2);

  // Supplier document
  const supplierDocType = "NIT";
  const supplierDocId = buildDocumentId(supplierDocType, supplierNit, true);

  // Customer document
  const customerDocType = invoice.customerDocumentType || "CC";
  const customerDocNumber = invoice.customerDocument || "";
  const customerDocId = buildDocumentId(customerDocType, customerDocNumber, false);

  // Build invoice lines
  const lineXml = items.map((item, idx) => {
    const lineNum = idx + 1;
    const qty = item.quantity;
    const unitPricePesos = centsToPesos(item.unitPrice);
    const lineSubtotalPesos = centsToPesos(item.subtotal);
    return `    <cac:InvoiceLine>
      <cbc:ID>${lineNum}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="94">${qty}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="COP">${lineSubtotalPesos}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${xmlEscape(item.description)}</cbc:Description>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="COP">${unitPricePesos}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:sts="dian:gov:co:facturaelectronica:Structures-2-1">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1: Factura Electronica de Venta</cbc:ProfileID>
  <cbc:ID>${xmlEscape(invoice.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  ${dueDate ? `<cbc:DueDate>${dueDate}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency || "COP"}</cbc:DocumentCurrencyCode>

  <!-- AccountingSupplierParty: el club dueño de la factura -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${xmlEscape(supplierName)}</cbc:Name>
      </cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${xmlEscape(supplierName)}</cbc:RegistrationName>
${supplierDocId}
        <cac:TaxScheme>
          <cbc:ID>01</cbc:ID>
          <cbc:Name>IVA</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEscape(supplierName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- AccountingCustomerParty: el jugador / cliente -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${xmlEscape(invoice.customerName)}</cbc:RegistrationName>
${customerDocId}
        <cac:TaxScheme>
          <cbc:ID>01</cbc:ID>
          <cbc:Name>IVA</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEscape(invoice.customerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- TaxTotal: IVA 19% -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${taxPesos}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">${subtotalPesos}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">${taxPesos}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>${taxRatePct}</cbc:Percent>
        <cbc:TaxExemptionReasonCode>1</cbc:TaxExemptionReasonCode>
        <cac:TaxScheme>
          <cbc:ID>01</cbc:ID>
          <cbc:Name>IVA</cbc:Name>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- LegalMonetaryTotal -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${subtotalPesos}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${subtotalPesos}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${totalPesos}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${totalPesos}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

${lineXml}
</Invoice>`;

  return xml;
}
